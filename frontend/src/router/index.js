import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import AdminLayout from '../views/admin/AdminLayout.vue'
import DashboardWithSidebar from '../views/admin/DashboardWithSidebar.vue'
import UsersView from '../views/admin/UsersView.vue'
import Families from '../views/admin/Families.vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard-with-sidebar'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'RegisterPage',
    component: Register
  },
  {
    path: '/dashboard-with-sidebar',
    name: 'DashboardWithSidebar',
    component: DashboardWithSidebar,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/users',
    name: 'Users',
    component: UsersView,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/families',
    name: 'Families',
    component: Families,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin',
    component: AdminLayout,
    children: [
      {
        path: '',
        redirect: '/dashboard-with-sidebar'
      }
    ],
    meta: { requiresAuth: true, requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// Navigation guard unique pour gérer l'authentification et les droits admin
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Si la route nécessite une authentification
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!token) {
      next('/login');
    } else if (to.matched.some(record => record.meta.requiresAdmin) && user.role !== 'admin') {
      // Si la route nécessite des droits admin et que l'utilisateur n'est pas admin
      next('/login');
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router 