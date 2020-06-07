<template>
  <div class="preview-hierarchy">
    <template v-if="value">
      <div>{{ rootData }}</div>
      <el-tree :data="value.children" default-expand-all>
        <template #default="{ data: { children, ...data } }">
          <div>{{ data }}</div>
        </template>
      </el-tree>
    </template>
    <div v-else>データがありません</div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Tree } from 'element-ui'

Vue.use(Tree)

export default Vue.extend({
  props: {
    value: {
      type: Object,
      default: undefined
    }
  },
  computed: {
    rootData() {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { children, ...data } = this.value
      return data
    }
  }
})
</script>