<template>
  <div class="not-found-view">
    <div class="card">
      <div class="not-found-content">
        <h2 class="error-code">404</h2>
        <h3>页面未找到</h3>
        <p>您访问的页面不存在或已被移除。</p>
        <router-link to="/" class="btn btn-primary mt-3">返回首页</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
// Not Found component
</script>

<style scoped>
.not-found-view {
  max-width: 600px;
  margin: 3rem auto;
}

.not-found-content {
  text-align: center;
  padding: 3rem 1rem;
}

.error-code {
  font-size: 5rem;
  font-weight: bold;
  color: #e74c3c;
  margin-bottom: 1rem;
}
</style>
