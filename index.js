var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

let maxVolume = 0.25; // percentage, as a decimal (0.0 - 1.0)
let progressBarIsVisible = true;
let playerStatus = "";
let queue = [];

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/assets/html/main.html');
});

app.get('/dashboard', function(req, res) {
  res.sendFile(__dirname + '/assets/html/dashboard.html');
});

app.get('/main.css', function(req, res) {
	res.sendFile(__dirname + '/assets/css/main.css');
});

app.get('/dashboard.css', function(req, res) {
	res.sendFile(__dirname + '/assets/css/dashboard.css');
});

app.get('/main.js', function(req, res) {
	res.sendFile(__dirname + '/assets/js/main.js');
});

app.get('/dashboard.js', function(req, res) {
	res.sendFile(__dirname + '/assets/js/dashboard.js');
});

app.get('/socket.io-2.2.0.js', function(req, res) {
	res.sendFile(__dirname + '/assets/js/socket.io-2.2.0.js');
});

app.get('/jquery-3.3.1.min.js', function(req, res) {
	res.sendFile(__dirname + '/assets/js/jquery-3.3.1.min.js');
});

io.on('connection', function(socket) {
	// Send maxVolume on connection
	io.emit("changeVolume", maxVolume);

	// Send progressBarIsVisible on connection
	io.emit("progressBarIsVisible", progressBarIsVisible);

    // Send queue on connection
    io.emit("queue", queue);

	// Send player status on connection
	io.emit(playerStatus);

    // Queue Controls
    socket.on("queue", function(queueArr) {
			let queueLength = queue.length;
			let queueArrLength = queueArr.length;
        for (let i = 0; i <= queueLength; i++) {
            queue.pop();
        }
        for (let i = 0; i < queueArrLength; i++) {
            queue[i] = queueArr[i];
        }
        io.emit("queue", queue);
    });

	// Player Controls
	socket.on("changeVolume", function(volume) {
		maxVolume = volume;
		io.emit("changeVolume", maxVolume);
    });
	socket.on("play", function() {
		io.emit("play");
	});
	socket.on("pause", function() {
		io.emit("pause");
	});
    socket.on("goBack5Sec", function() {
        io.emit("goBack5Sec");
    });
	socket.on("goToEndOfVid", function() {
		io.emit("goToEndOfVid");
	});
	socket.on("toggleProgressBar", function() {
		if (progressBarIsVisible) {
			progressBarIsVisible = false;
		} else {
			progressBarIsVisible = true;
		}
		io.emit("progressBarIsVisible", progressBarIsVisible);
	});

    // Other Controls
	socket.on("reload", function() {
		io.emit("reload");
	})

    // Player Status
	socket.on("Twitch.Player.PAUSE", function() {
		playerStatus = "Twitch.Player.PAUSE";
		io.emit("Twitch.Player.PAUSE");
	});
	socket.on("Twitch.Player.PLAY", function() {
		playerStatus = "Twitch.Player.PLAY";
		io.emit("Twitch.Player.PLAY");
	});
	socket.on("Twitch.Player.PLAYING", function() {
		playerStatus = "Twitch.Player.PLAYING";
		io.emit("Twitch.Player.PLAYING");
	});
    socket.on("Twitch.Player.ENDED", function() {
        playerStatus = "Twitch.Player.ENDED";
        io.emit("Twitch.Player.ENDED");
});
    // Playback Type Information
	socket.on("collection", function() {
		io.emit("collection");
	});
	socket.on("video", function() {
		io.emit("video");
	});
	socket.on("clip", function() {
		io.emit("clip");
	});
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});
