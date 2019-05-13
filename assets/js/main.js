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
var player = new Twitch.Player("playerDiv", options);
var bDiv = document.getElementById("b");
var cDiv = document.getElementById("c");
var dDiv = document.getElementById("d");
var eDiv = document.getElementById("e");
var fDiv = document.getElementById("f");
var gDiv = document.getElementById("g");
var hDiv = document.getElementById("h");
var iDiv = document.getElementById("i");
var progressDiv = document.getElementById("progress");
var jumpButton = document.getElementById("jump");
var changeCollectionButton =
    document.getElementById("changeCollection");
var collectionInput = document.getElementById("collection");

function soundFadeInFunc() {
	var beforeFadeVol = player.getVolume();
	var soundFadeIn = setInterval(function() {
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
		if (player.getVolume() > 0) {
			player.setVolume(player.getVolume() - (beforeFadeVol / 20));
		} else {
			clearInterval(soundFadeOut);
		}
	}, 100);
}

function next() {
    if (playingType == "clip") {
        document.getElementById("playerDiv").removeChild(document.getElementById("playerDiv").childNodes[1]);
        playingType = null;
    }
    console.log("NEXT!");
    iDiv.innerHTML = "Playback Status: Ended";
    socket.emit("Twitch.Player.ENDED");
    //setTimeout(function() {
        console.log("continuing...");
        if (player.getEnded() === true || playingType == null) {
            if (queueIndex < queue.length) {
          switch (queue[queueIndex].type) {
              case "collection":
                  player.setCollection(queue[queueIndex].id);
                  playingType = "collection";
                break;
            case "video":
                player.setVideo("v" + queue[queueIndex].id, 0);
                playingType = "video";
                break;
            case "clip":
                console.log("i am right here now");
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
                        document.getElementById("playerDiv").appendChild(clip);
                        document.getElementById("clip").volume = 0;
                        document.getElementById("clip").oncanplay = function() {
                            document.getElementById("playerDiv").style.opacity = 1;
                            document.getElementById("clip").style.opacity = 1;
                            document.getElementById("clip").play();
                            playingType = "clip";
                            var beforeFadeVol = document.getElementById("clip").volume;
                            var soundFadeIn = setInterval(function() {
                                if (document.getElementById("clip").volume < maxVolume) {
                                    document.getElementById("clip").volume = (document.getElementById("clip").volume + (maxVolume / 20));
                                } else {
                                    clearInterval(soundFadeIn);
                                }
                            }, 100);
                        }
                        document.getElementById("clip").onended = next;
                        counter += 1;
                    }
                }
                break;
        }
        queueIndex += 1;
        }
        }
  //}, 3000);
}

if (hideDebug) {
  document.getElementById("debug").style.display = "none";
}
player.setVolume(0);

player.addEventListener(Twitch.Player.PLAYING, function() {
  playerDiv.style.opacity = 1;
  iDiv.innerHTML = "Playback Status: Playing"
  soundFadeInFunc();
});

setInterval(function() {
  fDiv.innerHTML = "Collection ID: " + options.collection;
  gDiv.innerHTML = "Video ID: " + player.getVideo();
}, 5000);

