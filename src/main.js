import Vue from 'vue'
import App from './App.vue'
import VueRouter from 'vue-router'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.css'
import axios from 'axios'
import { ScreepsAPI, Socket } from 'screeps-api'
import URL from 'url'
import routes from './routes'

Vue.use(VueRouter)
Vue.use(Vuetify)

const api = Vue.prototype.$api = new ScreepsAPI()

api.socket.subscribe = async function subscribe (path) {
  const self = this //.$api.socket
  if (!path) return
  if (!self.api.user) { await self.api.me() }
  if (!path.match(/^(\w+):(.+?)$/)) { path = `user:${self.api.user._id}/${path}` }
  if (self.authed) {
    self.send(`subscribe ${path}`)
  } else {
    self.__subQueue.push(`subscribe ${path}`)
  }
  self.emit('subscribe', path)
  self.__subs[path] = self.__subs[path] || 0
  self.__subs[path]++
}

api.socket.unsubscribe = async function unsubscribe (path) {
  const self = this //.$api.socket
  if (!path) return
  if (!self.api.user) { await self.api.me() }
  if (!path.match(/^(\w+):(.+?)$/)) { path = `user:${self.api.user._id}/${path}` }
  self.send(`unsubscribe ${path}`)
  self.emit('unsubscribe', path)
  if (self.__subs[path]) self.__subs[path]--
}

api.raw.history = function history (room, tick, shard = 'shard0') {
  let self = api
  if (self.isOfficialServer()) {
    tick -= tick % 100
    return self.req('GET', `/room-history/${shard}/${room}/${tick}.json`)
  } else {
    tick -= tick % 20
    return self.req('GET', `/room-history`, { room, time: tick })
  }
}

api.req = async function req (method, path, body = {}) {
  console.log(method, path, body)
  let opts = {
    baseURL: this.opts.url,
    url: path,
    method,
    headers: {
      'X-Token': localStorage.authToken,
      'X-Username': localStorage.authToken
    },
    validateStatus (status) {
      return true
    }
  }
  if (method === 'GET') {
    opts.params = body
  }
  if (method === 'POST') {
    opts.data = body
  }
  let res = await axios.request(opts)
  if (res.status === 401) {
    if (this.__authed) {
      this.__authed = false
      await this.auth(this.opts.email, this.opts.password)
    } else {
      throw new Error('Not Authorized')
    }
  }
  let token = res.headers['x-token']
  if (token) {
    this.emit('token', token)
  }
  this.emit('response', res)
  res = res.data
  if (!res.ok) {
    throw new Error(res.data)
  }
  if (typeof res.data === 'string' && res.data.slice(0, 3) === 'gz:') {
    res.data = await this.gz(res.data)
  }
  return res
}

api.setServer({
  hostname: location.hostname,
  port: parseInt(location.port),
  protocol: location.protocol.slice(0,-1)
})

api.on('token', token => {
  localStorage.authToken = token
})

var EventBus = new Vue()

// Add to Vue properties by exposing a getter for $bus
Object.defineProperties(Vue.prototype, {
  eventBus: {
    get: function () {
      return EventBus
    }
  }
})

const router = new VueRouter({
  routes
})

router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requireAuth) && !localStorage.authToken) {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  } else {
    next() // make sure to always call next()!
  }
})

new Vue({
  el: '#app',
  render: h => h(App),
  router
})
