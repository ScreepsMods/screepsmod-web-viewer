<template>
	<div class="fillArea fill-height">
    <panContainer class="fill-height flex noSelect" @wheel="wheel" @position="setPosition" @dragend="loadPosition">
      <router-link class="mapRoom noSelect" ondragstart="return false" :to="`/room/${room.name}`" v-for="room in rooms" :style="{ top: `${room.y}px`, left: `${room.x}px` }" :data-room="room.name">
        <img class="noSelect" draggable="false" :src="url(room.name)">
      </router-link>
      <canvas ref="overlay" class="roomOverlay noClick noSelect" draggable="false" width="1000" height="1000"></canvas>
      <img class="mapRoom noClick noSelect badge" :data-room="room.name" draggable="false" :src="badge(room.own.user)" :class="`level${room.own.level}`" v-if="room.own" v-for="room in rooms" :style="{ top: `${room.y}px`, left: `${room.x}px` }">
    </panContainer>
    <!-- <div style="position: absolute; top: 50px;">{{ mapPosition }} {{ debug }}</div> -->
	</div>
</template>
<script>
	import panContainer from './PanContainer.vue'
  import { roomNameFromXY, roomNameToXY } from './utils'
  import Vue from 'vue'

  import randomColor from 'randomcolor'
  import seedrandom from 'seedrandom'

  const ROOM_SIZE = 150
  const colors = {
    2: '#FF9600', // invader
    3: '#FF9600', // source keeper
    w: '#000000', // wall
    r: '#3C3C3C', // road
    pb: '#FFFFFF', // powerbank
    p: '#00C8FF', // portal
    s: '#FFF246', // source
    m: '#AAAAAA', // mineral
    c: '#505050', // controller
    k: '#640000' // keeperLair
  }

  function getColor (identifier) {
    if (!colors[identifier]) {
      Math.seedrandom(identifier);
      const seed = Math.random().toString();
      colors[identifier] = randomColor({
        luminosity: 'bright',
        seed
      })
    }
    return colors[identifier]
  }

	export default {
		components: {
			panContainer
		},
		data () {
			return {
        debug: {},
        roomToView: 'E1S1',
				zoom: 0,
        overlays: {},
        rooms: {},
        users: {},
        mapPosition: { x: 0, y: 0 },
        overlayCanvas: null
			}
		},
    async mounted () {
      this.overlayCanvas = this.$refs.overlay
      this.$api.socket.on('roomMap2', this.roomMap2)
      this.loadPosition()
    },
    async created () {
    },
    destroyed () {
      for(const room of Object.values(this.rooms)) {
        if (room.subscribed) {
          this.$api.socket.unsubscribe(`roomMap2:${room.name}`)
          room.subscribed = false
        }
      }
      this.$api.socket.removeListener('roomMap2', this.roomMap2)
    },
    unmounted () {
      for(const room of Object.values(this.rooms)) {
        if (room.subscribed) {
          this.$api.socket.unsubscribe(`roomMap2:${room.name}`)
          room.subscribed = false
        }
      }
      this.$api.socket.removeListener('roomMap2', this.roomMap2)
    },
    computed: {
      subscribed() {
        return Object.values(this.rooms)
          .filter(r => r.subscribed)
          .map(r => r.name)
      },
      host () {
        const { protocol, hostname, port } = this.$api.opts
        return `${protocol}://${hostname}:${port}`
      }
    },
    methods: {
      url (room) {
        return `/assets/map/${room}.png`
      },
      badge (userid) {
        return `/api/user/badge-svg?username=${this.users[userid].username}`
      },
      setPosition (pos) {
        this.mapPosition = pos
      },
      roomMap2 ({ id, data }) {
        if (!this.rooms[id]) {
          this.$api.socket.unsubscribe(`roomMap2:${id}`)
        }
        this.renderRoomOverlay(this.rooms[id], data)
      },
      renderRoomOverlay(room, roomData) {
        // const canvas = document.createElement('canvas')
        const canvas = this.overlayCanvas
        const ctx = canvas.getContext('2d')
        ctx.save()
        ctx.translate(room.x, room.y)
        ctx.clearRect(0, 0, ROOM_SIZE, ROOM_SIZE)
        ctx.scale(3,3)
        for (const k in roomData) {
          ctx.fillStyle = getColor(k)
          ctx.beginPath()
          for (const [x,y] of roomData[k]) {
            ctx.rect(x,y,1,1)
          }
          ctx.fill()
        }
        ctx.restore()
      },
      async loadPosition() {
        if (!this.$api.socket.connected) {
          await this.$api.socket.connect()
        }
        const { x, y } = this.mapPosition
        const rx = Math.floor(x / ROOM_SIZE)
        const ry = Math.floor(y / ROOM_SIZE)
        const name = roomNameFromXY(rx, ry)
        this.roomToView = `https://server1.screepspl.us/assets/map/${name}.png`
        const width = window.innerWidth
        const height = window.innerHeight
        const roomWidth =  Math.ceil(width / ROOM_SIZE) + 4
        const roomHeight =  Math.ceil(height / ROOM_SIZE) + 4
        const centerX = Math.floor(roomWidth / 2) + 10
        const centerY = Math.floor(roomHeight / 2) + 10
        const rooms = []
        this.debug = {
          rx, ry, roomWidth, roomHeight, name, rooms: []
        }
        for (let ix = rx - 1; ix < rx + roomWidth; ix++) {
          for (let iy = ry - 1; iy < ry + roomHeight; iy++) {
            const name = roomNameFromXY(ix,iy)
            rooms.push(name)
          }  
        }
        if (rooms.length) {
          const tofind = rooms.filter(r => !this.rooms[r])
          console.log(`Fetching ${tofind}`)
          const { stats, users } = await this.$api.raw.game.mapStats(tofind, 'shard0', 'owner0')
          for (const [room, { status, own }] of Object.entries(stats)) {
            const [rx, ry] = roomNameToXY(room)
            Vue.set(this.rooms, room, {
              name: room,
              status, 
              own,
              x: rx * ROOM_SIZE,
              y: ry * ROOM_SIZE,
              rx, ry
            })
          }
          for (const user in users) {
            this.users[user] = users[user]
          }
          const canvas = this.overlayCanvas
          let maxX = 0
          let maxY = 0
          Object.values(this.rooms).forEach(room => {
            maxX = Math.max(maxX, room.x)
            maxY = Math.max(maxY, room.y)
          })
          const ctx = canvas.getContext('2d')
          const imgdata = ctx.getImageData(0, 0, canvas.width, canvas.height)
          canvas.width = maxX + ROOM_SIZE
          canvas.height = maxY + ROOM_SIZE
          ctx.putImageData(imgdata, 0, 0)
        }
        this.debug.subscribed = []
        for(const room of Object.values(this.rooms)) {
          const event = `roomMap2:${room.name}`
          if (room.subscribed && !rooms.includes(room.name)) {
            // console.log(`unsubscribe ${event}`)
            this.$api.socket.unsubscribe(`roomMap2:${room.name}`)
            room.subscribed = false
          }
          if (!room.subscribed && rooms.includes(room.name) && room.status === 'normal') {
            // console.log(`subscribe ${event}`)
            this.$api.socket.subscribe(`roomMap2:${room.name}`)
            room.subscribed = true
          }
          if (room.subscribed) {
            this.debug.subscribed.push(room.name)
          }
        }
      },
      wheel (e) {
        console.log(e.deltaY)
        if(e.deltaY > 0) {
          this.zoom--
        }
        if(e.deltaY < 0) {
          this.zoom++
        }
        this.zoom = Math.min(Math.max(this.zoom, 2), 10)
      }
		}
	}
