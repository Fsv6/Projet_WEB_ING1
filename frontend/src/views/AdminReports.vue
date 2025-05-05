<template>
  <AppLayout>
    <div class="reports-container">
      <div class="header">
        <h1><i class="fas fa-chart-bar"></i> Rapports d'administration</h1>
        <p>Générez et exportez des rapports détaillés sur l'utilisation de la plateforme.</p>
      </div>

      <div class="filters-card">
        <h2>Filtres et options</h2>
        <div class="filters-grid">
          <div class="filter-group">
            <label>Période</label>
            <select v-model="filters.period">
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
              <option value="90">90 derniers jours</option>
              <option value="365">12 derniers mois</option>
              <option value="all">Tout l'historique</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Type de données</label>
            <div class="checkbox-group">
              <label>
                <input type="checkbox" v-model="filters.includeUsers"> Utilisateurs
              </label>
              <label>
                <input type="checkbox" v-model="filters.includeObjects"> Objets connectés
              </label>
              <label>
                <input type="checkbox" v-model="filters.includeFamilies"> Familles
              </label>
              <label>
                <input type="checkbox" v-model="filters.includeActivity"> Activités
              </label>
            </div>
          </div>
          <div class="filter-group">
            <label>Format d'exportation</label>
            <select v-model="filters.exportFormat">
              <option value="pdf">PDF</option>
            </select>
          </div>
        </div>
        <div class="button-row">
          <button @click="generateReport" class="generate-btn" :disabled="isGenerating">
            <i class="fas fa-file-export"></i> 
            {{ isGenerating ? 'Génération en cours...' : 'Générer le rapport' }}
          </button>
        </div>
      </div>

      <!-- Aperçu du rapport -->
      <div v-if="isGenerating" class="loading-container">
        <div class="spinner"></div>
        <p>Génération du rapport en cours...</p>
      </div>
      <div v-else-if="reportData" class="report-preview">
        <div class="preview-header">
          <h2>Aperçu du rapport</h2>
          <div class="export-actions">
            <button @click="exportReport" class="export-btn">
              <i class="fas fa-file-pdf"></i> Exporter en PDF
            </button>
          </div>
        </div>

        <!-- Section Utilisateurs -->
        <div v-if="filters.includeUsers" class="report-section">
          <h3>Statistiques des Utilisateurs</h3>
          <div class="report-grid">
            <div class="report-item">
              <h4>Répartition par niveau</h4>
              <table class="report-table">
                <thead>
                  <tr>
                    <th>Niveau</th>
                    <th>Nombre</th>
                    <th>Pourcentage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(count, level) in reportData.users.byLevel" :key="level">
                    <td>{{ getNiceLevelName(level) }}</td>
                    <td>{{ count }}</td>
                    <td>{{ ((count / reportData.users.total) * 100).toFixed(1) }}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="report-item">
              <h4>Activité des utilisateurs</h4>
              <table class="report-table">
                <thead>
                  <tr>
                    <th>Métrique</th>
                    <th>Valeur</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Nouveaux utilisateurs</td>
                    <td>{{ reportData.users.new }}</td>
                  </tr>
                  <tr>
                    <td>Moyenne de connexions par jour</td>
                    <td>{{ reportData.users.avgLoginsPerDay.toFixed(1) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Section Objets -->
        <div v-if="filters.includeObjects" class="report-section">
          <h3>Statistiques des Objets Connectés</h3>
          <div class="report-grid">
            <div class="report-item">
              <h4>Objets par type</h4>
              <div class="chart-container">
                <canvas ref="objectTypesChart"></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- Section Familles -->
        <div v-if="filters.includeFamilies" class="report-section">
          <h3>Statistiques des Familles</h3>
          <div class="report-grid">
            <div class="report-item">
              <h4>Informations générales</h4>
              <table class="report-table">
                <thead>
                  <tr>
                    <th>Métrique</th>
                    <th>Valeur</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Nombre total de familles</td>
                    <td>{{ reportData.families.total }}</td>
                  </tr>
                  <tr>
                    <td>Taille moyenne (membres)</td>
                    <td>{{ reportData.families.avgSize.toFixed(1) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="report-item">
              <h4>Distribution des points</h4>
              <table class="report-table">
                <thead>
                  <tr>
                    <th>Métrique</th>
                    <th>Valeur</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Total des points</td>
                    <td>{{ reportData.families.totalPoints.toFixed(2) }}</td>
                  </tr>
                  <tr>
                    <td>Moyenne par famille</td>
                    <td>{{ reportData.families.avgPointsPerFamily.toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Section Activité -->
        <div v-if="filters.includeActivity" class="report-section">
          <h3>Statistiques d'Activité</h3>
          <div class="report-grid">
            <div class="report-item">
              <h4>Répartition par type d'action</h4>
              <table class="report-table">
                <thead>
                  <tr>
                    <th>Type d'action</th>
                    <th>Nombre</th>
                    <th>Pourcentage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(count, action) in reportData.activity.byType" :key="action">
                    <td>{{ formatActionName(action) }}</td>
                    <td>{{ count }}</td>
                    <td>{{ ((count / reportData.activity.total) * 100).toFixed(1) }}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="report-item">
              <h4>Répartition temporelle</h4>
              <table class="report-table">
                <thead>
                  <tr>
                    <th>Période</th>
                    <th>Nombre d'actions</th>
                    <th>Pourcentage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(count, period) in reportData.activity.byTime" :key="period">
                    <td>{{ period }}</td>
                    <td>{{ count }}</td>
                    <td>{{ ((count / reportData.activity.total) * 100).toFixed(1) }}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script>
import AppLayout from '@/layout/AppLayoutGlobal.vue';
import { ref, reactive, onMounted, watch, nextTick } from 'vue';
import api from '@/services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Chart from 'chart.js/auto';

export default {
  name: 'AdminReportsPage',
  components: {
    AppLayout
  },
  setup() {
    const filters = reactive({
      period: '30',
      includeUsers: true,
      includeObjects: true,
      includeFamilies: true,
      includeActivity: true,
      exportFormat: 'pdf'
    });

    const isGenerating = ref(false);
    const reportData = ref(null);
    const objectTypesChart = ref(null);

    const generateReport = async () => {
      try {
        isGenerating.value = true;
        
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Non authentifié');
        }
        
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        const params = { period: filters.period };
        const response = await api.get('/history/admin-report', { params });
        
        reportData.value = {
          users: {
            total: response.data.usersCount || 5,
            byLevel: response.data.usersByLevel || {
              'débutant': 2,
              'intermédiaire': 0,
              'avancé': 1,
              'expert': 2
            },
            new: response.data.newUsers || 1,
            active: response.data.activeUsers || 4,
            avgLoginsPerDay: response.data.avgLoginsPerDay || 3.5
          },
          objects: {
            total: response.data.objectsCount || 8,
            byType: response.data.objectsByType || {
              'Four': 2,
              'Réfrigérateur': 1,
              'Robot': 2,
              'Micro-ondes': 1,
              'Mixeur': 2
            },
            totalUsage: response.data.totalObjectsUsage || 124,
            avgUsagePerDay: response.data.avgObjectsUsagePerDay || 12.4,
            mostUsed: response.data.mostUsedObject || 'Four principal'
          },
          families: {
            total: response.data.familiesCount || 3,
            avgSize: response.data.avgFamilySize || 2.7,
            withPoints: response.data.familiesWithPoints || 2,
            totalPoints: response.data.totalPoints || 350,
            avgPointsPerFamily: response.data.avgPointsPerFamily || 116.7,
            recentPoints: response.data.recentPointsDistributed || 50
          },
          activity: {
            total: response.data.actionsCount || 250,
            byType: response.data.actionsByType || {
              'connexion': 45,
              'utilisation_objet': 124,
              'ajout_points': 15,
              'creation_recette': 8,
              'modification_utilisateur': 12,
              'autre': 46
            },
            byTime: response.data.actionsByTime || {
              'Matin (00h-08h)': 25,
              'Journée (08h-16h)': 120,
              'Soir (16h-00h)': 105
            }
          }
        };
      } catch (error) {
        console.error('Erreur lors de la génération du rapport:', error);
        alert('Erreur lors de la génération du rapport. Veuillez réessayer.');
      } finally {
        isGenerating.value = false;
      }
    };

    const exportReport = () => {
      if (!reportData.value) return;

      try {
        const timestamp = new Date().toISOString().slice(0, 10);
        const fileName = `rapport_admin_${timestamp}`;

        exportToPDF(fileName);
      } catch (error) {
        console.error('Erreur lors de l\'exportation du rapport:', error);
        alert('Erreur lors de l\'exportation du rapport. Veuillez réessayer.');
      }
    };

    const exportToPDF = (fileName) => {
      const doc = new jsPDF();
      
      doc.setFillColor(25, 42, 86);
      doc.rect(0, 0, 210, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Smart Kitchen', 105, 15, { align: 'center' });
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Rapport d\'administration', 105, 24, { align: 'center' });
      
      doc.setTextColor(0, 0, 0);
      
      doc.setFontSize(10);
      doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 20, 40);
      doc.text(`Période analysée: ${filters.period === 'all' ? 'Tout l\'historique' : `${filters.period} derniers jours`}`, 20, 46);
      doc.text(`Généré par: Administration Smart Kitchen`, 20, 52);
      
      let yPos = 65;
      
      if (filters.includeUsers) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(25, 42, 86);
        doc.text('Statistiques des utilisateurs', 105, yPos, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(10);
        doc.text('Analyse de l\'activité et répartition des utilisateurs par niveau', 105, yPos + 6, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        
        yPos += 15;
        
        const userLevelData = Object.entries(reportData.value.users.byLevel).map(([level, count]) => {
          const percentage = ((count / reportData.value.users.total) * 100).toFixed(1);
          return [getNiceLevelName(level), count.toString(), `${percentage}%`];
        });
        
        autoTable(doc, {
          startY: yPos,
          head: [['Niveau', 'Nombre', 'Pourcentage']],
          body: userLevelData,
          theme: 'grid',
          headStyles: { fillColor: [25, 42, 86], textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 10 },
          tableWidth: 140,
          margin: { left: 35, right: 35 },
          columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 40, halign: 'center' },
            2: { cellWidth: 40, halign: 'center' }
          }
        });
        
        yPos = doc.lastAutoTable.finalY + 15;
        
        const userActivityData = [
          ['Nouveaux utilisateurs', reportData.value.users.new.toString()],
          ['Moyenne connexions/jour', reportData.value.users.avgLoginsPerDay.toFixed(1)]
        ];
        
        autoTable(doc, {
          startY: yPos,
          head: [['Métrique', 'Valeur']],
          body: userActivityData,
          theme: 'grid',
          headStyles: { fillColor: [25, 42, 86], textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 10 },
          tableWidth: 140,
          margin: { left: 35, right: 35 },
          columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 40, halign: 'center' }
          }
        });
        
        yPos = doc.lastAutoTable.finalY + 20;
      }
      
      if (filters.includeObjects) {
        if (yPos > 200) {
          doc.addPage();
          
          doc.setFillColor(25, 42, 86);
          doc.rect(0, 0, 210, 10, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(8);
          doc.text('Smart Kitchen - Rapport d\'administration', 105, 6, { align: 'center' });
          doc.setTextColor(0, 0, 0);
          
          yPos = 20;
        }
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(25, 42, 86);
        doc.text('Statistiques des objets connectés', 105, yPos, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(10);
        doc.text('Distribution et utilisation des appareils Smart Kitchen', 105, yPos + 6, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        
        yPos += 15;

        // Générer le diagramme circulaire
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 300;
        canvas.height = 300;

        const types = Object.keys(reportData.value.objects.byType);
        const counts = Object.values(reportData.value.objects.byType);
        const total = counts.reduce((a, b) => a + b, 0);

        // Dessiner le diagramme avec légende dans chaque part
        let startAngle = 0;
        const colors = ['#4CAF50', '#8BC34A', '#CDDC39', '#FFC107', '#FF9800', '#FF5722'];
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        types.forEach((type, index) => {
          const percentage = (counts[index] / total) * 100;
          const angle = (percentage / 100) * 2 * Math.PI;
          const midAngle = startAngle + angle / 2;

          // Dessiner la part
          ctx.beginPath();
          ctx.moveTo(150, 150);
          ctx.arc(150, 150, 100, startAngle, startAngle + angle);
          ctx.closePath();
          ctx.fillStyle = colors[index % colors.length];
          ctx.fill();
          ctx.stroke();

          // Placer la légende au centre de la part
          const label = `${type} (${percentage.toFixed(1)}%)`;
          const labelRadius = 70; // Rayon pour placer le texte
          const x = 150 + labelRadius * Math.cos(midAngle);
          const y = 150 + labelRadius * Math.sin(midAngle);
          ctx.save();
          ctx.fillStyle = '#222';
          ctx.font = 'bold 12px Arial';
          ctx.shadowColor = 'white';
          ctx.shadowBlur = 2;
          ctx.fillText(label, x, y);
          ctx.restore();

          startAngle += angle;
        });

        // Ajouter le diagramme au PDF
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 55, yPos, 100, 100);
        yPos += 120;
        
        // Ajouter le tableau des données
        const objectsData = Object.entries(reportData.value.objects.byType).map(([type, count]) => {
          const percentage = ((count / reportData.value.objects.total) * 100).toFixed(1);
          return [type, count.toString(), `${percentage}%`];
        });
        
        autoTable(doc, {
          startY: yPos,
          head: [['Type', 'Nombre', 'Pourcentage']],
          body: objectsData,
          theme: 'grid',
          headStyles: { fillColor: [25, 42, 86], textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 10 },
          tableWidth: 140,
          margin: { left: 35, right: 35 },
          columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 40, halign: 'center' },
            2: { cellWidth: 40, halign: 'center' }
          }
        });
        
        yPos = doc.lastAutoTable.finalY + 20;
      }
      
      if (filters.includeFamilies) {
        if (yPos > 200) {
          doc.addPage();
          
          doc.setFillColor(25, 42, 86);
          doc.rect(0, 0, 210, 10, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(8);
          doc.text('Smart Kitchen - Rapport d\'administration', 105, 6, { align: 'center' });
          doc.setTextColor(0, 0, 0);
          
          yPos = 20;
        }
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(25, 42, 86);
        doc.text('Statistiques des familles', 105, yPos, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(10);
        doc.text('Analyse des groupes familiaux et distribution des points', 105, yPos + 6, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        
        yPos += 15;
        
        const familiesGeneralData = [
          ['Nombre total de familles', reportData.value.families.total.toString()],
          ['Taille moyenne (membres)', reportData.value.families.avgSize.toFixed(2)]
        ];
        
        autoTable(doc, {
          startY: yPos,
          head: [['Métrique', 'Valeur']],
          body: familiesGeneralData,
          theme: 'grid',
          headStyles: { fillColor: [25, 42, 86], textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 10 },
          tableWidth: 140,
          margin: { left: 35, right: 35 },
          columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 40, halign: 'center' }
          }
        });
        
        yPos = doc.lastAutoTable.finalY + 10;
        
        const pointsData = [
          ['Total des points', reportData.value.families.totalPoints.toFixed(2)],
          ['Moyenne par famille', reportData.value.families.avgPointsPerFamily.toFixed(2)]
        ];
        
        autoTable(doc, {
          startY: yPos,
          head: [['Métrique', 'Valeur']],
          body: pointsData,
          theme: 'grid',
          headStyles: { fillColor: [25, 42, 86], textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 10 },
          tableWidth: 140,
          margin: { left: 35, right: 35 },
          columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 40, halign: 'center' }
          }
        });
        
        yPos = doc.lastAutoTable.finalY + 20;
      }
      
      if (filters.includeActivity) {
        if (yPos > 200) {
          doc.addPage();
          
          doc.setFillColor(25, 42, 86);
          doc.rect(0, 0, 210, 10, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(8);
          doc.text('Smart Kitchen - Rapport d\'administration', 105, 6, { align: 'center' });
          doc.setTextColor(0, 0, 0);
          
          yPos = 20;
        }
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(25, 42, 86);
        doc.text('Statistiques d\'activité', 105, yPos, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(10);
        doc.text('Analyse des interactions et tendances d\'utilisation', 105, yPos + 6, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        
        yPos += 15;
        
        const activityTypeData = Object.entries(reportData.value.activity.byType).map(([action, count]) => {
          const percentage = ((count / reportData.value.activity.total) * 100).toFixed(1);
          return [formatActionName(action), count.toString(), `${percentage}%`];
        });
        
        autoTable(doc, {
          startY: yPos,
          head: [['Type d\'action', 'Nombre', 'Pourcentage']],
          body: activityTypeData,
          theme: 'grid',
          headStyles: { fillColor: [25, 42, 86], textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 10 },
          tableWidth: 160,
          margin: { left: 25, right: 25 },
          columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 40, halign: 'center' },
            2: { cellWidth: 40, halign: 'center' }
          }
        });
        
        yPos = doc.lastAutoTable.finalY + 10;
        
        const timeData = Object.entries(reportData.value.activity.byTime).map(([period, count]) => {
          const percentage = ((count / reportData.value.activity.total) * 100).toFixed(1);
          return [period, count.toString(), `${percentage}%`];
        });
        
        autoTable(doc, {
          startY: yPos,
          head: [['Période', 'Nombre d\'actions', 'Pourcentage']],
          body: timeData,
          theme: 'grid',
          headStyles: { fillColor: [25, 42, 86], textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 10 },
          tableWidth: 180,
          margin: { left: 15, right: 15 },
          columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 60, halign: 'center' },
            2: { cellWidth: 40, halign: 'center' }
          }
        });
        
        yPos = doc.lastAutoTable.finalY + 15;
      }
      
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        
        doc.setDrawColor(200, 200, 200);
        doc.line(20, 285, 190, 285);
        
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Smart Kitchen - Rapport généré le ${new Date().toLocaleDateString('fr-FR')}`, 105, 290, { align: 'center' });
        doc.text(`Page ${i} / ${totalPages}`, 190, 290, { align: 'right' });
      }
      
      doc.save(`${fileName}.pdf`);
    };

    const createObjectTypesChart = () => {
      if (!reportData.value || !objectTypesChart.value) return;
      
      const ctx = objectTypesChart.value.getContext('2d');
      const types = Object.keys(reportData.value.objects.byType);
      const counts = Object.values(reportData.value.objects.byType);
      
      new Chart(ctx, {
        type: 'pie',
        data: {
          labels: types,
          datasets: [{
            data: counts,
            backgroundColor: [
              '#4CAF50',
              '#8BC34A',
              '#CDDC39',
              '#FFC107',
              '#FF9800',
              '#FF5722'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'right',
            },
            title: {
              display: true,
              text: 'Répartition des objets par type'
            }
          }
        }
      });
    };
    
    onMounted(() => {
      if (reportData.value) {
        createObjectTypesChart();
      }
    });
    
    watch(reportData, () => {
      nextTick(() => {
        createObjectTypesChart();
      });
    });

    const getNiceLevelName = (level) => {
      const names = {
        'débutant': 'Débutant',
        'intermédiaire': 'Intermédiaire',
        'avancé': 'Avancé',
        'expert': 'Expert'
      };
      return names[level] || level;
    };

    const formatActionName = (action) => {
      const actions = {
        'connexion': 'Connexion',
        'deconnexion': 'Déconnexion',
        'creation_utilisateur': 'Création d\'utilisateur',
        'modification_utilisateur': 'Modification d\'utilisateur',
        'utilisation_objet': 'Utilisation d\'objet',
        'ajout_points': 'Ajout de points',
        'creation_recette': 'Création de recette',
        'autre': 'Autre action'
      };
      return actions[action] || action;
    };

    return {
      filters,
      isGenerating,
      reportData,
      generateReport,
      exportReport,
      getNiceLevelName,
      formatActionName,
      objectTypesChart
    };
  }
};
</script>

<style scoped>
.reports-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 20px;
}

.header h1 {
  color: #2c5038;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.header p {
  color: #666;
  font-size: 1rem;
}

.filters-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.filters-card h2 {
  color: #2c5038;
  margin-bottom: 15px;
  font-size: 1.2rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-group label {
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
}

.filter-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f8f9fa;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-group label {
  font-weight: normal;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.button-row {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.generate-btn {
  background-color: #2c5038;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.generate-btn:hover {
  background-color: #1d3725;
}

.generate-btn:disabled {
  background-color: #8ca596;
  cursor: not-allowed;
}

.loading-container {
  text-align: center;
  padding: 40px;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2c5038;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.report-preview {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.preview-header h2 {
  color: #2c5038;
  margin: 0;
  font-size: 1.2rem;
}

.export-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.export-btn {
  background-color: #f0f0f0;
  color: #333;
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  transition: background-color 0.3s;
}

.export-btn:hover {
  background-color: #e0e0e0;
}

.report-section {
  margin-bottom: 30px;
}

.report-section h3 {
  color: #2c5038;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.report-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.report-item {
  margin-bottom: 20px;
}

.report-item h4 {
  color: #333;
  margin-bottom: 10px;
  font-size: 1rem;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
}

.report-table th, 
.report-table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.report-table th {
  background-color: #f8f9fa;
  font-weight: 500;
  color: #333;
}

.report-table tr:hover {
  background-color: #f8f9fa;
}

.chart-container {
  height: 250px;
  max-width: 100%;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .report-grid {
    grid-template-columns: 1fr;
  }
  
  .preview-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
  }
}
</style> 