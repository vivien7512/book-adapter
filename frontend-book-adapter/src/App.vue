<script setup lang="ts">
import { ref } from 'vue'

// Déclaration de variables réactives
const message = ref('Bienvenue à Vue 3 avec TypeScript!')
</script>

<template>
  <div id="root">
    <nav class="bg-teal-700 p-4 flex justify-around items-center shadow-md">
      <router-link to="/PageEditor" class="nav-item flex justify-center items-center w-full ripple mx-2" active-class="active">PAGE Editor</router-link>
      <router-link to="/tab2" class="nav-item flex justify-center items-center w-full ripple  mx-2" active-class="active">2</router-link>
      <router-link to="/tab3" class="nav-item flex justify-center items-center w-full ripple  mx-2" active-class="active">3</router-link>
    </nav>
    <router-view />
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
  @apply bg-white text-teal-700;
  border-bottom: 2px solid black
}
.ripple {
  background-position: center;
  transition: background 0.8s;
}
.ripple:hover {
  background: #015555 radial-gradient(circle, transparent 1%, #006F6F 1%) center/15000%;
  color: white;
}
.ripple:active {
  background-color: #008B8B;
  background-size: 100%;
  transition: background 0s;
}
</style>
