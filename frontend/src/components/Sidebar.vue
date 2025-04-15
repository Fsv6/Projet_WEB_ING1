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
        <span>{{ item.label }}</span>
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

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: 250px;
  background-color: #2c3e50;
  color: white;
  padding: 20px;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
}

.sidebar-header {
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: white;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  color: white;
  text-decoration: none;
  border-radius: 5px;
  transition: all 0.3s ease;
}

.nav-item:hover {
  background-color: #34495e;
  transform: translateX(5px);
}

.nav-item i {
  margin-right: 10px;
  width: 20px;
  text-align: center;
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
    width: 60px;
    padding: 10px;
  }
  
  .sidebar-header h2,
  .nav-item span {
    display: none;
  }
  
  .nav-item {
    justify-content: center;
    padding: 15px;
  }
  
  .nav-item i {
    margin-right: 0;
    font-size: 1.2rem;
  }
}
</style> 