"""
启动 SSH 隧道，将本地 15432 转发到远程 PostgreSQL 5432
同时将本地 16379 转发到远程 Redis 6379
"""
import paramiko
import threading
import socketserver
import socket
import select
import sys
import time


class ForwardHandler(socketserver.BaseRequestHandler):
    """SSH 端口转发请求处理器"""

    def handle(self):
        try:
            chan = self.ssh_transport.open_channel(
                'direct-tcpip',
                (self.chain_host, self.chain_port),
                self.request.getpeername()
            )
        except Exception as e:
            print(f'转发通道打开失败: {e}')
            return

        print(f'隧道已建立: {self.request.getpeername()} -> {self.chain_host}:{self.chain_port}')

        while True:
            r, w, x = select.select([self.request, chan], [], [])
            if self.request in r:
                data = self.request.recv(4096)
                if len(data) == 0:
                    break
                chan.send(data)
            if chan in r:
                data = chan.recv(4096)
                if len(data) == 0:
                    break
                self.request.send(data)

        chan.close()
        self.request.close()


class ForwardServer(socketserver.ThreadingTCPServer):
    daemon_threads = True
    allow_reuse_address = True


def create_tunnel(ssh_transport, local_port, remote_host, remote_port):
    """创建一个端口转发"""
    class Handler(ForwardHandler):
        chain_host = remote_host
        chain_port = remote_port
        ssh_transport_ref = ssh_transport

    Handler.ssh_transport = ssh_transport

    server = ForwardServer(('127.0.0.1', local_port), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    print(f'隧道: localhost:{local_port} -> {remote_host}:{remote_port}')
    return server


def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print('正在连接 SSH...')
    import os
    ssh.connect(os.environ.get('DEPLOY_SERVER', 'YOUR_SERVER_IP'), username=os.environ.get('DEPLOY_USER', 'ubuntu'), password=os.environ.get('DEPLOY_PASSWORD', ''),
                allow_agent=False, look_for_keys=False, banner_timeout=30)
    print('SSH 连接成功！')

    transport = ssh.get_transport()

    # PostgreSQL: local 15432 -> remote 127.0.0.1:5432
    pg_server = create_tunnel(transport, 15432, '127.0.0.1', 5432)

    # Redis: local 16379 -> remote 127.0.0.1:6379
    redis_server = create_tunnel(transport, 16379, '127.0.0.1', 6379)

    print('\n========================================')
    print('SSH 隧道已启动！')
    print('PostgreSQL: localhost:15432')
    print('Redis:      localhost:16379')
    print('========================================')
    print('按 Ctrl+C 关闭隧道...\n')

    try:
        while True:
            time.sleep(1)
            if not transport.is_active():
                print('SSH 连接已断开，退出...')
                break
    except KeyboardInterrupt:
        print('\n正在关闭隧道...')
    finally:
        pg_server.shutdown()
        redis_server.shutdown()
        ssh.close()
        print('隧道已关闭。')


if __name__ == '__main__':
    main()
