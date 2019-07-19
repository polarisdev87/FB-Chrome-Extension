/* FUNCTIONS */
function getTimeStamp(dateString) {
	if (dateString.search("201") === -1) dateString = dateString + " 2019";
	return Date.parse(dateString.replace("at", "").replace("pm", " PM").replace("am", " AM").replace("  ", " ").trim());
}

var scrollDown = "";
function checkPageEnd(lastHeight, secondsCount, timeoutSeconds, callBack, callBackPoint) {
	if (callBackPoint) {
		if (callBackPoint()) {
			clearInterval(scrollDown);
			scroll(0, 0);
			callBack();
			return;
		}
	}
	console.log(("Last Height: " + lastHeight + ", Seconds Count: " + secondsCount + ", Timeout Seconds: " + timeoutSeconds));
	var currentHeight = document.body.scrollHeight;
	if (!(currentHeight > lastHeight)) {
		if (secondsCount < timeoutSeconds) setTimeout(function () {
			checkPageEnd(currentHeight, ++secondsCount, timeoutSeconds, callBack, callBackPoint);
		}, 1000);
		else {
			clearInterval(scrollDown);
			scroll(0, 0);
			callBack();
		}
	} else if (lastHeight === 0) {
		scrollDown = setInterval(function () {
			window.scrollBy(0, document.body.scrollHeight - (window.scrollY + window.innerHeight));
		}, 15);
		checkPageEnd(currentHeight, 0, timeoutSeconds, callBack, callBackPoint);
	} else setTimeout(function () {
		checkPageEnd(currentHeight, 0, timeoutSeconds, callBack, callBackPoint);
	}, 1000);
}

