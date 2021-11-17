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

const { InMemoryMessageStore } = require("./messageStore");
const messageStore = new InMemoryMessageStore();

io.use((socket, next) => {
  // if user sends sessionID fetch it.
  console.log("happened middleware");
  const sessionID = socket.handshake.auth.sessionID;
  console.log("sessionID: ", sessionID);
  if (sessionID) {
    const session = sessionStore.findSession(sessionID);
    if (session) {
      console.log("sessionID happened: ", session);

      socket.sessionID = sessionID;
      socket.userID = session.userID;
      socket.username = session.username;
      return next();
    }
  }

  // otherwise just get username and set new sessionID and userID
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
  //persist session
  // the sessionID, userID, username come from the middleware
  // always save a session, if exist it will just update the connected status.
  sessionStore.saveSession(socket.sessionID, {
    userID: socket.userID,
    username: socket.username,
    connected: true
  });

  // emit session details
  socket.emit("session", {
    sessionID: socket.sessionID,
    userID: socket.userID
  });

  //join the userID room
  socket.join(socket.userID);

  //
  //  // fetch existing users (old, without persisten user session)
  //  const users = [];
  //  for (let [id, socket] of io.of("/").sockets) {
  //    users.push({
  //      userID: id,
  //      username: socket.username
  //    });
  //  }
  //  socket.emit("users", users); // notify connecting user

  // fetch existing users (with persistent session)

  const users = [];
  const messagesPerUser = new Map();

  messageStore.findMessagesForUser(socket.userID).forEach(message => {
    console.log("messageFound: ", message);
    const { from, to } = message;
    const otherUser = socket.userID === from ? to : from;
    if (messagesPerUser.has(otherUser)) {
      messagesPerUser.get(otherUser).push(message);
    } else {
      messagesPerUser.set(otherUser, [message]);
    }
  });

  console.log("messagesPerUser: ", messagesPerUser);

  sessionStore.findAllSessions().forEach(session => {
    users.push({
      userID: session.userID,
      username: session.username,
      connected: session.connected,
      messages: JSON.stringify(messagesPerUser.get(session.userID)) || '[]'
    });
  });

  console.log("users to emit: ", users);

  socket.emit("users", users);

  // notify existing users
  socket.broadcast.emit("user connected", {
    userID: socket.userID,
    username: socket.username,
    connected: true,
    messages: '[]'
  });

  //	// old way (without persistent users)
  //  // forward the private message to the right recipient
  //  socket.on("private message", ({ content, to }) => {
  //    socket.to(to).emit("private message", {
  //      content,
  //      from: socket.id
  //    });
  //  });

  // new way
  // forward the private message to the right recipient (and other tabs of the sender)
  socket.on("private message", ({ content, to }) => {
    const message = {
      content,
      from: socket.userID,
      to
    };
    socket
      .to(to)
      .to(socket.userID)
      .emit("private message", message);
    messageStore.saveMessage(message);
  });

  // notify users upon disconnection
  socket.on("disconnect", async () => {
    console.log("user disconnected");
    const matchingSockets = await io.in(socket.userID).allSockets();
    // Note: we could also have used the io.of("/").sockets object, like in part I, but the allSockets() method also works with multiple Socket.IO servers, which will be useful when scaling up.
    const isDisconnected = matchingSockets.size === 0;
    if (isDisconnected) {
      // notify other users
      socket.broadcast.emit("user disconnected", socket.userID);
      // update the connection status of the session
      sessionStore.saveSession(socket.sessionID, {
        userID: socket.userID,
        username: socket.username,
        connected: false
      });
    }

    socket.broadcast.emit("user disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
