<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()

const form = ref({
  titre: '',
  description: '',
  objetsUtilises: []
})

const allObjects = ref([])
const ingredients = ref([])
const newIngredient = ref('')
const etapes = ref([])
const newEtape = ref('')

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

const submitRecette = async () => {
  try {
    const payload = {
      ...form.value,
      ingredients: ingredients.value,
      etapes: etapes.value
    }
    await api.post('/recettes', payload)
    alert('✅ Recette ajoutée !')
    router.push('/recettes')
  } catch (err) {
    alert('❌ Erreur lors de la création')
    console.error(err)
  }
}

onMounted(async () => {
  const res = await api.get('/objets')
  allObjects.value = res.data
})
</script>
<template>
  <div class="new-recette">
    <h2>➕ Nouvelle Recette</h2>
    <form @submit.prevent="submitRecette">

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
          <li v-for="(item, index) in ingredients" :key="index">
            {{ item }}
            <button type="button" @click="removeIngredient(index)">❌</button>
          </li>
        </ul>
      </div>

      <label>Étapes</label>
      <div class="dynamic-list">
        <input v-model="newEtape" placeholder="Ajouter une étape" />
        <button type="button" @click="addEtape">➕</button>
        <ol>
          <li v-for="(etape, index) in etapes" :key="index">
            {{ etape }}
            <button type="button" @click="removeEtape(index)">❌</button>
          </li>
        </ol>
      </div>

      <button type="submit">Créer</button>
    </form>
  </div>
</template>


<style scoped>
.nouvelle-recette-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.recette-form {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.form-group {
  margin-bottom: 1rem;
}

input, textarea {
  width: 100%;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #ccc;
  margin-top: 5px;
}

button {
  background-color: #28a745;
  color: white;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.objets-liste label {
  display: block;
  margin-bottom: 5px;
}
</style>

