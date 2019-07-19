// FUNCTIONS
function getFormData(formSelector, allRequired, separateBy) {
	var formInputs = document.querySelector(formSelector).querySelectorAll("[name]:not([type=\"file\"])"),
		formData = {},
		noBlank = true;
	formInputs.forEach(formInput => {
		if (!formInput) return;
		if (!formInput.value) noBlank = false;
		var inputName = formInput.getAttribute("name");
		if (formInput.getAttribute("type") === "checkbox") var inputValue = (formInput.checked) ? true : false;
		else if (formInput.getAttribute("type") === "radio") {
			if (!formInput.checked) return;
			var inputValue = formInput.value;
		} else {
			try {
				var inputValue = JSON.parse(formInput.value);
			} catch (error) {
				var inputValue = formInput.value;
			}
		}
		if (separateBy && formInput.getAttribute("data-separateable")) formData[inputName] = inputValue.trim().split(separateBy).filter(Boolean);
		else if (formData[inputName]) {
			if (Array.isArray(formData[inputName])) formData[inputName].push(inputValue);
			else {
				var existingValue = formData[inputName];
				formData[inputName] = [existingValue];
				formData[inputName].push(inputValue);
			}
		} else formData[inputName] = inputValue;
	});
	if (allRequired && !noBlank) return false;
	else return formData;
}

function setFormData(formSelector, formData, separateBy) {
	for (var inpuName in formData) {
		var inputNode = document.querySelector(formSelector).querySelectorAll("[name=\"" + inpuName + "\"]:not([type=\"file\"])");
		for (var i = 0; i < inputNode.length; i++) {
			if (inputNode[i].getAttribute("type") === "checkbox" || inputNode[i].getAttribute("type") === "radio") {
				inputNode[i].checked = (formData[inpuName] == inputNode[i].value) ? true : false;
			} else if (inputNode[i]) inputNode[i].value = (Array.isArray(formData[inpuName]) && separateBy) ? formData[inpuName].join(separateBy) : formData[inpuName];
		}
	}
	return true;
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
		if (xhttp.readyState === 4 && xhttp.status === 200) {
			if (getJSON) callBack(JSON.parse(xhttp.responseText));
			else callBack(xhttp);
		}
	};
}

function getDOM() {
	var getFacebookId = function (URL) {
		var FacebookId = (Number(URL.split("?id=").pop().split("&")[0])) ? URL.split("?id=").pop().split("&")[0] : URL.split("facebook.com/").pop().split("?")[0].split("/")[0];
		return FacebookId;
	}
	var reactionList = {
		"Like": 1,
		"Love": 2,
		"Wow": 3,
		"Haha": 4,
		"Sad": 7,
		"Angry": 8
	};
	var selectedReaction = document.querySelector(`.uiLayer:not(.hidden_elem) [role="dialog"] [aria-selected=\"true\"] [aria-label]`).getAttribute("aria-label").split(" ").pop().trim();
	var reactionType = reactionList[selectedReaction] || false;

	var reactionBlock = document.querySelector(`.uiLayer:not(.hidden_elem) [role="dialog"] .uiScrollableAreaBody > .uiScrollableAreaContent > div:not(.hidden_elem)`);
	if (reactionBlock) {
		var totalPeople = document.querySelector(`.uiLayer:not(.hidden_elem) [role="dialog"] ul[defaultactivetabkey] > li a[aria-selected="true"]`).innerText.trim();
		var totalPeople = ((totalPeople.indexOf("K") !== -1) ? Number(totalPeople.replace(/[^0-9.]/g, "")) * 1000 : false) || ((totalPeople.indexOf("M") !== -1) ? Number(totalPeople.replace(/[^0-9.]/g, "")) * 1000000 : false) || Number(totalPeople.replace(/[^0-9.]/g, ""));
		totalPeople;
		var seeMoreLink = reactionBlock.querySelector(`a[href*="ft_ent_identifier"]`);
		if (seeMoreLink) {
			var postId = seeMoreLink.href.split("ft_ent_identifier=")[1];
			return {
				"postId": postId,
				"reactionType": reactionType,
				"totalPeople": totalPeople,
				"addAmount": (totalPeople < 50) ? totalPeople : 50
			}
		} else {
			var profileList = [], i;
			var profileLinks = reactionBlock.querySelectorAll(`ul > li a[data-gt]`);
			for (i = 0; i < profileLinks.length; i++) {
				var fullName = profileLinks[i].innerText.trim();
				var userId = getFacebookId(profileLinks[i].href);
				profileList.push({
					"fullName": fullName,
					"userId": userId
				});
			}
			return {
				"profileList": JSON.stringify(profileList),
				"totalPeople": totalPeople,
				"addAmount": (totalPeople < 50) ? totalPeople : 50
			}
		}
	}
}

