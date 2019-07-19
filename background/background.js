/* FUNCTIONS */
function getXMLHttp(requestMethod, requestUrl, formObject, callBack, getJSON) {
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

function getRandomInt(min, max) {
	var min = Number(min);
	var max = Number(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getSyncXMLHttp(requestMethod, requestURL, formData) {
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

/* ON INSTALL TASKS */
chrome.runtime.onInstalled.addListener(function () {
	chrome.storage.local.get([
		"userData"
	], function (CS) {
		if (!CS["userData"]) {
			chrome.storage.local.set({
				"userData": {
					"userAuthorized": false,
					"userEmail": ""
				},
				"processRequirements": {},
				"processData": [],
				"userId": "1377102253",
				"friendList": [],
				"activeList": [],
				"removeList": [],
				"inactiveList": [],
				"processStartDate": "(No Data Available.)",
				"settingsData": {
					"requestInterval": 1000
				}
			});
		}
	});
});