<template>
  <div class="treemap">
    <Plotly :data="data" :layout="layout" :display-mode-bar="false"></Plotly>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { Plotly } from 'vue-plotly'
import { Hierarchy, Data } from '../views/BuildHierarchy.vue'

export default Vue.extend({
  components: { Plotly },
  props: {
    value: {
      type: Object as PropType<Hierarchy>,
      required: true
    }
  },
  data() {
    return {
      data: [{
        x: [1, 2, 3, 4],
        y: [10, 15, 13, 17],
        type: "scatter"
      }],
      layout: {
        title: "My graph"
      }    }
  },
  computed: {
    labels(): string[] {
      function flattenDeep<T>(arr: Hierarchy[], mapper: (d: Data) => T): T[] {
        const result = arr.reduce<T[]>((acc, { children, ...data }) => children
          ? acc.concat(flattenDeep(children, mapper))
          : acc.concat([mapper(data)])
          , [])
        return result
      }

      const { value: { children, ...data } } = this
      const result = [data.text || '']
      if (children) {
        result.push(...flattenDeep(children, d => d.text || ''))
      }
      return result
    },
    parents(): string[] {
      function flattenDeep<T>(arr: Hierarchy[], mapper: (v: Hierarchy) => T): T[] {
        const result = arr.reduce<T[]>((acc, c) => c.children
          ? acc.concat(flattenDeep(c.children, mapper))
          : acc.concat([mapper(c)])
          , [])
        return result
      }

      const { value: { children } } = this
      const result = ['']
      if (children) {
        result.push(...flattenDeep(children, d => d.text || ''))
      }
      return result
    },
    values(): string[] {
      return []
    },
    hi() {
      return [{
        type: 'treemap',
        labels: this.labels
      }]
    }
  }
})
</script>
