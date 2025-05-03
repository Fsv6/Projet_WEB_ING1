<template>
  <AppLayout>
    <div class="edit-object-page">
      <h1>✏️ Modifier l'objet</h1>

      <form v-if="object" @submit.prevent="updateObject" class="form-edit">
        <div class="form-group">
          <label>Nom</label>
          <input v-model="form.nom" required />
        </div>

        <div class="form-group">
          <label>Description</label>
          <textarea v-model="form.description" required></textarea>
        </div>

        <div class="form-group">
          <label>Type</label>
          <input v-model="form.type" required />
        </div>

        <div class="form-group">
          <label>Marque</label>
          <input v-model="form.marque" />
        </div>

        <div class="form-group">
          <label>Connectivité</label>
          <select v-model="form.connectivite">
            <option value="Wi-Fi">Wi-Fi</option>
            <option value="Bluetooth">Bluetooth</option>
          </select>
        </div>

        <div class="form-group">
          <label>Statut</label>
          <select v-model="form.statut">
            <option value="Actif">Actif</option>
            <option value="Inactif">Inactif</option>
          </select>
        </div>

        <div class="form-group">
          <label>Niveau de danger</label>
          <select v-model="form.niveauDanger">
            <option value="faible">Faible</option>
            <option value="élevé">Elevé</option>
          </select>
        </div>

        <div class="form-group checkbox-group">
          <label><input type="checkbox" v-model="form.supporteTemperature" /> Supporte la température</label>
          <label><input type="checkbox" v-model="form.supporteMode" /> Supporte les modes</label>
        </div>

        <div v-if="form.supporteTemperature" class="form-group">
          <label>Température cible (en °C)</label>
          <input v-model="form.temperatureCible" type="number" min="0" />
        </div>

        <div v-if="form.supporteMode" class="form-group">
          <label>Modes disponibles (séparés par virgules)</label>
          <input v-model="modesInput" placeholder="Ex: Espresso, Rapide..." />
        </div>

        <div v-if="form.supporteMode" class="form-group">
          <label>Mode par défaut</label>
          <input v-model="form.mode" placeholder="Ex: Espresso..." />
        </div>

        <button class="btn-save" type="submit">Enregistrer</button>
      </form>

      <div v-else>
        <p>Chargement...</p>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import AppLayout from '@/layout/AppLayoutGlobal.vue'

const route = useRoute()
const router = useRouter()
const object = ref(null)
const modesInput = ref('')

const form = ref({})

onMounted(async () => {
  const id = route.params.id
  try {
    const res = await api.get(`/objets/${id}`)
    object.value = res.data
    form.value = {
      nom: res.data.nom,
      description: res.data.description,
      type: res.data.type,
      marque: res.data.marque,
      connectivite: res.data.connectivite,
      statut: res.data.statut,
      niveauDanger: res.data.niveauDanger,
      supporteTemperature: res.data.supporteTemperature,
      supporteMode: res.data.supporteMode,
      temperatureCible: res.data.temperatureCible || 0,
      mode: res.data.mode || '',
    }
    modesInput.value = res.data.modesDisponibles?.join(', ') || ''
  } catch (err) {
    alert("Erreur lors du chargement de l'objet")
    console.error(err)
  }
})

const updateObject = async () => {
  const payload = {
    ...form.value,
    temperatureCible: form.value.supporteTemperature ? form.value.temperatureCible || 0 : null,
    mode: form.value.supporteMode ? form.value.mode : null,
    modesDisponibles: form.value.supporteMode ? modesInput.value.split(',').map(m => m.trim()).filter(Boolean) : []
  }

  try {
    await api.put(`/objets/${route.params.id}`, payload)
    alert('✅ Modifications enregistrées avec succès')
    router.push('/manage/objects')
  } catch (err) {
    console.error('Erreur MAJ objet :', err)
    alert('Erreur lors de la sauvegarde.')
  }
}
</script>

<style scoped>
.edit-object-page {
  max-width: 600px;
  margin: 0 auto;
}
.form-edit {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
}
.form-group label {
  font-weight: bold;
}
.checkbox-group label {
  margin-right: 1rem;
}
.btn-save {
  background-color: #4caf50;
  color: white;
  padding: 10px;
  border: none;
  cursor: pointer;
}
</style>
