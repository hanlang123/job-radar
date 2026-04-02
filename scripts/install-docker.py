"""
在远程服务器上安装 Docker Engine + Docker Compose 插件
"""
import paramiko
import time

import os
SERVER = os.environ.get('DEPLOY_SERVER', 'YOUR_SERVER_IP')
USERNAME = os.environ.get('DEPLOY_USER', 'ubuntu')
PASSWORD = os.environ.get('DEPLOY_PASSWORD', '')

def run(ssh, cmd, timeout=300):
    print(f'>>> {cmd}')
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    code = stdout.channel.recv_exit_status()
    if out.strip():
        # 只打印最后几行避免刷屏
        lines = out.strip().split('\n')
        if len(lines) > 5:
            print(f'  ...({len(lines)} 行输出，显示最后 3 行)')
            print('\n'.join(lines[-3:]))
        else:
            print(out.strip())
    if err.strip() and code != 0:
        print(f'  STDERR: {err.strip()[-300:]}')
    return code

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f'连接 {SERVER}...')
    ssh.connect(SERVER, username=USERNAME, password=PASSWORD,
                allow_agent=False, look_for_keys=False, banner_timeout=30)
    print('连接成功！\n')

    # 在服务器上写一个安装脚本，避免本地转义问题
    install_script = r'''#!/bin/bash
set -e
echo "=== 安装 Docker ==="
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
sudo chmod a+r /etc/apt/keyrings/docker.gpg
sudo mkdir -p /etc/apt/sources.list.d
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker ubuntu
sudo systemctl enable docker
sudo systemctl start docker
echo "=== Docker 安装完成 ==="
docker --version
docker compose version
'''

    # 上传安装脚本
    sftp = ssh.open_sftp()
    with sftp.open('/tmp/install-docker.sh', 'w') as f:
        f.write(install_script)
    sftp.close()
    print('安装脚本已上传\n')

    # 执行安装脚本
    code = run(ssh, 'bash /tmp/install-docker.sh', timeout=600)
    if code != 0:
        print(f'\n安装失败 (exit {code})')
    else:
        print('\nDocker 安装成功！')

    # 需要重新登录 SSH 才能让 docker 组生效，这里用 newgrp 临时生效
    run(ssh, 'sg docker -c "docker info --format \'{{.ServerVersion}}\'"')

    ssh.close()

if __name__ == '__main__':
    main()
