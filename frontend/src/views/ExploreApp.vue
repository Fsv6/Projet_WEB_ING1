<script setup>
import { ref, computed, onMounted } from 'vue'
import { useObjetsStore } from '@/stores/objetsStore'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/layout/AppLayoutGlobal.vue'
import api from '../services/api'
import {useRouter} from "vue-router";
const router = useRouter()

const objetsStore = useObjetsStore()
const auth = useAuthStore()
const isVisiteur = computed(() => auth.role === 'visiteur')

onMounted(() => {
  objetsStore.fetchObjets()
})

const search = ref('')
const selectedType = ref('')

const filteredObjects = computed(() =>
    objetsStore.objets.filter(obj =>
        (!selectedType.value || obj.type === selectedType.value) &&
        (!search.value || obj.nom.toLowerCase().includes(search.value.toLowerCase()))
    )
)

const uniqueTypes = computed(() =>
    [...new Set(objetsStore.objets.map(o => o.type))].filter(Boolean)
)



const handleConsultation = async (id) => {
  try {
    if (auth.role !== 'visiteur') {
      await api.post(`/users/${auth.userId}/points`, { amount: 0.5 });
      auth.points += 0.5;
      localStorage.setItem('points', auth.points);
    }
    router.push(`/objects/${id}`);
  } catch (err) {
    console.warn("Erreur lors de l'ajout de points à la consultation", err);
    router.push(`/objects/${id}`);
  }
}

function peutControler(objet) {
  const niveau = auth.niveau
  const role = auth.role
  const danger = objet.niveauDanger // ← champ envoyé par l'API

  if (role === 'admin' || role === 'complexe') return true
  if (role === 'simple' && niveau === 'intermédiaire' && danger === 'faible') return true
  return false
}


function controlObject(obj) {
  router.push(`/objects/${obj._id}/control`);
}

</script>
<template>
  <AppLayout>
    <div class="explore-page">
      <h1>Explorer les objets connectés</h1>

      <div class="filters">
        <input v-model="search" placeholder="Recherche par nom..." />
        <select v-model="selectedType">
          <option value="">Tous les types</option>
          <option v-for="type in uniqueTypes" :key="type" :value="type">{{ type }}</option>
        </select>
      </div>

      <div class="object-grid">
        <div v-for="obj in filteredObjects" :key="obj._id" class="object-card">
          <h3>{{ obj.nom }}</h3>

          <!-- Flouter les infos si visiteur -->
          <div :class="{ 'blur': isVisiteur }">
            <p>{{ obj.description }}</p>
            <p>État : {{ obj.statut }}</p>
            <p>
              🔒 Niveau de danger :
              <span :class="['badge', obj.niveauDanger]">
                {{ obj.niveauDanger }}
              </span>
            </p>
          </div>

          <!-- Bouton consulter -->
          <button
              class="btn"
              :disabled="isVisiteur"
              @click="handleConsultation(obj._id)"
          >
            Consulter infos
          </button>

          <!-- Bouton contrôler -->
          <button
              class="btn"
              :disabled="!peutControler(obj)"
              :title="!peutControler(obj) ? 'Contrôle non autorisé à ton niveau' : ''"
              @click="peutControler(obj) && controlObject(obj)"
          >
            Contrôler cet objet
          </button>
        </div>
      </div>

      <div class="daily-recipe-widget">
        <h2>🍽️ Recette du jour</h2>

        <div v-if="!isVisiteur">
          <h3>Tajine aux légumes rôtis</h3>
          <p>Une recette équilibrée pour tirer le meilleur de votre four connecté.</p>
        </div>
        <div v-else class="blur">
          <p>🔒 Recette réservée aux utilisateurs inscrits</p>
        </div>

        <p v-if="isVisiteur" class="locked-info">
          🔒 Créez un compte pour découvrir cette recette !
          <router-link to="/register" class="link">S’inscrire</router-link>
        </p>
      </div>
    </div>
  </AppLayout>
</template>


<style scoped>

.badge {
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 0.85em;
  display: inline-block;
  margin-left: 6px;
}

.badge.faible {
  background-color: #e0f7e9;
  color: #007b39;
}

.badge.élevé {
  background-color: #ffe0e0;
  color: #b00000;
}

.explore-page {
  max-width: 1000px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 1rem;
  color: #006d77;
}

/* ✅ Bannière info */
.info-banner {
  background-color: #e0f7fa;
  color: #006064;
  padding: 10px 15px;
  border-radius: 6px;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.cta-link {
  margin-left: 10px;
  color: #00796b;
  font-weight: bold;
  text-decoration: underline;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.filters input,
.filters select {
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 1rem;
  width: 100%;
  max-width: 300px;
}

.object-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.object-card {
  background: white;
  border-radius: 12px;
  padding: 1.2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  position: relative;
  transition: transform 0.2s ease;
}

.object-card:hover {
  transform: translateY(-4px);
}


.blur {
  filter: blur(4px);
  user-select: none;
  cursor: default;
}

.locked-info {
  font-size: 0.85rem;
  margin-top: 10px;
  color: #555;
  text-align: center;
}

.locked-info .link {
  color: #006d77;
  font-weight: bold;
  margin-left: 5px;
  text-decoration: underline;
}

.daily-recipe-widget {
  margin-top: 3rem;
  padding: 1.5rem;
  background-color: #fefefe;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  text-align: center;
}

.daily-recipe-widget h2 {
  margin-bottom: 1rem;
  color: #006d77;
}

.daily-recipe-widget h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.locked-info {
  font-size: 0.85rem;
  margin-top: 10px;
  color: #555;
}

.locked-info .link {
  color: #006d77;
  font-weight: bold;
  margin-left: 5px;
  text-decoration: underline;
}

.disabled-button {
  background-color: #ccc;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  color: #666;
  cursor: not-allowed;
  font-weight: bold;
  margin-top: 10px;
  width: 100%;
  max-width: 250px;
  margin-left: auto;
  margin-right: auto;
  display: block;
}




</style>
