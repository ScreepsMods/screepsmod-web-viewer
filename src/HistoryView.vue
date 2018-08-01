<template>
	<div>
		<div layout="column">
			<div>
				<!-- <input v-model="room"> -->
				<h1>{{ room }}</h1>
				<v-btn @click="tick++"><v-icon>arrow-right</v-icon></v-btn>
				<v-btn @click="togglePlay">Play/Pause</v-btn>
			</div>
			<div>
				<v-slider v-model="tick" thumb-label ticks :min="gameTime - 10000" :max="gameTime"></v-slider>
			</div>
			<div>
				<v-slider v-model="speed" thumb-label ticks step="10" :min="100" :max="5000"></v-slider>
			</div>
			<panContainer class="" @wheel="wheel">
				<render-engine :users="users" :objects="objects" :terrain="terrain" :gameTime="tick" :badgeUrl="badgeUrl" :speed="1000/speed" :style="{ width: (zoom * 100) + 'px', height: (zoom * 100) + 'px' }"></render-engine>
			</panContainer>
		</div>
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
		props: ['room','time'],
		data () {
			return {
				users: {},
				objects: [],
				terrain: [],
				gameTime: 0,
				zoom: 6,
				es: null,
				tick: 0,
				cache: {},
				speed: 1000,
				play: false,
				lastTick: 0,
				badgeUrl: '/api/user/badge-svg?username=%1'
			}
		},
		created(){
			this.update(true)
			// this.$api.opts.url = 'https://server1.screepspl.us:21025'
		},
		watch: {
			time(val) {
				this.tick = val
			},
			room (val) {
				if(val.match(/^[EW]\d+[NS]\d+$/)) {					
					this.update(true)
				}
			},
			tick (val) {
				this.update()
			}
		},
		methods: {
			togglePlay() {
				this.play = !this.play
				if(this.play) {
					this.inctick()
				}
			},
			inctick() {
				this.tick++
				if(this.play) setTimeout(() => this.inctick(), this.speed)
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
			},
			getHistory (tick) {
				let base = tick - (tick % 20)
				return Promise.resolve(this.cache['history:'+base] || this.$api.history(this.room, tick))
					.then(data => {
						this.cache['history:'+base] = data
						return data
					})
			},
			getUser (id) {
				// console.log('getUser', id)
				return Promise.resolve(this.cache['user:'+id] || this.$api.raw.user.findById(id))
					.then(({user}) => user)
					.then(data => {
						this.cache['user:'+id] = data
						return data
					})
			},
			async getTick (tick) {
				tick = tick || this.tick || this.gameTime
				if(tick === this.lastTick) return
				this.lastTick = tick
				let data = await this.getHistory(tick)
				if(!data || !data.ticks) return
		
				let objects = {}
				for(let i = data.base; i <= tick; i++) {
					for(let oid in data.ticks[i]) {
						if (data.ticks[i][oid]) {
							objects[oid] = objects[oid] || {}
							Object.assign(objects[oid], data.ticks[i][oid])
						} else {
							delete objects[oid]
						}
					}
				}
				objects = Object.entries(objects).map(([,e]) => e)
				let ids = {}
				objects.forEach(o => {
					if(o.user) ids[o.user] = true
				})
				ids = Object.keys(ids)
				// this.objects = []
				// this.users = {}
				console.log('ids', tick, ids)
				for (let id of ids) {
					this.users[id] = this.users[id] || await this.getUser(id)
				}

				this.objects = objects
			},
			async getTime() {
				if(this.gameTime) return
				let res = await this.$api.raw.game.time()
				this.gameTime = res.time
			},
			async getTerrain() {
				let res = await this.$api.raw.game.roomTerrain(this.room)
				let types = ['plain', 'wall', 'swamp', 'wall']
				let terrain = res.terrain[0].terrain.split('').map((v, i) => ({
          x: i % 50,
          y: Math.floor(i / 50),
          type: types[v]
        }))
        this.terrain = terrain
			},
			async update(reset) {
				if(reset) {
					this.cache = {}
					this.terrain = []
				}				
				if(!this.terrain || !this.terrain.length) this.getTerrain()
				this.getTime()
				this.getTick()
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