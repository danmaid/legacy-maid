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
    <el-button @click="gen">Gen</el-button>
    <el-button @click="download">download</el-button>
    <el-tree v-if="hierarchy" :data="[hierarchy]" default-expand-all>
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

type SheetName = string

type NodeRow = Node & { number: number }
type Row = { number: number; cells: Cell[] }
type Cell = { addr: XLSX.CellAddress; value: XLSX.CellObject }

/**
 * Excelシートから行を取得する。
 */
function getRows(sheet: XLSX.Sheet, range: XLSX.Range): Row[] {
  const result = Object.entries(sheet)
    .map(([key, value]): Cell => ({
      addr: XLSX.utils.decode_cell(key),
      value: value
    }))
    .filter(({ addr, value }) =>
      range.s.r <= addr.r && addr.r <= range.e.r &&
      range.s.c <= addr.c && addr.c <= range.e.c &&
      value.t !== 'z'
    )
    .sort((a, b) => {
      if (a.addr.r > b.addr.r) return 1
      if (a.addr.r < b.addr.r) return 1
      return a.addr.c - b.addr.c
    })
    .reduce((acc: Row[], c: Cell, i, arr) => {
      const prev = arr[i - 1]
      if (prev && prev.addr.r === c.addr.r) {
        acc[acc.length - 1].cells.push(c)
      } else {
        acc.push({ number: c.addr.r, cells: [c] })
      }
      return acc
    }, [])
  console.log(result)
  return result
}

/**
 * Excelシートからデータ行を取得する。
 */
async function getItemRows(
  sheet: XLSX.Sheet,
  options: { columns: Array<number>; rowMin: number; rowMax: number }
): Promise<NodeRow[]> {
  const { columns, rowMin, rowMax } = options
  const range: XLSX.Range = {
    s: { r: rowMin, c: Math.min(...columns) },
    e: { r: rowMax, c: Math.max(...columns) }
  }
  const rows: Row[] = getRows(sheet, range)
  const result: NodeRow[] = await Promise.all(rows.map(
    async ({ number, cells }): Promise<NodeRow> => {
      const text = cells.map(v => v.value.w).join('')
      const hash = await getHash(text)
      return { number, text, hashSource: text, hash }
    }
  ))
  console.log(result)
  return result
}

/**
 * Excelシートから階層行を取得する。
 */
async function getHierarchyRows(
  sheet: XLSX.Sheet,
  options: { columns: Array<number>; rowMin: number; rowMax: number }
): Promise<NodeRow[]> {
  const { columns, rowMin, rowMax } = options
  const range: XLSX.Range = {
    s: { r: rowMin, c: Math.min(...columns) },
    e: { r: rowMax, c: Math.max(...columns) }
  }
  const rows: Row[] = getRows(sheet, range)
  const maxColumn = (list: Cell[]) => list[list.length - 1].addr.c
  type LinkedRow = Row & { parent?: LinkedRow; hashSource?: string }
  function findParent(column: number, row?: LinkedRow): LinkedRow | undefined {
    if (!row) return
    return maxColumn(row.cells) >= column ? findParent(column, row.parent) : row
  }
  const result: NodeRow[] = await Promise.all(rows.map(
    async (cur: LinkedRow, i, arr: LinkedRow[]): Promise<NodeRow> => {
      const { number, cells } = cur
      const prev = arr[i - 1]
      const text = cells.map(v => v.value.w).join('')
      const hash = await getHash(text)
      const parent = findParent(maxColumn(cells), prev)
      const hashSource = parent ? [parent.hashSource, text].join(' - ') : text
      cur.parent = parent
      cur.hashSource = hashSource
      return { number, text, hash, hashSource }
    }
  ))
  console.log(result)
  return result
}

/**
 * Excelブックからデータを生成する。
 */
async function generate(xlsx: XLSX.WorkBook, settings: Setting[]): Promise<Node[]> {
  const data = await Promise.all(settings
    .filter(v => v.enabled == true)
    .map<Promise<Node[]>>(async (setting: Setting): Promise<Node[]> => {
      const { name } = setting
      const sheet = xlsx.Sheets[name]
      const rowRange = { rowMin: setting.rows[0] - 1, rowMax: setting.rows[1] - 1 }
      const items: NodeRow[] = await getItemRows(sheet, {
        columns: setting.data.map(XLSX.utils.decode_col),
        ...rowRange
      })
      const hierarchy: NodeRow[] = await getHierarchyRows(sheet, {
        columns: setting.columns.map(XLSX.utils.decode_col),
        ...rowRange
      })
      const data: Node[] = []
      hierarchy.forEach(({ number, hash }, i, arr) => {
        const next = arr[i + 1] || { number: rowRange.rowMax }
        items.filter(v => (number < v.number && v.number < next.number))
          .forEach(v => data.push({ parent: hash, ...v }))
      })
      return data
    })
  )
  return data.flat()
}


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
  } {
    return {
      xlsx: undefined,
      settings: [],
      items: [],
      data: []
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

    async gen() {
      const { xlsx, settings } = this
      if (!xlsx) throw Error('xlsx がありません。')
      const result = await generate(xlsx, settings)
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