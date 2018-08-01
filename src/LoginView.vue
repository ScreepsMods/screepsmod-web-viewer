<template>
	<v-layout align-center justify-center>
    <v-flex xs12 sm8 md4>
    	<v-form class="login" v-model="valid" @submit.prevent="login">
        <v-card>
          <v-toolbar color="primary">
            <v-toolbar-title>Login</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
      			<v-text-field
      				v-model="username"
      				label="Username"
      				required
      			></v-text-field>
      			<v-text-field
      				v-model="password"
      				label="Password"
      				required
      			></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" type="submit">Login</v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
    </v-flex>
	</v-layout>
</template>
<script>
export default {
  props: ['redirect'],
  data() {
    return {
      username: '',
      password: '',
      valid: false
    }
  },
  methods: {
    async login () {
      const { username, password } = this
      const { token } = await this.$api.auth(username, password)
      if (token) localStorage.authToken = token
      this.$router.push(this.redirect || '/map')
    }
  }
}
</script>
<style>
	
</style>