// INITIALIZER
function initializeTab() {
	chrome.tabs.query({
		currentWindow: true,
		active: true
	}, function (tab) {
		var initializer = function (DOMs) {
			var addFriendsData = (DOMs) ? ((DOMs[0]) ? DOMs[0] : false) : false;
			if (addFriendsData) {
				setFormData("[form-name=\"addData\"]", addFriendsData);
				openTab("add-friends", "ready");
			} else chrome.storage.local.get([
				"inactiveList",
				"userData"
			], function (CS) {
				if (CS["userData"]["userAuthorized"]) {
					if (CS["inactiveList"].length === 0) {
						openTab("home", "start-form");
					} else {
						openTab("remove-friends");
					}
				} else {
					openTab("authorization");
					document.querySelector("[class=\"tab-navigation\"]").style.display = "none";
				}
			});
		}
		if (tab[0].url.indexOf("facebook.com/") !== -1) chrome.tabs.executeScript(tab[0].id, {
			code: "(" + getDOM + ")();"
		}, (DOMs) => {
			setTimeout(function () {
				initializer(DOMs);
			}, 750);
		});
		else setTimeout(function () {
			initializer();
		}, 750);
	});
}
initializeTab();

// UPDATE USER ID
var validUser = true,
	userId = "";
chrome.cookies.get({
	"url": "https://www.facebook.com",
	"name": "c_user"
}, function (cookie) {
	if (cookie) {
		userId = cookie.value;
		chrome.storage.local.set({
			"userId": userId
		});
	}
	else validUser = false;
});

// HOME TAB
var homeTab = document.querySelectorAll(".tab-content[data-name=\"home\"]")[0];
homeTab.querySelector("[form-name=\"scanData\"]").addEventListener("submit", function (thisEvent) {
	thisEvent.preventDefault();
	var scanData = getFormData("[form-name=\"scanData\"]", true);
	if (scanData) {
		chrome.runtime.sendMessage({
			"executionData": {
				"code": `var userId = "${userId}", scanData = ${JSON.stringify(scanData)}, activeList = [], friendList = [], inactiveList = [];`,
				"files": ["scripts/scanPosts.js"],
				"url": "https://m.facebook.com/" + userId + "/year/" + new Date().getFullYear()
			}
		});
		showMessage("success", "Scanning started successfully!");
		setTimeout(function () {
			window.close();
		}, 750);
	} else {
		showMessage("error", "All fields are required!");
	}
});

// REMOVE FRIENDS TAB
var removeFriendsTab = document.querySelectorAll(".tab-content[data-name=\"remove-friends\"]")[0];
removeFriendsTab.querySelectorAll("[data-action=\"remove-friends\"]")[0].addEventListener("click", function (thisEvent) {
	chrome.storage.local.get([
		"removeList"
	], function (CS) {
		var removeList = CS["removeList"];
		if (removeList.length === 0) {
			showMessage("error", "No friend(s) to remove.");
		} else {
			chrome.runtime.sendMessage({
				"executionData": {
					"code": `var removeList = ${JSON.stringify(removeList)}, totalSelected = ${removeList.length};`,
					"files": ["scripts/removeFriends.js"],
					"url": "https://m.facebook.com/"
				}
			});
			showMessage("success", "Friends removing process started successfully!");
			setTimeout(function () {
				window.close();
			}, 750);
		}
	});
});