// Update video player progress bar and debug information
setInterval(function() {
 progressDiv.style.transform = "scaleX(" + (player.getCurrentTime() / player.getDuration()) + ")";
 bDiv.innerHTML = "Duration: " + player.getDuration().toFixed(0) + " sec";
 cDiv.innerHTML = "Current Time: " + player.getCurrentTime().toFixed(0) + " sec";
 dDiv.innerHTML = "Fade transition is active: " + (player.getCurrentTime().toFixed(0) == player.getDuration() - 1);
 eDiv.innerHTML = "Volume: " + (player.getVolume() * 100).toFixed(0) + "%";
 hDiv.innerHTML = "Video Quality: " + player.getQuality();
 // TRANSITION TO NEXT COLLECTION/VIDEO/CLIP
 if (player.getCurrentTime().toFixed(0) == player.getDuration().toFixed(0) - 1) {
   playerDiv.style.opacity = 0;
 }
 if (player.getCurrentTime().toFixed(0) == player.getDuration().toFixed(0) - 2) {
	 soundFadeOutFunc();
 }
 if (playingType == "clip") {
     progressDiv.style.transform = "scaleX(" + (document.getElementById("clip").currentTime / document.getElementById("clip").duration) + ")";
     if (document.getElementById("clip").currentTime.toFixed(0) == document.getElementById("clip").duration.toFixed(0) - 1) {
        document.getElementById("clip").style.opacity = 0;
        playerDiv.style.opacity = 0;
    }
    console.log(document.getElementById("clip").volume);
     if (document.getElementById("clip").currentTime.toFixed(0) == document.getElementById("clip").duration.toFixed(0) - 2) {
        var beforeFadeVol = document.getElementById("clip").volume;
        var soundFadeOut = setInterval(function() {
            if (playingType == "clip" && document.getElementById("clip").volume > 0) {
                document.getElementById("clip").volume = document.getElementById("clip").volume - (beforeFadeVol / 20);
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
	playerDiv.style.opacity = 0;
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
    player.setVolume(volume);
    if (document.getElementById("clip") !== null) {
        document.getElementById("clip").volume = volume;
    }
});

socket.on("play", function() {
	player.play();
});

socket.on("pause", function() {
	player.pause();
});

socket.on("goBack5Sec", function() {
    player.seek(player.getCurrentTime() - 5);
});

socket.on("goToEndOfVid", function() {
	player.seek(player.getDuration() - 5);
    if (playingType == "clip") {
        document.getElementById("clip").currentTime = document.getElementById("clip").duration - 5;
    }
});

socket.on("progressBarIsVisible", function(progressBarIsVisible) {
	if (progressBarIsVisible) {
		progressDiv.style.opacity = 0.5;
	} else {
		progressDiv.style.opacity = 0;
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
    if (playingType === null) {
        if (queueIndex < queue.length) {
            switch (queue[queueIndex].type) {
                case "collection":
                    console.log("Playing a collection with ID: " + queue[queueIndex].id);
                    player.setCollection(queue[queueIndex].id);
                    playingType = "collection";
                    break;
                case "video":
                    console.log("Playing a video with ID: " + queue[queueIndex].id);
                    player.setVideo("v" + queue[queueIndex].id, 0);
                    playingType = "video";
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
                            document.getElementById("playerDiv").appendChild(clip);
                            document.getElementById("clip").volume = 0;
                            document.getElementById("clip").oncanplay = function() {
                                document.getElementById("playerDiv").style.opacity = 1;
                                document.getElementById("clip").style.opacity = 1;
                                document.getElementById("clip").play();
                                playingType = "clip";
                                var beforeFadeVol = document.getElementById("clip").volume;
                                var soundFadeIn = setInterval(function() {
                                    if (document.getElementById("clip").volume < maxVolume) {
                                        document.getElementById("clip").volume = (document.getElementById("clip").volume + (maxVolume / 20));
                                    } else {
                                        clearInterval(soundFadeIn);
                                    }
                                }, 100);
                            }
                            document.getElementById("clip").onended = next;
                            counter += 1;
                        }
                    }
                    break;
            }
            queueIndex += 1;
        }
    } else if (queueIndex === 0) {
        switch (queue[queueIndex].type) {
                case "collection":
                    console.log("Playing a collection with ID: " + queue[queueIndex].id);
                    player.setCollection(queue[queueIndex].id);
                    playingType = "collection";
                    break;
                case "video":
                    console.log("Playing a video with ID: " + queue[queueIndex].id);
                    player.setVideo("v" + queue[queueIndex].id, 0);
                    playingType = "video";
                    break;
                case "clip":
                    // TODO: Embedding a clip is different than embedding a live stream or VOD. The embedded clips player uses a different set of query parameters and does not support the JavaScript interactive embed.
                    break;
            }
            queueIndex += 1;
    } else if (queue.length === 0) {
        queueIndex = 0;
    }
});

// TODO: Change to accept other collections, videos, and
//       clips in a queue.
// Check to see if the player is not showing anything else
// after three seconds. If it still isn't showing anything
// after three seconds, then check for another collection to
// show; switch to that collection, if possible.
player.addEventListener(Twitch.Player.ENDED, next);

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
