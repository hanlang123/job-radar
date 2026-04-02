"""配置 Docker 镜像加速器"""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
import os
ssh.connect(os.environ.get('DEPLOY_SERVER', 'YOUR_SERVER_IP'), username=os.environ.get('DEPLOY_USER', 'ubuntu'), password=os.environ.get('DEPLOY_PASSWORD', ''),
            allow_agent=False, look_for_keys=False, banner_timeout=30)

sftp = ssh.open_sftp()
stdin, stdout, stderr = ssh.exec_command('sudo mkdir -p /etc/docker', timeout=10)
stdout.read()

daemon_json = '''{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me",
    "https://docker.rainbond.cc"
  ]
}'''

with sftp.open('/tmp/daemon.json', 'w') as f:
    f.write(daemon_json)
sftp.close()

cmds = [
    'sudo cp /tmp/daemon.json /etc/docker/daemon.json',
    'sudo systemctl daemon-reload',
    'sudo systemctl restart docker',
    'cat /etc/docker/daemon.json',
    'sudo docker info 2>&1 | grep -A5 "Registry Mirrors"',
]
for c in cmds:
    print(f'>>> {c}')
    si, so, se = ssh.exec_command(c, timeout=30)
    print(so.read().decode().strip())
    e = se.read().decode().strip()
    if e:
        print(e[:200])
    print()

ssh.close()
print('Docker 镜像加速配置完成！')
