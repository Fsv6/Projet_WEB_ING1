<template>
  <nav class="sidebar">
    <div class="sidebar-header">
      <h1 class="logo">Smart Kitchen</h1>
      
      <!-- Photo de profil de l'utilisateur connecté -->
      <div v-if="userId" class="user-photo-container">
        <img :src="getPhotoUrl(null, userId)" alt="Photo de profil" class="user-photo" />
      </div>
    </div>
    <hr class="divider" />

    <!-- Bouton de déconnexion remonté pour les utilisateurs connectés -->
    <div v-if="role && role !== 'visiteur'" class="logout-container">
      <button @click="logout" class="auth-btn logout-btn">Se déconnecter</button>
    </div>

    <ul class="nav-list">
      <li v-for="item in navItems" :key="item.path">
        <router-link :to="item.path" class="nav-link">
          <span class="nav-icon"><i :class="item.icon"></i></span>
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </li>
      <li v-if="role !== 'admin'">
        <router-link to="/family-members" class="nav-link">
          <span class="nav-icon"><i class="fas fa-users"></i></span>
          <span class="nav-label">Membres de ma famille</span>
        </router-link>
      </li>
      <!-- Toggle mode sombre intégré comme fonctionnalité -->
      <li>
        <button class="nav-link theme-toggle-list" @click="toggleTheme" type="button">
          <span class="nav-icon">
            <i :class="theme.darkMode ? 'fas fa-moon' : 'fas fa-sun'"></i>
          </span>
          <span class="nav-label">{{ theme.darkMode ? 'Mode clair' : 'Mode sombre' }}</span>
          <span class="toggle-switch-list">
            <span :class="['toggle-switch', { 'dark': theme.darkMode }]">
              <span class="toggle-thumb"></span>
              <span class="toggle-icons">
                <span v-if="!theme.darkMode" class="sun"></span>
                <span v-else>
                  <span class="moon"></span>
                  <span class="star star1"></span>
                  <span class="star star2"></span>
                  <span class="star star3"></span>
                </span>
              </span>
            </span>
          </span>
        </button>
      </li>
      <!-- Ajout des liens d'authentification comme éléments de navigation standards -->
      <li v-if="role === 'visiteur' || role === null">
        <router-link to="/register" class="nav-link auth-nav-link register-nav-link">
          <span class="nav-icon"><i class="fas fa-user-plus"></i></span>
          <span class="nav-label">S'inscrire</span>
        </router-link>
      </li>
      <li v-if="role === 'visiteur' || role === null">
        <router-link to="/login" class="nav-link auth-nav-link login-nav-link">
          <span class="nav-icon"><i class="fas fa-sign-in-alt"></i></span>
          <span class="nav-label">Se connecter</span>
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import { useRouter } from 'vue-router'
import { computed, onMounted } from 'vue'
import { getPhotoUrl } from '@/utils/photo'
import api from '../services/api'

const auth = useAuthStore()
const theme = useThemeStore()
const router = useRouter()
const role = auth.role
const userId = auth.userId

async function logout() {
  // Logger la déconnexion côté backend
  try {
    await api.post('history', { 
      action: 'deconnexion',
      details: {
        userId: userId // On envoie l'ID de l'utilisateur actuel
      }
    })
  } catch (e) {
    // On ignore l'erreur pour ne pas bloquer la déconnexion
  }
  auth.clearAuth()
  router.push('/login')
}

function toggleTheme() {
  theme.toggleDarkMode()
}

onMounted(() => {
  theme.initTheme()
})

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
    { path: '/level', label: 'Niveau', icon: 'fas fa-chart-line' }
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
      { path: '/admin/reports', label: 'Générer Rapports', icon: 'fas fa-file-export' },
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
  padding: 1rem 0.7rem 1rem 0.7rem;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.sidebar-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 0.2rem;
}

