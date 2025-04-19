<template>
  <div class="appearance-settings">
    <button class="settings-toggle" @click="toggleSettings">
      <i class="fas fa-text-height"></i>
    </button>

    <div class="settings-panel" v-if="isOpen">
      <div class="panel-header dark-mode-toggle">
        <button @click="toggleDarkMode" class="theme-toggle">
          <i :class="isDarkMode ? 'fas fa-sun' : 'fas fa-moon'"></i>
          {{ isDarkMode ? 'Mode Clair' : 'Mode Sombre' }}
        </button>
      </div>

      <div class="panel-header">
        <h3>Taille d'affichage</h3>
        <button class="close-btn" @click="toggleSettings">&times;</button>
      </div>

      <div class="settings-content">
        <div class="setting-group">
          <div class="font-size-options">
            <button 
              v-for="size in fontSizes" 
              :key="size.value"
              class="font-size-btn"
              :class="{ active: currentZoom === size.value }"
              @click="setZoom(size.value)"
            >
              {{ size.label }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppearanceSettings',
  data() {
    return {
      isOpen: false,
      isDarkMode: localStorage.getItem('darkMode') === 'true',
      currentZoom: localStorage.getItem('zoom') || '1',
      fontSizes: [
        { value: '0.8', label: 'Très petit' },
        { value: '0.9', label: 'Petit' },
        { value: '1', label: 'Normal' },
        { value: '1.1', label: 'Grand' }
      ]
    }
  },
  methods: {
    toggleSettings() {
      this.isOpen = !this.isOpen
    },
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode
      localStorage.setItem('darkMode', this.isDarkMode)
      
      if (this.isDarkMode) {
        document.body.classList.add('dark-mode')
        document.documentElement.classList.add('dark-mode')
      } else {
        document.body.classList.remove('dark-mode')
        document.documentElement.classList.remove('dark-mode')
      }
      
      // Émettre un événement personnalisé pour informer l'application du changement de mode
      window.dispatchEvent(new CustomEvent('darkModeChanged', {
        detail: { isDarkMode: this.isDarkMode }
      }));
    },
    setZoom(zoom) {
      this.currentZoom = zoom
      localStorage.setItem('zoom', zoom)
      document.body.style.zoom = zoom
    },
    resetToDefault() {
      this.setZoom('1')
    }
  },
  mounted() {
    // Appliquer le zoom sauvegardé
    const savedZoom = localStorage.getItem('zoom')
    const validValues = this.fontSizes.map(size => size.value)
    
    if (!savedZoom || !validValues.includes(savedZoom)) {
      this.resetToDefault()
    } else {
      this.setZoom(savedZoom)
    }
    
    if (!document.body.style.zoom) {
      document.body.style.zoom = this.currentZoom
    }

    // Appliquer le mode sombre au chargement si nécessaire
    if (this.isDarkMode) {
      document.body.classList.add('dark-mode')
      document.documentElement.classList.add('dark-mode')
    }
  }
}
</script>

<style>
.appearance-settings {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.settings-toggle {
  background: #4263eb;
  color: white;
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  cursor: pointer;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3em;
  transition: transform 0.2s, background-color 0.2s;
}

.settings-toggle:hover {
  background: #3255d9;
  transform: scale(1.1);
}

.settings-panel {
  position: absolute;
  top: 55px;
  right: 0;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  width: 250px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #f0f4ff;
  border-bottom: 1px solid #e0e0f0;
}

.panel-header h3 {
  margin: 0;
  font-size: 1.1em;
  color: #2c3e50;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  color: #4263eb;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #3255d9;
}

.settings-content {
  padding: 15px;
}

.setting-group {
  margin-bottom: 10px;
}

.font-size-options {
  display: grid;
  gap: 10px;
}

.font-size-btn {
  background: #f5f7ff;
  border: 1px solid #e0e6ff;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: #4263eb;
  font-weight: 500;
}

.font-size-btn:hover {
  background: #edf0ff;
  transform: translateY(-2px);
}

.font-size-btn.active {
  border-color: #4263eb;
  background: rgba(66, 99, 235, 0.15);
  color: #2c3e50;
  font-weight: 600;
  box-shadow: 0 2px 5px rgba(66, 99, 235, 0.2);
}

/* Mode sombre pour le composant de paramètres */
body.dark-mode .settings-toggle {
  background-color: #5c7cff;
  color: white;
}

body.dark-mode .settings-panel {
  background: #1a1c23;
  border-color: #2d3748;
}

body.dark-mode .panel-header {
  background-color: #242731;
  border-bottom-color: #2d3748;
  color: #e9ecef;
}

body.dark-mode .panel-header h3 {
  color: #e9ecef;
}

body.dark-mode .close-btn {
  color: #5c7cff;
}

body.dark-mode .font-size-btn {
  background: #242731;
  border-color: #2d3748;
  color: #e9ecef;
}

body.dark-mode .font-size-btn:hover {
  background: #2d3748;
}

body.dark-mode .font-size-btn.active {
  background: #4263eb;
  border-color: #5c7cff;
  color: white;
}

.theme-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  justify-content: center;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s;
  border: 1px solid transparent;
  background-color: transparent;
  color: #2c3e50;
  font-weight: 500;
}

.theme-toggle:hover {
  background-color: rgba(66, 99, 235, 0.1);
}

body.dark-mode .theme-toggle {
  background-color: #242731;
  color: #e9ecef;
  border-color: #2d3748;
}

body.dark-mode .theme-toggle:hover {
  background-color: #2d3748;
}

.dark-mode-toggle {
  justify-content: center;
  padding: 5px 15px;
}
</style>