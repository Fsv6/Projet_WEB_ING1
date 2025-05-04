<template>
  <AppLayout>
    <div class="family-members-container">
      <h1 class="page-title">
        Membres de ma famille
        <span class="members-count">({{ filteredMembers.length }})</span>
      </h1>
      <div v-if="loading" class="loading-indicator">
        <i class="fas fa-spinner fa-spin"></i> Chargement des membres de votre famille...
      </div>
      <div v-else>
        <div v-if="familyMembers.length === 0" class="no-members">
          <i class="fas fa-users-slash"></i>
          <h3>Aucun membre de famille</h3>
          <p>Vous n'avez pas encore de membres de famille enregistrés dans votre compte.</p>
          <p class="info-text">Les membres de votre famille apparaîtront ici une fois qu'ils auront été ajoutés à votre compte.</p>
        </div>
        <div v-else>
          <div class="members-list" :class="{ 'visitor-blur': isVisitor }">
            <div
                v-for="member in filteredMembers"
                :key="member._id"
                class="member-card"
                @mouseenter="showTooltip(member)"
                @mouseleave="hideTooltip"
            >
              <div class="member-photo">
                <img :src="getPhotoUrl(member.photo, member._id)" alt="Photo de profil" class="avatar" />
              </div>
              <div class="member-details">
                <h3>{{ member.nom }} {{ member.prenom }}</h3>
                <p><strong>Rôle:</strong> {{ member.role }}</p>
                <p><strong>Niveau:</strong> {{ member.niveau }}</p>
              </div>
              <div v-if="activeTooltip === member._id" class="member-tooltip">
                <h4>{{ member.prenom }} {{ member.nom }}</h4>
                <div class="tooltip-detail">
                  <span class="tooltip-label">Email:</span>
                  <span>{{ member.email || 'Non renseigné' }}</span>
                </div>
                <div class="tooltip-detail">
                  <span class="tooltip-label">Points:</span>
                  <span>{{ member.points || 0 }}</span>
                </div>
                <div class="tooltip-detail">
                  <span class="tooltip-label">Niveau:</span>
                  <span>{{ member.niveau }}</span>
                </div>
                <div class="tooltip-detail">
                  <span class="tooltip-label">Rôle:</span>
                  <span>{{ member.role }}</span>
                </div>
                <div v-if="member.dateCreation" class="tooltip-detail">
                  <span class="tooltip-label">Membre depuis:</span>
                  <span>{{ formatDate(member.dateCreation) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="familyMembers.length > 0" class="chart-container" :class="{ 'visitor-blur-light': isVisitor }">
            <h2>Répartition des points</h2>
            <div class="bar-chart">
              <div
                  v-for="(member, index) in filteredMembers"
                  :key="member._id"
                  class="bar-wrapper"
              >
                <div
                    class="bar"
                    :style="{
                      height: ((Number(member.points) / maxPoints) * 180) + 'px',
                      '--bar-color': getColor(index)
                    }"
                    :aria-label="`Points de ${member.prenom} ${member.nom} : ${member.points}`"
                    role="progressbar"
                    :aria-valuenow="member.points"
                    :aria-valuemin="0"
                    :aria-valuemax="maxPoints"
                >
                </div>
                <span class="bar-label">{{ member.points }}</span>
                <p class="bar-name">{{ member.prenom }}</p>
              </div>
            </div>
          </div>
          <div v-if="isVisitor" class="visitor-overlay">
            <div class="visitor-message">
              <i class="fas fa-chart-bar"></i>
              <h3>Aperçu des membres de famille</h3>
              <p>Créez un compte ou connectez-vous pour accéder à votre propre espace familial.</p>
              <div class="visitor-actions">
                <router-link to="/login" class="visitor-btn login">Connexion</router-link>
                <router-link to="/register" class="visitor-btn register">Inscription</router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import AppLayout from '@/layout/AppLayoutGlobal.vue';
import api from '@/services/api';
import { getPhotoUrl } from '@/utils/photo';
import { useAuthStore } from '@/stores/auth';

export default {
  name: 'FamilyMembers',
  components: { AppLayout },
  setup() {
    const familyMembers = ref([]);
    const loading = ref(true);
    const activeTooltip = ref(null);
    const auth = useAuthStore();

    const isVisitor = computed(() => {
      return auth.role === 'visiteur' || auth.role === null;
    });

    const filteredMembers = computed(() =>
      familyMembers.value.filter(m => m.role !== 'admin')
    );

    const loadFamilyMembers = async () => {
      try {
        if (isVisitor.value) {
          // Données de démo pour les visiteurs avec des IDs au format MongoDB (24 caractères)
          familyMembers.value = [
            {
              _id: '123456789012345678901234',
              nom: 'Dupont',
              prenom: 'Jean',
              role: 'simple',
              niveau: 'expert',
              points: 97,
              email: 'jean.dupont@exemple.fr',
              dateCreation: new Date('2023-09-15').toISOString(),
              photo: null
            },
            {
              _id: '123456789012345678901235',
              nom: 'Martin',
              prenom: 'Sophie',
              role: 'simple',
              niveau: 'intermédiaire',
              points: 64,
              email: 'sophie.martin@exemple.fr',
              dateCreation: new Date('2023-10-22').toISOString(),
              photo: null
            },
            {
              _id: '123456789012345678901236',
              nom: 'Bernard',
              prenom: 'Lucas',
              role: 'simple',
              niveau: 'débutant',
              points: 32,
              email: 'lucas.bernard@exemple.fr',
              dateCreation: new Date('2024-01-05').toISOString(),
              photo: null
            },
            {
              _id: '123456789012345678901237',
              nom: 'Petit',
              prenom: 'Emma',
              role: 'simple',
              niveau: 'débutant',
              points: 21,
              email: 'emma.petit@exemple.fr',
              dateCreation: new Date('2024-02-18').toISOString(),
              photo: null
            }
          ];
        } else {
          const response = await api.get('/users/family-members');
          familyMembers.value = response.data.map(member => ({
            ...member,
            points: member.points || 0
          }));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des membres de la famille:', error);
        // Fallback aux données de démo en cas d'erreur
        if (familyMembers.value.length === 0) {
          familyMembers.value = [
            {
              _id: '123456789012345678901234',
              nom: 'Dupont',
              prenom: 'Jean',
              role: 'simple',
              niveau: 'expert',
              points: 97,
              email: 'jean.dupont@exemple.fr',
              dateCreation: new Date('2023-09-15').toISOString(),
              photo: null
            }
          ];
        }
      } finally {
        loading.value = false;
      }
    };

    const maxPoints = computed(() => {
      if (filteredMembers.value.length === 0) return 100;
      const max = Math.max(...filteredMembers.value.map(m => Number(m.points) || 0));
      return max === 0 ? 100 : max;
    });

    const getColor = (index) => {
      // Palette unique pour toutes les barres, quel que soit le thème
      const colors = ['#2c5038', '#4a7c59', '#a3b18a', '#f4a261', '#e76f51'];
      return colors[index % colors.length];
    };

    const showTooltip = (member) => {
      activeTooltip.value = member._id;
    };

    const hideTooltip = () => {
      activeTooltip.value = null;
    };

    const formatDate = (dateString) => {
      if (!dateString) return 'Date inconnue';
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    };

    const safeGetPhotoUrl = (photo, userId) => {
      if (isVisitor.value) {
        // En mode visiteur, utiliser des avatars génériques basés sur l'index
        const index = familyMembers.value.findIndex(m => m._id === userId);
        const colors = ['#4fd1c5', '#63b3ed', '#f6ad55', '#fc8181'];
        const avatarColor = colors[index % colors.length];
        const initials = familyMembers.value.find(m => m._id === userId)?.prenom.charAt(0) || '?';
        
        // Créer un SVG en base64 pour l'avatar
        const svgContent = `
          <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="50" fill="${avatarColor}" />
            <text x="50" y="65" font-family="Arial" font-size="40" fill="white" text-anchor="middle">${initials}</text>
          </svg>
        `;
        return `data:image/svg+xml;base64,${btoa(svgContent)}`;
      }
      
      // Sinon utiliser la fonction getPhotoUrl normale
      return getPhotoUrl(photo, userId);
    };

    onMounted(() => {
      loadFamilyMembers();
    });

    return {
      familyMembers,
      filteredMembers,
      loading,
      maxPoints,
      getColor,
      getPhotoUrl: safeGetPhotoUrl,
      activeTooltip,
      showTooltip,
      hideTooltip,
      formatDate,
      isVisitor
    };
  }
};
</script>

<style scoped>
.family-members-container {
  padding: 1rem;
  max-width: 950px;
  margin: 0 auto;
  width: 100%;
}

.page-title {
  color: #2c5038;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  text-align: center;
  font-weight: 600;
  position: relative;
  padding-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.page-title .members-count {
  font-size: 1.1rem;
  color: #4a7c59;
  font-weight: 500;
  margin-left: 0.5rem;
}

.page-title::after {
  content: '';
  position: absolute;
  width: 60px;
  height: 2px;
  background-color: #2c5038;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 2px;
}

.loading-indicator {
  text-align: center;
  font-size: 1rem;
  color: #666;
  padding: 1.5rem;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.no-members {
  text-align: center;
  padding: 2rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin: 2rem auto;
  max-width: 500px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.no-members i {
  font-size: 3rem;
  color: #6c757d;
  margin-bottom: 1rem;
}

.no-members h3 {
  color: #2c5038;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.no-members p {
  color: #6c757d;
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.no-members .info-text {
  font-style: italic;
  font-size: 0.9rem;
  margin-top: 1rem;
  color: #868e96;
}

.members-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.7rem;
  margin-bottom: 2rem;
}

.member-card {
  background: linear-gradient(135deg, #e0f7fa 0%, #b2dfdb 100%);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(44, 80, 56, 0.10), 0 1.5px 4px rgba(44, 80, 56, 0.08);
  padding: 0.7rem 0.5rem 0.8rem 0.5rem;
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1.5px solid #2c5038;
  position: relative;
  min-width: 0;
  max-width: 210px;
  margin: 0 auto;
}

/* Styles spécifiques pour le mode sombre - Carte membre */
:global(html.dark-mode) .member-card {
  background: var(--dark-bg-card) !important;
  border: 1.5px solid var(--dark-border) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25) !important;
}

.member-card:hover {
  transform: translateY(-4px) scale(1.03);
  box-shadow: 0 6px 18px rgba(44, 80, 56, 0.18), 0 2px 8px rgba(44, 80, 56, 0.12);
  border-color: #4a7c59;
  z-index: 10;
}

:global(html.dark-mode) .member-card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35) !important;
  border-color: var(--dark-accent) !important;
}

.member-photo {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 0.5rem;
}

.avatar {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 50%;
  border: 2px solid #4a7c59;
  background: #fff;
  box-shadow: 0 1px 4px rgba(44, 80, 56, 0.10);
}

:global(html.dark-mode) .avatar {
  border-color: var(--dark-accent) !important;
  background: var(--dark-bg-input) !important;
}

.member-details h3 {
  margin: 0 0 0.3rem;
  font-size: 1.05rem;
  color: #2c5038;
  font-weight: 700;
  word-break: break-word;
}

:global(html.dark-mode) .member-details h3 {
  color: var(--dark-text) !important;
}

.member-details p {
  margin: 0.3rem 0;
  color: #4a5568;
  font-size: 0.9rem;
  line-height: 1.3;
}

:global(html.dark-mode) .member-details p {
  color: var(--dark-text-muted) !important;
}

.chart-container {
  margin-top: 2rem;
  text-align: center;
  padding: 1.25rem;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  border: 1.5px solid #2c5038;
}

:global(html.dark-mode) .chart-container {
  background-color: var(--dark-bg-card) !important;
  border-color: var(--dark-border) !important;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2) !important;
}

.chart-container h2 {
  margin-bottom: 1rem;
  color: #2c5038;
  font-size: 1.1rem;
  font-weight: 600;
}

:global(html.dark-mode) .chart-container h2 {
  color: var(--dark-text) !important;
}

.bar-chart {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  height: 220px;
  min-height: 220px;
  padding: 0.7rem;
  position: relative;
  background-color: #f9fafb;
  border-radius: 8px;
  overflow-x: auto;
  gap: 0.7rem;
}

:global(html.dark-mode) .bar-chart {
  background-color: var(--dark-bg-main) !important;
}

.bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 30px;
  position: relative;
}

.bar {
  width: 22px;
  min-height: 3px;
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  transition: height 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  border-radius: 6px 6px 0 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  background-color: var(--bar-color) !important;
}

:global(html.dark-mode) .bar {
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.bar-label {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 2px;
  color: #2c5038;
  font-weight: 600;
  font-size: 0.75rem;
  background-color: white;
  padding: 0.1rem 0.2rem;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

:global(html.dark-mode) .bar-label {
  background-color: var(--dark-bg-input) !important;
  color: var(--dark-text) !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2) !important;
}

.bar-name {
  margin-top: 0.4rem;
  font-size: 0.75rem;
  color: #4a5568;
  font-weight: 500;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  max-width: 60px;
}

:global(html.dark-mode) .bar-name {
  color: var(--dark-text-muted) !important;
}

.member-tooltip {
  position: absolute;
  z-index: 100;
  left: 105%;
  top: 0;
  width: 220px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 0.8rem;
  text-align: left;
  border: 1px solid #2c5038;
  animation: fadeIn 0.2s ease-out;
}

:global(html.dark-mode) .member-tooltip {
  background-color: var(--dark-bg-card) !important;
  border: 1px solid var(--dark-accent) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.member-tooltip h4 {
  margin: 0 0 0.5rem;
  color: #2c5038;
  font-size: 1rem;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.4rem;
}

:global(html.dark-mode) .member-tooltip h4 {
  color: var(--dark-text) !important;
  border-bottom: 1px solid var(--dark-border) !important;
}

.tooltip-detail {
  margin: 0.4rem 0;
  font-size: 0.85rem;
  display: flex;
  flex-direction: column;
}

:global(html.dark-mode) .tooltip-detail {
  color: var(--dark-text) !important;
}

.tooltip-label {
  font-weight: 600;
  color: #4a7c59;
  margin-right: 0.3rem;
}

:global(html.dark-mode) .tooltip-label {
  color: var(--dark-accent) !important;
}

@media (max-width: 900px) {
  .family-members-container {
    max-width: 99vw;
    padding: 0.5rem;
  }
  .members-list {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 0.5rem;
  }
  .member-card {
    max-width: 160px;
    padding: 0.5rem 0.2rem 0.6rem 0.2rem;
  }
  .avatar {
    width: 38px;
    height: 38px;
  }
  .member-tooltip {
    left: -65%;
    top: 100%;
    width: 180px;
  }
  .member-card:hover {
    z-index: 10;
  }
}

@media (max-width: 600px) {
  .family-members-container {
    padding: 0.2rem;
  }
  .page-title {
    font-size: 1.1rem;
    padding-bottom: 0.2rem;
  }
  .members-list {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 0.3rem;
  }
  .member-card {
    max-width: 110px;
    padding: 0.3rem 0.1rem 0.4rem 0.1rem;
    border-radius: 8px;
  }
  .avatar {
    width: 28px;
    height: 28px;
  }
  .member-details h3 {
    font-size: 0.8rem;
  }
  .member-details p {
    font-size: 0.7rem;
  }
  .chart-container {
    padding: 0.5rem;
    border-radius: 7px;
  }
  .bar-chart {
    height: 80px;
    padding: 0.3rem;
    gap: 0.3rem;
  }
  .bar {
    width: 12px;
    min-height: 4px;
    border-radius: 4px 4px 0 0;
  }
  .bar-label {
    font-size: 0.6rem;
    padding: 0.05rem 0.1rem;
  }
  .bar-name {
    font-size: 0.6rem;
    max-width: 30px;
  }
  .member-tooltip {
    left: -50%;
    width: 160px;
    font-size: 0.75rem;
    padding: 0.5rem;
  }
  .tooltip-detail {
    font-size: 0.7rem;
    margin: 0.2rem 0;
  }
  .member-tooltip h4 {
    font-size: 0.8rem;
    padding-bottom: 0.2rem;
  }
}

.visitor-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, 
    rgba(0, 0, 0, 0.4) 0%, 
    rgba(0, 0, 0, 0.2) 40%, 
    rgba(0, 0, 0, 0.1) 60%, 
    rgba(0, 0, 0, 0.3) 100%
  );
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  pointer-events: none;
}

.visitor-message {
  background-color: white;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15);
  max-width: 90%;
  width: 350px;
  transform: translateY(-60px);
  pointer-events: auto;
}

