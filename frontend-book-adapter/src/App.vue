<script setup lang="ts">
import { ref } from 'vue'
import TesseractSettings from './components/SettingsTesseract.vue'


// Déclaration de variables réactives
const message = ref('Bienvenue à Vue 3 avec TypeScript!')
const showSettings = ref(false)

const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

const saveSettings = (settings: { ocrOem: string, ocrPsm: string, ocrLang: string }) => {
}
</script>

<template>
  <div id="root">
    <nav class="bg-blue-800 p-4 flex justify-around items-center shadow-md">
      <router-link to="/PageEditor" class="nav-item flex justify-center items-center w-full ripple mx-2" active-class="active">PAGE Editor</router-link>
      <router-link to="/tab2" class="nav-item flex justify-center items-center w-full ripple  mx-2" active-class="active">2</router-link>
      <router-link to="/tab3" class="nav-item flex justify-center items-center w-full ripple  mx-2" active-class="active">3</router-link>
      <button @click="toggleSettings" class="bg-gray-300 text-gray-700 px-4 py-2 rounded flex items-center">
        <span class="material-icons">⚙️</span>
      </button>
    </nav>
    <router-view />
    <TesseractSettings :visible="showSettings" @onSave="saveSettings" @onClose="toggleSettings" />

  </div>
</template>

<style lang="scss" scoped>
#root {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  margin: 0;
  background-color: #f0f4f8;
  overflow: hidden; 
}

.nav-item {
  @apply text-white text-lg font-bold uppercase p-2 rounded transition duration-300;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.nav-item:hover {
  @apply bg-teal-600;
}

.active {
  @apply bg-white text-blue-800;
  border-bottom: 2px solid black
}
.ripple {
  background-position: center;
  transition: background 0.8s;
}
.ripple:hover {
  background: #1e3a8a radial-gradient(circle, transparent 1%, #0f1b3d 1%) center/15000%;
  color: white;
}
.ripple:active {
  background-color: #0f1b3d;
  background-size: 100%;
  transition: background 0s;
}
</style>
