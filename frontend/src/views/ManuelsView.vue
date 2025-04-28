<script setup>
import { onMounted, computed } from 'vue'
import { useObjetsStore } from '@/stores/objetsStore'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/layout/AppLayoutGlobal.vue'

const objetsStore = useObjetsStore()
const auth = useAuthStore()
const isVisiteur = computed(() => auth.role === 'visiteur')

onMounted(() => {
  objetsStore.fetchObjets()
})

const objetsAvecManuels = objetsStore.objetsAvecManuels
</script>

<template>
  <AppLayout>
    <div class="manuels-page">
      <h1>Manuels des objets connectés</h1>

      <div
          class="manuel-card"
          v-for="obj in objetsAvecManuels"
          :key="obj.manuel._id"
      >
        <h3>{{ obj.nom }}</h3>
        <p>Type : {{ obj.type }}</p>
        <button
            class="disabled-button"
            :disabled="isVisiteur"
        >
          🔒 Télécharger le manuel
        </button>

        <p class="blocked-msg">Réservé aux utilisateurs inscrits</p>
      </div>
    </div>
  </AppLayout>
</template>


<style scoped>
.manuels-page {
  max-width: 1000px;
  margin: 0 auto;
}

.manuel-card {
  background: white;
  padding: 1rem;
  border-radius: 10px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.disabled-button {
  background-color: #ccc;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  color: #666;
  cursor: not-allowed;
  font-weight: bold;
  margin-top: 5px;
}

.blocked-msg {
  font-size: 0.8rem;
  color: #888;
  text-align: center;
  margin-top: 5px;
}
</style>
