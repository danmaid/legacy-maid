<template>
  <div id="app">
    <div id="nav">
      <router-link to="/build/hierarchy">階層インポート</router-link>
      <router-link to="/treemap">preview treemap</router-link>
    </div>
    <router-view />
  </div>
</template>

<style>
#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>
