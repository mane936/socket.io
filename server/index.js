const httpServer = require("http").createServer();
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "http://localhost:8080"
  }
});

const crypto = require("crypto");
const randomId = () => crypto.randomBytes(8).toString("hex");

const { InMemorySessionStore } = require("./sessionStore");
const sessionStore = new InMemorySessionStore();



io.use((socket, next) => {
  const sessionID = socket.handshake.auth.sessionID;
  if (sessionID) {
		const session = sessionS>tore.findSession(sessionID)
		if(session) {
			socket.sessionID = sessionID;
			socket.userID = session.userID;
			socket.username = session.username
			return next();
		}
  }

  const username = socket.handshake.auth.username;
  if (!username) {
    return next(new Error("invalid username"));
  }
	socket.sessionID = randomId();
	socket.userID = randomId();
  socket.username = username;
  next();

});


io.on("connection", socket => {
  // fetch existing users
  const users = [];
  for (let [id, socket] of io.of("/").sockets) {
    users.push({
      userID: id,
      username: socket.username
    });
  }
  socket.emit("users", users); // notify connecting user

  // notify existing users
  socket.broadcast.emit("user connected", {
    userID: socket.id,
    username: socket.username
  });

  // forward the private message to the right recipient
  socket.on("private message", ({ content, to }) => {
    socket.to(to).emit("private message", {
      content,
      from: socket.id
    });
  });

  // notify users upon disconnection
  socket.on("disconnect", () => {
    console.log("user disconnected");
    socket.broadcast.emit("user disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
