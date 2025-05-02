import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'


export const useRecettesStore = defineStore('recettes', () => {
  const recettes = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchRecettes = async () => {
    loading.value = true
    error.value = null
    try {
      const res = await api.get('/recettes')
      recettes.value = res.data
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  return {
    recettes,
    loading,
    error,
    fetchRecettes
  }
})