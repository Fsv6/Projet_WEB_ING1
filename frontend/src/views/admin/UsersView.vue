<template>
  <div class="dashboard-with-sidebar">
    <!-- Sidebar à gauche -->
    <AppSidebar 
      title="Administration" 
      :navItems="navItems"
    />

    <!-- Contenu principal -->
    <div class="dashboard-content">
      <div class="users-container">
        <div class="header">
          <h1>Gestion des utilisateurs</h1>
          <p>Créer, modifier et supprimer des utilisateurs</p>
        </div>

        <div class="actions-bar">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input 
              type="text" 
              v-model="userSearch" 
              @input="filterUsers" 
              placeholder="Rechercher un utilisateur..."
            >
          </div>
          <div class="filters">
            <select v-model="roleFilter" @change="filterUsers">
              <option value="">Tous les rôles</option>
              <option value="admin">Administrateur</option>
              <option value="simple">Simple</option>
              <option value="complexe">Complexe</option>
            </select>
            <select v-model="familyFilter" @change="filterUsers">
              <option value="">Toutes les familles</option>
              <option value="none">Sans famille</option>
              <option v-for="family in families" :key="family.id" :value="family.id">
                {{ family.nom }}
              </option>
            </select>
          </div>
          <button class="add-btn" @click="showUserModal = true">
            <i class="fas fa-plus"></i>
            Ajouter un utilisateur
          </button>
        </div>

        <div class="users-table-wrapper">
          <table class="users-table admin-table">
            <thead>
              <tr>
                <th @click="sortBy('nom_utilisateur')" class="sortable-header">
                  Nom d'utilisateur
                  <i class="fas" :class="getSortIconClass('nom_utilisateur')"></i>
                </th>
                <th @click="sortBy('email')" class="sortable-header">
                  Email
                  <i class="fas" :class="getSortIconClass('email')"></i>
                </th>
                <th @click="sortBy('role')" class="sortable-header">
                  Rôle
                  <i class="fas" :class="getSortIconClass('role')"></i>
                </th>
                <th>Famille</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id">
                <td>{{ user.nom_utilisateur }}</td>
                <td>{{ user.email }}</td>
                <td>
                  <span class="badge" :class="'role-' + user.role">
                    {{ user.role }}
                  </span>
                </td>
                <td>
                  <span v-if="getFamilyName(user.famille_id)">{{ getFamilyName(user.famille_id) }}</span>
                  <span v-else class="no-family">Non assigné</span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button class="action-btn edit" @click="editUser(user)" title="Modifier">
                      <i class="fas fa-edit"></i>
                    </button>

                    <button class="action-btn" @click="assignFamily(user)" title="Assigner à une famille">
                      <i class="fas fa-home"></i>
                    </button>
                    <button class="action-btn delete" @click="deleteUser(user)" title="Supprimer">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredUsers.length === 0">
                <td colspan="5" class="empty-message">
                  <div>
                    <i class="fas fa-search"></i>
                    <p>Aucun utilisateur trouvé</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="pagination" v-if="filteredUsers.length > 0">
          <span class="pagination-info">Affichage de {{ startIndex + 1 }}-{{ endIndex }} sur {{ totalFilteredUsers }} utilisateurs</span>
          <div class="pagination-controls">
            <button @click="prevPage" :disabled="currentPage === 1">
              <i class="fas fa-chevron-left"></i>
            </button>
            <span>Page {{ currentPage }} sur {{ totalPages }}</span>
            <button @click="nextPage" :disabled="currentPage === totalPages">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Modal utilisateur -->
      <div v-if="showUserModal" class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ editingUser ? 'Modifier un utilisateur' : 'Ajouter un utilisateur' }}</h3>
            <button class="close-btn" @click="closeUserModal">&times;</button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveUser">
              <div class="form-group">
                <label>Nom d'utilisateur</label>
                <input type="text" v-model="userForm.nom_utilisateur" required>
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" v-model="userForm.email" required>
              </div>
              <div class="form-group">
                <label>Mot de passe {{ editingUser ? '(laisser vide pour ne pas changer)' : '' }}</label>
                <input type="password" v-model="userForm.mot_de_passe" :required="!editingUser">
              </div>
              <div class="form-group">
                <label>Rôle</label>
                <select v-model="userForm.role">
                  <option value="admin">Administrateur</option>
                  <option value="simple">Simple</option>
                  <option value="complexe">Complexe</option>
                </select>
              </div>
              <div class="form-group">
                <label>Famille</label>
                <select v-model="userForm.famille_id">
                  <option value="">Aucune famille</option>
                  <option v-for="family in families" :key="family.id" :value="family.id">
                    {{ family.nom }}
                  </option>
                </select>
              </div>
              <div class="form-actions">
                <button type="button" class="btn secondary" @click="closeUserModal">Annuler</button>
                <button type="submit" class="btn primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Modal assignation famille -->
      <div v-if="showFamilyAssignModal" class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h3>Assigner à une famille</h3>
            <button class="close-btn" @click="closeFamilyAssignModal">&times;</button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveFamilyAssignment">
              <div class="form-group">
                <label>Utilisateur</label>
                <input type="text" :value="assigningUser ? assigningUser.nom_utilisateur : ''" disabled>
              </div>
              <div class="form-group">
                <label>Famille</label>
                <select v-model="familyAssignmentForm.famille_id">
                  <option value="">Aucune famille</option>
                  <option v-for="family in families" :key="family.id" :value="family.id">
                    {{ family.nom }}
                  </option>
                </select>
              </div>
              <div class="form-actions">
                <button type="button" class="btn secondary" @click="closeFamilyAssignModal">Annuler</button>
                <button type="submit" class="btn primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AppSidebar from '@/components/Sidebar.vue'

