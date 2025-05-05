import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    darkMode: localStorage.getItem('darkMode') === 'true' || false
  }),
  actions: {
    toggleDarkMode() {
      this.darkMode = !this.darkMode
      localStorage.setItem('darkMode', this.darkMode.toString())
      
      // Appliquer la classe sur l'élément html pour les styles globaux
      if (this.darkMode) {
        document.documentElement.classList.add('dark-mode')
      } else {
        document.documentElement.classList.remove('dark-mode')
      }
    },
    
    // Initialisation du thème au démarrage de l'application
    initTheme() {
      const savedTheme = localStorage.getItem('darkMode') === 'true'
      if (savedTheme) {
        this.darkMode = true
        document.documentElement.classList.add('dark-mode')
      }
    }
  }
}) 