<template>
  <div class="dashboard-with-sidebar">
    <!-- Sidebar à gauche -->
    <AppSidebar 
      title="Administration" 
      :navItems="navItems"
    />

    <!-- Contenu principal -->
    <div class="dashboard-content">
      <div class="families-container">
        <div class="header">
          <h1>Gestion des familles</h1>
          <p>Créer, modifier et gérer les familles et leurs membres</p>
        </div>

        <div class="actions-bar">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input 
              type="text" 
              v-model="familySearch" 
              @input="filterFamilies" 
              placeholder="Rechercher une famille..."
            >
          </div>
          <button class="add-btn" @click="showFamilyModal = true">
            <i class="fas fa-plus"></i>
            Ajouter une famille
          </button>
        </div>

        <div class="families-grid">
          <div class="family-card" v-for="family in filteredFamilies" :key="family.id">
            <div class="family-header">
              <h3>{{ family.nom }}</h3>
              <div class="family-actions">
                <button class="action-btn" @click="editFamily(family)" title="Modifier">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn" @click="regenerateCode(family)" title="Régénérer le code">
                  <i class="fas fa-sync"></i>
                </button>
                <button class="action-btn delete" @click="deleteFamily(family)" title="Supprimer">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            
            <div class="family-code-section">
              <div class="family-code">
                <span>Code d'invitation</span>
                <div class="code">
                  {{ family.code }}
                  <button class="copy-btn" @click="copyCode(family.code)" title="Copier le code">
                    <i class="fas fa-copy"></i>
                  </button>
                </div>
              </div>
            </div>
            
            <div class="family-members-section">
              <div class="section-header">
                <h4>
                  <i class="fas fa-users"></i>
                  Membres ({{ getMembersCount(family) }})
                </h4>
                <button class="add-member-btn" @click="showAddMemberModal(family)" title="Ajouter un membre">
                  <i class="fas fa-user-plus"></i>
                </button>
              </div>
              
              <div class="members-list" v-if="getMembersCount(family) > 0">
                <div class="member-item" v-for="member in getFamilyMembers(family)" :key="member.id">
                  <div class="member-info">
                    <span class="member-name">{{ member.nom_utilisateur }}</span>
                    <span class="member-role" :class="'role-' + member.role">{{ member.role }}</span>
                  </div>
                  <button class="remove-member-btn" @click="removeMember(member)" title="Retirer de la famille">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
              <div class="empty-members" v-else>
                <p>Aucun membre dans cette famille</p>
              </div>
            </div>
          </div>

          <div class="empty-card" v-if="filteredFamilies.length === 0">
            <div class="empty-message">
              <i class="fas fa-home"></i>
              <p>Aucune famille trouvée</p>
              <button class="add-btn" @click="showFamilyModal = true">
                <i class="fas fa-plus"></i>
                Créer une famille
              </button>
            </div>
          </div>
        </div>

        <!-- Modal famille -->
        <div v-if="showFamilyModal" class="modal-overlay">
          <div class="modal">
            <div class="modal-header">
              <h3>{{ editingFamily ? 'Modifier une famille' : 'Ajouter une famille' }}</h3>
              <button class="close-btn" @click="closeFamilyModal">&times;</button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="saveFamily">
                <div class="form-group">
                  <label>Nom de la famille</label>
                  <input type="text" v-model="familyForm.nom" required>
                </div>
                <div class="form-actions">
                  <button type="button" class="btn secondary" @click="closeFamilyModal">Annuler</button>
                  <button type="submit" class="btn primary">Enregistrer</button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Modal ajout de membre -->
        <div v-if="showMemberModal" class="modal-overlay">
          <div class="modal">
            <div class="modal-header">
              <h3>Ajouter un membre à {{ currentFamily ? currentFamily.nom : '' }}</h3>
              <button class="close-btn" @click="closeMemberModal">&times;</button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="addMemberToFamily">
                <div class="form-group">
                  <label>Sélectionner un utilisateur</label>
                  <select v-model="selectedUserId" required>
                    <option value="">-- Choisir un utilisateur --</option>
                    <option v-for="user in getAvailableUsers()" :key="user.id" :value="user.id">
                      {{ user.nom_utilisateur }} ({{ user.email }})
                    </option>
                  </select>
                </div>
                <div class="form-actions">
                  <button type="button" class="btn secondary" @click="closeMemberModal">Annuler</button>
                  <button type="submit" class="btn primary">Ajouter</button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div class="families-table-wrapper">
          <table class="families-table admin-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Code</th>
                <th>Membres</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="family in filteredFamilies" :key="family.id">
                <td>{{ family.nom }}</td>
                <td>{{ family.code }}</td>
                <td>{{ getMembersCount(family) }}</td>
                <td>
                  <button class="action-btn" @click="editFamily(family)" title="Modifier">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="action-btn" @click="regenerateCode(family)" title="Régénérer le code">
                    <i class="fas fa-sync"></i>
                  </button>
                  <button class="action-btn delete" @click="deleteFamily(family)" title="Supprimer">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AppSidebar from '@/components/Sidebar.vue'