:global(html.dark-mode) .visitor-message {
  background-color: #1f2937;
  border: 1px solid #4b5563;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.3);
}

.visitor-message i {
  font-size: 3rem;
  color: #4a7c59;
  margin-bottom: 1rem;
  opacity: 0.9;
  animation: pulse 2s infinite ease-in-out;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.visitor-message h3 {
  color: #2c5038;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.visitor-message p {
  color: #4a5568;
  margin-bottom: 1.5rem;
  line-height: 1.6;
  font-size: 1.05rem;
}

.visitor-actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.visitor-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-block;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.visitor-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.visitor-btn.login {
  background-color: #63b3ed;
  color: #1a202c;
}

.visitor-btn.login:hover {
  background-color: #4299e1;
}

.visitor-btn.register {
  background-color: #4fd1c5;
  color: #1a202c;
}

.visitor-btn.register:hover {
  background-color: #38b2ac;
}

:global(html.dark-mode) .visitor-btn.login {
  background-color: #2b6cb0;
  color: #f7fafc;
}

:global(html.dark-mode) .visitor-btn.login:hover {
  background-color: #3182ce;
}

:global(html.dark-mode) .visitor-btn.register {
  background-color: #2c7a7b;
  color: #f7fafc;
}

:global(html.dark-mode) .visitor-btn.register:hover {
  background-color: #38a169;
}

:global(html.dark-mode) .visitor-message i {
  color: #4fd1c5;
}

:global(html.dark-mode) .visitor-message h3 {
  color: #f7fafc;
}

:global(html.dark-mode) .visitor-message p {
  color: #cbd5e0;
}

.visitor-blur {
  filter: blur(3.5px);
  user-select: none;
  opacity: 0.95;
}

.visitor-blur-light {
  filter: blur(1.5px);
  opacity: 0.98;
}
</style>
