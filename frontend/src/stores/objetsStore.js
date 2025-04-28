import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'


export const useObjetsStore = defineStore('objets', () => {
  const objets = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchObjets = async () => {
    loading.value = true
    error.value = null
    try {
      const res = await api.get('/objets')
      objets.value = res.data
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  const objetsAvecManuels = computed(() =>
    objets.value.filter(obj => obj.manuel)
  )

  return {
    objets,
    loading,
    error,
    fetchObjets,
    objetsAvecManuels
  }
})