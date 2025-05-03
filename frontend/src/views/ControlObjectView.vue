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
    console.error('❌ Erreur API PUT:', error)
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
.object-form {
  margin-top: 20px;
}

.form-group {
  margin-bottom: 15px;
}

input, select {
  width: 100%;
  padding: 8px;
  margin-top: 5px;
}

.btn-apply {
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  cursor: pointer;
}
</style>



<style scoped>
.object-form {
  margin-top: 20px;
}

.form-group {
  margin-bottom: 15px;
}

input, select {
  width: 100%;
  padding: 8px;
  margin-top: 5px;
}
.btn-apply {
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  cursor: pointer;
}

</style>