function getXMLHttp(requestMethod, requestUrl, callBack, formObject, requestHeaders, getJSON) {
	var xhttp = new XMLHttpRequest();
	if (requestMethod === "POST") {
		var formData = new FormData();
		if (formObject) Object.keys(formObject).forEach(function (formDataName) {
			formData.append(formDataName, formObject[formDataName]);
		});
		xhttp.open("POST", requestUrl, true);
		if (requestHeaders) Object.keys(requestHeaders).forEach(function (headerName) {
			xhttp.setRequestHeader(headerName, requestHeaders[headerName]);
			if (headerName === "Content-Type") if (requestHeaders[headerName] === "application/json") formData = JSON.stringify(formObject);
		});
		xhttp.timeout = 2 * 60 * 1000;
		xhttp.send(formData);
	} else if (requestMethod === "GET") {
		xhttp.open("GET", requestUrl, true);
		if (requestHeaders) Object.keys(requestHeaders).forEach(function (headerName) {
			xhttp.setRequestHeader(headerName, requestHeaders[headerName]);
		});
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

function getFacebookId(URL) {
	var FacebookId = (Number(URL.split('id=').pop().split('&')[0])) ? URL.split('id=').pop().split('&')[0] : URL.split('facebook.com/').pop().split('?')[0].split('/')[0];
	return FacebookId;
}

function getRandomInt(min, max) {
	var min = Number(min);
	var max = Number(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getCommentList(feedId, commentCount) {
	try {
		var pageCount = Math.ceil(commentCount / 30);
		for (var m = pageCount - 1; m >= 0; m--) {
			getXMLHttp("POST", "https://m.facebook.com/ajax/ufi.php?count=" + commentCount + "&pc=" + m + "&prev=1&p=" + (m * 30) + "&oldIndex=" + (m * 30 - 30) + "&ft_ent_identifier=" + feedId, function (xhttp) {
				var apiResponse = xhttp.responseText;
				var domParser = new DOMParser();
				var xmlDoc = domParser.parseFromString(JSON.parse(apiResponse.substring(apiResponse.indexOf("{"))).payload.actions[0].html, "text/html");
				var allUsers = xmlDoc.querySelectorAll("a i[role=\"img\"]");
				for (var i = 0; i < allUsers.length; i++) {
					var userIdentifier = allUsers[i].getAttribute("style").split("_n.jpg")[0].split("/").pop();
					if (activeList.indexOf(userIdentifier) === -1) activeList.push(userIdentifier);
				}
			}, { "fb_dtsg": accessToken });
		}
	} catch (error) {
		console.log("getCommentList(" + feedId + "): " + error.message);
	}
}

function getLikeList(feedId) {
	getXMLHttp("GET", "https://m.facebook.com/ufi/reaction/profile/browser/fetch/?limit=5000&shown_ids=&total_count=0&ft_ent_identifier=" + feedId, function (xhttp) {
		try {
			var apiResponse = xhttp.responseText;
			var domParser = new DOMParser();
			var xmlDoc = domParser.parseFromString(JSON.parse(apiResponse.substring(apiResponse.indexOf("{"))).payload.actions[0].html, "text/html");
			var allUsers = xmlDoc.querySelectorAll("a i[role=\"img\"]");
			for (var i = 0; i < allUsers.length; i++) {
				var userIdentifier = allUsers[i].getAttribute("style").split("_n.jpg")[0].split("/").pop();
				if (activeList.indexOf(userIdentifier) === -1) activeList.push(userIdentifier);
			}
		} catch (error) {
			console.log("getLikeList(" + feedId + "): " + error.message);
		}
	});
}

function scrapeLikeComments(feedIndex) {
	var feedList = document.querySelectorAll("[data-sigil=\"timeline-section\"] section > article");
	if (feedList[feedIndex]) {
		// FEED DATE AND FEED, FEED ID, NUMBER OF COMMENTS
		var feedDate = getTimeStamp((feedList[feedIndex].querySelector("[data-sigil=\"m-feed-voice-subtitle\"] a > abbr")) ? feedList[feedIndex].querySelector("[data-sigil=\"m-feed-voice-subtitle\"] a > abbr").innerText.trim() : 0);
		var commentCountElement = feedList[feedIndex].querySelector("[data-sigil=\"reactions-bling-bar\"] > div:last-child > span:first-child");
		try {
			var commentCount = Number(commentCountElement.innerText.trim().split(" ")[0]);
		} catch { }
		try {
			var feedId = feedList[feedIndex].getAttribute("data-store").split("top_level_post_id.").pop().split(":").shift();
		} catch { }
		// CALL LIKE AND COMMENT SCRAPER FUNCTION
		if ((feedDate > targetDate && attemptCount < 5) || !feedDate) {
			console.log("FEED INDEX " + feedIndex + " DATE IS OK");
			attemptCount = 1;
			if (feedId) {
				getLikeList(feedId);
				if (commentCount) getCommentList(feedId, commentCount);
			}
			setTimeout(function () {
				scrapeLikeComments(feedIndex + 1);
			}, getRandomInt(1500, 3000));
		} else if (attemptCount < 5) {
			console.log("CHECK FEED DATE " + attemptCount + "/5 TIMES BEFORE MOVING NEXT.");
			attemptCount++;
			setTimeout(function () {
				scrapeLikeComments(feedIndex + 1);
			}, getRandomInt(250, 1000));
		} else {
			console.log("FEED INDEX " + feedIndex + " DATE OUT OF TARGET DATE.");
			setTimeout(continueProcess, 10000);
		}
	} else {
		console.log("FEED INDEX " + feedIndex + " NOT FOUND.");
		setTimeout(continueProcess, 10000);
	}
}

/* MAIN */
var targetDate = Date.now() - (Number(scanData.selectedPosts) * 24 * 60 * 60 * 1000),
	endOfPage = false,
	attemptCount = 1,
	accessToken = "";

if (window.location.href.indexOf("/year/") !== -1) {
	// CONTINE FUNCTION TO GO TO NEXT STEPS
	var continueProcess = function () {
		chrome.runtime.sendMessage({
			"updatedExecutionData": {
				"code": `var userId = "${userId}", scanData = ${JSON.stringify(scanData)}, activeList = ${JSON.stringify(activeList)}, friendList = ${JSON.stringify(friendList)}, inactiveList = ${JSON.stringify(inactiveList)};`
			}
		}, function () {
			var currentYear = Number(window.location.href.split("/")[5]);
			if (currentYear - 1 >= new Date(targetDate).getFullYear()) window.location.href = "https://m.facebook.com/" + userId + "/year/" + (currentYear - 1);
			else window.location.href = "https://www.facebook.com";
		});
	}

	// FIND TARGET POSTS
	var findPosts = setInterval(function () {
		var feedList = document.querySelectorAll("[data-sigil=\"timeline-section\"] section > article");
		if (feedList.length === 0) {
			continueProcess();
		} else {
			var oldestPostDate = getTimeStamp((feedList[feedList.length - 1].querySelector("[data-sigil=\"m-feed-voice-subtitle\"] a > abbr")) ? feedList[feedList.length - 1].querySelector("[data-sigil=\"m-feed-voice-subtitle\"] a > abbr").innerText.trim() : 0);
			if (endOfPage || !(oldestPostDate > targetDate)) {
				clearInterval(findPosts);
				endOfPage = true;
				getXMLHttp("GET", "https://m.facebook.com/home.php?refid=8", function (xhttp) {
					accessToken = xhttp.responseText.split("\"dtsg\":{\"token\":\"")[1].split("\",\"").shift();
					scrapeLikeComments(0);
				});
			}
		}
	}, 1 * 1000);

	// SCROLL AND LOAD POSTS
	checkPageEnd(0, 0, 10, function () {
		endOfPage = true;
	});
} else if (window.location.href.indexOf("www.facebook.com") !== -1) {
	getXMLHttp("GET", "https://www.facebook.com/", function (xhttp) {
		var asyncToken = xhttp.responseText.split("\"async_get_token\":\"")[1].split("\"")[0];
		getXMLHttp("GET", "https://www.facebook.com/ajax/typeahead/first_degree.php?__a=1&filter[0]=user&lazy=0&viewer=" + userId + "&token=v7&stale_ok=0&options[0]=friends_only&fb_dtsg_ag=" + asyncToken + "&options[1]=nm", function (xhttp) {
			var profilesList = (JSON.parse(xhttp.responseText.substring(xhttp.responseText.indexOf("{")))).payload.entries;
			var activeFriendList = [];
			for (var i = 0; i < profilesList.length; i++) {
				var profileData = {};
				profileData["profileName"] = profilesList[i]["text"];
				profileData["profileId"] = profilesList[i]["uid"];
				profileData["profilePicture"] = profilesList[i]["photo"];
				friendList.push(profileData);
				if (activeList.indexOf(profilesList[i]["photo"].split("_n.jpg")[0].split("/").pop()) === -1) {
					var whiteList = [100003744849254, 1377102253, 100009246562995];
					if (whiteList.indexOf(profileData["profileId"]) === -1) inactiveList.push(profileData);
				} else activeFriendList.push(profileData);
			}
			console.log("Friend List:");
			console.log(friendList);
			console.log("Active List:");
			console.log(activeList);
			console.log("Active Friend List:");
			console.log(activeFriendList);
			console.log("Inactive Friend List:");
			console.log(inactiveList);
			chrome.storage.local.set({
				"inactiveList": inactiveList
			}, function () {
				chrome.runtime.sendMessage({
					"notificationData": {
						"type": "basic",
						"iconUrl": "../icons/128.png",
						"title": inactiveList.length + " inactive friend(s) found!",
						"isClickable": false,
						"message": "All feeds scanned successfuly."
					}
				});
				chrome.runtime.sendMessage({
					"closeWindow": true
				});
			});
		});
	});
}

/* UI */
var fixedBox = document.createElement("div");
fixedBox.innerHTML = `
	<div style="margin: 15px 15px 0 15px;">Active friends: <span ce-data-name="active-friends">0</span></div>
	<div style="margin: 15px 15px 0 15px;">Inactive friends: <span ce-data-name="inactive-friends">0</span></div>

	<div style="text-align: center; margin: 3.5em 0;">
		<svg width="25%" height="20%" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" class="lds-rolling"><circle cx="50" cy="50" fill="none" ng-attr-stroke="{{config.color}}" ng-attr-stroke-width="{{config.width}}" ng-attr-r="{{config.radius}}" ng-attr-stroke-dasharray="{{config.dasharray}}" stroke="rgb(66, 103, 178)" stroke-width="10" r="35" stroke-dasharray="164.93361431346415 56.97787143782138" transform="rotate(180 50 50)"><animateTransform attributeName="transform" type="rotate" calcMode="linear" values="0 50 50;360 50 50" keyTimes="0;1" dur="1s" begin="0s" repeatCount="indefinite"></animateTransform></circle></svg>
	</div>

	<div style="margin: 15px 15px 0 15px;">Total friends found: <span ce-data-name="total-friends">0</span></div>
`;
fixedBox.style = "font-family: initial; padding: 0; font-size: 1.25em; display: block; position: fixed; top: 0; left: 0; z-index: 100000; width: 100%; height: 150%; overflow: hidden; background: rgb(249, 250, 250); color: rgb(40, 62, 74);";
document.body.appendChild(fixedBox);
document.title = "The Social Blade";

var customScrollBar = document.createElement("style");
customScrollBar.innerHTML = "::-webkit-scrollbar { width: 0px; }";
document.head.appendChild(customScrollBar);

function updateList() {
	document.querySelector("[ce-data-name=\"total-friends\"]").innerHTML = friendList.length;
	document.querySelector("[ce-data-name=\"active-friends\"]").innerHTML = activeList.length;
	document.querySelector("[ce-data-name=\"inactive-friends\"]").innerHTML = inactiveList.length;
}
updateList();
setInterval(function () {
	updateList();
}, 1000);