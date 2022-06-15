const express = require("express");
const path = require("path");
const http = require("http");
const app = express();
const bodyParser = require("body-parser");
const server = http.createServer(app);
const socketio = require("socket.io");
const Filter = require("bad-words");
const io = socketio(server);
const { addUser, removeUser, getUser, getUsersInRoom } = require("./users");
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../public")));
function generateMessage(username, text, createdAt) {
  return {
    text,
    createdAt,
    username,
  };
}

io.on("connection", (socket) => {
  let $user = {};
  socket.on("join", (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });

    error && callback(error);

    try {
      $user = user;
      socket.join(user.room);

      socket.emit(
        "message",
        generateMessage(
          "Moderator",
          `Welcome to ${user.room}`,
          new Date().getTime()
        )
      );
      socket
        .to(user.room)
        .broadcast.emit(
          "message",
          generateMessage(
            "Moderator",
            `${user.username} has joined`,
            new Date().getTime()
          )
        );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    } catch (error) {
      callback("Username is taken");
    }
    callback();
  });
  socket.on("sendMessage", (message, callback) => {
    const filter = new Filter();

    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed");
    }
    io.to($user.room).emit(
      "message",
      generateMessage($user.username, message, new Date().getTime())
    );
    callback();
  });
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage(
          "Moderator",
          `${user.username} has left`,
          new Date().getTime()
        )
      );
    }
  });
  socket.on("sendLocation", (coords, callback) => {
    const loc = `https://google.com/maps?q=${coords.latitude},${coords.longitude}`;
    socket.to($user.room).broadcast.emit(
      "message",
      generateMessage(
        $user.username,
        `
     <a target="_blank" href="${loc}">see location</a>
     `,
        new Date().getTime()
      )
    );
    callback();
  });
});

server.listen(process.env.PORT || 3000);