export default {
  name: 'FamiliesManagement',
  components: {
    AppSidebar
  },
  data() {
    return {
      families: [],
      filteredFamilies: [],
      users: [],
      familySearch: '',
      showFamilyModal: false,
      showMemberModal: false,
      editingFamily: null,
      currentFamily: null,
      familyForm: {
        nom: ''
      },
      selectedUserId: '',
      copiedCode: null,
      copiedTimeout: null,
      navItems: [
        { 
          path: '/', 
          label: '', 
          icon: 'fas fa-arrow-left',
          position: 'top'
        },
        { 
          path: '/dashboard-with-sidebar', 
          label: 'Tableau de bord', 
          icon: 'fas fa-tachometer-alt' 
        },
        { 
          path: '/admin/users', 
          label: 'Gestion des utilisateurs', 
          icon: 'fas fa-users' 
        },
        { 
          path: '/admin/families', 
          label: 'Gestion des familles', 
          icon: 'fas fa-home',
          active: true
        },
        { 
          path: '/login', 
          label: 'Déconnexion', 
          icon: 'fas fa-sign-out-alt' 
        }
      ]
    }
  },
  mounted() {
    this.loadData();
  },
  methods: {
    async loadData() {
      try {
        await Promise.all([
          this.fetchFamilies(),
          this.fetchUsers()
        ]);
        this.filterFamilies();
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    },
    
    async fetchFamilies() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/familles', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des familles');
        }
        
        const data = await response.json();
        this.families = data || [];
        this.filteredFamilies = [...this.families];
      } catch (error) {
        console.error('Erreur:', error);
      }
    },
    
    async fetchUsers() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/utilisateurs', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des utilisateurs');
        }
        
        const data = await response.json();
        this.users = data || [];
      } catch (error) {
        console.error('Erreur:', error);
      }
    },
    
    filterFamilies() {
      if (!this.familySearch.trim()) {
        this.filteredFamilies = [...this.families];
        return;
      }
      
      const query = this.familySearch.toLowerCase().trim();
      this.filteredFamilies = this.families.filter(family => 
        family.nom?.toLowerCase().includes(query)
      );
    },
    
    getMembersCount(family) {
      return this.users.filter(user => user.famille_id === family.id).length;
    },
    
    getFamilyMembers(family) {
      return this.users.filter(user => user.famille_id === family.id);
    },
    
    getAvailableUsers() {
      if (!this.currentFamily) return [];
      return this.users.filter(user => !user.famille_id || user.famille_id !== this.currentFamily.id);
    },
    
    editFamily(family) {
      this.editingFamily = family;
      this.familyForm = {
        nom: family.nom
      };
      this.showFamilyModal = true;
    },
    
    async deleteFamily(family) {
      const membersCount = this.getMembersCount(family);
      let confirmMessage = `Voulez-vous vraiment supprimer la famille "${family.nom}" ?`;
      
      if (membersCount > 0) {
        confirmMessage += `\nCette famille contient ${membersCount} membre(s) qui seront dissociés.`;
      }
      
      if (!confirm(confirmMessage)) {
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/familles/${family.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors de la suppression');
        }
        
        await this.loadData();
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression');
      }
    },
    
    async regenerateCode(family) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/familles/${family.id}/regenerer-code`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors de la régénération du code');
        }
        
        await this.fetchFamilies();
        this.filterFamilies();
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la régénération du code');
      }
    },
    
    copyCode(code) {
      navigator.clipboard.writeText(code).then(() => {
        this.copiedCode = code;
        
        // Clear previous timeout if exists
        if (this.copiedTimeout) {
          clearTimeout(this.copiedTimeout);
        }
        
        // Set timeout to clear the copied state after 3 seconds
        this.copiedTimeout = setTimeout(() => {
          this.copiedCode = null;
        }, 3000);
      }).catch(err => {
        console.error('Erreur lors de la copie:', err);
      });
    },
    
    showAddMemberModal(family) {
      this.currentFamily = family;
      this.selectedUserId = '';
      this.showMemberModal = true;
    },
    
    async addMemberToFamily() {
      if (!this.selectedUserId || !this.currentFamily) {
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/utilisateurs/${this.selectedUserId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            famille_id: this.currentFamily.id
          })
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors de l\'ajout du membre');
        }
        
        await this.fetchUsers();
        this.closeMemberModal();
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'ajout du membre');
      }
    },
    
    async removeMember(user) {
      if (!confirm(`Voulez-vous vraiment retirer ${user.nom_utilisateur} de sa famille ?`)) {
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/utilisateurs/${user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            famille_id: null
          })
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors du retrait du membre');
        }
        
        await this.fetchUsers();
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors du retrait du membre');
      }
    },
    
    async saveFamily() {
      try {
        const token = localStorage.getItem('token');
        const isEditing = !!this.editingFamily;
        const url = isEditing 
          ? `http://localhost:3000/api/familles/${this.editingFamily.id}`
          : 'http://localhost:3000/api/familles';
          
        const response = await fetch(url, {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(this.familyForm)
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors de l\'enregistrement');
        }
        
        await this.fetchFamilies();
        this.filterFamilies();
        this.closeFamilyModal();
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'enregistrement');
      }
    },
    
    closeFamilyModal() {
      this.showFamilyModal = false;
      this.editingFamily = null;
      this.familyForm = {
        nom: ''
      };
    },
    
    closeMemberModal() {
      this.showMemberModal = false;
      this.currentFamily = null;
      this.selectedUserId = '';
    }
  }
}
</script>

