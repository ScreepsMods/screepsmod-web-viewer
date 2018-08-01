<template>
	<div>
		<input v-model="room"><button @click="connect()">Connect</button>
		<panContainer class="fillArea" @wheel="wheel">
			<render-engine :users="users" :objects="objects" :terrain="terrain" :gameTime="gameTime" :style="{ width: (zoom * 100) + 'px', height: (zoom * 100) + 'px' }"></render-engine>			
		</panContainer>
	</div>
</template>
<script>
	import renderEngine from './RenderEngine.vue'
	import panContainer from './PanContainer.vue'
	export default {
		components: {
			renderEngine,
			panContainer
		},
		props: ['room'],
		data () {
			return {
				users: {},
				objects: [],
				terrain: [],
				gameTime: 0,
				zoom: 3,
				width: 300,
				height: 300,
				es: null
			}
		},
		watch: {
			room (val) {
				if(val.match(/^[EW]\d+[NS]\d+$/)) {
					this.connect()
				}
			}
		},
		methods: {
			wheel (e) {
				console.log(e.deltaY)
				if(e.deltaY > 0) {
          this.zoom--
        }
        if(e.deltaY < 0) {
          this.zoom++
        }
        this.zoom = Math.min(Math.max(this.zoom, 2), 10)
			},
			connect () {
        if(this.es) {
          try {
            this.es.close()
          } catch(e) {}
        }
        let es = this.es = new EventSource(`http://swc.screepspl.us:21025/api/stream/room?room=${this.room}`)
        es.addEventListener('terrain', (data) => {
					let types = ['plain', 'wall', 'swamp', 'wall']
          let terrain = data.data.split('').map((v, i) => ({
            x: i % 50,
            y: Math.floor(i / 50),
            type: types[v]
          }))
          this.terrain = terrain
        })
        es.addEventListener('users', (data) => {
          data = JSON.parse(data.data)
          let dat = {
            "2":{"_id":"2","username":"Invader","badgeUrl":"https://screeps.com/api/user/badge-svg?username=Invader"},
            "3":{"_id":"3","username":"Source Keeper","badgeUrl":"https://screeps.com/api/user/badge-svg?username=Source%20Keeper"},
          }
          data.forEach(user => { 
            dat[user._id] = user 
            Object.defineProperty(user, 'badgeUrl', {
              get () {
                return `http://swc.screepspl.us:21025/api/user/badge-svg?username=${this.username}`
              },
              set (v) {

              }
            })
          })
          this.users = dat
        })
        es.addEventListener('gameTime', (data) => {
          this.gameTime = JSON.parse(data.data)
        })
        es.addEventListener('objects', (data) => {
          data = JSON.parse(data.data)
          this.objects = data
        })
      }
		}
	}
</script>
<style>
	.fillArea {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
	}
</style>