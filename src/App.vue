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
      this.usernameAlreadySelected = true;
      socket.auth = { username };
      socket.connect();
    }
  },
  created() {
	const sessionID = localStorage.getItem("sessionID");

	if(sessionID) {
		this.usernameAlreadySelected = true;
		socket.auth = { sessionID };
		socket.connect();
	}

	// whether already a session or username, the server will always return a sessionID and userID.
	socket.on("session", ({ sessionID, userID }) => {
		// attach the sessionID to the next recconnection attempts
		socket.auth = { sessionID };
		// store it in th elocalStorage
		localStorage.setItem("sessionID", sessionID);
		// save the ID of the user
		socket.userID = userID;
	})

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
