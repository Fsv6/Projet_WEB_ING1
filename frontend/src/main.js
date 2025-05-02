import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
// Import de Font Awesome
import '@fortawesome/fontawesome-free/css/all.css'

const app = createApp(App)

// 🟢 Pinia d'abord !
app.use(createPinia())

// 🔵 Puis le router
app.use(router)

app.mount('#app')

