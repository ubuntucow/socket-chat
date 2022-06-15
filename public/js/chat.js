const socket = io();
$message = $("#message");

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});
$("#send").on("submit", (e) => {
  e.preventDefault();
  if ($message.val() === "") return;

  $("#send button").prop("disabled", true);

  socket.emit("sendMessage", $message.val(), (msg) => {
    $("#send button").prop("disabled", false);
    msg ? $("#messages").append(`<li>${msg}</li>`) : "";
  });
  $message.focus();
  $message.val("");
});

const autoscroll = () => {
  // get last message
  const $newMessage = document.getElementById("messages");

  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
  const visibleHeight = $newMessage.offsetHeight;
  const containerHeight = document.getElementById("messages").scrollHeight;
  const scrollOffset = $newMessage.scrollTop + visibleHeight;
  if (containerHeight - newMessageHeight <= scrollOffset) {
    document.getElementById("messages").scrollTop =
      document.getElementById("messages").scrollHeight;
  }
};

socket.on("message", (message) => {
  $("#messages").append(
    `<li class="message"> <b class="messsage__name">
    ${message.username}</b>
    <p class="message__meta">${moment(message.createdAt).format("HH:mm")}</p>
    ${message.text}
    </li>`
  );
  autoscroll();
});

$("#locationbtn").click(() => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        $("#messages").append(`<li class="message"> <b class="messsage__name">
        Moderator</b>
        <p class="message__meta">${moment(new Date().getTime()).format(
          "HH:mm"
        )}</p>
        Location sent
        </li>`);
      }
    );
  });
  autoscroll();
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});

socket.on("roomData", ({ room, users }) => {
  $(".room-title").text(room);
  users.forEach((user) => {
    $(".users").append(`<li>${user.username}</li>`);
  });
});
