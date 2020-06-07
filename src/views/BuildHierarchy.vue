<template>
  <div class="build-hierarchy" style="min-width: 300px;min-height: 300px; border: 1px solid;">
    <upload-xlsx v-model="xlsx" />

    <div v-for="sheet of sheets" :key="sheet.name" class="sheet">
      <el-checkbox v-model="sheet.enabled">{{ sheet.name }}</el-checkbox>
      <!-- <el-input v-model="sheet.columns" placeholder="column set"></el-input> -->
      <div style="display:flex;align-items:center;">
        <span style="margin-right:1em">rows for hierarchy</span>
        <el-checkbox-group v-model="sheet.columns" size="mini">
          <el-checkbox-button label="A"></el-checkbox-button>
          <el-checkbox-button label="B"></el-checkbox-button>
        </el-checkbox-group>
      </div>
      <!-- <el-input v-model="sheet.rows" placeholder="row range" size="mini"></el-input> -->
      <div style="display:flex;align-items:center;">
        <span style="margin-right:1em">column range</span>
        <el-slider v-model="sheet.rows" range :max="sheet.rowMax" style="flex: 1 1"></el-slider>
      </div>
    </div>

    <preview-hierarchy v-model="hierarchy" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import UploadXlsx from '../components/UploadXlsx.vue'
import PreviewHierarchy from '../components/PreviewHierarchy.vue'
import { Checkbox, Input, InputNumber, CheckboxButton, CheckboxGroup, Slider } from 'element-ui'
import * as XLSX from 'xlsx'

Vue.use(Checkbox)
Vue.use(Input)
Vue.use(InputNumber)
Vue.use(CheckboxButton)
Vue.use(CheckboxGroup)
Vue.use(Slider)

function numToAlpha(num: number) {
  let alpha = ''
  for (; num >= 0; num = num / 26 - 1) {
    alpha = String.fromCharCode(num % 26 + 0x41) + alpha;
  }
  return alpha;
}

export default Vue.extend({
  components: { UploadXlsx, PreviewHierarchy },
  data(): {
    xlsx?: XLSX.WorkBook;
    hierarchy?: {};
    sheets: {}[];
  } {
    return {
      xlsx: undefined,
      hierarchy: {
        text: 'root',
        children: [
          { text: 'c1' },
          { text: 'c2' },
          {
            text: 'c3',
            children: [
              { text: 'c3-1' },
              { text: 'c3-2' },
            ]
          },
        ]
      },
      sheets: []
    }
  },
  watch: {
    xlsx(value: XLSX.WorkBook) {
      this.sheets = value.SheetNames.map(v => {
        const ref = value.Sheets[v]['!ref']
        const rowMin = ref ? XLSX.utils.decode_range(ref).s.r : 0
        const rowMax = ref ? XLSX.utils.decode_range(ref).e.r : 100
        return {
          name: v,
          enabled: true,
          columns: [],
          rows: [rowMin, rowMax],
          rowMax
        }
      })
    }
  }
})
</script>

<style scoped>
.sheet {
  /* display: flex; */
  /* align-items: center; */
  padding: 0.2em 1em;
}
.sheet > :not(:last-child) {
  margin-right: 1em;
}
</style>