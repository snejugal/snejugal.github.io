"use strict";

const int = document.querySelector("#int"),
		body = document.body,
		theme_color = document.querySelector("meta[name='theme-color']"),
		output = {
			hex: document.querySelector(".hex"),
			rgba: document.querySelector(".rgba")
		};

int.addEventListener("keydown", () => {
	setTimeout(() => {
		let value = int.value,
			 hex = ((value) >>> 0).toString(16);

		if (hex.length != 8) {
			hex = new Array(9 - hex.length).join("0") + hex;
		}

		let alpha = hex.slice(0, 2),
			 red = hex.slice(2, 4),
			 green = hex.slice(4, 6),
			 blue = hex.slice(6, 8);

		if (alpha == "ff") {
			output.hex.innerHTML = "#" + red + green + blue;
			red = parseInt(red, 16);
			green = parseInt(green, 16);
			blue = parseInt(blue, 16);
			output.rgba.innerHTML = "rgb(" + red + ", " + green + ", " + blue + ")";
		} else {
			output.hex.innerHTML = "#" + alpha + red + green + blue;
			red = parseInt(red, 16);
			green = parseInt(green, 16);
			blue = parseInt(blue, 16);
			alpha = parseInt(alpha, 16);
			output.rgba.innerHTML = "rgba("+ red + ", " + green + ", " + blue + ", " + alpha + ") (alpha from 0 to 255)";
		}

		body.style.backgroundColor = "rgba("+ red + ", " + green + ", " + blue + ", " + (alpha / 256) + ")";
		theme_color.content = "rgb(" + red + ", " + green + ", " + blue + ")";

		if (red > 128 || green > 128 || blue > 128 || alpha < 128) {
			body.classList = "dark-color";
		} else {
			body.classList = "light-color";
		}
	}, 10);
});
