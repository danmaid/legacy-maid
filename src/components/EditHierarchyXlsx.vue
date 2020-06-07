<template>
  <div class="edit-hierarchy-xlsx">
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import * as XLSX from 'xlsx'

export default Vue.extend({
  props: {
    value: {
      type: Object
    },
    sheet: {
      type: Object as PropType<XLSX.WorkSheet & { '!ref': string; '!cols': {}[] }>
    }
  },
  computed: {
    range() {
      return XLSX.utils.decode_range(this.sheet['!ref'])
    },
    rows() {
      //   return this.sheet['!rows']
      if (!this.sheet) return
      return this.sheet['!rows']
    },
    html() {
      if (!this.sheet) return
      return XLSX.utils.sheet_to_html(this.sheet, { header: '', footer: '' })
    },
    json() {
      if (!this.sheet) return
      return XLSX.utils.sheet_to_json(this.sheet)
    },
    columns() {
      if (!this.sheet) return
      const sheet = this.sheet as { '!ref': string; '!cols': {}[] }
      const result = /^\w+:([A-Z])\d+$/.exec(sheet['!ref'])
      if (!Array.isArray(result) || result.length < 2) return
      const start = 'A'.charCodeAt(0)
      const end = result[1].charCodeAt(0)
      const columns = new Array(end - start + 1).fill({}).map((v, i) => {
        return {
          value: String.fromCharCode(start + i),
          ...sheet['!cols'][i]
        }
      })
      return columns
    }
  },
  methods: {
    extend() {
      console.log(this.$refs.table)
    }
  }
})
</script>