<style scoped>
/* Structure de base avec sidebar */
.dashboard-with-sidebar {
  display: flex;
  width: 100%;
  min-height: 100vh;
}

/* Styles du contenu adapté avec la sidebar */
.dashboard-content {
  flex: 1;
  padding: 20px;
  margin-left: 220px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.families-container {
  max-width: 100%;
  padding: 15px;
}

.header {
  margin-bottom: 20px;
}

.header h1 {
  font-size: 20px;
  margin: 0 0 6px 0;
  color: #333;
}

.header p {
  margin: 0;
  color: #666;
  font-size: 13px;
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 320px;
}

.search-box input {
  width: 100%;
  padding: 8px 12px 8px 30px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
}

.search-box i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #aaa;
}

.add-btn {
  background-color: #4263eb;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
  font-size: 13px;
}

.add-btn:hover {
  background-color: #3b57ce;
}

.families-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
}

.family-card {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.family-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.family-header {
  padding: 15px;
  background-color: #f9f9f9;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.family-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.family-actions {
  display: flex;
  gap: 5px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  border: none;
  color: #555;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background-color: #eee;
}

.action-btn.delete {
  color: #f03e3e;
}

.action-btn.delete:hover {
  background-color: #ffe5e5;
}

.family-code-section {
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
  background-color: #fcfcfc;
}

.family-code {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.family-code span {
  display: block;
  font-size: 11px;
  color: #888;
  margin-bottom: 4px;
}

.family-code .code {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f8f9fa;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
  font-family: monospace;
  font-size: 13px;
}

.copy-btn {
  background: none;
  border: none;
  color: #777;
  cursor: pointer;
  padding: 5px;
  transition: color 0.2s;
}

.copy-btn:hover {
  color: #333;
}

.family-members-section {
  padding: 12px 15px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h4 {
  margin: 0;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-header h4 i {
  color: #4263eb;
}

.add-member-btn {
  background-color: #f0f2f5;
  border: none;
  width: 26px;
  height: 26px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-member-btn:hover {
  background-color: #e0e3e9;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background-color: #f9f9f9;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.member-item:hover {
  background-color: #f5f5f5;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.member-name {
  font-weight: 500;
  font-size: 13px;
}

.member-role {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 20px;
  text-transform: capitalize;
}

.role-admin {
  background-color: #e3f2fd;
  color: #2196f3;
}

.role-simple {
  background-color: #f1f8e9;
  color: #689f38;
}

.role-complexe {
  background-color: #fff8e1;
  color: #ffa000;
}

.remove-member-btn {
  width: 22px;
  height: 22px;
  background-color: #f0f0f0;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.remove-member-btn:hover {
  background-color: #ffebee;
  color: #f44336;
}

.empty-members {
  text-align: center;
  padding: 12px 0;
  color: #999;
  font-style: italic;
  font-size: 13px;
}

.empty-card {
  grid-column: 1 / -1;
  background-color: white;
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.empty-message i {
  font-size: 40px;
  color: #ccc;
}

.empty-message p {
  font-size: 16px;
  color: #888;
  margin: 0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background-color: white;
  border-radius: 10px;
  width: 95%;
  max-width: 500px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #555;
  font-weight: 500;
  font-size: 13px;
}

.form-group input, 
.form-group select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
}

.form-group input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
}

.btn {
  padding: 8px 15px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s;
}

.btn.primary {
  background-color: #4263eb;
  color: white;
}

.btn.primary:hover {
  background-color: #3b57ce;
}

.btn.secondary {
  background-color: #f1f3f5;
  color: #555;
}

.btn.secondary:hover {
  background-color: #e9ecef;
}

@media (max-width: 768px) {
  .families-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    max-width: none;
  }
  
  .add-btn {
    width: 100%;
    justify-content: center;
  }
}

.table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  font-size: 12px;
}

.table th, .table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.families-table.admin-table {
  /* Add any specific styles for the families table */
}
</style> 