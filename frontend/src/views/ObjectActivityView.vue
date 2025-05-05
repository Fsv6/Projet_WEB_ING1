<template>
  <AppLayout>
    <div class="object-activity-page">
      <div class="header">
        <router-link to="/manage/objects">
          <button class="btn-retour">← Retour à la gestion des objets</button>
        </router-link>
        <h1>🧰 Fiche technique : {{ object?.nom || 'Chargement...' }}</h1>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Chargement des données...</p>
      </div>

      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
        <button @click="loadData" class="retry-btn">
          <i class="fas fa-sync-alt"></i> Réessayer
        </button>
      </div>

      <div v-else class="activity-content">
        <!-- Informations de base -->
        <div class="card object-info">
          <h2>Informations générales</h2>
          <div class="info-grid">
            <div class="info-item">
              <h3>Marque</h3>
              <p>{{ object.marque || 'Non spécifiée' }}</p>
            </div>
            <div class="info-item">
              <h3>Type</h3>
              <p>{{ object.type || 'Non spécifié' }}</p>
            </div>
            <div class="info-item">
              <h3>Connectivité</h3>
              <p>{{ object.connectivite || 'Aucune' }}</p>
            </div>
            <div class="info-item status">
              <h3>Statut actuel</h3>
              <p :class="{'status-active': object.statut === 'Actif', 'status-inactive': object.statut !== 'Actif'}">
                {{ object.statut || 'Inconnu' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Description et fonctionnalités -->
        <div class="card">
          <h2>Description</h2>
          <p class="description">{{ object.description || 'Aucune description disponible pour cet objet.' }}</p>
        </div>

        <!-- Paramètres techniques -->
        <div class="card">
          <h2>Paramètres techniques</h2>
          <div class="tech-grid">
            <div class="tech-item" v-if="object.supporteTemperature">
              <div class="tech-icon">🌡️</div>
              <div class="tech-info">
                <h3>Température</h3>
                <p>Température actuelle: <strong>{{ object.temperatureActuelle || 'N/A' }}°C</strong></p>
                <p>Température cible: <strong>{{ object.temperatureCible || 'N/A' }}°C</strong></p>
              </div>
            </div>
            <div class="tech-item" v-if="object.supporteMode">
              <div class="tech-icon">⚙️</div>
              <div class="tech-info">
                <h3>Mode de fonctionnement</h3>
                <p>Mode actuel: <strong>{{ object.mode || 'Standard' }}</strong></p>
                <div v-if="object.modesDisponibles && object.modesDisponibles.length">
                  <p>Modes disponibles:</p>
                  <ul class="modes-list">
                    <li v-for="mode in object.modesDisponibles" :key="mode">{{ mode }}</li>
                  </ul>
                </div>
              </div>
            </div>
            <div class="tech-item">
              <div class="tech-icon">⚠️</div>
              <div class="tech-info">
                <h3>Niveau de danger</h3>
                <p :class="{'danger-high': object.niveauDanger === 'élevé', 'danger-low': object.niveauDanger === 'faible'}">
                  {{ getDangerLevel(object.niveauDanger) }}
                </p>
              </div>
            </div>
            <div class="tech-item" v-if="object.piece">
              <div class="tech-icon">🏠</div>
              <div class="tech-info">
                <h3>Emplacement</h3>
                <p>{{ object.piece }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Recommandations d'utilisation -->
        <div class="card">
          <h2>Recommandations d'utilisation</h2>
          <div class="recommendations">
            <div class="recommendation-item">
              <div class="recommendation-icon">✅</div>
              <div class="recommendation-text">
                <h3>Consommation énergétique</h3>
                <p>Utilisez le mode "{{ getEcoMode() }}" pour économiser de l'énergie.</p>
              </div>
            </div>
            <div class="recommendation-item" v-if="object.supporteTemperature">
              <div class="recommendation-icon">⏰</div>
              <div class="recommendation-text">
                <h3>Temps de chauffe</h3>
                <p>Temps estimé pour atteindre {{ object.temperatureCible || 200 }}°C: {{ getHeatingTime() }} minutes.</p>
              </div>
            </div>
            <div class="recommendation-item">
              <div class="recommendation-icon">🔒</div>
              <div class="recommendation-text">
                <h3>Sécurité</h3>
                <p v-if="object.niveauDanger === 'élevé'">
                  Cet appareil présente un niveau de danger élevé. Ne pas laisser sans surveillance.
                </p>
                <p v-else>
                  Cet appareil présente un niveau de danger faible, mais restez vigilant pendant son utilisation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/layout/AppLayoutGlobal.vue'
import api from '@/services/api'

const route = useRoute()
const object = ref({})
const loading = ref(true)
const error = ref(null)

// Fonction pour calculer le mode économique recommandé
const getEcoMode = () => {
  if (!object.value.modesDisponibles || !object.value.modesDisponibles.length) {
    return 'Éco'
  }
  
  const ecoModes = ['Éco', 'Eco', 'Économique', 'Economique', 'Économie', 'Economie']
  for (const mode of ecoModes) {
    if (object.value.modesDisponibles.includes(mode)) {
      return mode
    }
  }
  
  return object.value.modesDisponibles[0]
}

// Fonction pour estimer le temps de chauffe en fonction de la température cible
const getHeatingTime = () => {
  if (!object.value.supporteTemperature) return 'N/A'
  
  const targetTemp = object.value.temperatureCible || 200
  // Estimation simple: 1 min par 20°C à chauffer
  return Math.round(targetTemp / 20)
}

// Fonction pour formater le niveau de danger
const getDangerLevel = (level) => {
  switch (level) {
    case 'élevé':
      return 'Élevé - Manipulation avec précaution'
    case 'faible':
      return 'Faible - Utilisation standard'
    default:
      return 'Non spécifié'
  }
}

// Charger les données de l'objet
const loadData = async () => {
  try {
    loading.value = true
    error.value = null
    
    // En-tête d'autorisation
    const token = localStorage.getItem('token')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    
    // Récupérer les informations de l'objet
    const response = await api.get(`/objets/${route.params.id}`)
    object.value = response.data
  } catch (err) {
    console.error('Erreur lors du chargement des données:', err)
    error.value = `Erreur lors du chargement des données: ${err.response?.data?.error || err.message || 'Erreur inconnue'}`
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.object-activity-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 30px;
}

.btn-retour {
  background-color: #f0f0f0;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 20px;
}

.loading {
  text-align: center;
  padding: 40px;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  color: #dc3545;
  text-align: center;
  padding: 20px;
}

.retry-btn {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 20px auto;
}

.retry-btn i {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.info-item {
  padding: 15px;
  border-radius: 8px;
  background-color: #f8f9fa;
}

.info-item h3 {
  margin-top: 0;
  color: #6c757d;
  font-size: 0.9rem;
  text-transform: uppercase;
}

.info-item p {
  margin-bottom: 0;
  font-size: 1.1rem;
  font-weight: 500;
}

.status-active {
  color: #28a745;
}

.status-inactive {
  color: #dc3545;
}

.description {
  line-height: 1.6;
  color: #495057;
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.tech-item {
  display: flex;
  align-items: flex-start;
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
}

.tech-icon {
  font-size: 2rem;
  margin-right: 15px;
  flex-shrink: 0;
}

.tech-info {
  flex-grow: 1;
}

.tech-info h3 {
  margin-top: 0;
  color: #2c5038;
  font-size: 1.1rem;
}

.tech-info p {
  margin-bottom: 0.5rem;
}

.modes-list {
  margin: 0;
  padding-left: 20px;
}

.modes-list li {
  margin-bottom: 5px;
}

.danger-high {
  color: #dc3545;
  font-weight: bold;
}

.danger-low {
  color: #28a745;
}

.recommendations {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.recommendation-item {
  display: flex;
  align-items: flex-start;
  background-color: #f0f7ff;
  padding: 15px;
  border-radius: 8px;
}

.recommendation-icon {
  font-size: 1.5rem;
  margin-right: 15px;
  flex-shrink: 0;
}

.recommendation-text {
  flex-grow: 1;
}

.recommendation-text h3 {
  margin-top: 0;
  color: #2c5038;
  font-size: 1.1rem;
}

.recommendation-text p {
  margin-bottom: 0;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .info-grid, .tech-grid {
    grid-template-columns: 1fr;
  }
}
</style> 