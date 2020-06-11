import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import BuildHierarchy from '../views/BuildHierarchy.vue'
import Treemap from '../views/Treemap.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  { path: '/build/hierarchy', name: 'BuildHierarchy', component: BuildHierarchy },
  { path: '/treemap', name: 'TreeMap', component: Treemap },
  { path: '/', redirect: '/treemap' }
]

const router = new VueRouter({
  mode: "hash",
  routes
})

export default router
