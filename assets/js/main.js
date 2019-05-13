let socket = io.connect("//", {secure: false, rejectUnauthorized: false});
let playingType = null; // collection, video, or clip

// hide verbose information and controls for testing
var hideDebug = true;

let queue = [];
var soundFadeIn = -1;
var soundFadeOut = -1;

// collection IDs to play through
var collections = ["RvuGzpeNeRWEQQ", "506ho6ONeRWxZg"];

// variable to keep track of collections played so far
var collectionIndex = 0;
let queueIndex = 0;

// options for the Twitch player
var options = {
	width: 1920,
	height: 1080,
	//collection: collections[collectionIndex],
	video: "",
	controls: false
};

var maxVolume = 0.25;

var playerDiv = document.getElementById("playerDiv");
var player = {};
var bDiv = document.getElementById("b");
var cDiv = document.getElementById("c");
var dDiv = document.getElementById("d");
var eDiv = document.getElementById("e");
var fDiv = document.getElementById("f");
var gDiv = document.getElementById("g");
var hDiv = document.getElementById("h");
var iDiv = document.getElementById("i");
var playerProgressDiv = document.getElementById("playerProgress");
var clipProgressDiv = document.getElementById("clipProgress");
var jumpButton = document.getElementById("jump");
var changeCollectionButton =
    document.getElementById("changeCollection");
var collectionInput = document.getElementById("collection");
var video = document.getElementById("clip");

function soundFadeInFunc() {
	var beforeFadeVol = player.getVolume();
	var soundFadeIn = setInterval(function() {
		console.log("VOD Player volume: " + player.getVolume());
		if (player.getVolume() < maxVolume) {
			player.setVolume(player.getVolume() + (maxVolume / 20));
		} else {
			clearInterval(soundFadeIn);
		}
	}, 100);
}

function soundFadeOutFunc() {
	var beforeFadeVol = player.getVolume();
	var soundFadeOut = setInterval(function() {
		console.log("VOD Player volume: " + player.getVolume());
		if (player.getVolume() > 0) {
			player.setVolume(player.getVolume() - (beforeFadeVol / 20));
		} else {
			clearInterval(soundFadeOut);
		}
	}, 100);
}

