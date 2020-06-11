import Vue from 'vue'
import App from './App.vue'
import router from './router'
import 'element-ui/lib/theme-chalk/index.css'
import { ElectronApi } from './preload'

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')

export interface Hierarchy {
  text?: string;
  children?: Hierarchy[];
  parent?: Hierarchy;
  digest?: string;
}

declare global {
  interface Window {
    electron: ElectronApi;
  }
}
