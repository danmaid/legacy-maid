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

    <el-col :span="12">
      <div>インポート階層</div>
      <el-button @click="generate">Generate</el-button>
      <el-button @click="save(hierarchy)">Save (上書き)</el-button>
      <el-tree v-if="hierarchy" :data="[hierarchy]" default-expand-all>
        <template #default="{ data: { children, ...data } }">
          <div>{{ data }}</div>
        </template>
      </el-tree>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import Vue from 'vue'
import UploadXlsx from '../components/UploadXlsx.vue'
import { Checkbox, Input, InputNumber, CheckboxButton, CheckboxGroup, Slider, TabPane, Tabs, Tree, Button, Row, Col } from 'element-ui'
import * as XLSX from 'xlsx'
import { Hierarchy } from '../main'

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

async function getDigest(text: string) {
  const data = new TextEncoder().encode(text)
  const buffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(buffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

interface Setting {
  name: string;
  enabled: boolean;
  columns: string[];
  colList: string[];
  rows: [number, number];
  rowMax: number;
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
  } {
    return {
      xlsx: undefined,
      settings: [],
      hierarchy: undefined
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
  mounted() {
    console.log(window.electron)
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
    async generate() {
      this.hierarchy = await this.getHierarchy(this.settings)
    },
    async getHierarchy(settings: Setting[]): Promise<Hierarchy> {
      const { xlsx } = this
      if (!xlsx) throw Error('xlsx not found.')
      const text = xlsx.Props ? xlsx.Props.Title : undefined
      return {
        text,
        digest: await getDigest('' + text),
        children: await Promise.all(settings.filter(v => v.enabled).map(async v => ({
          text: v.name,
          digest: await getDigest([text, v.name].join(' - ')),
          children: await this.sheetToHierarchy(xlsx.Sheets[v.name], v, [text, v.name].join(' - '))
        })))
      }
    },
    async sheetToHierarchy(sheet: XLSX.Sheet, setting: Setting, parent: string): Promise<Hierarchy[]> {
      class Node {
        addr: XLSX.CellAddress;
        key: string;
        value: XLSX.CellObject;
        hNode: Hierarchy & { digest?: string };
        parent?: Node;
        children?: Node[];

        constructor(addr: string, value: XLSX.CellObject) {
          this.addr = XLSX.utils.decode_cell(addr)
          this.key = addr
          this.value = value
          this.hNode = { text: value.w }
        }

        async appendChild(child: Node) {
          this.children ? this.children.push(child) : this.children = [child]
          this.hNode.children
            ? this.hNode.children.push(child.hNode)
            : this.hNode.children = [child.hNode]
          child.parent = this
          child.hNode.digest = await this.getDigest(child)
        }

        findParent(node: Node): Node {
          if (!this.parent) return this
          return this.parent.addr.c < node.addr.c ? this.parent : this.parent.findParent(node)
        }

        async getDigest(node: Node) {
          const joinedText = function findParentText(node: Node): string {
            return node.parent
              ? [findParentText(node.parent), node.hNode.text || ''].join(' - ')
              : node.hNode.text || 'a'
          }(node)
          const digest = await getDigest([joinedText].join(' - '))
          return digest
        }
      }

      const cells = setting.columns.map(v => XLSX.utils.decode_col(v))
      const rMin = setting.rows[0] - 1
      const rMax = setting.rows[1] - 1
      const init = new Node('A0', { t: 's', w: parent })
      const result = await Object.entries(sheet)
        .filter(([cell]) => {
          const c = XLSX.utils.decode_cell(cell)
          if (!cells.includes(c.c)) return false
          if (c.r < rMin || rMax < c.r) return false
          return true
        })
        .filter(([, v]) => v.t != 'z')
        .map(([key, value]) => new Node(key, value))
        .reduce(async (acc: Promise<{ root: Hierarchy; prev: Node }>, c: Node) => {
          const a = await acc
          if (a.prev.addr.c < c.addr.c) {
            await a.prev.appendChild(c)
          } else if (a.prev.addr.c == c.addr.c && a.prev.parent) {
            await a.prev.parent.appendChild(c)
          } else if (a.prev.addr.c > c.addr.c) {
            await a.prev.findParent(c).appendChild(c)
          }
          a.prev = c
          return a
        }, Promise.resolve({ prev: init, root: init.hNode }))
      console.log(result)
      console.log(init)
      return result.root.children || []
    },
    async save(data: Hierarchy) {
      if (!confirm('本当にいい？')) return
      try {
        await window.electron.save(data)
        alert('保存しました')
      } catch (err) {
        alert(`保存失敗\n${err}`)
      }
    }
  }
})
</script>
