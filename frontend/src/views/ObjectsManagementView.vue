<template>
  <AppLayout>
    <div class="manage-objects-page">
      <h1>🛠️ Gestion des objets connectés</h1>

      <!-- Bouton pour afficher/masquer le formulaire -->
      <button @click="showForm = !showForm" class="btn-toggle">
        {{ showForm ? 'Annuler' : '➕ Ajouter un objet' }}
      </button>

      <!-- Formulaire d’ajout -->
      <form v-if="showForm" @submit.prevent="createObject" class="form-ajout">
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
          <label>Modes disponibles (séparés par virgules)</label>
          <input v-model="modesInput" placeholder="Ex: Espresso, Lungo" />
        </div>
        <div class="form-group" v-if="form.supporteMode">
          <label>Mode par défaut</label>
          <input v-model="form.mode" placeholder="Ex: Espresso, Auto..." />
        </div><div class="form-group" v-if="form.supporteMode">
        <label>Modes disponibles (séparés par virgules)</label>
        <input v-model="modesInput" placeholder="Ex: Espresso, Lungo" />
      </div>



        <button type="submit" class="btn-submit">Créer l'objet</button>
      </form>

      <!-- Tableau des objets -->
      <table v-if="objets.length" class="objects-table">
        <thead>
        <tr>
          <th>Nom</th>
          <th>Type</th>
          <th>Statut</th>
          <th>Actions</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="obj in objets" :key="obj._id">
          <td>{{ obj.nom }}</td>
          <td>{{ obj.type }}</td>
          <td>{{ obj.statut }}</td>
          <td>
            <router-link :to="`/manage/objects/${obj._id}/edit`">
              <button class="btn-edit">Modifier</button>
            </router-link>

            <button @click="requestDeletion(obj)">🗑️ Solliciter suppression</button>
          </td>
        </tr>
        </tbody>
      </table>

      <p v-else>Aucun objet pour le moment.</p>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import AppLayout from '@/layout/AppLayoutGlobal.vue'

const objets = ref([])
const showForm = ref(false)
const modesInput = ref('')

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

onMounted(async () => {
  await fetchObjects()
})

const fetchObjects = async () => {
  try {
    const res = await api.get('/objets')
    objets.value = res.data
  } catch (error) {
    console.error("Erreur chargement objets:", error)
  }
}

const createObject = async () => {
  try {
    const cleanedModes = modesInput.value
        .split(',')
        .map(m => m.trim())
        .filter(Boolean);

    const payload = {
      ...form.value,

      // Forcer des champs même s'ils sont "vides"
      statut: 'Inactif',
      temperatureCible: form.value.supporteTemperature ? form.value.temperatureCible || 0 : 0,
      supporteMode: form.value.supporteMode,
      mode: form.value.supporteMode
          ? form.value.mode || cleanedModes[0] || null
          : null,
      modesDisponibles: form.value.supporteMode ? cleanedModes : []
    };

    await api.post('/objets', payload);
    alert('✅ Objet ajouté avec succès');
    showForm.value = false;
    await fetchObjects();
  } catch (err) {
    console.error('Erreur création objet :', err);
    alert('❌ Erreur lors de la création');
  }
};


const requestDeletion = async (obj) => {
  try {
    await api.post(`/objets/${obj._id}/demande-suppression`, {
      motif: "Suppression demandée par l'utilisateur avancé"  // Tu peux rendre ce champ dynamique plus tard
    })

    alert(`🔔 Demande de suppression envoyée pour : ${obj.nom}`)
  } catch (err) {
    console.error('❌ Erreur envoi suppression :', err)
    alert("Erreur lors de l'envoi de la demande.")
  }
}

</script>

<style scoped>
.manage-objects-page {
  padding: 20px;
}

.btn-toggle {
  margin-bottom: 20px;
  padding: 8px 14px;
  background-color: #2e8b57;
  color: white;
  border: none;
  cursor: pointer;
}

.form-ajout {
  max-width: 600px;
  margin-bottom: 30px;
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
  background-color: #007bff;
  color: white;
  border: none;
  cursor: pointer;
}

.objects-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 30px;
}

.objects-table th,
.objects-table td {
  border: 1px solid #ccc;
  padding: 10px;
}

.objects-table th {
  background-color: #f5f5f5;
}
</style>
