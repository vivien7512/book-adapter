import { createRouter, createWebHistory } from 'vue-router'
import PageEditor from '../components/PageEditor.vue'
import Tab2 from '../components/Tab2.vue'
import Tab3 from '../components/Tab3.vue'

const routes = [
  { path: '/', redirect: '/PageEditor' },
  { path: '/PageEditor', component: PageEditor },
  { path: '/tab2', component: Tab2 },
  { path: '/tab3', component: Tab3 }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
