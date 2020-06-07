import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import BuildHierarchy from '../views/BuildHierarchy.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/build/hierarchy',
    name: 'BuildHierarchy',
    component: BuildHierarchy
  },
  { path: '/', redirect: '/build/hierarchy' }
]

const router = new VueRouter({
  routes
})

export default router
