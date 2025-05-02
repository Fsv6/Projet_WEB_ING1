import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import AccueilAdmin from '../views/AccueilAdmin.vue'
import VisitorsView from '@/views/VisitorsView.vue'
import axios from 'axios'

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
    path: '/manuels',
    name: 'Manuels',
    component: () => import('@/views/ManuelsView.vue')
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
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true }
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
  const userStr = localStorage.getItem('user');
  let user = {};
  
  try {
    user = userStr ? JSON.parse(userStr) : {};
  } catch (e) {
    console.error("Erreur de parsing user:", e);
    localStorage.removeItem('user');
  }

  // Réinitialiser le token Axios à chaque navigation
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Vérifier si la route requiert une authentification
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!token) {
      console.log('Navigation restreinte: pas de token');
      next('/login');
    } else if (to.matched.some(record => record.meta.requiresAdmin) && user.role !== 'admin') {
      console.log('Navigation restreinte: accès admin requis');
      next('/explore');
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router