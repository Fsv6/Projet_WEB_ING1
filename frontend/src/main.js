import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

const app = createApp(App)

// 🟢 Pinia d'abord !
app.use(createPinia())

// 🔵 Puis le router
app.use(router)

app.mount('#app')