function next() {
    iDiv.innerHTML = "Playback Status: Ended";
    socket.emit("Twitch.Player.ENDED");
    // setTimeout(function() {
        console.log("continuing...");
        if (playingType == null) {
            if (queueIndex < queue.length) {
          switch (queue[queueIndex].type) {
              case "collection":
							player = new Twitch.Player("playerDiv", options);
                  player.setCollection(queue[queueIndex].id);
                  playingType = "collection";
									player.addEventListener(Twitch.Player.PLAYING, function() {
									  playerDiv.style.opacity = 1;
									  iDiv.innerHTML = "Playback Status: Playing"
									  soundFadeInFunc();
									});
									player.addEventListener(Twitch.Player.ENDED, function() {
										document.getElementById("playerDiv").removeChild(document.getElementById("playerDiv").childNodes[1]);
										console.log("calling next");
										playingType = null;
										next();
									});

									player.addEventListener(Twitch.Player.PLAY, function() {
										socket.emit("Twitch.Player.PLAY");
										socket.emit(playingType);
									});

									player.addEventListener(Twitch.Player.PLAYING, function() {
										socket.emit("Twitch.Player.PLAYING");
										socket.emit(playingType);
									});

									player.addEventListener(Twitch.Player.PAUSE, function() {
										socket.emit("Twitch.Player.PAUSE");
										socket.emit(playingType);
									});
                break;
            case "video":
						player = new Twitch.Player("playerDiv", options);
						console.log(playingType);
						console.log(queue[queueIndex].type);
                player.setVideo("v" + queue[queueIndex].id, 0);
								console.log("video here" + queue[queueIndex].id);
                playingType = "video";
								player.addEventListener(Twitch.Player.PLAYING, function() {
								  playerDiv.style.opacity = 1;
								  iDiv.innerHTML = "Playback Status: Playing"
								  soundFadeInFunc();
								});
								player.addEventListener(Twitch.Player.ENDED, function() {
									document.getElementById("playerDiv").removeChild(document.getElementById("playerDiv").childNodes[1]);
									console.log("calling next");
									playingType = null;
									next();
								});

								player.addEventListener(Twitch.Player.PLAY, function() {
									socket.emit("Twitch.Player.PLAY");
									socket.emit(playingType);
								});

								player.addEventListener(Twitch.Player.PLAYING, function() {
									socket.emit("Twitch.Player.PLAYING");
									socket.emit(playingType);
								});

								player.addEventListener(Twitch.Player.PAUSE, function() {
									socket.emit("Twitch.Player.PAUSE");
									socket.emit(playingType);
								});
                break;
            case "clip":
                let counter = 0;
                // TODO: Embedding a clip is different than embedding a live stream or VOD. The embedded clips player uses a different set of query parameters and does not support the JavaScript interactive embed.
                console.log("clip");
                const Http = new XMLHttpRequest();
                const url='https://clips.twitch.tv/api/v1/clips/' + queue[queueIndex].id + '/status';
                Http.open("GET", url);
                Http.send();
                Http.onreadystatechange=(e)=>{
                    if (counter === 0) {
                        console.log(JSON.parse(Http.responseText).quality_options[0].source);
                        let clip = document.createElement("video");
                        clip.setAttribute("id", "clip");
                        clip.setAttribute("width", "1920");
                        clip.setAttribute("height", "1080");
                        clip.setAttribute("src", JSON.parse(Http.responseText).quality_options[0].source);
                        document.getElementById("clipDiv").appendChild(clip);
												video = document.getElementById("clip");
                        video.volume = 0;
                        video.oncanplay = function() {
                            document.getElementById("playerDiv").opacity = 0;
                            clipDiv.style.opacity = 1;
                            video.play();
                            playingType = "clip";
                            var beforeFadeVol = video.volume;
                            var soundFadeIn = setInterval(function() {
                                if (video.volume < maxVolume) {
                                    video.volume = (video.volume + (maxVolume / 20));
                                } else {
                                    clearInterval(soundFadeIn);
                                }
                            }, 100);
                        };
                        video.onended = function() {
													document.getElementById("clipDiv").removeChild(document.getElementById("clipDiv").childNodes[1]);
									        playingType = null;
													console.log("ended");
													next();
												};
												video.onplay = function() {
													console.log("play");
													socket.emit("Twitch.Player.PLAY");
													socket.emit(playingType);
												};

												video.onpause = function() {
													console.log("paused");
													socket.emit("Twitch.Player.PAUSE");
													socket.emit(playingType);
												};

												video.onplaying = function() {
													console.log("playing");
													socket.emit("Twitch.Player.PLAYING");
													socket.emit(playingType);
												};
                        counter += 1;
                    }
                }
                break;
        }
        queueIndex += 1;
			} else if (queueIndex >= queue.length) {
				queueIndex = 0;
				next();
			}
        }
  // }, 2000);
}

if (hideDebug) {
  document.getElementById("debug").style.display = "none";
}

setInterval(function() {
  fDiv.innerHTML = "Collection ID: " + options.collection;
	if (playingType !== "clip" && playingType !== null)
  gDiv.innerHTML = "Video ID: " + player.getVideo();
}, 5000);