export default {
  name: 'UsersView',
  components: {
    AppSidebar
  },
  data() {
    return {
      users: [],
      filteredUsers: [],
      displayedUsers: [],
      userSearch: '',
      roleFilter: '',
      familyFilter: '',
      families: [],
      showUserModal: false,
      showFamilyAssignModal: false,
      editingUser: null,
      assigningUser: null,
      userForm: {
        nom_utilisateur: '',
        email: '',
        mot_de_passe: '',
        role: 'simple',
        famille_id: ''
      },
      familyAssignmentForm: {
        famille_id: ''
      },
      currentPage: 1,
      itemsPerPage: 10,
      sortField: 'nom_utilisateur',
      sortDirection: 'asc',
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
          icon: 'fas fa-users',
          active: true
        },
        { 
          path: '/admin/families', 
          label: 'Gestion des familles', 
          icon: 'fas fa-home' 
        },
        { 
          path: '/login', 
          label: 'Déconnexion', 
          icon: 'fas fa-sign-out-alt' 
        }
      ]
    };
  },
  computed: {
    totalFilteredUsers() {
      return this.filteredUsers.length;
    },
    totalPages() {
      return Math.ceil(this.totalFilteredUsers / this.itemsPerPage);
    },
    startIndex() {
      return (this.currentPage - 1) * this.itemsPerPage;
    },
    endIndex() {
      const end = this.startIndex + this.itemsPerPage;
      return end > this.totalFilteredUsers ? this.totalFilteredUsers : end;
    }
  },
  mounted() {
    this.loadData();
  },
  methods: {
    async loadData() {
      try {
        await Promise.all([
          this.fetchUsers(),
          this.fetchFamilies()
        ]);
        this.filterUsers();
        this.updateDisplayedUsers();
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    },
    
    async fetchUsers() {
      try {
        const token = localStorage.getItem('token');
        console.log('Token:', token);
        
        const response = await fetch('http://localhost:3000/api/utilisateurs', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des utilisateurs');
        }
        
        const data = await response.json();
        console.log('Users data:', data);
        this.users = data;
        this.filteredUsers = [...data];
      } catch (error) {
        console.error('Erreur:', error);
      }
    },
    
    async fetchFamilies() {
      try {
        const token = localStorage.getItem('token');
        console.log('Token:', token);
        
        const response = await fetch('http://localhost:3000/api/familles', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des familles');
        }
        
        const data = await response.json();
        console.log('Families data:', data);
        this.families = data || [];
      } catch (error) {
        console.error('Erreur:', error);
      }
    },
    
    filterUsers() {
      let result = [...this.users];
      
      if (this.userSearch.trim()) {
        const query = this.userSearch.toLowerCase().trim();
        result = result.filter(user => 
          user.nom_utilisateur?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query)
        );
      }
      
      if (this.roleFilter) {
        result = result.filter(user => user.role === this.roleFilter);
      }
      
      if (this.familyFilter) {
        if (this.familyFilter === 'none') {
          result = result.filter(user => !user.famille_id);
        } else {
          result = result.filter(user => user.famille_id === this.familyFilter);
        }
      }
      
      this.sortData(result);
      
      this.filteredUsers = result;
      this.currentPage = 1;
      this.updateDisplayedUsers();
    },
    
    sortData(data) {
      data.sort((a, b) => {
        let valA = a[this.sortField];
        let valB = b[this.sortField];
        
        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';
        
        if (typeof valA === 'string' && typeof valB === 'string') {
          return this.sortDirection === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
        }
        
        return this.sortDirection === 'asc' 
          ? valA - valB 
          : valB - valA;
      });
      
      return data;
    },
    
    sortBy(field) {
      if (this.sortField === field) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = field;
        this.sortDirection = 'asc';
      }
      
      this.filterUsers();
    },
    
    getSortIconClass(field) {
      if (this.sortField !== field) return 'fa-sort';
      return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
    },
    
    updateDisplayedUsers() {
      this.displayedUsers = this.filteredUsers.slice(this.startIndex, this.endIndex);
    },
    
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.updateDisplayedUsers();
      }
    },
    
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.updateDisplayedUsers();
      }
    },
    
    getFamilyName(familyId) {
      if (!familyId) return null;
      const family = this.families.find(f => f.id === familyId);
      return family ? family.nom : 'Inconnue';
    },
    
    editUser(user) {
      this.editingUser = user;
      this.userForm = {
        nom_utilisateur: user.nom_utilisateur,
        email: user.email,
        mot_de_passe: '',
        role: user.role,
        famille_id: user.famille_id || ''
      };
      this.showUserModal = true;
    },
    
    async changeRole(user) {
      const newRole = prompt('Changer le rôle (admin, simple, complexe):', user.role);
      if (!newRole || !['admin', 'simple', 'complexe'].includes(newRole)) {
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
          body: JSON.stringify({ role: newRole })
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors de la mise à jour du rôle');
        }
        
        await this.fetchUsers();
        this.filterUsers();
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la mise à jour du rôle');
      }
    },
    
    assignFamily(user) {
      this.assigningUser = user;
      this.familyAssignmentForm.famille_id = user.famille_id || '';
      this.showFamilyAssignModal = true;
    },
    
    async saveFamilyAssignment() {
      if (!this.assigningUser) return;
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/utilisateurs/${this.assigningUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            famille_id: this.familyAssignmentForm.famille_id || null
          })
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors de l\'assignation de la famille');
        }
        
        await this.fetchUsers();
        this.filterUsers();
        this.closeFamilyAssignModal();
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'assignation de la famille');
      }
    },
    
    async deleteUser(user) {
      if (!confirm(`Voulez-vous vraiment supprimer l'utilisateur ${user.nom_utilisateur} ?`)) {
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/utilisateurs/${user.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors de la suppression');
        }
        
        await this.fetchUsers();
        this.filterUsers();
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression');
      }
    },
    
    async saveUser() {
      try {
        const token = localStorage.getItem('token');
        const isEditing = !!this.editingUser;
        const url = isEditing 
          ? `http://localhost:3000/api/utilisateurs/${this.editingUser.id}`
          : 'http://localhost:3000/api/utilisateurs';
          
        const userData = { ...this.userForm };
        
        if (isEditing && !userData.mot_de_passe) {
          delete userData.mot_de_passe;
        }
        
        if (!userData.famille_id) {
          userData.famille_id = null;
        }
        
        const response = await fetch(url, {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors de l\'enregistrement');
        }
        
        await this.fetchUsers();
        this.filterUsers();
        this.closeUserModal();
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'enregistrement');
      }
    },
    
    closeUserModal() {
      this.showUserModal = false;
      this.editingUser = null;
      this.userForm = {
        nom_utilisateur: '',
        email: '',
        mot_de_passe: '',
        role: 'simple',
        famille_id: ''
      };
    },
    
    closeFamilyAssignModal() {
      this.showFamilyAssignModal = false;
      this.assigningUser = null;
      this.familyAssignmentForm = {
        famille_id: ''
      };
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

.users-container {
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
  margin-bottom: 15px;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-box input {
  width: 90%;
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

.filters {
  display: flex;
  gap: 10px;
}

.filters select {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  background-color: white;
  min-width: 140px;
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

.users-table-wrapper {
  overflow-x: auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid #eee;
  font-weight: 600;
  color: #333;
  background-color: #f9f9f9;
  font-size: 13px;
}

.sortable-header {
  cursor: pointer;
  user-select: none;
  position: relative;
}

.sortable-header i {
  margin-left: 5px;
  font-size: 12px;
  color: #aaa;
}

.users-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #eee;
  vertical-align: middle;
  font-size: 13px;
}

.users-table tr:last-child td {
  border-bottom: none;
}

.users-table tr:hover {
  background-color: #f8fbff;
}

.badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 50px;
  font-size: 11px;
  font-weight: 500;
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

.no-family {
  color: #999;
  font-style: italic;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-btn {
  width: 34px;
  height: 34px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
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

.action-btn.edit:hover {
  background-color: #f8fbff;
}

.empty-message {
  text-align: center;
  padding: 30px;
  color: #888;
}

.empty-message div {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.empty-message i {
  font-size: 24px;
  color: #ccc;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.pagination-info {
  color: #666;
  font-size: 12px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pagination-controls button {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.pagination-controls button:hover:not(:disabled) {
  background-color: #eee;
}

.pagination-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  .actions-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filters {
    flex-direction: column;
  }
  
  .add-btn {
    width: 100%;
    justify-content: center;
  }
  
  .pagination {
    flex-direction: column;
    align-items: center;
  }
}
</style> 