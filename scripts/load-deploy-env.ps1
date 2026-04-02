#!/usr/bin/env pwsh
# 加载部署环境变量到当前 PowerShell 会话
# 用法: . .\scripts\load-deploy-env.ps1

$envFile = Join-Path $PSScriptRoot "..\\.env.deploy"

if (-not (Test-Path $envFile)) {
    Write-Error "未找到 .env.deploy 文件，请先创建（参考 .env.deploy.example）"
    exit 1
}

Get-Content $envFile | Where-Object { $_ -match '^\s*[^#]' } | ForEach-Object {
    $parts = $_ -split '=', 2
    if ($parts.Count -eq 2) {
        $key = $parts[0].Trim()
        $value = $parts[1].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $value, 'Process')
        Set-Item -Path "env:$key" -Value $value
        Write-Host "✓ 已加载 $key"
    }
}

Write-Host ""
Write-Host "部署环境变量已加载，现在可以运行："
Write-Host "  python scripts/deploy.py"
Write-Host "  python scripts/check-server.py"
Write-Host "  bash scripts/deploy.sh"