removeFriendsTab.querySelectorAll("[data-action=\"select-all\"]")[0].onclick = function () {
	chrome.storage.local.get([
		"inactiveList"
	], function (CS) {
		var removeList = [], inactiveList = CS["inactiveList"];
		for (var i = 0; i < inactiveList.length; i++) removeList.push(inactiveList[i]["profileId"].toString());
		chrome.storage.local.set({
			"removeList": removeList
		}, function () {
			updateFriendsList(true, true);
		});
	});
};

removeFriendsTab.querySelectorAll("[data-action=\"deselect-all\"]")[0].onclick = function () {
	chrome.storage.local.set({
		"removeList": []
	}, function () {
		updateFriendsList(true, true);
	});
};

function updateFriendsList(inactiveListOnly, removeListOnly) {
	chrome.storage.local.get([
		"friendList",
		"activeList",
		"inactiveList",
		"removeList"
	], function (CS) {
		var friendList = CS["friendList"];
		var activeList = CS["activeList"];
		var inactiveList = CS["inactiveList"];
		var removeList = CS["removeList"];

		removeFriendsTab.querySelector("[data-name=\"inactive-friends-count\"]").innerHTML = inactiveList.length;

		if (inactiveListOnly) {
			var appendCount = 0;
			removeFriendsTab.querySelector("[data-name=\"inactive-friends\"]").innerHTML = "";
			for (var i = 0; i < inactiveList.length; i++) {
				var inactiveFriend = document.createElement("div");
				inactiveFriend.style.display = "inline-block";
				inactiveFriend.setAttribute("profileId", inactiveList[i]["profileId"]);
				inactiveFriend.onclick = function () {
					if (this.getAttribute("selected")) this.removeAttribute("selected");
					else this.setAttribute("selected", true);
					updateRemoveList(this.getAttribute("profileId"));
				};
				if (removeList.indexOf(inactiveList[i]["profileId"].toString()) !== -1) inactiveFriend.setAttribute("selected", true);
				inactiveFriend.innerHTML = "<span data-name=\"profile-picture\"><img src=\"" + inactiveList[i]["profilePicture"] + "\"/></span><span data-name=\"profile-name\">" + inactiveList[i]["profileName"] + "</span>";
				removeFriendsTab.querySelector("[data-name=\"inactive-friends\"]").appendChild(inactiveFriend);
				appendCount++;
			}
			if (appendCount === 0) removeFriendsTab.querySelector("[data-name=\"inactive-friends\"]").innerHTML = "<div style=\"text-align: center; width: calc(100% - 77.5px); padding: 35px; margin: 0;\">This list is empty! Please scan posts to get the inactive list.</div>";
		}

		if (removeListOnly) {
			var appendCount = 0;
			removeFriendsTab.querySelector("[data-name=\"selected-friends\"]").innerHTML = "";
			for (var i = 0; i < inactiveList.length; i++) {
				if (removeList.indexOf(inactiveList[i]["profileId"].toString()) !== -1) {
					var inactiveFriend = document.createElement("div");
					inactiveFriend.style.display = "inline-block";
					inactiveFriend.setAttribute("profileId", inactiveList[i]["profileId"]);
					inactiveFriend.onclick = function () {
						updateRemoveList(this.getAttribute("profileId"), true);
					};
					if (removeList.indexOf(inactiveList[i]["profileId"].toString()) !== -1) inactiveFriend.setAttribute("selected", true);
					inactiveFriend.innerHTML = "<span data-name=\"profile-picture\"><img src=\"" + inactiveList[i]["profilePicture"] + "\"/></span><span data-name=\"profile-name\">" + inactiveList[i]["profileName"] + "</span>";
					removeFriendsTab.querySelector("[data-name=\"selected-friends\"]").appendChild(inactiveFriend);
					appendCount++;
				}
			}
			if (appendCount === 0) removeFriendsTab.querySelector("[data-name=\"selected-friends\"]").innerHTML = "<div style=\"text-align: center; width: calc(100% - 77.5px); padding: 35px; margin: 0;\">Selected list is empty!</div>";
		}
	});
}
setTimeout(function () {
	updateFriendsList(true, true);
}, 750);

