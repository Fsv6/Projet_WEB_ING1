<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import AppLayout from '@/layout/AppLayoutGlobal.vue'

const auth = useAuthStore()

const isVisiteur = computed(() => auth.role === 'visiteur')

const niveaux = ['débutant', 'intermédiaire', 'avancé', 'expert']
const seuils = {
  'intermédiaire': 3,
  'avancé': 5,
  'expert': 7
}

const currentPoints = computed(() => isVisiteur.value ? 0 : auth.points)
const currentLevel = computed(() => isVisiteur.value ? 'débutant' : auth.niveau)
const currentIndex = computed(() => niveaux.indexOf(currentLevel.value))

const nextLevel = computed(() => niveaux[currentIndex.value + 1])
const pointsNeeded = computed(() => seuils[nextLevel.value] || null)
const readyForUpgrade = computed(() =>
    !isVisiteur.value &&
    nextLevel.value &&
    pointsNeeded.value &&
    currentPoints.value >= pointsNeeded.value
)

const upgradeLevel = async () => {
  console.log('🟢 Click détecté – tentative de montée de niveau');
  console.log('auth.userId =', auth.userId);

  if (!readyForUpgrade.value || !nextLevel.value) return
  try {
    console.log(`📤 Envoi POST vers /users/${auth.userId}/upgrade avec niveau = ${nextLevel.value}`);

    const res = await api.post(`/users/${auth.userId}/upgrade`, { niveau: nextLevel.value })
    console.log('✅ Réponse API :', res.data);

    auth.niveau = res.data.niveau
    auth.role = res.data.role
    localStorage.setItem('niveau', res.data.niveau)
    localStorage.setItem('role', res.data.role)

    alert("🎉 Félicitations ! Tu es maintenant " + res.data.niveau)
  } catch (err) {
    alert("Erreur : " + (err.response?.data?.error || 'Impossible de monter de niveau'))
  }
}
</script>

<template>
  <AppLayout>
    <div class="level-container">
      <h2>🌟 Progression de ton niveau</h2>

      <p><strong>Niveau actuel :</strong> {{ currentLevel }}</p>
      <p><strong>Points :</strong> {{ currentPoints }}</p>

      <div class="progress-bar">
        <div
            class="progress-fill"
            :style="{ width: nextLevel ? (Math.min(currentPoints, pointsNeeded) / pointsNeeded * 100) + '%' : '100%' }"
        ></div>
      </div>
      <p v-if="nextLevel"><em>Prochain niveau : {{ nextLevel }} ({{ pointsNeeded }} pts)</em></p>
      <p v-else><em>✨ Niveau maximum atteint !</em></p>
      <p v-if="isVisiteur" class="notice">
        🔒 Crée un compte pour débloquer la progression, gagner des points et monter en niveau !
      </p>
      <p>DEBUG: readyForUpgrade = {{ readyForUpgrade }}</p>

      <button
          :disabled="!readyForUpgrade"
          @click="upgradeLevel"
      >
        Monter au niveau suivant
      </button>

      <div class="levels-info">
        <div class="level-card" v-for="niveau in niveaux" :key="niveau">
          <h3>{{ niveau.charAt(0).toUpperCase() + niveau.slice(1) }}</h3>
          <p><strong>Points requis :</strong> {{ seuils[niveau] || 0 }}</p>
          <ul>
            <li v-if="niveau === 'débutant'">🔓 Accès aux objets connectés en lecture seule</li>
            <li v-if="niveau === 'intermédiaire'">🧭 Consultation détaillée des services</li>
            <li v-if="niveau === 'avancé'">⚙️ Contrôle des objets (on/off, réglages)</li>
            <li v-if="niveau === 'expert'">🛠️ Accès à la gestion et personnalisation des objets/services</li>
          </ul>
        </div>
      </div>
    </div>
  </AppLayout>
</template>


<style scoped>
.level-container {
  padding: 2rem;
}
.progress-bar {
  height: 20px;
  width: 100%;
  background-color: #eee;
  border-radius: 10px;
  overflow: hidden;
  margin: 1rem 0;
}
.progress-fill {
  height: 100%;
  background-color: #2c3e50;
  transition: width 0.5s ease;
}
button.btn {
  background-color: #2c3e50;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button.btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
.notice {
  color: #666;
  font-style: italic;
  margin-bottom: 1rem;
}
.levels-info {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 2rem;
}
.level-card {
  flex: 1 1 200px;
  background: #f3f3f3;
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
}
.level-card h3 {
  margin-bottom: 0.5rem;
  text-transform: capitalize;
}
.level-card ul {
  padding-left: 1rem;
}

</style>
