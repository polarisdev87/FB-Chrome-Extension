// GLOBAL VARIABLES
var executionList = [];

// EXECUTE CONTENT SCRIPT FILES
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    var executionData = executionList.find(i => i.tabId === tabId);
    if (executionData && changeInfo.status === "complete") {
        var executeFiles = function () {
            executionData.files.forEach(file => {
                chrome.tabs.executeScript(tabId, { "file": file });
            });
        };
        var executeCode = function (callBack) {
            chrome.tabs.executeScript(tabId, { "code": executionData.code }, function () {
                if (callBack) callBack();
            });
        };
        if (executionData.code) executeCode(function () {
            if (executionData.files) executeFiles();
        });
        else if (executionData.files) executeFiles();
    }
});

// KEEP TABS/WINDOWS LIVE
setInterval(() => {
    executionList.forEach(function (execution, index) {
        chrome.windows.get(execution.windowId, function (windowData) {
            if (!chrome.runtime.lastError && windowData) {
                // MAKE THE WINDOW NORMAL IF NOT NORMAL
                if (windowData.state !== "normal") {
                    chrome.windows.update(execution.windowId, {
                        "state": "normal",
                        "focused": true
                    }, function () {
                        chrome.windows.update(execution.windowId, {
                            "focused": false
                        });
                    });
                }
            } else {
                // DELETE THE EXECUTION DATA IF WINDOW REMOVED
                delete (executionList[index]);
                executionList = executionList.filter(Boolean);
            }
        });
    });
}, 2.5 * 1000);

// LISTENER TO CREATE EXECUTION WINDOW
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.executionData) {
        var executionData = message.executionData;
        chrome.windows.create({
            "url": executionData.url,
            "state": "normal",
            "width": 350,
            "height": 475,
			"top": Math.round((screen.height - 475) / 2),
			"left": Math.round((screen.width - 350) / 2),
            "type": "popup",
            "focused": true
        }, function (createdWindow) {
            // PUSH TO EXECUTION (MONITORING) LIST
            executionData.windowId = createdWindow.id;
            executionData.tabId = createdWindow.tabs[0].id;
            executionList.push(executionData);
        });
    }
    if (message.updatedExecutionData) {
        var executionIndex = executionList.findIndex(i => i.tabId === sender.tab.id);
        for (var key in message.updatedExecutionData) {
            executionList[executionIndex][key] = message.updatedExecutionData[key];
        }
    }
    if (message.closeWindow) {
        chrome.windows.remove(sender.tab.windowId);
    }
    if (message.notificationData) {
        chrome.notifications.create(message.notificationData);
        new Audio("alert.mp3").play();
    }
});