</script>
<style>
  .noClick {
    pointer-events: none;
  }
  .noSelect {
    user-select: none;
  }
  .noDrag {
    user-drag: none;
    --webkit-user-drag: none;
  }
	.fillArea {
    display:  flex;
    max-width: 100%;
    padding: 0;
    width: 100%;
    flex: 1 1 100%;
	}
  .mapRoom {
    position: absolute;
  }
  .roomOverlay {
    position: absolute;
    top: 0px;
    left: 0px;
    /* right: 0; */
    /* bottom: 0; */
  }
  .badge {
    width: 150px;
    opacity: 0.7;
  }
  .badge.level0 {
    width: 50px;
    margin: 50px;
    opacity: 0.4;
  }
  .badge.level1 {
    width: 58px;
    margin: 46px;
  }
  .badge.level2 {
    width: 64px;
    margin: 43px;
  }
  .badge.level3 {
    width: 70px;
    margin: 40px;
  }
  .badge.level4 {
    width: 76px;
    margin: 37px;
  }
  .badge.level5 {
    width: 82px;
    margin: 34px;
  } 
  .badge.level6 {
    width: 88px;
    margin: 31px;
  }
  .badge.level7 {
    width: 94px;
    margin: 28px;
  }
  .badge.level8 {
    width: 100px;
    margin: 25px;
  }
</style>