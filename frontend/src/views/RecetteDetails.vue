<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import AppLayout from '@/layout/AppLayoutGlobal.vue'

const route = useRoute()
const recette = ref(null)

onMounted(async () => {
  try {
    const res = await api.get(`/recettes/${route.params.id}`)
    recette.value = res.data
  } catch (err) {
    console.error('Erreur chargement recette :', err)
  }
})
</script>

<template>
  <AppLayout>
    <div class="recette-details">
      <h1>Détail de la recette</h1>

      <div v-if="recette">
        <h2>{{ recette.titre }}</h2>
        <p>{{ recette.description }}</p>

        <div v-if="recette.ingredients?.length">
          <h3>🧂 Ingrédients</h3>
          <ul>
            <li v-for="(ing, index) in recette.ingredients" :key="index">{{ ing }}</li>
          </ul>
        </div>

        <div v-if="recette.etapes?.length">
          <h3>👨‍🍳 Étapes</h3>
          <ol>
            <li v-for="(step, index) in recette.etapes" :key="index">{{ step }}</li>
          </ol>
        </div>
      </div>

      <div v-else>
        <p>Chargement de la recette...</p>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.recette-details {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

h2 {
  margin-top: 1rem;
}

ul, ol {
  padding-left: 1.5rem;
}
</style>
