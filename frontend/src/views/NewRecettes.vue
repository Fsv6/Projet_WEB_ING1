<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import AppLayout from '@/layout/AppLayoutGlobal.vue'

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
  <AppLayout>
    <div class="nouvelle-recette-page">
      <h2>➕ Nouvelle Recette</h2>
      <form @submit.prevent="submitRecette" class="recette-form">

        <div class="form-group">
          <label>Titre</label>
          <input v-model="form.titre" required />
        </div>

        <div class="form-group">
          <label>Description</label>
          <textarea v-model="form.description" required></textarea>
        </div>

        <div class="form-group">
          <label>Objets utilisés</label>
          <select v-model="form.objetsUtilises" multiple>
            <option v-for="obj in allObjects" :value="obj._id" :key="obj._id">
              {{ obj.nom }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Ingrédients</label>
          <div class="dynamic-list">
            <div class="input-group">
              <input v-model="newIngredient" placeholder="Ajouter un ingrédient" />
              <button type="button" @click="addIngredient">➕</button>
            </div>
            <ul>
              <li v-for="(item, index) in ingredients" :key="index">
                {{ item }}
                <button type="button" @click="removeIngredient(index)">❌</button>
              </li>
            </ul>
          </div>
        </div>

        <div class="form-group">
          <label>Étapes</label>
          <div class="dynamic-list">
            <div class="input-group">
              <input v-model="newEtape" placeholder="Ajouter une étape" />
              <button type="button" @click="addEtape">➕</button>
            </div>
            <ol>
              <li v-for="(etape, index) in etapes" :key="index">
                {{ etape }}
                <button type="button" @click="removeEtape(index)">❌</button>
              </li>
            </ol>
          </div>
        </div>

        <button type="submit" class="btn-submit">Créer</button>
      </form>
    </div>
  </AppLayout>
</template>

<style scoped>
.nouvelle-recette-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.recette-form {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  font-weight: bold;
  display: block;
  margin-bottom: 0.5rem;
}

input,
textarea,
select {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
  box-sizing: border-box;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

input:focus,
textarea:focus,
select:focus {
  border-color: #4caf50;
  outline: none;
}

.input-group {
  display: flex;
  gap: 10px;
  margin-top: 0.5rem;
}

.dynamic-list {
  margin-top: 1rem;
}

.dynamic-list ul,
.dynamic-list ol {
  margin-top: 1rem;
  padding-left: 1.5rem;
}

.dynamic-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  background-color: #fafafa;
  transition: transform 0.2s ease-in-out;
}

.dynamic-list li button {
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
}

.dynamic-list li button:hover {
  background-color: #c0392b;
}

button {
  padding: 0.8rem 1.5rem;
  background-color: #2c3e50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #34495e;
}

/* Animation sur l'ajout ou suppression d'un élément */
.dynamic-list li.adding {
  transform: scale(1.05);
  background-color: #d1f7c4;
}

.dynamic-list li.removing {
  transform: scale(0.95);
  background-color: #f8d7da;
}

.dynamic-list li.removing button {
  background-color: #c0392b;
}
</style>

