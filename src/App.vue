<template>
  <v-app dark>
    <v-toolbar fixed app :clipped-left="clipped">
      <v-toolbar-title v-text="title"></v-toolbar-title>
      <v-spacer></v-spacer>
      <!-- <v-btn href="#/room/E5S3">Live</v-btn> -->
      <!-- <v-btn href="#/history/E5S3">History</v-btn> -->
      <v-btn href="#/map">Map</v-btn>
    </v-toolbar>
    <v-content>
      <v-container fluid fill-height style="padding: 0">
        <v-slide-y-transition mode="out-in">
          <router-view></router-view>
        </v-slide-y-transition>
      </v-container>
    </v-content>
    <v-navigation-drawer
      temporary
      :right="right"
      v-model="rightDrawer"
      fixed
    >
      <v-list>
        <v-list-tile @click.native="right = !right">
          <v-list-tile-action>
            <v-icon>compare_arrows</v-icon>
          </v-list-tile-action>
          <v-list-tile-title>Switch drawer (click me)</v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>
  </v-app>
</template>

<script>
  import axios from 'axios'
  import roomViewHack from './RoomViewHack.vue'

  export default {
    components: {
      roomViewHack
    },
    data () {
      return {
        clipped: false,
        drawer: false,
        fixed: false,
        items: [
          { icon: 'bubble_chart', title: 'Inspire' }
        ],
        miniVariant: false,
        right: true,
        rightDrawer: false,
        title: 'Screeps Client',
        timeInterval: 0
      }
    },
    created: function () {
      const self = this
      if (localStorage.authToken) {
        this.$api.token = localStorage.authToken
      }
      axios.interceptors.response.use(async (res) => {
        if (res.status === 401 && res.config && !res.config.__isRetryRequest) {
          // if you ever get an unauthorized, logout the user
          delete localStorage.authToken
          // you can also redirect to /login if needed !
          try {
            await this.$api.auth()
            res.config.__isRetryRequest = true
            return axios.request(res.config)
          } catch (e) {}
          if (self.$router.currentRoute.path !== '/login') {
            self.$router.push({ path: '/login', query: { redirect: self.$router.currentRoute.path }})
          }
        }
        return res
      });
      this.$api.me()
      this.timeInterval = setInterval(() => {
        if (localStorage.authToken) {
          this.$api.raw.game.time()
        }
      }, 10000)
    },
    beforeDestroyed () {
      clearInterval(this.timeInterval)
    }
  }
</script>
