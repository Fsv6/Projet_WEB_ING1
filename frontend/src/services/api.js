import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // à adapter si tu déploies ailleurs
  headers: {
    'Content-Type': 'application/json'
  }
})

// 👉 Intercepteur pour ajouter automatiquement le token aux requêtes
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, error => {
  return Promise.reject(error)
})

// 👉 Intercepteur pour gérer les erreurs globales (401, 403...)
api.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status

    if (status === 401 || status === 403) {
      console.warn('Non autorisé. Redirection vers login...')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default api