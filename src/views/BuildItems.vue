<template>
  <div class="build-data">
    <div>インポート設定</div>
    <upload-xlsx v-model="xlsx" />

    <el-tabs type="border-card">
      <el-tab-pane v-for="setting of settings" :key="setting.name">
        <template #label>
          <el-checkbox v-model="setting.enabled">{{ setting.name }}</el-checkbox>
        </template>
        <div class="label-value">
          <div>columns for hierarchy</div>
          <div>
            <el-checkbox-group v-model="setting.columns" size="mini">
              <el-checkbox-button v-for="col of setting.colList" :key="col" :label="col"></el-checkbox-button>
            </el-checkbox-group>
          </div>
        </div>
        <div class="label-value">
          <div>columns for data</div>
          <div>
            <el-checkbox-group v-model="setting.data" size="mini">
              <el-checkbox-button v-for="col of setting.colList" :key="col" :label="col"></el-checkbox-button>
            </el-checkbox-group>
          </div>
        </div>
        <div class="label-value">
          <div>row range</div>
          <div style="flex: 0 1 auto;">min</div>
          <el-input-number v-model="setting.rows[0]" style="max-width: 200px;"></el-input-number>
          <div style="flex: 0 1 auto;">max</div>
          <el-input-number v-model="setting.rows[1]" style="max-width: 200px;"></el-input-number>
        </div>
      </el-tab-pane>
    </el-tabs>

    <div>データ生成</div>
    <el-button @click="generateData">Generate Data</el-button>
    <el-button @click="generateHierarchy">Generate Hierarchy</el-button>
    <el-button @click="download">Download</el-button>
    <el-tree :data="data" default-expand-all>
      <template #default="{ data: { children, ...data } }">
        <div>{{ data }}</div>
      </template>
    </el-tree>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import UploadXlsx from '../components/UploadXlsx.vue'
import { Checkbox, Input, InputNumber, CheckboxButton, CheckboxGroup, Slider, TabPane, Tabs, Tree, Button } from 'element-ui'
import * as XLSX from 'xlsx'
import { Node, getHash } from '../data'
import { getItemRows, getHierarchyRows, getAlphaList, getHierarchy } from '../xlsx-utils'

interface Setting {
  name: string;
  enabled: boolean;
  columns: string[];
  colList: string[];
  rows: [number, number];
  rowMax: number;
  data: string[];
}

export interface Item {
  digest: string;
  text?: string;
  children?: Item[];
}

Vue.use(Checkbox)
Vue.use(Input)
Vue.use(InputNumber)
Vue.use(CheckboxButton)
Vue.use(CheckboxGroup)
Vue.use(Slider)
Vue.use(Tabs)
Vue.use(TabPane)
Vue.use(Tree)
Vue.use(Button)

export default Vue.extend({
  components: { UploadXlsx },
  data(): {
    xlsx?: XLSX.WorkBook;
    settings: Setting[];
    items: Item[];
    data: Node[];
    hierarchy: Node[];
  } {
    return {
      xlsx: undefined,
      settings: [],
      items: [],
      data: [],
      hierarchy: []
    }
  },
  computed: {
    god() {
      return {}
    }
  },
  watch: {
    xlsx(value: XLSX.WorkBook) {
      this.settings = this.getSettings(value)
    }
  },
  async mounted() {
    this.hierarchy = await window.electron.load()
  },
  methods: {
    getSettings(book: XLSX.WorkBook): Setting[] {
      return book.SheetNames.map(v => {
        const ref = book.Sheets[v]['!ref']
        const rowMin = ref ? XLSX.utils.decode_range(ref).s.r + 1 : 0
        const rowMax = ref ? XLSX.utils.decode_range(ref).e.r + 1 : 100
        const colMax = ref ? XLSX.utils.decode_range(ref).e.c : 100
        const colList = getAlphaList(0, colMax)
        return {
          name: v,
          enabled: false,
          columns: [],
          colList,
          rows: [rowMin, rowMax],
          rowMax,
          data: []
        }
      })
    },

    /**
     * Excelブックからデータを生成する。
     */
    async generateData() {
      const { xlsx, settings } = this
      if (!xlsx) throw Error('xlsx がありません。')
      const data = await Promise.all(settings
        .filter(v => v.enabled == true)
        .map<Promise<Node[]>>(async (setting: Setting): Promise<Node[]> => {
          const { name } = setting
          const sheet = xlsx.Sheets[name]
          const rowRange = { rowMin: setting.rows[0] - 1, rowMax: setting.rows[1] - 1 }
          const items = await getItemRows(sheet, {
            columns: setting.data.map(XLSX.utils.decode_col),
            ...rowRange
          })
          const hierarchy = await getHierarchyRows(sheet, {
            columns: setting.columns.map(XLSX.utils.decode_col),
            ...rowRange
          })
          const data: Node[] = []
          hierarchy.forEach(({ number, hash }, i, arr) => {
            const next = arr[i + 1] || { number: rowRange.rowMax }
            items.filter(v => (number < v.number && v.number < next.number))
              .forEach(v => data.push({ parent: hash, ...v }))
          })
          console.log(data)
          return data
        })
      )
      const result = data.flat()
      console.log(result)
      this.data = result
    },
    download() {
      const { data } = this
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
      const a = document.createElement('a')
      a.download = 'data.json'
      a.href = URL.createObjectURL(blob)
      a.click()
    },

    async generateHierarchy() {
      const { xlsx, settings } = this
      if (!xlsx) throw Error('xlsx がありません。')
      const data = await Promise.all(settings
        .filter(v => v.enabled == true)
        .map<Promise<Node>>(async (setting: Setting): Promise<Node> => {
          const { name } = setting
          const sheet = xlsx.Sheets[name]
          const rowRange = { rowMin: setting.rows[0] - 1, rowMax: setting.rows[1] - 1 }
          const hierarchy = await getHierarchy(sheet, {
            columns: setting.columns.map(XLSX.utils.decode_col),
            ...rowRange
          })
          console.log(hierarchy)
          return {
            text: name,
            hashSource: name,
            hash: await getHash(name),
            children: hierarchy
          }
        })
      )
      const result = data.flat()
      console.log(result)
      this.data = result
    }
  }
})
</script>

<style scoped>
.label-value {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}
.label-value > :first-child {
  flex: 0 1 200px;
}
.label-value > :not(:first-child) {
  flex: 1 1 auto;
  margin-left: 1em;
}
</style>