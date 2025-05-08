<template>
  <div class="app-container">
    <header class="app-header">
      <h1>AI 英语单词学习</h1>
      <div class="header-buttons">
        <router-link to="/input" class="header-button home-button">首页</router-link>
        <router-link to="/article-input" class="header-button article-input-button">文章输入</router-link>
        <router-link to="/article-display" class="header-button article-button">文章</router-link>
        <router-link to="/notes" class="header-button notes-button">记录</router-link>
        <router-link to="/review" class="header-button review-button">复习</router-link>
      </div>
    </header>
    <main class="app-content">
      <router-view />
    </main>
    <footer class="app-footer">
      <p>© 2025 AI 英语单词学习</p>
    </footer>
  </div>
</template>

<script setup>
// App component setup script
</script>

<style>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

.app-header {
  background-color: #2c3e50;
  color: white;
  padding: 1rem;
  text-align: center;
  position: relative;
}

.header-buttons {
  position: absolute;
  top: 50%;
  right: 2rem;
  transform: translateY(-50%);
  display: flex;
  gap: 1rem;
}

.header-button {
  background-color: #3498db;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: bold;
  transition: background-color 0.3s;
}

.header-button:hover {
  background-color: #2980b9;
}

.notes-button {
  background-color: #27ae60;
}

.notes-button:hover {
  background-color: #219653;
}

.home-button {
  background-color: #f39c12;
}

.home-button:hover {
  background-color: #e67e22;
}

.article-input-button {
  background-color: #e74c3c;
}

.article-input-button:hover {
  background-color: #c0392b;
}

.article-button {
  background-color: #9b59b6;
}

.article-button:hover {
  background-color: #8e44ad;
}

.review-button {
  background-color: #3498db;
}

.app-content {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.app-footer {
  background-color: #f8f8f8;
  padding: 1rem;
  text-align: center;
  font-size: 0.9rem;
  color: #666;
}
</style>
