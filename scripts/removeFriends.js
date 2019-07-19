/* START: FUNCTIONS */
function getRandomInt(min, max) {
	var min = Number(min);
	var max = Number(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getXMLHttp(requestMethod, requestUrl, callBack, formObject, getJSON, topOrigin) {
	if (topOrigin) {
		var messageHandler = function (thisEvent) {
			callBack(thisEvent.data);
			window.removeEventListener("message", messageHandler);
			temporaryScript.parentNode.removeChild(temporaryScript);
		};
		window.addEventListener("message", messageHandler);
		var temporaryScript = document.createElement("script");
		temporaryScript.innerHTML = `
            ${getXMLHttp.toString()}
            getXMLHttp("${requestMethod}", "${requestUrl}", function(targetData) {
                window.postMessage((!${((getJSON) ? true : false)}) ? {
                    "responseText": targetData.responseText
                } : targetData, "*");
            }, ${((formObject) ? JSON.stringify(formObject) : "{}")}, ${((getJSON) ? true : false)});
        `;
		document.body.appendChild(temporaryScript);
	} else {
		var xhttp = new XMLHttpRequest();
		if (requestMethod === "POST") {
			var formData = new FormData();
			var dataKeys = Object.keys(formObject);
			for (var i = 0; i < dataKeys.length; i++) formData.append(dataKeys[i], formObject[(dataKeys[i])]);
			xhttp.open("POST", requestUrl, true);
			xhttp.timeout = 2 * 60 * 1000;
			xhttp.send(formData);
		} else if (requestMethod === "GET") {
			xhttp.open("GET", requestUrl, true);
			xhttp.timeout = 2 * 60 * 1000;
			xhttp.send();
		}
		xhttp.onreadystatechange = function () {
			if (xhttp.readyState === 4 && xhttp.status === 200) {
				if (getJSON) callBack(JSON.parse(xhttp.responseText));
				else callBack(xhttp);
			}
		};
	}
}

function getXMLHttpSync(requestMethod, requestURL, formData) {
	xmlHttp = new XMLHttpRequest();
	xmlHttp.open(requestMethod, requestURL, false);
	if (requestMethod === "POST") {
		xmlHttp.send(formData);
		if (xmlHttp.readyState === 4 && xmlHttp.status === 200) return xmlHttp.response;
		else return false;
	} else if (requestMethod === "GET") {
		xmlHttp.send();
		if (xmlHttp.readyState === 4 && xmlHttp.status === 200) return xmlHttp.response;
		else return false;
	} else {
		console.error("Unknown request method.");
		return false;
	}
}

function removeFriend(profileId, callBack) {
	var timedOut = false,
		onTimeout = setTimeout(function () {
			timedOut = true;
			callBack();
		}, getRandomInt(2000, 2500));

	getXMLHttp("POST", "https://m.facebook.com/a/removefriend.php?friend_id=" + profileId + "&unref=bd_profile_button", function () { }, { "fb_dtsg": getXMLHttpSync("GET", "https://m.facebook.com/").split("name=\"fb_dtsg\" value=\"")[1].split("\"")[0] }, false, true);

	if (callBack && !timedOut) {
		clearTimeout(onTimeout);
		onTimeout = "";
		setTimeout(function () {
			callBack();
		}, getRandomInt(750, 3750));
	}

	chrome.storage.local.get([
		"inactiveList"
	], function (CS) {
		var inactiveList = CS["inactiveList"];
		for (var i = 0; i < inactiveList.length; i++) {
			if (Number(inactiveList[i].profileId) === Number(profileId)) {
				delete (inactiveList[i]);
				break;
			}
		}
		inactiveList = inactiveList.filter(Boolean);
		chrome.storage.local.set({
			"inactiveList": inactiveList
		});
	});
}

function removeFromList() {
	if (removeList.length !== 0) {
		removeFriend(removeList.pop(), function () {
			removeFromList();
		});
	} else {
		chrome.runtime.sendMessage({
			"notificationData": {
				"type": "basic",
				"iconUrl": "../icons/128.png",
				"title": (totalSelected - removeList.length) + " friend(s) removed!",
				"isClickable": false,
				"message": "Selected friend(s) removed successfuly."
			}
		});
		chrome.runtime.sendMessage({
			"closeWindow": true
		});
	}
}

/* MAIN */
removeFromList();

/* UI */
var fixedBox = document.createElement("div");
fixedBox.innerHTML = `
	<div style="margin: 15px 15px 0 15px;">Total friends to remove: <span ce-data-name="totalSelected">0</span></div>
	<div style="margin: 15px 15px 0 15px;">Friends removed: <span ce-data-name="friendsRemoved">0</span></div>

	<div style="text-align: center; margin: 3.5em 0;">
		<svg width="25%" height="20%" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" class="lds-rolling"><circle cx="50" cy="50" fill="none" ng-attr-stroke="{{config.color}}" ng-attr-stroke-width="{{config.width}}" ng-attr-r="{{config.radius}}" ng-attr-stroke-dasharray="{{config.dasharray}}" stroke="rgb(66, 103, 178)" stroke-width="10" r="35" stroke-dasharray="164.93361431346415 56.97787143782138" transform="rotate(180 50 50)"><animateTransform attributeName="transform" type="rotate" calcMode="linear" values="0 50 50;360 50 50" keyTimes="0;1" dur="1s" begin="0s" repeatCount="indefinite"></animateTransform></circle></svg>
	</div>

	<div style="margin: 15px 15px 0 15px;">Remaining: <span ce-data-name="totalRemaining">0</span></div>
`;
fixedBox.style = "font-family: initial; padding: 0; font-size: 1.25em; display: block; position: fixed; top: 0; left: 0; z-index: 100000; width: 100%; height: 150%; overflow: hidden; background: rgb(249, 250, 250); color: rgb(40, 62, 74);";
document.body.appendChild(fixedBox);
document.title = "The Social Blade";

var customScrollBar = document.createElement("style");
customScrollBar.innerHTML = "::-webkit-scrollbar { width: 0px; }";
document.head.appendChild(customScrollBar);

function updateList() {
	document.querySelector("[ce-data-name=\"totalSelected\"]").innerHTML = totalSelected;
	document.querySelector("[ce-data-name=\"friendsRemoved\"]").innerHTML = totalSelected - removeList.length;
	document.querySelector("[ce-data-name=\"totalRemaining\"]").innerHTML = removeList.length;
}
updateList();
setInterval(function () {
	updateList();
}, 1000);