import HistoryView from './HistoryView.vue'
import MapView from './MapView.vue'
import LoginView from './LoginView.vue'
import RoomView from './RoomView.vue'
import RoomViewHack from './RoomViewHack.vue'

const routes = [
  { 
    path: '/login', 
    component: LoginView,
    props: true 
  },
  { 
    path: '/map', 
    component: MapView, 
    meta: { requireAuth: true },
    props: true 
  },
  { 
    path: '/room/:room', 
    component: RoomView, 
    meta: { requireAuth: true },
    props: true 
  },
  { 
    path: '/history/:room', 
    component: HistoryView, 
    meta: { requireAuth: true },
    props: ({ query: { time }, params: { room } }) => ({ room, time: parseInt(time || '0') }) }
]

function ifAuthenticated() {
  if (!!localStorage.authToken) {
    next()
    return
  }
  next('/login')
}

function ifNotAuthenticated() {
  if (!localStorage.authToken) {
    next()
    return
  }
  next('/')
}

export default routes
