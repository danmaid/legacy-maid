<template>
  <div class="treemap">
    <Plotly v-if="hierarchy" :data="data"></Plotly>
    <!-- {{ hierarchy }} -->
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { ipcRenderer } from 'electron'
import { Hierarchy } from '../main'
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { Plotly } from 'vue-plotly'

export default Vue.extend({
  components: { Plotly },
  data(): { hierarchy?: Hierarchy } {
    return {
      hierarchy: undefined
    }
  },
  computed: {
    ids() {
      const root = this.hierarchy || {}
      const result = function flatten({ children, ...data }: Hierarchy): string[] {
        return children
          ? children.reduce<string[]>((a, c) => a.concat(flatten(c)), [data.digest || ''])
          : [data.digest || '']
      }(root)
      return result
    },
    labels() {
      const root = this.hierarchy || {}
      const result = function flatten({ children, ...data }: Hierarchy): string[] {
        return children
          ? children.reduce<string[]>((a, c) => a.concat(flatten(c)), [data.text || ''])
          : [data.text || '']
      }(root)
      return result
    },
    parents() {
      const root = this.hierarchy || {}
      const result = function flatten({ children, ...data }: Hierarchy): string[] {
        return children
          ? children.reduce<string[]>((a, c) => a.concat(
            flatten(c).map(v => {
              if (v === root.digest) return ''
              return v === '' ? data.digest || '' : v
            }))
            , ['']
          )
          : ['']
      }(root)
      return result
    },
    data(): {}[] {
      return [{
        type: 'treemap',
        maxdepth: 4,
        ids: this.ids,
        labels: this.labels,
        parents: this.parents
      }]
    }
  },
  async mounted() {
    this.hierarchy = await ipcRenderer.invoke('load')
  }
})
</script>