// Update video player progress bar and debug information
setInterval(function() {
	if (playingType !== "clip" && playingType !== null) {
	 playerProgressDiv.style.transform = "scaleX(" + (player.getCurrentTime() / player.getDuration()) + ")";
	 bDiv.innerHTML = "Duration: " + player.getDuration().toFixed(0) + " sec";
	 cDiv.innerHTML = "Current Time: " + player.getCurrentTime().toFixed(0) + " sec";
	 dDiv.innerHTML = "Fade transition is active: " + (player.getCurrentTime().toFixed(0) == player.getDuration() - 1);
	 eDiv.innerHTML = "Volume: " + (player.getVolume() * 100).toFixed(0) + "%";
	 hDiv.innerHTML = "Video Quality: " + player.getQuality();
	 // TRANSITION TO NEXT COLLECTION/VIDEO/CLIP
	 if (player.getCurrentTime().toFixed(0) == player.getDuration().toFixed(0) - 1) {
		 clipDiv.style.opacity = 0;
	   playerDiv.style.opacity = 0;
	 }
	 if (player.getCurrentTime().toFixed(0) == player.getDuration().toFixed(0) - 2) {
		 soundFadeOutFunc();
	 }
 } else if (playingType == "clip") {
		 clipProgressDiv.style.transform = "scaleX(" + (video.currentTime / video.duration) + ")";
		 if (video.currentTime.toFixed(0) == video.duration.toFixed(0) - 1) {
				clipDiv.style.opacity = 0;
				playerDiv.style.opacity = 0;
				playingType = null;
		}
		console.log("Clip player volume: " + video.volume);
		 if (video.currentTime.toFixed(0) == video.duration.toFixed(0) - 2) {
				var beforeFadeVol = video.volume.toFixed(2);
				var soundFadeOut = setInterval(function() {
						if (playingType == "clip" && video.volume > 0) {
								video.volume = video.volume - (beforeFadeVol / 20);
						} else {
								clearInterval(soundFadeOut);
						}
				}, 100);
		}
 }
}, 100);

// BUTTON: Jump to 5 seconds before video ends
jumpButton.onclick = function() {
  player.seek(player.getDuration() - 5);
};

// BUTTON: Hide player/video, fade out sound, and
// tell player to show a different collection of videos
changeCollectionButton.onclick = function() {
	// TRANSITION TO NEXT COLLECTION/VIDEO/CLIP
	clipDiv.style.opacity = 0;
	playerDiv.style.opacity = 0;
	progresssDiv.style.opacity = 0;
	soundFadeOutFunc();
	setTimeout(function() {
		player.setCollection(collectionInput.value);
		options.collection = collectionInput.value;
		playingType = "collection";
	}, 1000);
};

socket.on("setVolume", function(volume) {
	maxVolume = volume;
});

socket.on("changeVolume", function(volume) {
	maxVolume = volume;
	if (playingType !== "clip" && playingType !== null) {
    player.setVolume(volume);
	}
    if (video !== null) {
        video.volume = volume;
    }
});

socket.on("play", function() {
	if (playingType == "clip") {
		video.play();
	} else {
		player.play();
	}
});

socket.on("pause", function() {
	if (playingType == "clip") {
		video.pause();
	} else {
		player.pause();
	}
});

socket.on("goBack5Sec", function() {
    player.seek(player.getCurrentTime() - 5);
});

socket.on("goToEndOfVid", function() {
    if (playingType == "clip") {
        video.currentTime = video.duration - 5;
    } else {
			player.seek(player.getDuration() - 5);
		}
});

socket.on("progressBarIsVisible", function(progressBarIsVisible) {
	if (progressBarIsVisible) {
		playerProgressDiv.style.opacity = 0.5;
		clipProgressDiv.style.opacity = 0.5;
	} else {
		playerProgressDiv.style.opacity = 0;
		clipProgressDiv.style.opacity = 0;
	}
});

socket.on("reload", function() {
  location.reload(true);
});

socket.on("queue", function(queueArr) {
    for (let i = 0; i <= queue.length; i++) {
        queue.pop();

    }
    for (let i = 0; i < queueArr.length; i++) {
        queue[i] = queueArr[i];

    }
		if (queue.length === 0) {
			queueIndex = 0;
		}
    if (playingType === null) {
        next();
    }
});

// TODO: Change to accept other collections, videos, and
//       clips in a queue.
// Check to see if the player is not showing anything else
// after three seconds. If it still isn't showing anything
// after three seconds, then check for another collection to
// show; switch to that collection, if possible.
