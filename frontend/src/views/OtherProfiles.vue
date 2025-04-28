<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '@/layout/AppLayoutGlobal.vue'
import api from '@/services/api'
import { useAuthStore } from '../stores/auth'
const auth = useAuthStore()
const users = ref([])


onMounted(async () => {
  try {
    const res = await api.get('/users')
    users.value = res.data
  } catch (err) {
    console.error("Erreur lors du chargement des membres :", err)
  }
})
</script>

<template>
  <AppLayout>
    <div class="members-page">
      <h2>👥 Membres de la plateforme</h2>

      <ul class="member-list" v-if="users.length">
        <li v-for="user in users.filter(u => u._id !== auth.userId)" :key="user._id" class="member-card">
          <img
              class="avatar"
              :src="user.photo ? `http://localhost:5000${user.photo}` : require('@/assets/default-avatar.png')"
              alt="photo"
          />

          <div class="info">
            <p><strong>Pseudonyme :</strong> {{ user.login }}</p>
            <p><strong>Âge :</strong> {{ user.personne?.age || 'Non spécifié' }}</p>
            <p><strong>Genre :</strong> {{ user.personne?.genre || 'Non spécifié' }}</p>
            <p><strong>Date de naissance :</strong> {{ user.personne?.dateNaissance?.substring(0, 10) || 'Non spécifiée' }}</p>
            <p><strong>Type de membre :</strong> {{ user.personne?.typeMembre || 'Non précisé' }}</p>
          </div>
        </li>
      </ul>

      <p v-else>Chargement ou aucun membre trouvé...</p>
    </div>
  </AppLayout>
</template>

<style scoped>
.members-page {
  padding: 2rem;
}
.member-list {
  list-style: none;
  padding: 0;
}
.member-card {
  display: flex;
  align-items: flex-start;
  background: #f3f3f3;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 8px;
}
.avatar {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 50%;
  margin-right: 1rem;
}
.info {
  flex-grow: 1;
}
.see-profile {
  display: inline-block;
  margin-top: 0.5rem;
  color: #2c3e50;
  text-decoration: underline;
}
</style>
