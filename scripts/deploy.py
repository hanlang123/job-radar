"""
部署 JobRadar 到远程服务器
通过 SSH 上传项目文件并用 Docker Compose 构建启动
"""
import paramiko
import os
import sys
import stat
import time

SERVER = os.environ.get('DEPLOY_SERVER', 'YOUR_SERVER_IP')
USERNAME = os.environ.get('DEPLOY_USER', 'ubuntu')
PASSWORD = os.environ.get('DEPLOY_PASSWORD', '')
REMOTE_DIR = '/home/ubuntu/job-radar'

# 需要排除的目录/文件
EXCLUDES = {
    'node_modules', '.nuxt', '.output', 'dist', '.git',
    '__pycache__', '.env', '.DS_Store',
}

# 需要排除的文件扩展名
EXCLUDE_EXTS = {'.csv', '.pyc'}

def should_exclude(name):
    if name in EXCLUDES:
        return True
    _, ext = os.path.splitext(name)
    if ext in EXCLUDE_EXTS:
        return True
    return False

def sftp_mkdir_p(sftp, remote_path):
    """递归创建远程目录"""
    dirs = []
    while True:
        try:
            sftp.stat(remote_path)
            break
        except FileNotFoundError:
            dirs.append(remote_path)
            remote_path = os.path.dirname(remote_path)
    for d in reversed(dirs):
        try:
            sftp.mkdir(d)
        except Exception:
            pass

def upload_dir(sftp, local_path, remote_path, file_count=0):
    """递归上传目录"""
    sftp_mkdir_p(sftp, remote_path)
    for item in os.listdir(local_path):
        if should_exclude(item):
            continue
        local_item = os.path.join(local_path, item)
        remote_item = remote_path + '/' + item
        if os.path.isdir(local_item):
            file_count = upload_dir(sftp, local_item, remote_item, file_count)
        else:
            sftp.put(local_item, remote_item)
            file_count += 1
            if file_count % 20 == 0:
                print(f'  已上传 {file_count} 个文件...')
    return file_count

def exec_command(ssh, cmd, show_output=True):
    """执行远程命令并返回输出"""
    print(f'$ {cmd}')
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=300)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if show_output:
        if out.strip():
            print(out.strip())
        if err.strip():
            print(err.strip())
    return out, err, stdout.channel.recv_exit_status()

def main():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(project_root)

    print('=== JobRadar 部署脚本 ===\n')

    # 连接 SSH
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f'[1/5] 连接服务器 {SERVER}...')
    ssh.connect(SERVER, username=USERNAME, password=PASSWORD,
                allow_agent=False, look_for_keys=False, banner_timeout=30)
    print('SSH 连接成功！\n')

    # 检查 Docker
    print('[2/5] 检查服务器环境...')
    out, err, code = exec_command(ssh, 'docker --version && docker compose version')
    if code != 0:
        print('错误：服务器上未安装 Docker 或 Docker Compose！')
        ssh.close()
        sys.exit(1)
    print()

    # 上传文件
    print(f'[3/5] 上传项目文件到 {REMOTE_DIR}...')
    sftp = ssh.open_sftp()

    # 先清理旧的构建产物
    exec_command(ssh, f'rm -rf {REMOTE_DIR}/apps {REMOTE_DIR}/packages {REMOTE_DIR}/docker {REMOTE_DIR}/scripts', show_output=False)

    total = upload_dir(sftp, '.', REMOTE_DIR)
    print(f'  共上传 {total} 个文件\n')

    # 上传 .env 到服务器（使用服务器本地配置）
    env_content = f"""# 数据库（服务器本地）
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_USER=jobRadar
DATABASE_PASSWORD=jobRadar123
DATABASE_NAME=jobRadar

# Redis（服务器本地）
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# JWT
JWT_SECRET=jobRadar-jwt-secret-prod-2026
JWT_REFRESH_SECRET=jobRadar-jwt-refresh-secret-prod-2026
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OpenAI 兼容 API
OPENAI_API_KEY={os.environ.get('OPENAI_API_KEY', '')}
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat

# 服务端口
SERVER_PORT=3001
WEB_PORT=3000
"""
    with sftp.open(f'{REMOTE_DIR}/.env', 'w') as f:
        f.write(env_content)
    print('  .env 配置文件已写入\n')
    sftp.close()

    # 构建并启动
    print('[4/5] 构建并启动 Docker 容器（这可能需要几分钟）...')
    exec_command(ssh, f'cd {REMOTE_DIR}/docker && docker compose -f docker-compose.prod.yml down 2>/dev/null || true')
    print('  正在构建镜像...')
    out, err, code = exec_command(ssh, f'cd {REMOTE_DIR}/docker && docker compose -f docker-compose.prod.yml up --build -d 2>&1')
    if code != 0:
        print(f'\n构建失败！退出码: {code}')
        ssh.close()
        sys.exit(1)

    print('\n  等待服务启动...')
    time.sleep(8)

    # 检查状态
    print('\n[5/5] 检查服务状态...')
    exec_command(ssh, f'cd {REMOTE_DIR}/docker && docker compose -f docker-compose.prod.yml ps')
    exec_command(ssh, 'docker logs jobRadar-server --tail 10 2>&1')

    ssh.close()

    print('\n=========================================')
    print(f'前端: http://{SERVER}:3000')
    print(f'API:  http://{SERVER}:3001/api')
    print('=========================================')

if __name__ == '__main__':
    main()
