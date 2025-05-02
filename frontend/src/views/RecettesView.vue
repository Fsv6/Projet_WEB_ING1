<script setup>
import { onMounted, computed } from 'vue'
import { useRecettesStore } from '@/stores/recettesStore'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/layout/AppLayoutGlobal.vue'

const recettesStore = useRecettesStore()
const auth = useAuthStore()
const isVisiteur = computed(() => auth.role === 'visiteur')

onMounted(() => {
  recettesStore.fetchRecettes()
})
</script>

<template>
  <AppLayout>
    <div class="recettes-page">
      <h1>Recettes à tester dans votre cuisine connectée</h1>

      <div
          class="recette-card"
          v-for="recette in recettesStore.recettes"
          :key="recette._id"
      >
        <h3>{{ recette.titre }}</h3>
        <p v-if="!isVisiteur">{{ recette.description }}</p>
        <p v-else class="blur">Contenu réservé aux utilisateurs inscrits</p>
        <button class="disabled-button" disabled>🔒 Noter cette recette</button>
        <p class="blocked-msg">Fonction disponible avec un compte</p>
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

.note {
  margin: 0.5rem 0;
}

.disabled-button {
  background-color: #ccc;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  color: #666;
  cursor: not-allowed;
  font-weight: bold;
  margin-top: 5px;
}

.blocked-msg {
  font-size: 0.8rem;
  color: #888;
  text-align: center;
  margin-top: 5px;
}
</style>
