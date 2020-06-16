import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Treemap from '../views/Treemap.vue'
import BuildItems from '../views/BuildItems.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  { path: '/treemap', name: 'TreeMap', component: Treemap },
  { path: '/build/items', name: 'BuildItems', component: BuildItems },
  { path: '/', redirect: '/treemap' }
]

const router = new VueRouter({
  mode: "hash",
  routes
})

export default router
