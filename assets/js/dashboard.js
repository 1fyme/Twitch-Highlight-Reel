"use strict";

//$(document).ready(function() {
	let queue = []; // ex.: number:2, type:"video", id:"419210531"}
	let tbodyQueue = document.getElementById("queue");
	let checkboxHeading = document.getElementById("heading");
  let queueItemCheckbox = document.getElementsByClassName("queueItem");
  let volumeSlider = document.getElementById("volumeSlider");
	let socket = io.connect("//", {secure: false, rejectUnauthorized: false});
  let snackbarContainer = document.querySelector("#snackbar");
  let volumeValue = document.getElementById("volumeValue");
  let hideShowOverlayButton = $("button#hide-show-overlay");
  let reloadOverlaysLink = $("a#reload-overlays");
  let reloadOverlaysButton = $("button#reload-overlays");
  let collectionIDValue = $("#cIDf1");
  let toggleProgressBarButton = $("button#toggleProgressBar");

	// Things do to when the dashboard loads
	$("button#removeItem").prop("disabled", true);
  volumeValue.innerHTML = volumeSlider.value + "%";

	// Functions
  function makeReadableDateString(dateIn) {
		let editedDateFormat = dateIn.slice(0, (dateIn.lastIndexOf("-") + 3)) + dateIn.slice((dateIn.lastIndexOf("-") + 3), dateIn.length);
    let date = new Date(editedDateFormat);
    let month = date.getMonth() + 1;
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    let dateString = "";
    if (month.toString().length < 2) {
    	month = "0" + month;
    }
    if (hours.toString().length < 2) {
    	hours = "0" + hours;
    }
    if (minutes.toString().length < 2) {
      minutes = "0" + minutes;
    }
    if (seconds.toString().length < 2) {
      seconds = "0" + seconds;
    }
    dateString = month + "/" + date.getDate() + "/" + date.getFullYear() + " " + hours + ":" + minutes + ":" + seconds;
    	return dateString;
    }
    function changeVolume(volume) {
    	volume *= 100;
  		volumeSlider.MaterialSlider.change(volume);
      volumeValue.innerHTML = volume.toFixed(0) + "%";
    }
    function checkboxEvent() {
        let isChecked = false;
				for (let i = 0; i < tbodyQueue.childNodes.length; i++) {
					if (tbodyQueue.childNodes[i].getElementsByTagName("td")[0].getElementsByTagName("input")[0].checked) {
						isChecked = true;
					}
				}
				if (tbodyQueue.childNodes[0].getElementsByTagName("td")[0].getElementsByTagName("input")[0].checked) {
					$("button#moveItemUp").prop("disabled", true);
				} else {
					$("button#moveItemUp").prop("disabled",  !isChecked || queue.length < 2);
				}
				if (tbodyQueue.childNodes[tbodyQueue.childNodes.length - 1].getElementsByTagName("td")[0].getElementsByTagName("input")[0].checked) {
					$("button#moveItemDown").prop("disabled", true);
				} else {
					$("button#moveItemDown").prop("disabled", !isChecked || queue.length < 2);
				}
				$("button#removeItem").prop("disabled", !isChecked);
    }
    function updateQueueTable() {
		if (tbodyQueue.childNodes.length > 0) {
			let numToRemove = tbodyQueue.childNodes.length;
			for (let i = 0; i < numToRemove; i++) {
				tbodyQueue.removeChild(tbodyQueue.childNodes[0]);
			}
		}
		for (let i = 0; i < queue.length; i++) {
			let tr = document.createElement("tr");
			let tdCheckbox = document.createElement("td");
			let input = document.createElement("input");
			let tdNumber = document.createElement("td");
			let tdType = document.createElement("td");
			let tdID = document.createElement("td");

			input.setAttribute("type", "checkbox");
			input.setAttribute("class", "queueItem");
			input.setAttribute("id", "checkbox-" + i);

			tdCheckbox.appendChild(input);

      queue[i].number = i;
			tdNumber.innerHTML = i;

			tdType.innerHTML = queue[i].type;
			tdID.innerHTML = queue[i].id;

			tr.setAttribute("id", i);
			tdNumber.setAttribute("class", "mdl-data-table__cell--non-numeric");
			tdType.setAttribute("class", "mdl-data-table__cell--non-numeric");
			tdID.setAttribute("class", "mdl-data-table__cell--non-numeric");

			tr.appendChild(tdCheckbox);
			tr.appendChild(tdNumber);
			tr.appendChild(tdType);
			tr.appendChild(tdID);

			tbodyQueue.appendChild(tr);

		}
		for (let i = 0; i < queue.length; i++) {
			queueItemCheckbox[i].addEventListener("click", checkboxEvent);
		}
		if (tbodyQueue.childNodes.length == 0) {
            checkboxHeading.checked = false;
        }
	}

	// Queue Controls
	$("input#heading").click(function() {
		if (checkboxHeading.checked == true) {
			for (let i = 0; i < tbodyQueue.childNodes.length; i++) {
				tbodyQueue.childNodes[i].getElementsByTagName("td")[0].getElementsByTagName("input")[0].checked = true;
			}
			if (tbodyQueue.childNodes.length > 0) {
				$("button#removeItem").prop("disabled", false);
			}
		} else {
			for (let i = 0; i < tbodyQueue.childNodes.length; i++) {
				tbodyQueue.childNodes[i].getElementsByTagName("td")[0].getElementsByTagName("input")[0].checked = false;
			}
			$("button#removeItem").prop("disabled", true);
		}
	});
	$("button#removeItem").click(function() {
		let queueLength = queue.length;
		let itemsToRemove = [];
		let newQueue = [];
		for (let i = 0; i < tbodyQueue.childNodes.length; i++) {
			if (tbodyQueue.childNodes[i].getElementsByTagName("td")[0].getElementsByTagName("input")[0].checked) {
				itemsToRemove.push(tbodyQueue.childNodes[i].getElementsByTagName("td")[1].innerText);
				queueItemCheckbox[0].removeEventListener("click", checkboxEvent);
			}
		}
		for (let i = 0; i < queue.length; i++) {
			newQueue.push({number: queue[i].number, type: queue[i].type, id: queue[i].id});
		}
		for (let i = 0; i < newQueue.length; i++) {
			for (let j = 0; j < itemsToRemove.length; j++) {
				if (newQueue[i].number == itemsToRemove[j]) {
					newQueue.splice(i, 1);
				}
			}
		}
		for (let i = 0; i < queueLength; i++) {
			queue.pop();
		}
		for (let i = 0; i < newQueue.length; i++) {
			queue.push({number: newQueue[i].number, type: newQueue[i].type, id: newQueue[i].id});
		}
				updateQueueTable();
				socket.emit("queue", queue);
		$("button#removeItem").prop("disabled", (queue.length == 0 && tbodyQueue.childNodes.length == 0));
	});
    $("button#moveItemUp").click(function() {
        let queueLength = queue.length;
        let itemsToMove = [];
        let newQueue = [];
        for (let i = 0; i < tbodyQueue.childNodes.length; i++) {
			if (tbodyQueue.childNodes[i].getElementsByTagName("td")[0].getElementsByTagName("input")[0].checked) {
				itemsToMove.push({number: tbodyQueue.childNodes[i].getElementsByTagName("td")[1].innerText, id: tbodyQueue.childNodes[i].getElementsByTagName("td")[3].innerText});
				queueItemCheckbox[0].removeEventListener("click", function() {
					let isChecked = false;
					for (let i = 0; i < queue.length; i++) {
						if (tbodyQueue.childNodes[i].getElementsByTagName("td")[0].getElementsByTagName("input")[0].checked) {
							isChecked = true;
						}
					}
				});
			}
		}
		for (let i = 0; i < queue.length; i++) {
			newQueue.push({number: queue[i].number, type: queue[i].type, id: queue[i].id});
		}
		for (let i = 0; i < newQueue.length; i++) {
			for (let j = 0; j < itemsToMove.length; j++) {
				if (newQueue[i].id == itemsToMove[j].id && newQueue[i].number == itemsToMove[j].number) {
					let itemToMove = newQueue.splice(i, 1);
                    newQueue.splice(i - 1, 0, itemToMove[0]);
				}
			}
		}
		for (let i = 0; i < queueLength; i++) {
			queue.pop();
		}
		for (let i = 0; i < newQueue.length; i++) {
			queue.push({number: newQueue[i].number, type: newQueue[i].type, id: newQueue[i].id});
		}
        updateQueueTable();
        socket.emit("queue", queue);
		$("button#removeItem").prop("disabled", (queue.length == 0 && tbodyQueue.childNodes.length == 0));
        for (let i = 0; i < queue.length; i++) {
            for (let j = 0; j < itemsToMove.length; j++) {
                if (tbodyQueue.childNodes[i].getElementsByTagName("td")[3].innerText == itemsToMove[j].id) {
                    setTimeout(function() {
                        tbodyQueue.childNodes[i].getElementsByTagName("td")[0].getElementsByTagName("input")[0].checked = true;
                        checkboxEvent();
                    }, 50);
                }
            }
        }
    });
    $("button#moveItemDown").click(function() {
			let queueLength = queue.length;
			let itemsToMove = [];
			let newQueue = [];
				for (let i = 0; i < tbodyQueue.childNodes.length; i++) {
			if (tbodyQueue.childNodes[i].getElementsByTagName("td")[0].getElementsByTagName("input")[0].checked) {
				itemsToMove.push({number: tbodyQueue.childNodes[i].getElementsByTagName("td")[1].innerText, id: tbodyQueue.childNodes[i].getElementsByTagName("td")[3].innerText});
				queueItemCheckbox[0].removeEventListener("click", function() {
					let isChecked = false;
					for (let i = 0; i < queue.length; i++) {
						if (tbodyQueue.childNodes[i].getElementsByTagName("td")[0].getElementsByTagName("input")[0].checked) {
							isChecked = true;
						}
					}
				});
			}
		}
		for (let i = 0; i < queue.length; i++) {
			newQueue.push({number: queue[i].number, type: queue[i].type, id: queue[i].id});
		}
		for (let i = newQueue.length - 1; i >= 0; i--) {
			for (let j = 0; j < itemsToMove.length; j++) {
				if (newQueue[i].id == itemsToMove[j].id && newQueue[i].number == itemsToMove[j].number) {
					let itemToMove = newQueue.splice(i, 1);
										newQueue.splice(i + 1, 0, itemToMove[0]);
				}
			}
		}
		for (let i = 0; i < queueLength; i++) {
			queue.pop();
		}
		for (let i = 0; i < newQueue.length; i++) {
			queue.push({number: newQueue[i].number, type: newQueue[i].type, id: newQueue[i].id});
		}
				updateQueueTable();
				socket.emit("queue", queue);
		$("button#removeItem").prop("disabled", (queue.length == 0 && tbodyQueue.childNodes.length == 0));
        for (let i = 0; i < queue.length; i++) {
            for (let j = 0; j < itemsToMove.length; j++) {
                if (tbodyQueue.childNodes[i].getElementsByTagName("td")[3].innerText == itemsToMove[j].id) {
                    setTimeout(function() {
                        tbodyQueue.childNodes[i].getElementsByTagName("td")[0].getElementsByTagName("input")[0].checked = true;
                        checkboxEvent();
                    }, 50);
                }
            }
        }
    });
	$("form#collectionIDForm").submit(function() {
		queue.push({number:queue.length, type:"collection", id:$("#collectionID").val()});
		$("#collectionID").val("");
		updateQueueTable();
        socket.emit("queue", queue);
		return false;
	});
	$("form#videoIDForm").submit(function() {
		queue.push({number:queue.length, type:"video", id:$("#videoID").val()});
		$("#videoID").val("");
		updateQueueTable();
        socket.emit("queue", queue);
		return false;
	});
	$("form#clipIDForm").submit(function() {
		queue.push({number:queue.length, type:"clip", id:$("#clipID").val()});
		$("#clipID").val("");
		updateQueueTable();
        socket.emit("queue", queue);
		return false;
	});
    socket.on("queue", function(queueArr) {
        for (let i = 0; i <= queue.length; i++) {
            queue.pop();
        }
        for (let i = 0; i < queueArr.length; i++) {
            queue[i] = queueArr[i];
        }
        updateQueueTable();
        
    });

    // Player Controls
    $("button#changeVolumeButton").click(function() {
        socket.emit("changeVolume", document.getElementById("volumeSlider").value / 100);
    });
	$("button#play").click(function() {
		socket.emit("play");
	});
	$("button#pause").click(function() {
		socket.emit("pause");
	});
    $("button#goBack5Sec").click(function() {
        socket.emit("goBack5Sec");
    });
	$("button#goToEndOfVid").click(function() {
		socket.emit("goToEndOfVid");
	});
	toggleProgressBarButton.click(function() {
		socket.emit("toggleProgressBar");
	})
    volumeSlider.oninput = function() {
        volumeValue.innerHTML = this.value + "%";
    }
	socket.on("progressBarIsVisible", function(progressBarIsVisible) {
		if (progressBarIsVisible) {
			toggleProgressBarButton.text("Hide Progress Bar");
		} else {
			toggleProgressBarButton.text("Show Progress Bar");
		}
	});
    socket.on("changeVolume", function(volumeIn) {
        changeVolume(volumeIn);
    });

    // Other Controls
    $(reloadOverlaysLink).click(function() {
        socket.emit("reload");
    });
    $(reloadOverlaysButton).click(function() {
        socket.emit("reload");
    });

    // Player Status
	socket.on("Twitch.Player.PAUSE", function() {
		$("button#play").removeClass("mdl-button--accent");
		$("button#play").removeClass("mdl-button--colored");
		$("button#pause").addClass("mdl-button--colored");
	});
	socket.on("Twitch.Player.PLAY", function() {
		$("button#play").addClass("mdl-button--accent");
	});
	socket.on("Twitch.Player.PLAYING", function() {
		$("button#play").removeClass("mdl-button--accent");
		$("button#play").addClass("mdl-button--colored");
		$("button#pause").removeClass("mdl-button--colored");
	});
    socket.on("Twitch.Player.ENDED", function() {
        $("button#play").removeClass("mdl-button--accent");
		$("button#play").removeClass("mdl-button--colored");
		$("button#pause").removeClass("mdl-button--colored");
    });
	socket.on("collection", function() {
		$("button#skipVidInCollection").prop("disabled", false);
	});
	socket.on("video", function() {
		$("button#skipVidInCollection").prop("disabled", true);
	});
	socket.on("clip", function() {
		$("button#skipVidInCollection").prop("disabled", true);
	});
//});
