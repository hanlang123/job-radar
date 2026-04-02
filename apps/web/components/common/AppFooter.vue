<template>
  <footer class="app-footer">
    <div class="footer-content">
      <p>&copy; {{ new Date().getFullYear() }} JobRadar - 职位情报分析平台</p>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.app-footer {
  background: rgba(10, 14, 26, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 16px 24px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
  letter-spacing: 0.3px;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
}
</style>
