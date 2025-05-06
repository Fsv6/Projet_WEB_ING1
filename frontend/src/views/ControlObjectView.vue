<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import AppLayout from '@/layout/AppLayoutGlobal.vue'

const route = useRoute()
const object = ref(null)
const form = ref({
  temperatureCible: 0,
  mode: '',
  statut: 'Actif'
})

// Ces computed doivent être en dehors de onMounted
const showTemperature = computed(() => object.value?.supporteTemperature)
const showMode = computed(() => object.value?.supporteMode)

onMounted(async () => {
  try {
    const id = route.params.id
    const res = await api.get(`/objets/${id}`)
    const data = res.data

    object.value = {
      _id: data._id,
      nom: data.nom,
      temperatureCible: data.temperatureCible,
      mode: data.mode,
      statut: data.statut,
      supporteTemperature: data.supporteTemperature,
      supporteMode: data.supporteMode,
      modesDisponibles: data.modesDisponibles || []
    }

    form.value.temperatureCible = object.value.temperatureCible || 0
    form.value.mode = object.value.mode || ''
    form.value.statut = object.value.statut || 'Actif'

  } catch (error) {
    console.error('Erreur lors du chargement de l\'objet:', error)
  }
})

const applyChanges = async () => {
  try {
    const id = route.params.id
    await api.put(`/objets/${id}/control`, {
      temperatureCible: form.value.temperatureCible,
      mode: form.value.mode,
      statut: form.value.statut
    });
    alert('✅ Modifications enregistrées avec succès !')
  } catch (error) {
    console.error('Erreur API PUT:', error)
    alert('Erreur lors de la mise à jour de l\'objet.')
  }
}
</script>

<template>
  <AppLayout>
    <div class="control-object-page">
      <h1>Contrôler l'objet</h1>

      <div v-if="object" class="object-form">
        <h2>{{ object.nom }}</h2>

        <!-- Température -->
        <div v-if="showTemperature" class="form-group">
          <label>Température cible (°C)</label>
          <input v-model="form.temperatureCible" type="number" />
        </div>

        <!-- Mode -->
        <div v-if="showMode" class="form-group">
          <label>Mode</label>

          <select v-if="object.modesDisponibles.length > 0" v-model="form.mode">
            <option v-for="option in object.modesDisponibles" :key="option" :value="option">
              {{ option }}
            </option>
          </select>

          <input
              v-else
              v-model="form.mode"
              type="text"
              placeholder="Entrer un mode manuellement"
          />
        </div>

        <!-- Statut -->
        <div class="form-group">
          <label>Statut</label>
          <select v-model="form.statut">
            <option value="Actif">Actif</option>
            <option value="Inactif">Inactif</option>
          </select>
        </div>

        <button @click="applyChanges" class="btn-apply">Appliquer les changements</button>
      </div>

      <div v-else>
        <p>Chargement de l'objet...</p>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.control-object-page {
  padding: 2rem;
  font-family: 'Arial', sans-serif;
}

.page-title {
  font-size: 2rem;
  color: #333;
  margin-bottom: 1.5rem;
}

.object-name {
  font-size: 1.5rem;
  color: #4a5568;
  margin-bottom: 1.2rem;
}

.object-form {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  width: 100%;
  max-width: 600px;
  margin: auto;
}

.form-group {
  margin-bottom: 20px;
}

label {
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8px;
}

/* Appliquer box-sizing border-box pour tout */
*,
*::before,
*::after {
  box-sizing: border-box;
}

/* Uniformiser la taille des inputs et selects */
input, select {
  width: 100%;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ccc;
  font-size: 1rem;
  color: #333;
  margin-top: 5px;
}

/* Eviter les bordures spécifiques pour les inputs de type number */
input[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
}

/* Style bouton */
button.btn-apply {
  margin: 1rem;
  padding: 0.5rem 1rem;
  background-color: #2c3e50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Responsivité */
@media screen and (max-width: 768px) {
  .control-object-page {
    padding: 1rem;
  }

  .object-form {
    padding: 1.5rem;
  }
}
</style>
