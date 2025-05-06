<script setup>
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRecettesStore } from '@/stores/recettesStore'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/layout/AppLayoutGlobal.vue'

const recettesStore = useRecettesStore()
const auth = useAuthStore()
const router = useRouter()

const isVisiteur = computed(() => auth.role === 'visiteur')
const isIntermediaireOrMore = computed(() => {
  const niveaux = ['débutant', 'intermédiaire', 'avancé', 'expert']
  return niveaux.indexOf(auth.niveau) >= 1
})

const recettesPerso = computed(() =>
    recettesStore.recettes.filter(r => r.auteur === auth.userId)
)

const autresRecettes = computed(() =>
    recettesStore.recettes.filter(r => r.auteur !== auth.userId)
)

const peutModifier = (recette) =>
    auth.userId === recette.auteur && isIntermediaireOrMore.value

const goToDetails = (id) => {
  router.push(`/recettes/${id}`)
}

const goToEdit = (id) => {
  router.push(`/recettes/${id}/edit`)
}

const goToNew = () => {
  router.push('/recettes/new')
}

onMounted(() => {
  recettesStore.fetchRecettes()
})
</script>

<template>
  <AppLayout>
    <div class="recettes-page">
      <h1>Recettes à tester dans votre cuisine connectée</h1>

      <!-- Bouton pour ajouter une recette -->
      <div v-if="!isVisiteur && isIntermediaireOrMore" class="btn-new-container">
        <button @click="goToNew" class="btn-new">➕ Nouvelle recette</button>
      </div>

      <!-- Recettes personnelles -->
      <h2 v-if="recettesPerso.length">📌 Vos recettes</h2>
      <div
          class="recette-card"
          v-for="recette in recettesPerso"
          :key="recette._id"
      >
        <h3>{{ recette.titre }}</h3>
        <p>{{ recette.description }}</p>
        <button @click="goToDetails(recette._id)" class="btn-view">👀 Consulter</button>

        <button
            class="btn-edit"
            :disabled="!peutModifier(recette)"
            :title="!peutModifier(recette) ? 'Tu n’as pas les droits pour modifier cette recette' : 'Modifier la recette'"
            @click="goToEdit(recette._id)"
        >
          ✏️ Modifier
        </button>
      </div>


      <!-- Autres recettes -->
      <h2 v-if="autresRecettes.length">🍽️ Autres recettes</h2>
      <div
          class="recette-card"
          v-for="recette in autresRecettes"
          :key="recette._id"
      >
        <h3>{{ recette.titre }}</h3>
        <p v-if="!isVisiteur">{{ recette.description }}</p>
        <p v-else class="blur">Contenu réservé aux utilisateurs inscrits</p>
        <button
            v-if="!isVisiteur"
            class="btn-view"
            @click="goToDetails(recette._id)"
        >
          👀 Consulter
        </button>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.recettes-page {
  max-width: 1000px;
  margin: 0 auto;
}

.recette-card {
  background: white;
  padding: 1rem;
  border-radius: 10px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

button {
  margin: 1rem;
  padding: 0.5rem 1rem;
  background-color: #2c3e50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.blur {
  filter: blur(4px);
  color: #888;
}

.blocked-msg {
  font-size: 0.8rem;
  color: #888;
  text-align: center;
  margin-top: 5px;
}
</style>
