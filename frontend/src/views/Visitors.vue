<template>
  <div class="main-wrapper">
    <!-- Barre latérale -->
    <AppSidebar :navItems="getNavItems()" />

    <!-- Contenu principal -->
    <div class="container">
      <h1>Espace Visiteurs</h1>
      <h2>Informations sur la Cuisine</h2>
      <p>La cuisine est un espace de convivialité où l'on prépare et partage des repas.</p>

      <button class="toggle-btn" @click="toggle('appareils')">Appareils</button>
      <button class="toggle-btn" @click="toggle('conseils')">Conseils</button>
      <button class="toggle-btn" @click="toggle('astuces')">Astuces</button>

      <div v-if="sections.appareils" class="info-section">
        <h3>Appareils de Cuisine</h3>
        <p>Four, plaque de cuisson, lave-vaisselle, réfrigérateur, micro-ondes, hotte.</p>
      </div>

      <div v-if="sections.conseils" class="info-section">
        <h3>Conseils pour l'Aménagement</h3>
        <p>Optimisez l’espace de travail, pensez au triangle d’activité (cuisson, lavage, rangement).</p>
      </div>

      <div v-if="sections.astuces" class="info-section">
        <h3>Astuces</h3>
        <p>Utilisez des tiroirs coulissants, installez un éclairage LED sous les meubles hauts.</p>
      </div>
    </div>
  </div>
</template>

<script>
import AppSidebar from '@/components/Sidebar.vue';

export default {
  name: "VisitorsPage",
  components: {
    AppSidebar
  },
  data() {
    return {
      sections: {
        appareils: false,
        conseils: false,
        astuces: false
      }
    };
  },
  methods: {
    toggle(section) {
      this.sections[section] = !this.sections[section];
    },
    getNavItems() {
      return [
        { path: '/admin', label: 'Accueil', icon: 'fas fa-home' },
        { path: '/admin/settings', label: 'Paramètres', icon: 'fas fa-cog' }
      ];
    }
  }
}
</script>

<style scoped>
.main-wrapper {
  background-color: #e0f7fa;
  font-family: Arial, sans-serif;
  display: flex;
  min-height: 100vh;
}

.container {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  max-width: 700px;
  margin: auto;
  flex-grow: 1;
  text-align: center;
}

h1 {
  color: #00796b;
  text-align: center;
  margin-bottom: 10px;
}

h2 {
  margin-top: 0;
}

p {
  color: #333;
  line-height: 1.6;
}

.toggle-btn {
  margin: 10px 5px;
  padding: 10px 15px;
  background-color: #00796b;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
}

.toggle-btn:hover {
  background-color: #004d40;
}

.info-section {
  margin-top: 15px;
  text-align: left;
}

.info-section p {
  margin: 5px 0;
}

@media (max-width: 800px) {
  .main-wrapper {
    flex-direction: column;
  }

  .container {
    margin: 0 auto;
    max-width: 95%;
  }
}
</style>
