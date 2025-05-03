import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import AccueilAdmin from '../views/AccueilAdmin.vue'
import VisitorsView from '@/views/VisitorsView.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/visitors',
    component: VisitorsView,
    children: [
      {
        path: '',
        redirect: '/explore'
      }
    ]
  },
  {
    path: '/admin',
    name: 'AccueilAdmin',
    component: AccueilAdmin,
    meta: { 
      requiresAuth: true,
      requiresAdmin: true 
    }
  },
  {
    path: '/register',
    name: 'RegisterPage',
    component: Register
  },
  {
    path: '/validation',
    name: 'Validation',
    component: () => import('@/views/ValidationInscription.vue')
  },
  {
    path: '/explore',
    name: 'Explore',
    component: () => import('@/views/ExploreApp.vue')
  },
  {
    path: '/recettes',
    name: 'Recettes',
    component: () => import('@/views/RecettesView.vue')
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/ExploreApp.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/objects/:id',
    name: 'ObjectDetails',
    component: () => import('@/views/ObjectDetails.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/level',
        name: 'LevelView',
      component: () => import('@/views/LevelView.vue'),
      meta: { requiresAuth: false }
  },
  {
    path: '/profile/:id',
    name: 'OtherProfile',
    component: () => import('@/views/OtherProfiles.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/objects/:id/control',
    name: 'control-object',
    component: () => import('@/views/ControlObjectView.vue')
  },
  {
    path: '/manage/objects/new',
    name: 'create-object',
    component: () => import('@/views/CreateObjectView.vue'),
    meta: { requiresRole: ['complexe', 'admin'] }
  },
  {
    path: '/manage/objects',
    name: 'objects-management',
    component: () => import('@/views/ObjectsManagementView.vue'),
    meta: { requiresRole: ['complexe', 'admin'] }
  },
  {
    path: '/manage/objects/:id/edit',
    name: 'EditObject',
    component: () => import('@/views/EditObject.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/recettes/new',
    name: 'NewRecettes',
    component: () => import('@/views/NewRecettes.vue')
  },
  {
    path: '/recettes/:id',
    name: 'RecetteDetails',
    component: () => import('@/views/RecetteDetails.vue')
  },
  {
    path: '/recettes/:id/edit',
    name: 'EditRecette',
    component: () => import('@/views/EditRecette.vue')
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: () => import('@/views/AdminUsers.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/history',
    name: 'AdminHistory',
    component: () => import('@/views/AdminHistory.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/families',
    name: 'AdminFamilies',
    component: () => import('@/views/AdminFamilies.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/user-points',
    name: 'AdminUserPoints',
    component: () => import('@/views/AdminUserPoints.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/family-members',
    name: 'FamilyMembers',
    component: () => import('@/views/FamilyMembers.vue'),
    meta: { requiresAuth: true }
  }



]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!token) {
      next('/login');
    } else if (to.matched.some(record => record.meta.requiresAdmin) && user.role !== 'admin') {
      next('/login');
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router 