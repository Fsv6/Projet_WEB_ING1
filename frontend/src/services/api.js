import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Port 5000 pour le backend
  headers: {
    'Content-Type': 'application/json'
  }
})

// 👉 Intercepteur pour ajouter automatiquement le token aux requêtes
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  
  // S'assurer que le token est bien configuré à chaque requête
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    console.log('Token appliqué à la requête:', token.substring(0, 10) + '...')
  } else {
    console.warn('Aucun token disponible pour la requête')
  }
  
  console.log('Requête envoyée:', {
    url: config.baseURL + config.url,
    method: config.method,
    data: config.data
  })
  
  return config
}, error => {
  console.error('Erreur de requête:', error)
  return Promise.reject(error)
})

// 👉 Intercepteur pour gérer les erreurs globales (401, 403...)
api.interceptors.response.use(
  response => {
    console.log('Réponse reçue:', response.data);
    return response;
  },
  error => {
    console.error('Erreur de réponse:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    const status = error.response?.status

    if (status === 401 || status === 403) {
      console.warn('Non autorisé. Une authentification est nécessaire.')
    }

    return Promise.reject(error)
  }
)

export default api