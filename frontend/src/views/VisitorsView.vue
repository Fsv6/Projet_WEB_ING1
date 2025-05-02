<template>
  <template>
    <AppLayout>
      <router-view />
    </AppLayout>
  </template>
  </template>

<script setup>
import AppLayout from '@/layout/AppLayoutGlobal.vue'
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

onMounted(() => {
  auth.setRole('visiteur')
})
</script>
<style>
  </style>