<template>
  <div class="treemap">
    <div ref="plotly"></div>
    <!-- {{ hierarchy }} -->
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Hierarchy } from '../main'
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import Plotly from 'plotly.js-dist'

export default Vue.extend({
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
  watch: {
      data(v) {
          console.log('data', v)
          console.log(this.$refs.plotly)
        //   Plotly.newPlot(this.$refs.plotly, v)
      }
  },
  async mounted() {
    this.hierarchy = await window.electron.load()
  }
})
</script>