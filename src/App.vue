<template>
  <div id="app">
    <div id="nav">
      <router-link to="/treemap">treemap</router-link>
      <router-link to="/build/hierarchy">hierarchy</router-link>
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
