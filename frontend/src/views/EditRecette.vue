<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import AppLayout from '@/layout/AppLayoutGlobal.vue'

const route = useRoute()
const router = useRouter()

const form = ref({
  titre: '',
  description: '',
  objetsUtilises: []
})

const ingredients = ref([])
const etapes = ref([])
const newIngredient = ref('')
const newEtape = ref('')
const allObjects = ref([])

onMounted(async () => {
  try {
    const recetteRes = await api.get(`/recettes/${route.params.id}`)
    const recette = recetteRes.data

    form.value = {
      titre: recette.titre,
      description: recette.description,
      objetsUtilises: recette.objetsUtilises.map(o => o._id)
    }

    ingredients.value = recette.ingredients || []
    etapes.value = recette.etapes || []

    const objetsRes = await api.get('/objets')
    allObjects.value = objetsRes.data
  } catch (err) {
    console.error('Erreur chargement recette :', err)
  }
})

const addIngredient = () => {
  if (newIngredient.value.trim()) {
    ingredients.value.push(newIngredient.value.trim())
    newIngredient.value = ''
  }
}

const removeIngredient = (index) => {
  ingredients.value.splice(index, 1)
}

const addEtape = () => {
  if (newEtape.value.trim()) {
    etapes.value.push(newEtape.value.trim())
    newEtape.value = ''
  }
}

const removeEtape = (index) => {
  etapes.value.splice(index, 1)
}

const updateRecette = async () => {
  try {
    const payload = {
      ...form.value,
      ingredients: ingredients.value,
      etapes: etapes.value
    }

    await api.put(`/recettes/${route.params.id}`, payload)
    alert('✅ Recette modifiée avec succès !')
    router.push('/recettes')
  } catch (err) {
    alert('❌ Erreur lors de la modification')
    console.error(err)
  }
}
</script>

<template>
  <AppLayout>
    <div class="edit-recette-page">
      <h2>✏️ Modifier la recette</h2>
      <form @submit.prevent="updateRecette">
        <label>Titre</label>
        <input v-model="form.titre" required />

        <label>Description</label>
        <textarea v-model="form.description" required></textarea>

        <label>Objets utilisés</label>
        <select v-model="form.objetsUtilises" multiple>
          <option v-for="obj in allObjects" :value="obj._id" :key="obj._id">
            {{ obj.nom }}
          </option>
        </select>

        <label>Ingrédients</label>
        <div class="dynamic-list">
          <input v-model="newIngredient" placeholder="Ajouter un ingrédient" />
          <button type="button" @click="addIngredient">➕</button>
          <ul>
            <li v-for="(item, i) in ingredients" :key="i">
              {{ item }}
              <button type="button" @click="removeIngredient(i)">❌</button>
            </li>
          </ul>
        </div>

        <label>Étapes</label>
        <div class="dynamic-list">
          <input v-model="newEtape" placeholder="Ajouter une étape" />
          <button type="button" @click="addEtape">➕</button>
          <ol>
            <li v-for="(etape, i) in etapes" :key="i">
              {{ etape }}
              <button type="button" @click="removeEtape(i)">❌</button>
            </li>
          </ol>
        </div>

        <button type="submit">💾 Enregistrer</button>
      </form>
    </div>
  </AppLayout>
</template>

<style scoped>
.edit-recette-page {
  max-width: 800px;
  margin: auto;
  padding: 1rem;
}

form {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

input, textarea, select {
  display: block;
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
}

button {
  margin-top: 10px;
  padding: 8px 12px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
}

.dynamic-list ul, .dynamic-list ol {
  margin-top: 10px;
}
</style>
