"""安装 nginx 并配置反向代�?""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
import os
ssh.connect(os.environ.get('DEPLOY_SERVER', 'YOUR_SERVER_IP'), username=os.environ.get('DEPLOY_USER', 'ubuntu'), password=os.environ.get('DEPLOY_PASSWORD', ''))

# nginx 配置�?0 端口反向代理�?Nuxt(3000) �?NestJS(3001)
nginx_conf = """
server {
    listen 80;
    server_name YOUR_SERVER_IP;

    # API 请求转发�?NestJS
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # SSE 支持
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }

    # 其他请求转发�?Nuxt
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

commands = [
    ('install nginx', 'sudo apt-get update -qq && sudo apt-get install -y -qq nginx 2>&1 | tail -5'),
    ('write config', f'echo \'{nginx_conf}\' | sudo tee /etc/nginx/sites-available/jobRadar > /dev/null'),
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
