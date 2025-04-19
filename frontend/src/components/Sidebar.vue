<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <h2>{{ title }}</h2>
    </div>
    <nav class="sidebar-nav">
      <router-link 
        v-for="(item, index) in navItems" 
        :key="index"
        :to="item.path" 
        class="nav-item"
      >
        <i :class="item.icon"></i>
        <span class="nav-text">{{ item.label }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script>
export default {
  name: 'AppSidebar',
  props: {
    title: {
      type: String,
      default: 'Smart Kitchen'
    },
    navItems: {
      type: Array,
      required: true,
      validator: (items) => {
        return items.every(item => 
          typeof item.path === 'string' && 
          typeof item.label === 'string' &&
          typeof item.icon === 'string'
        )
      }
    }
  }
}
</script>

<style>
/* Styles globaux nécessaires pour la mise en page avec sidebar */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  min-height: 100vh;
}

body {
  overflow-x: hidden;
}

/* Styles de la sidebar */
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 220px;
  background-color: #2c3e50;
  padding: 15px;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 16px;
  color: white !important;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-grow: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  text-decoration: none;
  border-radius: 4px;
  transition: all 0.3s ease;
  font-size: 13px;
}

.nav-item i {
  margin-right: 10px;
  width: 20px;
  text-align: center;
  color: white !important;
}

.nav-text {
  color: white !important;
}

.nav-item:hover {
  background-color: #34495e;
  transform: translateX(5px);
}

.router-link-active {
  background-color: #34495e;
  font-weight: bold;
}

/* Media Queries pour la responsivité */
@media screen and (max-width: 768px) {
  .sidebar {
    width: 200px;
  }
}

@media screen and (max-width: 480px) {
  .sidebar {
    width: 50px;
    padding: 10px;
  }
  
  .sidebar-header h2,
  .nav-text {
    display: none;
  }
  
  .nav-item {
    justify-content: center;
    padding: 15px;
  }
  
  .nav-item i {
    margin-right: 0;
    font-size: 14px;
  }
}
</style> 