import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import AccueilAdmin from '../views/AccueilAdmin.vue'
import Visitors from '@/views/Visitors.vue'

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
    name: 'VisitorsPage',
    component: Visitors
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