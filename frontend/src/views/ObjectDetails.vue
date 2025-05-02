<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/layout/AppLayoutGlobal.vue'
import api from '../services/api'


const route = useRoute()
const object = ref(null)

onMounted(async () => {
  try {
    const res = await api.get(`/objets/${route.params.id}`)
    object.value = res.data
  } catch (error) {
    console.error('Erreur de chargement de l\'objet :', error)
  }
})
</script>

<template>
  <AppLayout>
    <div class="object-details">
      <router-link to="/explore">
        <button class="btn-retour">← Retour au dashboard !</button>
      </router-link>

      <h2>Détails de l'objet connecté</h2>

      <div v-if="object" class="object-info">
        <p><strong>Nom :</strong> {{ object.nom }}</p>
        <p><strong>Description :</strong> {{ object.description }}</p>
        <p><strong>Type :</strong> {{ object.type }}</p>
        <p><strong>Marque :</strong> {{ object.marque }}</p>
        <p><strong>État :</strong> {{ object.statut }}</p>
        <p><strong>Connectivité :</strong> {{ object.connectivite }}</p>
        <p><strong>Batterie :</strong> {{ object.batterie ?? 'N/A' }}%</p>
        <p><strong>Température actuelle :</strong> {{ object.temperatureActuelle }}°C</p>
        <p><strong>Température cible :</strong> {{ object.temperatureCible }}°C</p>
        <p><strong>Mode :</strong> {{ object.mode }}</p>
        <p><strong>Pièce :</strong> {{ object.piece }}</p>
        <p><strong>Dernière interaction :</strong> {{ new Date(object.derniereInteraction).toLocaleString() }}</p>
      </div>

      <div v-else>
        <p>Chargement...</p>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.object-details {
  padding: 2rem;
}
.object-info {
  background: #f9f9f9;
  padding: 1rem;
  border-radius: 8px;
}
.btn-retour {
  background-color: #2c3e50;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  margin-bottom: 1rem;
  cursor: pointer;
}

</style>
