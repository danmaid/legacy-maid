<template>
  <div class="upload-xlsx">
    <input type="file" accept=".xlsx" @change="inputFile" />
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import * as XLSX from 'xlsx'

export default Vue.extend({
  props: {
    value: {
      type: Object as PropType<XLSX.WorkBook>,
      default: undefined
    }
  },
  data() {
    return {
      workbook: this.value
    }
  },
  watch: {
    workbook(v) {
      this.$emit('input', v)
    }
  },
  methods: {
    inputFile({ target }: Event) {
      if (!(target instanceof HTMLInputElement)) return
      const { files } = target
      if (!files) return

      console.log(files[0])
      this.readFile(files[0])
    },
    dropFile({ dataTransfer }: DragEvent) {
      if (!dataTransfer) return
      const { files } = dataTransfer
      if (!files) return

      console.log(files[0])
      this.readFile(files[0])
    },
    readFile(file: File) {
      const reader = new FileReader()
      reader.onload = () => {
        const { result } = reader
        if (!(result instanceof ArrayBuffer)) throw Error('invalid file')
        const data = new Uint8Array(result)
        this.workbook = XLSX.read(data, { type: 'array', cellStyles: true })
      }
      reader.readAsArrayBuffer(file)
    }
  }
})
</script>