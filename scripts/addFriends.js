/* START: FUNCTIONS */
function getRandomInt(min, max) {
	var min = Number(min);
	var max = Number(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

var getFacebookId = function (URL) {
	var FacebookId = (Number(URL.split("?id=").pop().split("&")[0])) ? URL.split("?id=").pop().split("&")[0] : URL.split("facebook.com/").pop().split("?")[0].split("/")[0];
	return FacebookId;
}

function getXMLHttp(requestMethod, requestUrl, callBack, formObject, getJSON) {
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
		if (xhttp.readyState === 4 && xhttp.status === 200 && callBack) {
			if (getJSON) callBack(JSON.parse(xhttp.responseText));
			else callBack(xhttp);
		}
	};
}

function isEnglish(charSet) {
	return (charSet.match(/[^\x00-\x7F]+/)) ? false : true;
}

function getUserData(userId, callBack) {
	getXMLHttp("GET", "https://m.facebook.com/" + userId, function (xhttp) {
		var profileData = xhttp.responseText;
		var userAddress = "", userState = "", addLink = "", mutualFriend = false;
		if (profileData.indexOf(`From <strong><span class="unlinkedTextEntity">`) !== -1) userAddress = profileData.split(`From <strong><span class="unlinkedTextEntity">`)[1].split(`</span>`)[0].trim();
		else if (profileData.indexOf(`Lives in <strong><span class="unlinkedTextEntity">`) !== -1) userAddress = profileData.split(`Lives in <strong><span class="unlinkedTextEntity">`)[1].split(`</span>`)[0].trim();
		if (userAddress.split(",").length > 1) userState = userAddress.split(",")[1].trim();
		else if (userAddress) userState = userAddress;
		if (profileData.indexOf(`data-sigil="add-friend hq-profile-logging-action-bar-button"><a href="`) !== -1) addLink = unescape("https://m.facebook.com" + profileData.split(`data-sigil="add-friend hq-profile-logging-action-bar-button"><a href="`)[1].split(`"`)[0].trim().replace(/&amp;/g, '&'));
		if (profileData.indexOf(`mutual friend</span>`) !== -1 || profileData.indexOf(`mutual friends</span>`) !== -1) mutualFriend = true;
		callBack({
			"userAddress": userAddress,
			"userState": userState,
			"addLink": addLink,
			"mutualFriend": mutualFriend
		});
	});
}

function addAsFriend(profileIndex) {
	if (profileList[profileIndex] && totalAdded < Number(addData.addAmount)) {
		getUserData(profileList[profileIndex]["userId"], function (userData) {
			console.log(userData);
			if (userData["addLink"]) {
				if (addData.targetRegions === "All" || (userData["userState"] && addData.targetRegions.toLowerCase().indexOf(userData["userState"].toLowerCase()) !== -1)) {
					if ((addData.mutualOnly && userData.mutualFriend) || !addData.mutualOnly) {
						getXMLHttp("GET", userData["addLink"]);
						totalAdded++;
						console.log("ADDING", userData);
					}
					setTimeout(addAsFriend, getRandomInt(addData.averageDelay * 1000 * 0.85, addData.averageDelay * 1000 * 1.25), profileIndex + 1);
				} else setTimeout(addAsFriend, getRandomInt(1500, 2500), profileIndex + 1);
			} else setTimeout(addAsFriend, getRandomInt(1500, 2500), profileIndex + 1);
			totalScanned++;
		});
	} else {
		// DONE
		console.log("Done!");
		setTimeout(function () {
			chrome.runtime.sendMessage({
				"notificationData": {
					"type": "basic",
					"iconUrl": "../icons/128.png",
					"title": totalAdded + " friend request(s) sent!",
					"isClickable": false,
					"message": "Target friend(s) added successfuly."
				}
			});
			chrome.runtime.sendMessage({
				"closeWindow": true
			});
		}, 2500);
	}
}
/* END: FUNCTIONS */

/* ADD AS FRIEND */
var totalScanned = 0,
	totalAdded = 0,
	profileList = [];
setTimeout(function () {
	// LOAD PROFILES
	var unfilteredProfileList = [];
	if (addData.profileList) {
		unfilteredProfileList = addData.profileList;

		// FILTER NAMES
		for (var i = 0; i < unfilteredProfileList.length; i++) {
			if (isEnglish(unfilteredProfileList[i]["fullName"])) profileList.push(unfilteredProfileList[i]);
		}

		// CHECK AND SEND REQUEST
		console.log("START SENDING REQUEST");
		addAsFriend(0);
	} else getXMLHttp("GET", "https://m.facebook.com/ufi/reaction/profile/browser/fetch/?limit=2500" + ((addData.reactionType) ? ("&reaction_type=" + addData.reactionType) : "") + "&total_count=0&ft_ent_identifier=" + addData.postId, function (xhttp) {
		var apiResponse = xhttp.responseText;
		var domParser = new DOMParser();
		var xmlDoc = domParser.parseFromString(JSON.parse(apiResponse.substring(apiResponse.indexOf("{"))).payload.actions[0].html, "text/html");
		var allUsers = xmlDoc.querySelectorAll(`[data-sigil="undoable-action marea"]`);
		for (var i = 0; i < allUsers.length; i++) {
			var fullName = allUsers[i].querySelector("strong").innerText.trim();
			var userId = getFacebookId(allUsers[i].querySelector("a").href);
			unfilteredProfileList.push({
				"fullName": fullName,
				"userId": userId
			});
		}

		// FILTER NAMES
		for (var i = 0; i < unfilteredProfileList.length; i++) {
			if (isEnglish(unfilteredProfileList[i]["fullName"])) profileList.push(unfilteredProfileList[i]);
		}

		// CHECK AND SEND REQUEST
		console.log("START SENDING REQUEST");
		console.log(unfilteredProfileList);
		addAsFriend(0);
	});
}, 750);

/* UI */
var fixedBox = document.createElement("div");
fixedBox.innerHTML = `
	<div style="margin: 15px 15px 0 15px;">Amount of people to add as friend: <span ce-data-name="add-amount">0</span></div>
	<div style="margin: 15px 15px 0 15px;">Profiles scanned: <span ce-data-name="total-scanned">0</span></div>

	<div style="text-align: center; margin: 3.5em 0;">
		<svg width="25%" height="20%" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" class="lds-rolling"><circle cx="50" cy="50" fill="none" ng-attr-stroke="{{config.color}}" ng-attr-stroke-width="{{config.width}}" ng-attr-r="{{config.radius}}" ng-attr-stroke-dasharray="{{config.dasharray}}" stroke="rgb(66, 103, 178)" stroke-width="10" r="35" stroke-dasharray="164.93361431346415 56.97787143782138" transform="rotate(180 50 50)"><animateTransform attributeName="transform" type="rotate" calcMode="linear" values="0 50 50;360 50 50" keyTimes="0;1" dur="1s" begin="0s" repeatCount="indefinite"></animateTransform></circle></svg>
	</div>

	<div style="margin: 15px 15px 0 15px;">Total friends added: <span ce-data-name="total-added">0</span></div>
`;
fixedBox.style = "font-family: initial; padding: 0; font-size: 1.25em; display: block; position: fixed; top: 0; left: 0; z-index: 100000; width: 100%; height: 150%; overflow: hidden; background: rgb(249, 250, 250); color: rgb(40, 62, 74);";
document.body.appendChild(fixedBox);
document.title = "The Social Blade";

var customScrollBar = document.createElement("style");
customScrollBar.innerHTML = "::-webkit-scrollbar { width: 0px; }";
document.head.appendChild(customScrollBar);

function updateList() {
	document.querySelector("[ce-data-name=\"add-amount\"]").innerHTML = addData.addAmount;
	document.querySelector("[ce-data-name=\"total-scanned\"]").innerHTML = totalScanned;
	document.querySelector("[ce-data-name=\"total-added\"]").innerHTML = totalAdded;
}
updateList();
setInterval(function () {
	updateList();
}, 1000);