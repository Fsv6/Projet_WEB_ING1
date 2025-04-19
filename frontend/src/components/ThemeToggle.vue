<template>
  <button @click="toggleDarkMode" class="theme-toggle">
    <i :class="isDarkMode ? 'fas fa-sun' : 'fas fa-moon'"></i>
    {{ isDarkMode ? 'Mode Clair' : 'Mode Sombre' }}
  </button>
</template>

<script>
/* eslint-disable no-unused-vars */
export default {
  name: 'ThemeToggle',
  props: {
    isDarkMode: Boolean
  },
  methods: {
    toggleDarkMode() {
      this.$emit('toggle-dark-mode');
    }
  }
}
</script>

<style scoped>
.theme-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid transparent;
  background-color: transparent;
  cursor: pointer;
  color: var(--text-primary);
  font-weight: 500;
  transition: all 0.2s ease;
}

.theme-toggle:hover {
  background-color: rgba(66, 99, 235, 0.1);
}

body.dark-mode .theme-toggle {
  color: var(--text-primary);
}

body.dark-mode .theme-toggle:hover {
  background-color: rgba(66, 99, 235, 0.15);
}
</style> 