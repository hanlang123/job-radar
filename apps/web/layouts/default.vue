<template>
  <div class="app-layout">
    <CommonAppHeader />
    <main class="app-main">
      <slot />
    </main>
    <CommonAppFooter />
  </div>
</template>

<style scoped lang="scss">
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 24px;

  @media (max-width: 768px) {
    padding: 12px;
  }
}
</style>
