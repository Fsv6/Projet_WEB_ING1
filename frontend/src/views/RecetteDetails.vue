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
  padding: 2rem;
  background: #fafafa;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.recette-content {
  margin-top: 2rem;
}

h1 {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 1rem;
}

h2 {
  margin-top: 1rem;
  font-size: 1.8rem;
  color: #4caf50;
  font-weight: 600;
}

.description {
  font-size: 1rem;
  color: #555;
  line-height: 1.6;
  margin-top: 1rem;
}

.ingredients,
.etapes {
  margin-top: 2rem;
}

h3 {
  font-size: 1.5rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
}

.emoji {
  font-size: 1.8rem;
}

.dynamic-list ul,
.dynamic-list ol {
  margin-top: 1rem;
  padding-left: 1.5rem;
  list-style-position: inside;
  list-style-type: none;
}

.dynamic-list li {
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
  color: #555;
  background: #f9f9f9;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  list-style-type: none;
}

.loading-message {
  text-align: center;
  margin-top: 2rem;
  font-size: 1.2rem;
  color: #999;
}

.loading-message p {
  animation: fadeIn 1.5s ease-in-out infinite;
}

@keyframes fadeIn {
  0% { opacity: 0.3; }
  50% { opacity: 1; }
  100% { opacity: 0.3; }
}
</style>
