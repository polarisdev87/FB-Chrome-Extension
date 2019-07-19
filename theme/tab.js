function openTab(targetName, subContent) {
	var i, targetTab;
	/* CHANGE NAV STYLE */
	var tabLink = document.querySelectorAll(".tab-navigation > .tab-link");
	for (i = 0; i < tabLink.length; i++) {
		if (tabLink[i].getAttribute("target-name") === targetName) tabLink[i].classList.add("active");
		else if (tabLink[i].classList.contains("active")) tabLink[i].classList.remove("active");
	}
	/* SHOW TARGET TAB */
	var tabContent = document.querySelectorAll(".tab-content[data-name=\"" + targetName + "\"]")[0].parentElement.querySelectorAll(".tab-content");
	for (i = 0; i < tabContent.length; i++) {
		if (tabContent[i].getAttribute("data-name") === targetName) {
			tabContent[i].classList.add("active");
			targetTab = tabContent[i]
		} else if (tabContent[i].classList.contains("active")) tabContent[i].classList.remove("active");
	}
	/* SHOW SUB TAB CONTENT ID SET */
	var tabSubContent = targetTab.querySelectorAll(".sub-content");
	if (subContent) {
		for (i = 0; i < tabSubContent.length; i++) {
			if (tabSubContent[i].getAttribute("data-name") === subContent) tabSubContent[i].classList.add("active");
			else if (tabSubContent[i].classList.contains("active")) tabSubContent[i].classList.remove("active");
		}
	} else if (tabSubContent.length > 1) {
		var hasActive = false;
		for (i = 0; i < tabSubContent.length; i++) {
			if (tabSubContent[i].classList.contains("active")) hasActive = true;
		}
		if(!hasActive) tabSubContent[0].classList.add("active");
	} else if (tabSubContent.length > 0) tabSubContent[0].classList.add("active");
}

document.body.onload = function () {
	var tabLink = document.querySelectorAll(".tab-navigation > .tab-link");
	for (var i = 0; i < tabLink.length; i++) {
		tabLink[i].onclick = function () {
			openTab(this.getAttribute("target-name"));
		};
	}
};