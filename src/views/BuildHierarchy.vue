<template>
  <el-row class="build-hierarchy">
    <el-col :span="12">
      <div>インポート設定</div>
      <upload-xlsx v-model="xlsx" />

      <div v-for="setting of settings" :key="setting.name">
        <el-tabs type="border-card">
          <el-tab-pane>
            <template #label>
              <el-checkbox v-model="setting.enabled">{{ setting.name }}</el-checkbox>
            </template>
            <el-row type="flex" align="middle">
              <el-col :span="6">columns for hierarchy</el-col>
              <el-col :span="18">
                <el-checkbox-group v-model="setting.columns" size="mini">
                  <el-checkbox-button v-for="col of setting.colList" :key="col" :label="col"></el-checkbox-button>
                </el-checkbox-group>
              </el-col>
            </el-row>
            <el-row type="flex" align="middle">
              <el-col :span="6">row range</el-col>
              <el-col :span="2">min</el-col>
              <el-col :span="7">
                <el-input-number v-model="setting.rows[0]"></el-input-number>
              </el-col>
              <el-col :span="2">max</el-col>
              <el-col :span="7">
                <el-input-number v-model="setting.rows[1]"></el-input-number>
              </el-col>
            </el-row>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-col>

    <el-col :span="6">
      <div>インポート階層</div>
      <el-button @click="hierarchy = getHierarchy(settings)">Generate</el-button>
      <el-button >Save (上書き)</el-button>
      <el-tree v-if="hierarchy" :data="[hierarchy]" default-expand-all>
        <template #default="{ data: { children, ...data } }">
          <div>{{ data }}</div>
        </template>
      </el-tree>
    </el-col>

    <el-col :span="6">
      <div>結果階層</div>
      <merge-hierarchy :from="selected" :to="god" strategy="overwrite" />
    </el-col>
  </el-row>
</template>

<script lang="ts">
import Vue from 'vue'
import UploadXlsx from '../components/UploadXlsx.vue'
import { Checkbox, Input, InputNumber, CheckboxButton, CheckboxGroup, Slider, TabPane, Tabs, Tree, Button, Row, Col } from 'element-ui'
import * as XLSX from 'xlsx'

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

export interface Hierarchy {
  text?: string;
  children?: Hierarchy[];
  parent?: Hierarchy;
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
Vue.use(Row)
Vue.use(Col)

export default Vue.extend({
  components: { UploadXlsx },
  data(): {
    xlsx?: XLSX.WorkBook;
    settings: Setting[];
    hierarchy?: Hierarchy;
    selected?: Hierarchy[];
  } {
    return {
      xlsx: undefined,
      settings: [],
      hierarchy: undefined,
      selected: undefined
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
          enabled: true,
          columns: [...colList],
          colList,
          rows: [rowMin, rowMax],
          rowMax
        }
      })
    },
    getHierarchy(settings: Setting[]): Hierarchy {
      const { xlsx } = this
      if (!xlsx) throw Error('xlsx not found.')
      return {
        text: xlsx.Props ? xlsx.Props.Title : undefined,
        children: settings.filter(v => v.enabled).map(v => ({
          text: v.name,
          children: this.sheetToHierarchy(xlsx.Sheets[v.name], v)
        }))
      }
    },
    sheetToHierarchy(sheet: XLSX.Sheet, setting: Setting): Hierarchy[] {
      class Node {
        addr: XLSX.CellAddress;
        key: string;
        value: XLSX.CellObject;
        hNode: Hierarchy;
        parent?: Node;
        children?: Node[];

        constructor(addr: string, value: XLSX.CellObject) {
          this.addr = XLSX.utils.decode_cell(addr)
          this.key = addr
          this.value = value
          this.hNode = { text: value.w }
        }

        appendChild(child: Node) {
          this.children ? this.children.push(child) : this.children = [child]
          this.hNode.children
            ? this.hNode.children.push(child.hNode)
            : this.hNode.children = [child.hNode]
          child.parent = this
        }

        findParent(node: Node): Node {
          if (!this.parent) return this
          return this.parent.addr.c < node.addr.c ? this.parent : this.parent.findParent(node)
        }
      }

      const cells = setting.columns.map(v => XLSX.utils.decode_col(v))
      const rMin = setting.rows[0] - 1
      const rMax = setting.rows[1] - 1
      const init = new Node('A0', { t: 'z' })
      const result = Object.entries(sheet)
        .filter(([cell]) => {
          const c = XLSX.utils.decode_cell(cell)
          if (!cells.includes(c.c)) return false
          if (c.r < rMin || rMax < c.r) return false
          return true
        })
        .filter(([, v]) => v.t != 'z')
        .map(([key, value]) => new Node(key, value))
        .reduce((a: { root: Hierarchy; prev: Node }, c: Node) => {
          if (a.prev.addr.c < c.addr.c) {
            a.prev.appendChild(c)
          } else if (a.prev.addr.c == c.addr.c && a.prev.parent) {
            a.prev.parent.appendChild(c)
          } else if (a.prev.addr.c > c.addr.c) {
            a.prev.findParent(c).appendChild(c)
          }
          a.prev = c
          return a
        }, { prev: init, root: init.hNode })
      console.log(result)
      console.log(init)
      return result.root.children || []
    }
  }
})
</script>
