<template>
  <nav class="sidebar">
    <h1 class="logo">Smart Kitchen</h1>
    <hr />

    <ul class="nav-list">
      <li v-for="item in navItems" :key="item.path">
        <router-link :to="item.path" class="nav-link">
          <i :class="item.icon"></i> {{ item.label }}
        </router-link>
      </li>
      <li v-if="role !== 'admin'">
        <router-link to="/family-members" class="nav-link">
          <i class="fas fa-users"></i> Membres de ma famille
        </router-link>
      </li>
    </ul>

    <div class="auth-actions">
      <template v-if="role === 'visiteur' || role === null">
        <router-link to="/register" class="auth-btn">S'inscrire</router-link>
        <router-link to="/login" class="auth-btn">Se connecter</router-link>
      </template>
      <template v-else>
        <button @click="logout" class="auth-btn logout-btn">Se déconnecter</button>
      </template>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { computed } from 'vue'


const auth = useAuthStore()
const router = useRouter()
const role = auth.role

function logout() {
  auth.clearAuth()
  router.push('/login')
}

const navItems = computed(() => {
  if (role === 'visiteur') {
    return [
      { path: '/explore', label: 'Explorer', icon: 'fas fa-search' },
      { path: '/recettes', label: 'Recettes', icon: 'fas fa-utensils' },
      { path: '/level', label: 'Niveau', icon: 'fas fa-chart-line' }
    ]
  }

  const common = [
    { path: '/profile', label: 'Profil', icon: 'fas fa-user' },
    { path: '/explore', label: 'Explorer', icon: 'fas fa-search' },
    { path: '/recettes', label: 'Recettes', icon: 'fas fa-utensils' },
    { path: '/level', label: 'Niveau', icon: 'fas fa-chart-line' },
    { path: '/profile/:id', label: 'Autres Membres', icon: 'fas fa-users' }
  ]

  const complexe = [
    { path: '/manage/objects', label: 'Gestion Objets', icon: 'fas fa-cogs' }
  ]

  if (role === 'admin') {
    return [
      { path: '/admin', label: 'Tableau de bord', icon: 'fas fa-home' },
      { path: '/admin/users', label: 'Gestion Utilisateurs', icon: 'fas fa-users-cog' },
      { path: '/admin/families', label: 'Gestion Familles', icon: 'fas fa-users' },
      { path: '/manage/objects', label: 'Gestion Objets', icon: 'fas fa-cogs' },
      { path: '/admin/history', label: 'Historique des actions', icon: 'fas fa-history' },
      { path: '/profile', label: 'Profil', icon: 'fas fa-user' },
      { path: '/explore', label: 'Explorer', icon: 'fas fa-search' },
      { path: '/recettes', label: 'Recettes', icon: 'fas fa-utensils' },
      { path: '/level', label: 'Niveau', icon: 'fas fa-chart-line' }
    ]
  }

  if (role === 'complexe') return [...common, ...complexe]
  return common
})
</script>

<style scoped>
.sidebar {
  width: 250px;
  background-color: #1f2a36;
  color: white;
  height: 100vh;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.nav-list {
  list-style: none;
  padding: 0;
  flex-grow: 1;
}

.nav-link {
  display: block;
  color: white;
  text-decoration: none;
  padding: 0.75rem 0;
  font-weight: 500;
}

.nav-link:hover {
  text-decoration: underline;
}

.auth-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: auto;
}

.auth-btn {
  background-color: #f0f4f8;
  color: #036672;
  padding: 0.6rem 1.2rem;
  border-radius: 4px;
  border: none;
  text-align: center;
  cursor: pointer;
  font-weight: bold;
  text-decoration: none;
  transition: 0.2s;
}

.logout-btn {
  background-color: #ffe4e6;
  color: #9b1c1c;
}

.auth-btn:hover {
  background-color: #e2e8f0;
}
.logout-btn:hover {
  background-color: #fecaca;
}
</style>
