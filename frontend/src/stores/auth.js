// src/stores/auth.js
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        userId: localStorage.getItem('userId') || null,
        role: localStorage.getItem('role') || null,
        niveau: localStorage.getItem('niveau') || null,
        points: Number(localStorage.getItem('points')) || 0
    }),
    actions: {
        setAuth(user) {
            this.userId = user._id
            this.role = user.role
            this.niveau = user.niveau
            this.points = user.points

            localStorage.setItem('userId', user._id)
            localStorage.setItem('role', user.role)
            localStorage.setItem('niveau', user.niveau)
            localStorage.setItem('points', user.points)
        },
        clearAuth() {
            this.userId = null
            this.role = null
            this.niveau = null
            this.points = 0

            localStorage.removeItem('userId')
            localStorage.removeItem('role')
            localStorage.removeItem('niveau')
            localStorage.removeItem('points')
            localStorage.removeItem('token')
            localStorage.removeItem('user')
        },
        setAsVisitor() {
            this.userId = null
            this.role = 'visiteur'
            this.niveau = null
            this.points = 0

            localStorage.setItem('role', 'visiteur')
            localStorage.removeItem('userId')
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            localStorage.removeItem('niveau')
            localStorage.removeItem('points')
        }
    }
})



