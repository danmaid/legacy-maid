<template>
  <div id="app">
    <div id="nav">
      <router-link tag="button" to="/treemap">preview treemap</router-link>
      <router-link tag="button" to="/build/hierarchy">階層インポート</router-link>
      <router-link tag="button" to="/build/items">アイテムインポート</router-link>
    </div>
    <router-view style="flex: 1 1 100%;" />
  </div>
</template>

<style>
body {
  margin: 0;
}
</style>

<style scoped>
#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>