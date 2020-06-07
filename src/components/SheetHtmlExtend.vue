<template>
  <div class="sheet-html-extend">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
    mounted() {
        console.log('mounted')
        console.log(this.$el.querySelector('table'))
    }
})
</script>