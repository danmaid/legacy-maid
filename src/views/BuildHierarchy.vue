<template>
  <div class="build-hierarchy" style="min-width: 300px;min-height: 300px; border: 1px solid;">
    <upload-xlsx v-model="xlsx" />

    <div v-for="setting of settings" :key="setting.name">
      <el-tabs type="border-card">
        <el-tab-pane>
          <template #label>
            <el-checkbox v-model="setting.enabled">{{ setting.name }}</el-checkbox>
          </template>
          <div style="display:flex;align-items:center;">
            <span style="margin-right:1em">rows for hierarchy</span>
            <el-checkbox-group v-model="setting.columns" size="mini">
              <el-checkbox-button v-for="col of setting.colList" :key="col" :label="col"></el-checkbox-button>
            </el-checkbox-group>
          </div>
          <div style="display:flex;align-items:center;">
            <span style="margin-right:1em">column range</span>
            <el-slider
              v-model="setting.rows"
              range
              :min="1"
              :max="setting.rowMax"
              style="flex: 1 1"
            ></el-slider>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-tree :data="[hierarchy]" default-expand-all>
      <template #default="{ data: { children, ...data } }">
        <div>{{ data }}</div>
      </template>
    </el-tree>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import UploadXlsx from '../components/UploadXlsx.vue'
import { Checkbox, Input, InputNumber, CheckboxButton, CheckboxGroup, Slider, TabPane, Tabs, Tree } from 'element-ui'
import * as XLSX from 'xlsx'

Vue.use(Checkbox)
Vue.use(Input)
Vue.use(InputNumber)
Vue.use(CheckboxButton)
Vue.use(CheckboxGroup)
Vue.use(Slider)
Vue.use(Tabs)
Vue.use(TabPane)
Vue.use(Tree)

function numToAlpha(num: number) {
  let alpha = ''
  for (; num >= 0; num = num / 26 - 1) {
    alpha = String.fromCharCode(num % 26 + 0x41) + alpha;
  }
  return alpha;
}

function getAlphaList(start: number, end: number): string[] {
  const arr: string[] = []
  for (let i = start; i <= end; i++) {
    arr.push(numToAlpha(i))
  }
  return arr
}

interface Setting {
  name: string;
  enabled: boolean;
  columns: string[];
  colList: string[];
  rows: [number, number];
  rowMax: number;
}

function getSettings(book: XLSX.WorkBook): Setting[] {
  return book.SheetNames.map(v => {
    const ref = book.Sheets[v]['!ref']
    const rowMin = ref ? XLSX.utils.decode_range(ref).s.r + 1 : 0
    const rowMax = ref ? XLSX.utils.decode_range(ref).e.r + 1 : 100
    const colMax = ref ? XLSX.utils.decode_range(ref).e.c : 100
    const colList = getAlphaList(0, colMax)
    return {
      name: v,
      enabled: true,
      columns: [...colList],
      colList,
      rows: [rowMin, rowMax],
      rowMax
    }
  })
}

type Hierarchy = Children & Data

interface Data {
  text?: string;
}

interface Children {
  children?: Hierarchy[];
}

function getHierarchy(settings: Setting[], root?: Data): Hierarchy {
  return {
    children: settings.filter(v => v.enabled).map(v => ({
      text: v.name
    })),
    ...root
  }
}

export default Vue.extend({
  components: { UploadXlsx },
  data(): {
    xlsx?: XLSX.WorkBook;
    settings: Setting[];
  } {
    return {
      xlsx: undefined,
      settings: []
    }
  },
  computed: {
    hierarchy() {
      const { settings, xlsx }: { xlsx?: XLSX.WorkBook; settings: Setting[] } = this
      const root = xlsx ? {
        text: xlsx.Props ? xlsx.Props.Title : undefined
      } : undefined
      return getHierarchy(settings, root)
    }
  },
  watch: {
    xlsx(value: XLSX.WorkBook) {
      this.settings = getSettings(value)
    }
  }
})
</script>
