"""验证 nginx 反向代理是否正常工作"""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
import os
ssh.connect(os.environ.get('DEPLOY_SERVER', 'YOUR_SERVER_IP'), username=os.environ.get('DEPLOY_USER', 'ubuntu'), password=os.environ.get('DEPLOY_PASSWORD', ''))

commands = [
    ('nginx status', 'sudo systemctl is-active nginx'),
    ('curl :80 �?Nuxt', 'curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://YOUR_SERVER_IP/'),
    ('curl :80/api/jobs �?NestJS', 'curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://YOUR_SERVER_IP/api/jobs'),
    ('curl :80/api/analysis/market-overview', 'curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://YOUR_SERVER_IP/api/analysis/market-overview'),
    ('check NUXT_PUBLIC_API_BASE', 'docker exec jobRadar-web printenv NUXT_PUBLIC_API_BASE'),
    ('check NUXT_API_BASE_SERVER', 'docker exec jobRadar-web printenv NUXT_API_BASE_SERVER'),
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
print('\n�?Verification done')
