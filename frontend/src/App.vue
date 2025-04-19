<template>
  <div id="app" :class="{'dark-mode': isDarkMode}">
    <AppearanceSettings />
    <router-view/>
  </div>
</template>

<script>
// import { useDark } from '@vueuse/core'
// import { watch } from 'vue'

export default {
  data() {
    return {
      isDarkMode: false
    }
  },
  created() {
    // Vérifier si le mode sombre est activé dès la création du composant
    this.isDarkMode = localStorage.getItem('darkMode') === 'true';
  },
  mounted() {
    // Appliquer la classe sur l'élément html pour un meilleur contrôle CSS
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
    }

    // Observer les changements de localStorage pour le mode sombre
    window.addEventListener('storage', this.handleStorageChange);
    window.addEventListener('darkModeChanged', this.handleDarkModeChange);
  },
  methods: {
    handleStorageChange(event) {
      if (event.key === 'darkMode') {
        this.isDarkMode = event.newValue === 'true';
        this.updateDarkMode();
      }
    },
    handleDarkModeChange(event) {
      this.isDarkMode = event.detail.isDarkMode;
      this.updateDarkMode();
    },
    updateDarkMode() {
      if (this.isDarkMode) {
        document.documentElement.classList.add('dark-mode');
        document.body.classList.add('dark-mode');
      } else {
        document.documentElement.classList.remove('dark-mode');
        document.body.classList.remove('dark-mode');
      }
    }
  },
  beforeUnmount() {
    window.removeEventListener('storage', this.handleStorageChange);
    window.removeEventListener('darkModeChanged', this.handleDarkModeChange);
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: var(--text-primary);
}

/* Forcer l'application du mode sombre sur tout le document */
html.dark-mode, 
body.dark-mode, 
#app.dark-mode {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
</style>
