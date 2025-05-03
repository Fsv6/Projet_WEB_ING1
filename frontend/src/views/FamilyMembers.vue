<template>
  <AppLayout>
    <div class="family-members-container">
      <h1 class="page-title">Membres de ma famille</h1>
      <div v-if="loading" class="loading-indicator">
        <i class="fas fa-spinner fa-spin"></i> Chargement des membres de votre famille...
      </div>
      <div v-else>
        <div v-if="familyMembers.length === 0" class="no-members">
          <p>Vous n'avez aucun membre de famille enregistré.</p>
        </div>
        <div v-else>
          <div class="members-list">
            <div
                v-for="member in familyMembers"
                :key="member.id"
                class="member-card"
            >
              <div class="member-details">
                <h3>{{ member.nom }} {{ member.prenom }}</h3>
                <p><strong>Rôle:</strong> {{ member.role }}</p>
                <p><strong>Niveau:</strong> {{ member.niveau }}</p>
              </div>
            </div>
          </div>

          <div v-if="familyMembers.length > 0" class="chart-container">
            <h2>Répartition des points</h2>
            <div class="bar-chart">
              <div
                  v-for="(member, index) in familyMembers"
                  :key="member.id"
                  class="bar-wrapper"
              >
                <div
                    class="bar"
                    :style="{
                      height: Math.max((Number(member.points) / maxPoints) * 100, 5) + '%',
                      backgroundColor: getColor(index)
                    }"
                    :aria-label="`Points de ${member.prenom} ${member.nom} : ${member.points}`"
                    role="progressbar"
                    :aria-valuenow="member.points"
                    :aria-valuemin="0"
                    :aria-valuemax="maxPoints"
                >
                </div>
                <span class="bar-label">{{ member.points }}</span>
                <p class="bar-name">{{ member.nom }}</p>
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

export default {
  name: 'FamilyMembers',
  components: { AppLayout },
  setup() {
    const familyMembers = ref([]);
    const loading = ref(true);

    const loadFamilyMembers = async () => {
      try {
        const response = await api.get('/users/family-members');
        familyMembers.value = response.data.map(member => ({
          ...member,
          points: member.points || 0
        }));
      } catch (error) {
        console.error('Erreur lors du chargement des membres de la famille:', error);
      } finally {
        loading.value = false;
      }
    };

    const maxPoints = computed(() => {
      if (familyMembers.value.length === 0) return 1;
      return Math.max(...familyMembers.value.map(m => Number(m.points) || 0), 1);
    });

    const getColor = (index) => {
      const colors = ['#2c5038', '#4a7c59', '#a3b18a', '#f4a261', '#e76f51'];
      return colors[index % colors.length];
    };

    onMounted(() => {
      loadFamilyMembers();
    });

    return {
      familyMembers,
      loading,
      maxPoints,
      getColor
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
  font-size: 1.75rem;
  text-align: center;
  font-weight: 600;
  position: relative;
  padding-bottom: 0.5rem;
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
  color: #666;
  font-size: 1rem;
  font-style: italic;
  padding: 1.5rem;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.members-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.member-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  padding: 1rem;
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.member-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.member-details h3 {
  margin: 0 0 0.5rem;
  font-size: 1.15rem;
  color: #2c5038;
  font-weight: 600;
}

.member-details p {
  margin: 0.5rem 0;
  color: #4a5568;
  font-size: 0.9rem;
  line-height: 1.4;
}

.chart-container {
  margin-top: 2rem;
  text-align: center;
  padding: 1.25rem;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.chart-container h2 {
  margin-bottom: 1rem;
  color: #2c5038;
  font-size: 1.2rem;
  font-weight: 600;
}

.bar-chart {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  height: 180px;
  padding: 1rem;
  position: relative;
  background-color: #f9fafb;
  border-radius: 8px;
  overflow-x: auto;
  gap: 1rem;
}

.bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 40px;
  position: relative;
}

.bar {
  width: 35px;
  min-height: 10px;
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  transition: height 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  border-radius: 6px 6px 0 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.bar-label {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 4px;
  color: #2c5038;
  font-weight: 600;
  font-size: 0.8rem;
  background-color: white;
  padding: 0.15rem 0.3rem;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.bar-name {
  margin-top: 0.6rem;
  font-size: 0.8rem;
  color: #4a5568;
  font-weight: 500;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  max-width: 80px;
}

/* Media queries pour le responsive */
@media (max-width: 768px) {
  .members-list {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.8rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .bar {
    width: 30px;
  }

  .bar-wrapper {
    min-width: 35px;
  }
}

@media (max-width: 480px) {
  .members-list {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .family-members-container {
    padding: 0.8rem;
  }

  .page-title {
    font-size: 1.3rem;
  }

  .chart-container {
    padding: 0.8rem;
  }

  .bar-chart {
    height: 150px;
    padding: 0.8rem;
  }

  .bar {
    width: 25px;
  }

  .bar-label {
    font-size: 0.7rem;
  }
}
</style>
