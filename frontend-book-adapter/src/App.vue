<script setup lang="ts">
import { ref } from 'vue'

// Déclaration de variables réactives
const message = ref('Bienvenue à Vue 3 avec TypeScript!')

</script>

<template>
  <div id="root">
    <nav>
      <span class="nav-item ripple"><router-link to="/PageEditor">PAGE Editor</router-link></span>
      <span class="nav-item ripple"><router-link to="/tab2">2</router-link></span>
      <span class="nav-item ripple"><router-link to="/tab3">3</router-link></span>
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
  background-color: #008B8B;
  overflow: hidden; 
}

nav {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: #008B8B;
  height: 50px;
}

.nav-item {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: bold;
  text-transform: uppercase;
  text-decoration: none;
  padding: 10px 20px;
  position: relative;
  text-align: center;
  flex-grow: 1;
}

.nav-item a {
  color: inherit;
  text-decoration: none;
  width: 100%;
  display: inline-block;
}

.router-link-active {
  color: white;
  font-weight: bold;
}

.router-link-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: white;
}

.nav-item:hover {
  background-color: #006F6F;
  border-radius: 5px;
}

.ripple {
  background-position: center;
  transition: background 0.8s;
}

.ripple:hover {
  background: #006F6F radial-gradient(circle, transparent 1%, #006F6F 1%) center/15000%;
}

.ripple:active {
  background-color: #008B8B;
  background-size: 100%;
  transition: background 0s;
}
</style>
