/* CLOSE BUTTONS */
var closeButton = document.querySelectorAll("[data-action=\"close-window\"]");
for (var i = 0; i < closeButton.length; i++) {
	closeButton[i].onclick = function () {
		window.close();
	};
}