function updateRemoveList(profileId, fullUpdate) {
	chrome.storage.local.get([
		"removeList"
	], function (CS) {
		var removeList = CS["removeList"];
		var profileIndex = removeList.indexOf(profileId);
		if (profileIndex !== -1) {
			delete (removeList[profileIndex]);
		} else {
			removeList.push(profileId);
		}
		removeList = removeList.filter(Boolean);
		chrome.storage.local.set({
			"removeList": removeList
		}, function () {
			if (fullUpdate) updateFriendsList(true, true);
			else updateFriendsList(false, true);
		});
	});
}

// ADD FRIENDS TAB
var addFriendsTab = document.querySelectorAll(".tab-content[data-name=\"add-friends\"]")[0];
addFriendsTab.querySelector("[form-name=\"addData\"]").addEventListener("submit", function (thisEvent) {
	thisEvent.preventDefault();
	var addData = getFormData("[form-name=\"addData\"]");
	chrome.runtime.sendMessage({
		"executionData": {
			"code": `var addData = ${JSON.stringify(addData)};`,
			"files": ["scripts/addFriends.js"],
			"url": "https://m.facebook.com/"
		}
	});
	showMessage("success", "Sending message!");
	setTimeout(function () {
		window.close();
	}, 750);
});

// MESSENGING TAB
var messagingTab = document.querySelectorAll(".tab-content[data-name=\"messaging\"]")[0];
messagingTab.querySelector("[form-name=\"messagingData\"]").addEventListener("submit", function (thisEvent) {
	thisEvent.preventDefault();
	var messagingData = getFormData("[form-name=\"messagingData\"]", true);
	if (messagingData) {
		chrome.runtime.sendMessage({
			"executionData": {
				"code": `var userId = "${userId}", messagingData = ${JSON.stringify(messagingData)};`,
				"files": ["scripts/sendMessage.js"],
				"url": (messagingData.selectedFriends === "1") ? "https://www.facebook.com/" + userId + "/allactivity?privacy_source=activity_log&log_filter=friends&category_key=friends" : "https://www.facebook.com/" + userId + "/friends"
			}
		});
		showMessage("success", "Sending message!");
		setTimeout(function () {
			window.close();
		}, 750);
	} else {
		showMessage("error", "All fields are required!");
	}
});
document.querySelector("[name=\"selectedFriends\"][checked]").onclick = document.querySelector("[name=\"selectedFriends\"]:not([checked])").onclick = function () {
	document.querySelector("[data-name=\"scanningRangeSelector\"]").style.display = (Number(this.value) === -1) ? "none" : "block";
	document.querySelector("[data-name=\"avoidRangeSelector\"]").style.display = (Number(this.value) === -1) ? "block" : "none";
};

// USER AUTHORIZATION
var authorizationTab = document.querySelectorAll(".tab-content[data-name=\"authorization\"]")[0];
authorizationTab.querySelector("[form-name=\"userAuthorization\"]").addEventListener("submit", function (thisEvent) {
	thisEvent.preventDefault();
	openTab("loading-anim");
	var userData = getFormData("[form-name=\"userAuthorization\"]", true);
	getXMLHttp("GET", "https://us-central1-prod-social-blade.cloudfunctions.net/getCustomerStatus?email=" + userData.userEmail, function (serverResponse) {
		openTab("authorization");
		if (serverResponse.error) showMessage("error", serverResponse.error);
		else if (serverResponse.status) {
			if (serverResponse.status === "paid") {
				userData.userAuthorized = true;
				chrome.storage.local.set({
					"userData": userData
				}, function () {
					location.reload();
				});
			}
		}
	}, {}, true);
});

chrome.storage.local.get([
	"userData"
], function (CS) {
	if (CS["userData"]["userEmail"]) {
		var userData = CS["userData"];
		getXMLHttp("GET", "https://us-central1-prod-social-blade.cloudfunctions.net/getCustomerStatus?email=" + userData.userEmail, function (serverResponse) {
			userData.userAuthorized = false;
			userData.userEmail = "";
			if (serverResponse.error) chrome.storage.local.set({
				"userData": userData
			}, function () {
				location.reload();
			});
		}, {}, true);
	}
});