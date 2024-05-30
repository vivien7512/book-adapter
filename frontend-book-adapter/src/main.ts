import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import './assets/tailwind.css' // Ajoutez cette ligne


createApp(App).use(router).mount('#app')
