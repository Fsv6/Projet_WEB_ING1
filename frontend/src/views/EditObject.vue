<template>
  <AppLayout>
    <div class="edit-container">
      <div class="edit-card">
        <h1 class="edit-title">
          <i class="fas fa-pen-fancy"></i> Modifier l'objet
        </h1>
        
        <div v-if="!object" class="loading">
          <div class="spinner"></div>
        </div>
        
        <form v-else @submit.prevent="updateObject" class="edit-form">
          <div class="form-grid">
            <div class="form-group">
              <label>Nom</label>
              <input v-model="form.nom" required />
            </div>
            
            <div class="form-group">
              <label>Type</label>
              <input v-model="form.type" required />
            </div>
            
            <div class="form-group span-2">
              <label>Description</label>
              <textarea v-model="form.description" required></textarea>
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
              <select v-model="form.niveauDanger" :class="form.niveauDanger === 'élevé' ? 'danger' : ''">
                <option value="faible">Faible</option>
                <option value="élevé">Élevé</option>
              </select>
            </div>
          </div>
          
          <div class="features-section">
            <h2 class="section-title">Fonctionnalités supplémentaires</h2>
            <div class="checkboxes">
              <label class="checkbox">
                <input type="checkbox" v-model="form.supporteTemperature" />
                <span class="checkbox-text">Contrôle de température</span>
              </label>
              
              <label class="checkbox">
                <input type="checkbox" v-model="form.supporteMode" />
                <span class="checkbox-text">Modes d'utilisation</span>
              </label>
            </div>
          </div>
          
          <div class="optional-settings" v-if="form.supporteTemperature || form.supporteMode">
            <div v-if="form.supporteTemperature" class="form-group">
              <label>Température cible (°C)</label>
              <input v-model="form.temperatureCible" type="number" min="0" />
            </div>
            
            <div v-if="form.supporteMode" class="form-group">
              <label>Modes disponibles <span class="hint">(séparés par virgules)</span></label>
              <input v-model="modesInput" placeholder="Ex: Espresso, Rapide..." />
            </div>
            
            <div v-if="form.supporteMode" class="form-group">
              <label>Mode par défaut</label>
              <input v-model="form.mode" placeholder="Ex: Espresso..." />
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="router.push('/manage/objects')" class="btn-cancel">
              <i class="fas fa-times"></i> Annuler
            </button>
            <button type="submit" class="btn-save">
              <i class="fas fa-save"></i> Enregistrer
            </button>
          </div>
        </form>
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
      temperatureCible: res.data.temperatureCible || 20,
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
.edit-container {
  max-width: 700px;margin: 0 auto;
  padding: 0 1rem;
}

.edit-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
  margin-top: 1rem;
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.edit-title {
  font-size: 1.5rem;
  color: #2c5038;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid rgba(44, 80, 56, 0.1);
  padding-bottom: 0.6rem;
}

.edit-title i {
  color: #036672;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.span-2 {
  grid-column: span 2;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.3rem;
  font-weight: 500;
  color: #2c5038;
  font-size: 0.9rem;
}

.hint {
  font-size: 0.75rem;
  font-weight: normal;
  color: #666;
  font-style: italic;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.5rem 0.7rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.95rem;
  transition: all 0.25s;
  background-color: #f8fafc;
}

.form-group textarea {
  min-height: 90px;
  resize: vertical;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #2c5038;
  box-shadow: 0 0 0 2px rgba(44, 80, 56, 0.1);
  background-color: white;
}

.features-section {
  background-color: #f8fafc;
  padding: 1rem;
  border-radius: 6px;
  border-left: 3px solid #2c5038;
}

.section-title {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
  color: #2c5038;
}

.checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  user-select: none;
}

.checkbox input {
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: #2c5038;
}

.checkbox-text {
  color: #1f2a36;
  font-weight: 500;
  font-size: 0.9rem;
}

.optional-settings {
  background-color: #f0f9ff;
  padding: 1rem;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  animation: slideDown 0.3s ease-out;
  border-left: 3px solid #036672;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
  margin-top: 1rem;
}

.btn-save, .btn-cancel {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-save {
  background: #2c5038;
  color: white;
  border: none;
}

.btn-cancel {
  background: white;
  color: #1f2a36;
  border: 1px solid #e2e8f0;
}

.btn-save:hover {
  background: #1e3725;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(44, 80, 56, 0.2);
}

.btn-cancel:hover {
  background: #f7fafc;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.loading {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(44, 80, 56, 0.1);
  border-top-color: #2c5038;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.danger {
  border-color: #e53e3e;
  color: #c53030;
}

.danger:focus {
  border-color: #e53e3e;
  box-shadow: 0 0 0 2px rgba(229, 62, 62, 0.1);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 600px) {
  .edit-card {
    padding: 1rem;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
    gap: 0.8rem;
  }
  
  .span-2 {
    grid-column: span 1;
  }
  
  .edit-title {
    font-size: 1.3rem;
    margin-bottom: 1rem;
  }
  
  .form-actions {
    flex-direction: column-reverse;
  }
  
  .btn-save, .btn-cancel {
    width: 100%;
    justify-content: center;
  }
}
</style>
