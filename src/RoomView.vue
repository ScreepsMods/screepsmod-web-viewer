<template>
	<div>
		<panContainer class="fillArea" @wheel="wheel">
			<render-engine 
				:users="users" 
				:objects="objects" 
        :terrain="terrain" 
        :gameTime="gameTime" 
        :style="{ width: (zoom * 100) + 'px', height: (zoom * 100) + 'px' }"></render-engine>			
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
				lastRoom: '',
				users: {},
        cachedObjects: {},
				objects: [],
				terrain: [],
				gameTime: 0,
				zoom: 6,
				width: 300,
				height: 300,
				es: null
			}
		},
		watch: {
			room (val) {
				if(val.match(/^[EW]\d+[NS]\d+$/)) {
					this.setRoom(val)
				}
			}
		},
    created () {
			this.$api.socket.on('room', this.update)
    },
    mounted () {
			this.setRoom(this.room)
		},
		beforeDestroy () {
      this.$api.socket.unsubscribe(`room:${this.room}`)
			this.$api.socket.removeListener('room', this.update)
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
			async setRoom (room) {
				if (!this.$api.socket.connected) {
					await this.$api.socket.connect()
				}
				if (this.lastRoom) {
          this.$api.socket.unsubscribe(`room:${this.lastRoom}`)
        }
				this.lastRoom = room
        let { terrain: [{ terrain } = {}] = [] } = await this.$api.raw.game.roomTerrain(room)
        let types = ['plain', 'wall', 'swamp', 'wall']
        this.terrain = terrain.split('').filter(t => t).map((v, i) => ({
          x: i % 50,
          y: Math.floor(i / 50),
          type: types[v]
        }))
        this.users = {}
        this.$api.socket.subscribe(`room:${room}`)
			},
			update ({ data: { gameTime, info, objects, users = {}, visual } = {} }) {
        this.gameTime = gameTime
        for (let k in users) {
          this.users[k] = users[k]
        }
        for (const [id,diff] of Object.entries(objects)) {
          const cobj = this.cachedObjects[id] = this.cachedObjects[id] || {}
          if (diff) {
            Object.assign(cobj, diff)
          } else {
            delete this.cachedObjects[id]
          }
        }
        this.objects = Object.entries(this.cachedObjects).map(([,e]) => e)
        // this.objects = Object.keys(objects).map(k=>objects[k])
				// data.forEach(user => { 
    //       dat[user._id] = user 
    //       Object.defineProperty(user, 'badgeUrl', {
    //         get () {
    //           return `http://swc.screepspl.us:21025/api/user/badge-svg?username=${this.username}`
    //         },
    //         set (v) {

    //         }
    //       })
    //     })
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