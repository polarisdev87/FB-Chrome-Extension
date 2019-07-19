// FUNCTIONS
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

function insertScript(scriptCodes) {
    var script = document.createElement("script");
    script.innerHTML = scriptCodes;
    document.body.appendChild(script);
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

function getFacebookToken(htmlString) {
    return htmlString.split("name=\"fb_dtsg\" value=\"").pop().split("\"").shift();
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

function sendMessage() {
    var currentId = targetFriends.pop();
    if (currentId && totalMessage < Number(messagingData.messagingLimit)) {
        getXMLHttp("GET", "https://m.facebook.com/messages/thread/" + currentId + "/", function (xhttp) {
            var xmlDoc = new DOMParser().parseFromString(xhttp.responseText, "text/html");
            var messageDates = xmlDoc.querySelectorAll("abbr[data-store]");
            var lastMessageDate = (messageDates.length !== 0) ? JSON.parse(messageDates[messageDates.length - 1].getAttribute("data-store")).time * 1000 : -1;
            if ((messagingData.selectedFriends === "1" && lastMessageDate === -1) || (messagingData.selectedFriends === "-1" && (new Date().getTime() - messagingData.avoidRange * 24 * 60 * 60 * 1000) > lastMessageDate)) {
                getXMLHttp("POST", "https://m.facebook.com/messages/send/?icm=1", function () {
                    totalMessage++;
                    setTimeout(() => {
                        sendMessage();
                    }, getRandomInt(messagingData.averageDelay * 1000 * 0.85, messagingData.averageDelay * 1000 * 1.25));
                }, {
                        "fb_dtsg": getFacebookToken(xhttp.responseText),
                        "ids[0]": currentId,
                        "photo": "",
                        "body": messagingData.messageData,
                        "Send": "Send",
                        "waterfall_source": "message"
                    }, false, true);
            } else {
                setTimeout(() => {
                    sendMessage();
                }, getRandomInt(messagingData.averageDelay * 1000 * 0.085, messagingData.averageDelay * 1000 * 0.125));
            }
        })
    } else setTimeout(() => {
        chrome.runtime.sendMessage({
            "notificationData": {
                "type": "basic",
                "iconUrl": "../icons/128.png",
                "title": "Message sent!",
                "isClickable": false,
                "message": "Successfuly sent message to " + totalMessage + " friend(s)."
            }
        });
        chrome.runtime.sendMessage({
            "closeWindow": true
        });
    }, 2500);
}

// MAIN
var totalMessage = 0;
setTimeout(() => {
    if (window.location.href.indexOf("/allactivity") !== -1) {
        var targetFriends = [],
            dateRange = new Date().getTime() - (messagingData.scanningRange * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000);
        checkPageEnd(0, 0, 10, function () {
            var friendActivity = document.querySelectorAll(".fbTimelineLogBody .uiList > li .uiBoxWhite");
            for (var i = 0; i < friendActivity.length; i++) {
                var profileId = getFacebookId("https://www.facebook.com" + friendActivity[i].querySelector("a[data-hovercard]:last-child").getAttribute("data-hovercard"));
                var addedOn = new Date(friendActivity[i].querySelector("span > a[href*=\"/posts/\"]").innerHTML.trim()).getTime();
                if (addedOn > dateRange) targetFriends.push(profileId);
            }
            chrome.runtime.sendMessage({
                "updatedExecutionData": {
                    "code": `var userId = "${userId}", messagingData = ${JSON.stringify(messagingData)}, targetFriends = ${JSON.stringify(targetFriends)};`
                }
            }, function () {
                window.location.href = "https://m.facebook.com/";
            });
        }, function () {
            var friendActivity = document.querySelectorAll(".fbTimelineLogBody .uiList > li .uiBoxWhite");
            if (!friendActivity[friendActivity.length - 1]) return false;
            var lastAddedOn = new Date(friendActivity[friendActivity.length - 1].querySelector("span > a[href*=\"/posts/\"]").innerHTML.trim()).getTime();
            if (!(lastAddedOn > dateRange)) return true;
            else return false;
        });
    } else if (window.location.href.indexOf("/friends") !== -1) {
        getXMLHttp("GET", "https://www.facebook.com/", function (xhttp) {
            var targetFriends = [];
            var asyncToken = xhttp.responseText.split("\"async_get_token\":\"")[1].split("\"")[0];
            getXMLHttp("GET", "https://www.facebook.com/ajax/typeahead/first_degree.php?__a=1&filter[0]=user&lazy=0&viewer=" + userId + "&token=v7&stale_ok=0&options[0]=friends_only&fb_dtsg_ag=" + asyncToken + "&options[1]=nm", function (xhttp) {
                var allFriends = (JSON.parse(xhttp.responseText.substring(xhttp.responseText.indexOf("{")))).payload.entries;
                allFriends.forEach(friendsData => {
                    targetFriends.push(friendsData.uid);
                });
                chrome.runtime.sendMessage({
                    "updatedExecutionData": {
                        "code": `var userId = "${userId}", messagingData = ${JSON.stringify(messagingData)}, targetFriends = ${JSON.stringify(targetFriends)};`
                    }
                }, function () {
                    window.location.href = "https://m.facebook.com/";
                });
            });
        });
    } else {
        sendMessage();
    }
}, 5000);

/* UI */
var fixedBox = document.createElement("div");
fixedBox.innerHTML = `
	<div style="margin: 15px 15px 0 15px;">Friends found: <span ce-data-name="total-found">0</span></div>

	<div style="text-align: center; margin: 3.5em 0;">
		<svg width="25%" height="20%" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" class="lds-rolling"><circle cx="50" cy="50" fill="none" ng-attr-stroke="{{config.color}}" ng-attr-stroke-width="{{config.width}}" ng-attr-r="{{config.radius}}" ng-attr-stroke-dasharray="{{config.dasharray}}" stroke="rgb(66, 103, 178)" stroke-width="10" r="35" stroke-dasharray="164.93361431346415 56.97787143782138" transform="rotate(180 50 50)"><animateTransform attributeName="transform" type="rotate" calcMode="linear" values="0 50 50;360 50 50" keyTimes="0;1" dur="1s" begin="0s" repeatCount="indefinite"></animateTransform></circle></svg>
	</div>

	<div style="margin: 15px 15px 0 15px;">Total message sent: <span ce-data-name="total-sent">0</span></div>
`;
fixedBox.style = "font-family: initial; padding: 0; font-size: 1.25em; display: block; position: fixed; top: 0; left: 0; z-index: 100000; width: 100%; height: 150%; overflow: hidden; background: rgb(249, 250, 250); color: rgb(40, 62, 74);";
document.body.appendChild(fixedBox);
document.title = "The Social Blade";

var customScrollBar = document.createElement("style");
customScrollBar.innerHTML = "::-webkit-scrollbar { width: 0px; }";
document.head.appendChild(customScrollBar);

function updateList() {
    document.querySelector("[ce-data-name=\"total-found\"]").innerHTML = (window.targetFriends) ? targetFriends.length : 0;
    document.querySelector("[ce-data-name=\"total-sent\"]").innerHTML = totalMessage;
}
updateList();
setInterval(function () {
    updateList();
}, 1000);