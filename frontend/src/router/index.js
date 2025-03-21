import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Accueil from '../views/Accueil.vue'

const routes = [
  {
    path: '/',
    redirect: '/accueil'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/accueil',
    name: 'Accueil',
    component: Accueil,
    meta: { requiresAuth: true }
  },
  {
    path: '/register',
    name: 'RegisterPage',
    component: Register
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!token) {
      next('/login');
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router 