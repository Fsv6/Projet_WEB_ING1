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
    component: () => import('@/views/OtherProfiles.vue'),
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