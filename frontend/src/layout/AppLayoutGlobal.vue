<template>
  <div class="layout">
    <!-- Burger mobile -->
    <button class="burger-btn" @click="toggleSidebar">☰</button>

    <!-- Sidebar autonome -->
    <Sidebar :class="{ open: sidebarVisible }" />

    <div class="layout-main">
      <!-- Bannière visiteur -->
      <div v-if="auth.role === 'visiteur'" class="visitor-banner">
        ⚠️ Mode visiteur activé — certaines informations sont floutées ou restreintes.
      </div>

      <!-- Contenu principal -->
      <main class="page-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script>
import Sidebar from '@/components/SideBar.vue'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'AppLayoutGlobal',
  components: { Sidebar },
  setup() {
    const auth = useAuthStore()
    return { auth }
  },
  data() {
    return {
      sidebarVisible: false
    }
  },
  methods: {
    toggleSidebar() {
      this.sidebarVisible = !this.sidebarVisible
    }
  }
}
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
}

.layout-main {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.page-content {
  flex: 1;
  padding: 2rem;
  margin-left: 0;
  overflow-y: auto;
}

/* Burger bouton */
.burger-btn {
  display: none;
  background: none;
  border: none;
  font-size: 2rem;
  padding: 1rem;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1000;
}

.visitor-banner {
  background-color: #fef3c7;
  color: #92400e;
  padding: 10px 20px;
  border-left: 5px solid #facc15;
  margin-bottom: 1rem;
  font-weight: bold;
  font-size: 0.95rem;
}

/* Responsive */
@media screen and (max-width: 768px) {
  .burger-btn {
    display: block;
  }

  .layout {
    flex-direction: column;
  }

  .sidebar {
    display: none;
  }

  .sidebar.open {
    display: block;
  }
}
</style>
