<template>
  <h1>socket.io</h1>
  <SelectUsername
    v-if="!usernameAlreadySelected"
    @text-input="onUsernameSelection"
  />
  <Chat v-else />
</template>

<script>
import SelectUsername from "./components/SelectUsername.vue";
import Chat from "./components/Chat.vue";
import socket from "./socket";

export default {
  name: "App",
  components: {
    SelectUsername,
    Chat
  },
  data() {
    return {
      usernameAlreadySelected: false
    };
  },
  methods: {
    onUsernameSelection(username) {
      console.log("Triggered ", username);
      this.usernameAlreadySelected = true;
      socket.auth = { username };
      socket.connect();
    }
  },
  created() {
    socket.on("connect_error", err => {
      if (err.message === "invalid username") {
        this.usernameAlreadySelected = false;
      }
    });
  },
  unmounted() {
    socket.off("connect_error");
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
