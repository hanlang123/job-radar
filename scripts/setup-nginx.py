"""安装 nginx 并配置反向代�?""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
import os
ssh.connect(os.environ.get('DEPLOY_SERVER', 'YOUR_SERVER_IP'), username=os.environ.get('DEPLOY_USER', 'ubuntu'), password=os.environ.get('DEPLOY_PASSWORD', ''))

# nginx 配置
nginx_conf = """server {
    listen 80;
    server_name YOUR_SERVER_IP;

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
"""

# �?SFTP 写入临时文件，再 sudo 移动
sftp = ssh.open_sftp()
with sftp.file('/tmp/jobRadar-nginx.conf', 'w') as f:
    f.write(nginx_conf)
sftp.close()
print('nginx config uploaded via SFTP')

commands = [
    ('move config', 'sudo cp /tmp/jobRadar-nginx.conf /etc/nginx/sites-available/jobRadar'),
    ('enable site', 'sudo ln -sf /etc/nginx/sites-available/jobRadar /etc/nginx/sites-enabled/jobRadar'),
    ('remove default', 'sudo rm -f /etc/nginx/sites-enabled/default'),
    ('test nginx', 'sudo nginx -t 2>&1'),
    ('restart nginx', 'sudo systemctl restart nginx 2>&1'),
    ('nginx status', 'sudo systemctl is-active nginx'),
    ('check port 80', 'ss -tlnp | grep ":80 "'),
    ('curl localhost:80', 'curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://localhost:80/'),
    ('curl localhost:80/api/jobs', 'curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:80/api/jobs'),
    ('curl public:80', 'curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://YOUR_SERVER_IP:80/'),
]

for label, cmd in commands:
    print(f'\n=== {label} ===')
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out:
        print(out)
    if err:
        print(f'[stderr] {err}')

ssh.close()
print('\n�?Done')
