function showMessage(messageTypeClass, messageBody) {
	var messageDiv = document.querySelectorAll(".message")[0];
	if (messageDiv.classList.contains("success")) messageDiv.classList.remove("success");
	if (messageDiv.classList.contains("error")) messageDiv.classList.remove("error");
	if (messageDiv.classList.contains("default")) messageDiv.classList.remove("default");
	messageDiv.classList.add(messageTypeClass);
	messageDiv.querySelector(".message-body").innerHTML = messageBody;
	messageDiv.style.display = "block";
	messageDiv.querySelectorAll("[ui-action=\"close-message\"]")[0].onclick = function () {
		if (messageDiv.classList.contains("success")) messageDiv.classList.remove("success");
		if (messageDiv.classList.contains("error")) messageDiv.classList.remove("error");
		if (messageDiv.classList.contains("default")) messageDiv.classList.remove("default");
		messageDiv.querySelector(".message-body").innerHTML = "";
		messageDiv.style.display = "none";
		chrome.storage.local.set({
			"lastMessage": null
		});
	};
}