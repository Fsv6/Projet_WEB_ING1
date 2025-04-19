import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Import Font Awesome
import '@fortawesome/fontawesome-free/css/all.css'

// Import des styles d'apparence
import './assets/css/appearance.css'

// Import du composant d'apparence
import AppearanceSettings from './components/AppearanceSettings.vue'

const app = createApp(App)

// Enregistrement global du composant d'apparence
app.component('AppearanceSettings', AppearanceSettings)

app.use(router)
app.mount('#app')
