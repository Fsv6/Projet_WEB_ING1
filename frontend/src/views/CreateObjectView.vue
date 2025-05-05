<template>
  <AppLayout>
    <div class="create-object-page">
      <h1>➕ Ajouter un nouvel objet connecté</h1>

      <form @submit.prevent="createObject" class="object-form">
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
            <option value="élevé">Élevé</option>
          </select>
        </div>

        <div class="form-group checkbox-group">
          <label><input type="checkbox" v-model="form.supporteTemperature" /> Supporte la température</label>
          <label><input type="checkbox" v-model="form.supporteMode" /> Supporte les modes</label>
        </div>

        <div class="form-group" v-if="form.supporteMode">
          <label>Modes disponibles (séparés par des virgules)</label>
          <input v-model="modesInput" placeholder="Ex: Espresso, Lungo, Cappuccino" />
        </div>

        <button type="submit" class="btn-submit">Créer l'objet</button>
      </form>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import AppLayout from '@/layout/AppLayoutGlobal.vue'

const router = useRouter()
const form = ref({
  nom: '',
  description: '',
  type: '',
  marque: '',
  connectivite: 'Wi-Fi',
  statut: 'Actif',
  niveauDanger: 'faible',
  supporteTemperature: false,
  supporteMode: false
})
const modesInput = ref('')

const createObject = async () => {
  try {
    const payload = {
      ...form.value,
      modesDisponibles: form.value.supporteMode
          ? modesInput.value.split(',').map(m => m.trim()).filter(Boolean)
          : []
    }

    await api.post('/objets', payload)
    alert('✅ Objet ajouté avec succès')
    router.push('/manage/objects')
  } catch (err) {
    console.error('Erreur API POST:', err)
    alert('❌ Erreur lors de la création de l\'objet')
  }
}
</script>

<style scoped>
.create-object-page {
  padding: 20px;
}

.object-form {
  max-width: 600px;
}

.form-group {
  margin-bottom: 15px;
}

input, textarea, select {
  width: 100%;
  padding: 8px;
  margin-top: 5px;
}

.checkbox-group label {
  display: block;
  margin-top: 10px;
}

.btn-submit {
  padding: 10px 20px;
  background-color: #2e8b57;
  color: white;
  border: none;
  cursor: pointer;
}
</style>