.logo {
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.user-photo-container {
  margin: 0.5rem 0 0.25rem;
}

.user-photo {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
}

.divider {
  margin: 0.5rem 0;
  border-color: rgba(255, 255, 255, 0.2);
  width: 100%;
}

.logout-container {
  margin: 0.35rem 0 0.5rem;
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
  width: 100%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.logout-btn {
  background-color: #ffe4e6;
  color: #9b1c1c;
}

.auth-btn:hover {
  background-color: #e2e8f0;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

.logout-btn:hover {
  background-color: #fecaca;
}

:global(html.dark-mode) .logout-btn {
  background-color: #9b2c2c;
  color: white;
}

:global(html.dark-mode) .logout-btn:hover {
  background-color: #c53030;
}

.nav-list {
  list-style: none;
  padding: 0;
  flex-grow: 1;
  margin-top: 0.5rem;
  min-height: 0;
  overflow-y: auto;
  /* Affiche un scroll SEULEMENT si vraiment nécessaire */
  scrollbar-width: thin;
  scrollbar-color: #2a3d65 #1f2a36;
}

.nav-link {
  display: flex;
  align-items: center;
  color: white;
  text-decoration: none;
  padding: 0.75rem 1rem;
  font-weight: 500;
  border-radius: 4px;
  transition: background-color 0.2s;
  position: relative;
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  margin-right: 12px;
  flex-shrink: 0;
}

.nav-label {
  flex-grow: 1;
  text-align: center;
  padding-right: 24px;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  text-decoration: none;
}

/* Styles spécifiques pour les liens d'authentification */
.auth-nav-link {
  font-weight: 600;
  margin-top: 0.5rem;
}

.register-nav-link {
  color: #4fd1c5;
}

.login-nav-link {
  color: #63b3ed;
}

.register-nav-link:hover {
  background-color: rgba(79, 209, 197, 0.15);
}

.login-nav-link:hover {
  background-color: rgba(99, 179, 237, 0.15);
}

:global(html.dark-mode) .register-nav-link {
  color: #4fd1c5;
}

:global(html.dark-mode) .login-nav-link {
  color: #63b3ed;
}

:global(html.dark-mode) .register-nav-link:hover {
  background-color: rgba(79, 209, 197, 0.2);
}

:global(html.dark-mode) .login-nav-link:hover {
  background-color: rgba(99, 179, 237, 0.2);
}

/* Toggle mode sombre tout en bas, bien visible */
.dark-mode-toggle {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  width: 100%;
  align-self: center;
  /* Fond accentué et visible dans les deux modes */
  background: linear-gradient(90deg, rgba(79,209,197,0.18) 0%, rgba(22,32,42,0.18) 100%);
  border-radius: 18px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  border: 1.5px solid #4fd1c5;
  padding: 0.4rem 0;
  transition: background 0.3s, border 0.3s;
}
.toggle-switch {
  width: 70px;
  height: 32px;
  background: #4fd1c5;
  border-radius: 20px;
  position: relative;
  transition: background 0.3s;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 6px rgba(0,0,0,0.10);
}
.toggle-switch.dark {
  background: #16202a;
}
.toggle-thumb {
  width: 28px;
  height: 28px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  left: 2px;
  top: 2px;
  transition: left 0.3s, background 0.3s;
  z-index: 2;
  box-shadow: 0 1px 4px rgba(0,0,0,0.10);
}
.toggle-switch.dark .toggle-thumb {
  left: 40px;
  background: #222;
}
.toggle-icons {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: absolute;
  left: 0; right: 0; top: 0; bottom: 0;
  pointer-events: none;
  padding: 0 10px;
  font-size: 18px;
}
.sun {
  width: 18px; height: 18px;
  background: yellow;
  border-radius: 50%;
  box-shadow: 0 0 8px 2px #ffe066;
  display: inline-block;
}
.moon {
  width: 18px; height: 18px;
  border-radius: 50%;
  background: #ffe066;
  position: relative;
  display: inline-block;
}
.moon::after {
  content: '';
  position: absolute;
  right: 0; top: 0;
  width: 12px; height: 18px;
  background: #16202a;
  border-radius: 50%;
}
.star {
  position: absolute;
  background: #ffe066;
  border-radius: 50%;
}
.star1 { width: 4px; height: 4px; left: 40px; top: 8px; }
.star2 { width: 3px; height: 3px; left: 48px; top: 18px; }
.star3 { width: 2px; height: 2px; left: 55px; top: 12px; }

.theme-toggle-list {
  width: 100%;
  background: none;
  border: none;
  color: inherit;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  transition: background-color 0.2s;
  position: relative;
  gap: 0.5rem;
  min-height: 44px;
}
.theme-toggle-list:hover {
  background-color: rgba(255,255,255,0.08);
}
.toggle-switch-list {
  margin-left: auto;
  display: flex;
  align-items: center;
}
.toggle-switch {
  width: 44px;
  height: 22px;
  background: #2a3d65;
  border-radius: 12px;
  position: relative;
  transition: background 0.3s;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 6px rgba(0,0,0,0.10);
}
.toggle-switch.dark {
  background: #1e293b;
}
.toggle-thumb {
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  left: 2px;
  top: 2px;
  transition: left 0.3s, background 0.3s;
  z-index: 2;
  box-shadow: 0 1px 4px rgba(0,0,0,0.10);
}
.toggle-switch.dark .toggle-thumb {
  left: 24px;
  background: #222;
}
.toggle-icons {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: absolute;
  left: 0; right: 0; top: 0; bottom: 0;
  pointer-events: none;
  padding: 0 5px;
  font-size: 13px;
}
.sun {
  width: 12px; height: 12px;
  background: yellow;
  border-radius: 50%;
  box-shadow: 0 0 4px 1px #ffe066;
  display: inline-block;
}
.moon {
  width: 12px; height: 12px;
  border-radius: 50%;
  background: #ffe066;
  position: relative;
  display: inline-block;
}
.moon::after {
  content: '';
  position: absolute;
  right: 0; top: 0;
  width: 8px; height: 12px;
  background: #16202a;
  border-radius: 50%;
}
.star {
  position: absolute;
  background: #ffe066;
  border-radius: 50%;
}
.star1 { width: 2.5px; height: 2.5px; left: 22px; top: 4px; }
.star2 { width: 2px; height: 2px; left: 28px; top: 12px; }
.star3 { width: 1.5px; height: 1.5px; left: 33px; top: 7px; }

@media (max-height: 800px) {
  .sidebar {
    padding: 0.5rem 0.3rem 0.5rem 0.3rem;
  }
  .logo {
    font-size: 1.05rem;
    margin-bottom: 0.3rem;
  }
  .user-photo {
    width: 44px;
    height: 44px;
  }
}

:global(html.dark-mode) .auth-buttons-container {
  background-color: rgba(79, 209, 197, 0.1);
  border: 1px solid rgba(79, 209, 197, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style>
