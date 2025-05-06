<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '@/layout/AppLayoutGlobal.vue'
import api from '@/services/api'
import { getPhotoUrl } from '@/utils/photo'

const user = ref(null)
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const photoFile = ref(null)
const photoPreview = ref(null)

onMounted(async () => {
  try {
    const res = await api.get('/users/me')
    user.value = res.data
  } catch (err) {
    console.error('Erreur chargement profil :', err)
  }
})

const handlePhotoChange = (e) => {
  const file = e.target.files[0]
  if (!file) return
  if (!['image/png', 'image/jpeg'].includes(file.type)) {
    alert('Seuls les formats PNG et JPEG sont acceptés.')
    return
  }
  photoFile.value = file
  photoPreview.value = URL.createObjectURL(file)
}

const uploadPhoto = async () => {
  if (!photoFile.value) {
    alert("Veuillez choisir une image.")
    return
  }

  const formData = new FormData()
  formData.append('photo', photoFile.value)

  try {
    const res = await api.put('/users/me/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    alert("Photo mise à jour !")
    user.value.photo = res.data.photo
    photoPreview.value = null
    photoFile.value = null
  } catch (err) {
    alert("Erreur lors de l'envoi de la photo")
    console.error(err)
  }
}


const updatePassword = async () => {
  if (!oldPassword.value || !newPassword.value || !confirmPassword.value) {
    alert('Tous les champs sont obligatoires.')
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    alert('Les mots de passe ne correspondent pas.')
    return
  }
  try {
    await api.put('/users/me', {
      password: newPassword.value,
      oldPassword: oldPassword.value
    })
    alert('Mot de passe mis à jour')
    oldPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (err) {
    alert("Erreur lors de la mise à jour : " + (err.response?.data?.message || 'Inconnue'))
  }
}
</script>

<template>
  <AppLayout>
    <div class="profile-page">
      <h2>👤 Mon Profil</h2>



      <div class="section">
        <div class="section">
          <h3>🖼️ Photo de profil</h3>

          <img
              :src="getPhotoUrl(user?.photo, user?._id)"
              alt="Photo de profil"
              class="avatar"
          />

          <input type="file" accept=".png, .jpeg, .jpg" @change="handlePhotoChange" />
          <img v-if="photoPreview" :src="photoPreview" alt="Preview" class="preview" />
          <button class="btn" @click="uploadPhoto">Mettre à jour la photo</button>
        </div>
        <h3>🧾 Infos publiques</h3>
        <p><strong>Pseudo :</strong> {{ user?.login }}</p>
        <p><strong>Age :</strong> {{ user?.personne?.age || 'Non spécifié' }}</p>
        <p><strong>Genre :</strong> {{ user?.personne?.genre || 'Non spécifié' }}</p>
        <p><strong>Date de naissance :</strong> {{ user?.personne?.dateNaissance?.substring(0, 10) || 'Non spécifiée' }}</p>
        <p><strong>Type de membre :</strong> {{ user?.personne?.typeMembre || 'Non précisé' }}</p>
        <div class="section">
          <h3>🔐 Infos privées</h3>
          <p><strong>Nom :</strong> {{ user?.personne?.nom || 'Non renseigné' }}</p>
          <p><strong>Prénom :</strong> {{ user?.personne?.prenom || 'Non renseigné' }}</p>
        </div>
      </div>

      <div class="section">
        <h3>🔒 Changer le mot de passe</h3>
        <input v-model="oldPassword" type="password" placeholder="Ancien mot de passe" />
        <input v-model="newPassword" type="password" placeholder="Nouveau mot de passe" />
        <input v-model="confirmPassword" type="password" placeholder="Confirmer le nouveau mot de passe" />
        <button class="btn" @click="updatePassword">Mettre à jour le mot de passe</button>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.profile-page {
  padding: 2rem;
  max-width: 600px;
  margin: auto;
}
.section {
  background: #f8f8f8;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}
.preview {
  width: 100px;
  margin-top: 1rem;
  border-radius: 6px;
}
input {
  display: block;
  margin: 0.5rem 0;
  padding: 0.5rem;
  width: 100%;
  border-radius: 4px;
  border: 1px solid #ccc;
}
button.btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #2c3e50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.avatar {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 50%;
  margin-bottom: 1rem;
  border: 2px solid #ccc;
}

</style>

