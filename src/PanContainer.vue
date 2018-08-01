<template>
  <div class="outer" @mousedown="mousedown" @mouseup="mouseup" @mousemove="mousemove">
  	<div class="inner" :style="{ top: top + 'px', left: left + 'px' }">
  		<slot></slot>
  	</div>
  </div>
</template>
<script>
  export default {
    data() {
    	return {
    		top: 0,
    		left: 0,
    		mp: [0,0],
    		drag: false,
    		down: false
    	}
    },
    methods: {
    	mousedown (e) {
    		this.down = true
    		this.drag = false
    		this.mp = [e.clientX, e.clientY]
    	},
    	mouseup (e) {
    		this.down = false
          if(this.drag) {
            e.preventDefault()
            e.stopPropagation()
            this.drag = false
            this.$emit('dragend', { x: -this.left, y: -this.top })
          }
    	},
    	mousemove (e) {
    		if (!this.down) return
    		let [ox, oy] = this.mp
    		let [nx, ny] = [e.clientX, e.clientY]
    		let [dx, dy] = [nx - ox, ny - oy]
    		let d = Math.max(dx, dy)
    		if (Math.abs(d) > 5) this.drag = true
    		if (this.drag) {
    			this.top += dy
    			this.left += dx
    			this.mp = [nx, ny]
    		}
        this.$emit('position', { x: -this.left, y: -this.top })
    	}
    }
  }
</script>
<style>
	.outer {
		overflow: hidden;
	}
	.inner {
		position: relative;
		top: 0;
		left: 0;
	}
</style>