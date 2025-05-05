import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './assets/darkmode.css'
import { useThemeStore } from './stores/theme'

const app = createApp(App)
const pinia = createPinia()

// 🟢 Pinia d'abord !
app.use(pinia)

// 🔵 Puis le router
app.use(router)

// Initialiser le thème avant de monter l'application
const themeStore = useThemeStore(pinia)
themeStore.initTheme()

app.mount('#app')

