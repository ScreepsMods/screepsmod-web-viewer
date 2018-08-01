<template>
	<div class="renderEngineContainer"></div>
</template>
<script>
export default {
	props: ['terrain','objects','users','gameTime','speed','badgeUrl'],
	data() {
		return {
			started: false,
			renderer: null,
			lastTick: 0,
			view: null
		}
	},
	computed: {
		secondsPerTick(){
			return this.speed || 1
		}
	},
	watch: {
		terrain (terrain) {
			if (this.renderer && terrain) {
				this.renderer.setTerrain(terrain)
			}
		},
		objects (objects) {
			if (this.renderer) {
				this.applyState()
			}
		},
		users (users) {
			if (this.renderer) {
				this.applyState()
			}
		},
		gameTime (gameTime) {
			if (this.renderer) {
				this.applyState()
			}
		}
	},
	mounted() {
	  this.attachView();
  	this.eventBus.$on('resize', this.resizeView);
  	window.addEventListener('resize', () => this.resizeView());
	},
  updated() {
  	
  },
  beforeDestroy() {
    this.eventBus.$off('resize', this.resizeView);
    window.removeEventListener('resize', () => this.resizeView());
    if (this.renderer) {
    	this.renderer.release()
    }
  },
  methods: {
  	attachView() {
  		this.createRenderer();
	  	this.resizeView();
  	},
  	resizeView() {
  		if (this.renderer) {
  			console.log(this.$el.offsetWidth, this.$el.offsetHeight)
	  		this.renderer.resize({ width: this.$el.offsetWidth, height: this.$el.offsetHeight });
	  	}
  	},
    applyState () {
    	if(this.gameTime === this.lastTick) return
    	this.lastTick = this.gameTime
      let dur = Math.max(this.secondsPerTick, .1)
      if (this.started && this.renderer) {
        setTimeout(() => {
          this.renderer.applyState({
            objects: this.objects || [],
            users: this.users || {},
            gameTime: this.gameTime || 0
          }, dur)
        },1)
      }
    },
		createRenderer() {
      let rescaleResources = ["creep-npc", "flag", "flag-secondary", "powerBank", "extractor", "controller", "controller-level", "constructedWall", "nuker", "nuker-border", "link", "link-border", "extension-border50", "extension-border100", "extension-border200", "lab", "terminal-border", "terminal-arrows", "bodyPartBar", "tower-base", "storage", "storage-border"]
      let worldConfigs = {
        CELL_SIZE: 100,
        ATTACK_PENETRATION: 10,
        VIEW_BOX: 5e3,
        RENDER_SIZE: {
          width: 2048,
          height: 2048
        },        
        metadata: RENDERER_METADATA,
        gameData: {
          player: {},
          showFlags: true,
          showFlagsNames: true,
          showCreepSpeech: true,
          showMyNames: true,
          showEnemyNames: true,
          swampTexture: true
        },
        BADGE_URL: this.badgeUrl || '/api/user/badge-svg?username=%1',
        lighting: true,
        forceCanvas: false,
        debug: true
      };
      console.log(worldConfigs)
      const RENDERER_RESOURCES = {
        "bodyPartBar": "res/bodyPartBar.svg?bust=1530120071349",
        "constructedWall": "res/constructedWall.svg?bust=1530120071349",
        "controller-level": "res/controller-level.svg?bust=1530120071349",
        "controller": "res/controller.svg?bust=1530120071349",
        "cover": "res/cover.svg?bust=1530120071349",
        "creep-mask": "res/creep-mask.png?bust=1530120071349",
        "creep-npc": "res/creep-npc.svg?bust=1530120071349",
        "exit-bottom": "res/exit-bottom.svg?bust=1530120071349",
        "exit-left": "res/exit-left.svg?bust=1530120071349",
        "exit-right": "res/exit-right.svg?bust=1530120071349",
        "exit-top": "res/exit-top.svg?bust=1530120071349",
        "extension-border100": "res/extension-border100.svg?bust=1530120071349",
        "extension-border200": "res/extension-border200.svg?bust=1530120071349",
        "extension-border50": "res/extension-border50.svg?bust=1530120071349",
        "extension": "res/extension.svg?bust=1530120071349",
        "extractor": "res/extractor.svg?bust=1530120071349",
        "flag-secondary": "res/flag-secondary.svg?bust=1530120071349",
        "flag": "res/flag.svg?bust=1530120071349",
        "flare1": "res/flare1.png?bust=1530120071349",
        "flare2": "res/flare2.png?bust=1530120071349",
        "glow": "res/glow.png?bust=1530120071349",
        "ground-mask": "res/ground-mask.png?bust=1530120071349",
        "ground": "res/ground.png?bust=1530120071349",
        "lab-highlight": "res/lab-highlight.svg?bust=1530120071349",
        "lab-mineral": "res/lab-mineral.svg?bust=1530120071349",
        "lab": "res/lab.svg?bust=1530120071349",
        "link-border": "res/link-border.svg?bust=1530120071349",
        "link-energy": "res/link-energy.svg?bust=1530120071349",
        "link": "res/link.svg?bust=1530120071349",
        "noise1": "res/noise1.png?bust=1530120071349",
        "noise2": "res/noise2.png?bust=1530120071349",
        "nuke": "res/nuke.svg?bust=1530120071349",
        "nuker-border": "res/nuker-border.svg?bust=1530120071349",
        "nuker": "res/nuker.svg?bust=1530120071349",
        "powerBank": "res/powerBank.svg?bust=1530120071349",
        "rampart": "res/rampart.svg?bust=1530120071349",
        "rectangle": "res/rectangle.svg?bust=1530120071349",
        "storage-border": "res/storage-border.svg?bust=1530120071349",
        "storage": "res/storage.svg?bust=1530120071349",
        "tbd": "res/tbd.svg?bust=1530120071349",
        "terminal-arrows": "res/terminal-arrows.svg?bust=1530120071349",
        "terminal-border": "res/terminal-border.svg?bust=1530120071349",
        "terminal-highlight": "res/terminal-highlight.svg?bust=1530120071349",
        "terminal": "res/terminal.svg?bust=1530120071349",
        "tombstone-border": "res/tombstone-border.svg?bust=1530120071349",
        "tombstone-resource": "res/tombstone-resource.svg?bust=1530120071349",
        "tombstone": "res/tombstone.svg?bust=1530120071349",
        "tough": "res/tough.svg?bust=1530120071349",
        "tower-base": "res/tower-base.svg?bust=1530120071349",
        "tower-rotatable": "res/tower-rotatable.svg?bust=1530120071349"
      }

      for (let k in RENDERER_RESOURCES) {
      	let [name] = RENDERER_RESOURCES[k].match(/[a-z0-9-]+\.[a-z]{3}/i)
        RENDERER_RESOURCES[k] = require('./res/' + name)
      }
      let view = this.$el
      GameRenderer.compileMetadata(RENDERER_METADATA)
      let renderer = new GameRenderer({
        size: {
          width: view.offsetWidth,
          height: view.offsetHeight
        },
        autoFocus: false,
        resourceMap: RENDERER_RESOURCES,
        rescaleResources,
        worldConfigs,
        onGameLoop: function() {},
        countMetrics: true,
        fitToWorld: {
          width: 50,
          height: 50
        },
        backgroundColor: 0x555555,
        debug: true
      })
      renderer.debug = true
      PIXI.loader.resources = {}
      renderer.init(view).then((t) => {
        this.started = true
        this.applyState()
        this.renderer = renderer
        if (this.terrain && this.terrain.length) {
			    this.renderer.setTerrain(this.terrain)
		    }
      })
		}
	}
}
</script>
<style>
.renderEngineContainer {
  width: 100%;
  height: 100%;
}
</style>