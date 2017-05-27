"use strict";

let functions = [],
	 i, k, tmp,
	 zoom = {
		 x: 1,
		 y: 1
	 },
	 start_points = {
		 viewbox_x: null,
		 viewbox_y: null,
		 mouse_x: null,
		 mouse_y: null
	 },
	 viewbox = {
		 x: 0,
		 y: 0,
		 width: 0,
		 height: 0
	 },
	 zoom_axises = {
		 x: true,
		 y: true
	 },
	 accuracy = .1,
	 graph_numbers = {
		 x: [],
		 y: []
	 },
	 expression,
	 accuracy_percentage = .1,
	 local_data = (localStorage["Math Graphs"]) ? JSON.parse(localStorage["Math Graphs"]) : {},
	 graph_hovered = false,
	 current_x = null,
	 coords_offset = {
		 x: 0,
		 y: 0
	 },
	 active_function = null,
	 accuracy_input_focused = false,
	 glossary_functions = document.querySelectorAll(".glossary h2:last-of-type + dl dt"),
	 plotting = null,
	 studying_function = null,
	 touched;

const graph = document.querySelector("svg"),
		footer_coords = {
			x: document.querySelector("footer .coord:nth-of-type(1)"),
			y: document.querySelector("footer .coord:nth-of-type(2)")
		},
		popup_coords = {
			x: document.querySelector(".popup-coords .t-coord:nth-of-type(1)"),
			y: document.querySelector(".popup-coords .t-coord:nth-of-type(2)")
		},
		point = document.querySelector("circle"),
	   values_to_replace = ["ч", "χ", "y=", "н=", "у=", "υ=", ",", "\"", "`", "'", ";", "^", "math.", "×", "÷", "−", "π"],
		values_to_replace_with = ["x", "x", "", "", "", "", ".", "", "", "", "", "**", "", "*", "/", "-", "pi"],
		allowed_functions = ["abs", "acos", "acosh", "asin", "asinh", "atan", "atanh", "atan2", "cbrt", "ceil", "clz32", "cos", "cosh", "exp", "expm1", "floor", "fround", "hypot", "imul", "log", "log1p", "log10", "log2", "max", "min", "pow", "round", "sign", "sin", "sinh", "sqrt", "tan", "tanh", "trunc"],
		allowed_constants = ["e", "ln2", "ln10", "log2e", "log10e", "pi", "sqrt1_2", "sqrt2"],
		allowed_symbols = ["x", "(", ")", "+", "-", "/", "*", "?", ":", "**", "π", "-x", "_"],
		background = document.querySelector("path.background"),
		values_to_replace_after_plotting = [".", "Math,", "**", "( ", " )", " (", "*", "/", "-", "PI"],
		values_to_replace_after_plotting_with = [",", "", "^", "(", ")", "(", "×", "÷", "−", "π"],
		allowed_characters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", ",", ".", "_", "+", "*", "/", "(", ")", "?", ":", "^", "×", "÷", "−", "π", " "],
		parse = function(value) {
			let result = [],
				 last_character_type = null;

			for (i = 0; i < value.length; i++) {
				for (k = 0; k < allowed_characters.length; k++) {
					if (value[i] == allowed_characters[k]) {
						if (k < 26) {
							if (last_character_type == "letter") {
								result[result.length - 1] += value[i];
							} else if (last_character_type == "negative") {
								result[result.length - 1] += value[i];
								last_character_type = "letter";
							} else if (last_character_type == "number") {
								result.push("*");
								result.push(value[i]);
								last_character_type = "letter";
							} else {
								result.push(value[i]);
								last_character_type = "letter";
							}
						} else if (k < 36) {
							if (last_character_type == "number" || last_character_type == "negative" || last_character_type == "letter") {
								result[result.length - 1] += value[i];
							} else {
								result.push(value[i]);
								last_character_type = "number";
							}
						} else if (k < 37) {
							if (value[i + 1] == " ") {
								result.push(value[i]);
								last_character_type = "symbol";
							} else {
								result.push(value[i]);
								last_character_type = "negative";
							}
						} else if (k < 40) {
							result[result.length - 1] += value[i];
						} else if (k < 52) {
							result.push(value[i]);
							last_character_type = "symbol";
						} else {
							last_character_type = "space";
						}
					}
				}
			}

			return result;
		},
		check_safety = function(expression) {
			let function_started = false,
				 brackets_tree = 0,
				 comma_removed = false;
			checking_functions: for (i = 0; i < expression.length; i++) {
				if (function_started) {
					if (expression[i][expression[i].length - 1] == ".") {
						expression[i] = expression[i].slice(0, -1);
						comma_removed = true;
					}
				}

				if (+expression[i] != expression[i]) {

					for (k = 0; k < allowed_functions.length; k++) {
						if (expression[i] == allowed_functions[k]) {
							expression[i] = "Math." + allowed_functions[k];
							function_started = true;
							if (comma_removed == true) {
								expression[i] += ",";
								comma_removed = false;
							}
							continue checking_functions;
						} else if (expression[i] == allowed_constants[k]) {
							expression[i] = "Math." + allowed_constants[k].toUpperCase();
							if (comma_removed == true) {
								expression[i] += ",";
								comma_removed = false;
							}
							continue checking_functions;
						} else if (expression[i] == allowed_symbols[k]) {
							if (function_started) {
								if (allowed_symbols[k] == "(") {
									brackets_tree++;
								} else if (allowed_symbols[k] == ")") {
									brackets_tree--;
									if (brackets_tree <= 0) {
										function_started = false;
									}
								} else if (comma_removed == true) {
									expression[i] += ",";
									comma_removed = false;
								}
							}
							continue checking_functions;
						} else if (expression[i] == "-" + allowed_functions[k]) {
							expression[i] = "-Math." + allowed_functions[k];
							if (comma_removed == true) {
								expression[i] += ",";
								comma_removed = false;
							}
							continue checking_functions;
						} else if (expression[i] == "-" + allowed_constants[k]) {
							expression[i] = "-Math." + allowed_constants[k].toUpperCase();
							if (comma_removed == true) {
								expression[i] += ",";
								comma_removed = false;
							}
							continue checking_functions;
						}
					}

					expression.splice(i, 1);
					i--;
				} else {
					if (comma_removed == true) {
						expression[i] += ",";
						comma_removed = false;
					}
				}
			}
		},
		settings = {
			open_button: document.querySelector("img[src='settings.svg']"),
			close_button: document.querySelector("section.settings .close"),
			accuracy_input: document.querySelector("input#accuracy"),
			panel: document.querySelector("section.settings")
		},
		glossary = {
			open_button: document.querySelector("img[src='glossary.svg']"),
			close_button: document.querySelector("section.glossary .close"),
			panel: document.querySelector("section.glossary")
		},
		zoom_info = document.querySelector(".zoom"),
	  	zoom_buttons = {
	  		in: document.querySelector("img[src='zoom_in.svg']"),
	  		out: document.querySelector("img[src='zoom_out.svg']")
	  	},
		get_y_value = function(function_number, x, change_footer_values, is_mouse_event) {
			if (change_footer_values) {
				if ((is_mouse_event && active_function != null) ||
					 (!is_mouse_event && studying_function != null)) {
					let y = (functions[function_number].expression_function(x));
					x = x.toFixed((is_mouse_event) ? 10 : 5); x = +x;

					if (is_mouse_event) {
						footer_coords.x.innerHTML = "X = " + x.toString().replace(".", ",").replace("-", "−");
					} else {
						popup_coords.x.innerHTML = "X = " + x.toString().replace(".", ",").replace("-", "−");
					}

					point.setAttribute("cx", x / zoom.x);

					if (isFinite(y) &&
						 y == y &&
						 y !== null &&
						 y !== undefined &&
						 y !== "") {

						y = +(y.toFixed((is_mouse_event) ? 10 : 5));
						point.setAttribute("cy", -y / zoom.y);
						point.classList.remove("hidden");

						if (is_mouse_event) {
							footer_coords.y.innerHTML = "Y = " + y.toString().replace(".", ",").replace("-", "−");
						} else {
							popup_coords.y.innerHTML = "Y = " + y.toString().replace(".", ",").replace("-", "−");
						}
					} else {
						if (is_mouse_event) {
							footer_coords.y.innerHTML = "Y неизвестен";
						} else {
							popup_coords.y.innerHTML = "Y неизвестен";
						}
						point.classList.add("hidden");
					}
				} else {
					point.classList.add("hidden");
				}
			} else {
				return functions[function_number].expression_function(x);
			}
		},
		change_zoom = function(direction) {
			if (direction == "in") {
				if (zoom_axises.x) {
					if (zoom.x > 1) {
						zoom.x--;
					} else {
						zoom.x /= 2;
					}
					accuracy = zoom.x * accuracy_percentage;
				}

				if (zoom_axises.y) {
					if (zoom.y > 1) {
						zoom.y--;
					} else {
						zoom.y /= 2;
					}
				}
			} else if (direction == "out") {
				if (zoom_axises.x) {
					if (zoom.x > 1) {
						zoom.x++;
					} else {
						zoom.x *= 2;
					}
					accuracy = zoom.x * accuracy_percentage;
				}

				if (zoom_axises.y) {
					if (zoom.y > 1) {
						zoom.y++;
					} else {
						zoom.y *= 2;
					}
				}
			}

			if (zoom.x == zoom.y) {
				let x_zoom = 1 / zoom.x;

				zoom_info.innerHTML = "Масштаб: " + x_zoom.toFixed(5) * 100 + "%";
			} else {
				let x_zoom = 1 / zoom.x,
					 y_zoom = 1 / zoom.y;

				zoom_info.innerHTML = "Масштаб по X: " + y_zoom.toFixed(5) * 100 + "%, по Y: " + y_zoom.toFixed(9) * 100 + "%";
			}

			for (k = 0; k < functions.length; k++) {
				plotting = k;
				plot(functions[k]);
			}

			if (graph_hovered) {
				get_y_value(active_function, current_x * zoom.x, true);
			}

			change_background(true);
		},
		new_function = function(expression) {
			if (expression === undefined) {
				expression = "";
			}

			if (functions.length < 18) {
				let function_dom = {},
					 used_colors = {
						 red: false,
						 pink: false,
						 purple: false,
						 deep_purple: false,
						 indigo: false,
						 blue: false,
						 light_blue: false,
						 cyan: false,
						 teal: false,
						 green: false,
						 light_green: false,
						 lime: false,
						 yellow: false,
						 amber: false,
						 orange: false,
						 deep_orange: false,
						 brown: false,
						 blue_gray: false
					 },
					 not_used_color;

				for (i = 0; i < functions.length; i++) {
					used_colors[functions[i].color] = true;
				}

				for (i in used_colors) {
					if (!used_colors[i]) {
						not_used_color = i;
						break;
					}
				}

				function_dom.outer = document.createElement("div");
				function_dom.outer.classList.add("outer");

				function_dom.function = document.createElement("div");
				function_dom.function.classList.add("function", not_used_color);

				function_dom.title = document.createElement("h2");
				function_dom.title.title = "Нажмите, чтобы раскрыть";
				function_dom.title.innerHTML = (functions.length + 1) + "-я функция";

				function_dom.more = document.createElement("div");
				function_dom.more.classList.add("more");

				function_dom.controls = document.createElement("div");
				function_dom.controls.classList.add("controls");

				function_dom.controls_get_y_value = document.createElement("img");
				function_dom.controls_get_y_value.src = "y_value.svg";
				function_dom.controls_get_y_value.title = "Вычислить значение Υ при X, равном...";

				function_dom.controls_delete = document.createElement("img");
				function_dom.controls_delete.src = "delete.svg";
				function_dom.controls_delete.title = "Удалить функцию";

				function_dom.input_area = document.createElement("div");
				function_dom.input_area.classList.add("input");

				function_dom.input = document.createElement("input");
				function_dom.input.type = "text";
				function_dom.input.title = "Задайте выражение функции";
				function_dom.input.required = true;
				function_dom.input.id = "function-" + (functions.length + 1) + "-expression";

				function_dom.label = document.createElement("label");
				function_dom.label.setAttribute("for", "function-" + (functions.length + 1) + "-expression");
				function_dom.label.title = "Задайте выражение функции";
				function_dom.label.innerHTML = "Выражение";

				function_dom.error_label = document.createElement("label");
				function_dom.error_label.classList.add("error", "hidden");
				function_dom.error_label.setAttribute("for", "function-" + (functions.length + 1) + "-expression");
				function_dom.error_label.innerHTML = "Похоже, что выражение имеет ошибку";

				function_dom.color_panel = document.createElement("div");
				function_dom.color_panel.classList.add("color");

				function_dom.color_panel_title = document.createElement("h3");
				function_dom.color_panel_title.title = "Цвет, которым будет показан график для отличия от других графиков";
				function_dom.color_panel_title.innerHTML = "Цвет графика";

				function_dom.color_list = document.createElement("div");
				function_dom.color_list.classList.add("colors");

				for (i in used_colors) {
					function_dom[i + "_color_input"] = document.createElement("input");
					function_dom[i + "_color_input"].type = "radio";
					function_dom[i + "_color_input"].name = "function-" + (functions.length + 1) + "-colors";
					function_dom[i + "_color_input"].id = "function-" + (functions.length + 1) + "-" + i;
					function_dom[i + "_color_input"].dataset.color = i;
					function_dom[i + "_color_input"].onchange = new Function("",
						"set_new_function_color(" + functions.length + ", this.dataset.color);"
					);

					if (not_used_color == i) {
						function_dom[i + "_color_input"].setAttribute("checked", true);
					}
					if (used_colors[i]) {
						function_dom[i + "_color_input"].setAttribute("disabled", true);
					}

					function_dom[i + "_color_label"] = document.createElement("label");
					function_dom[i + "_color_label"].setAttribute("for", "function-" + (functions.length + 1) + "-" + i);
					function_dom[i + "_color_label"].title = color_names[i];
				}

				function_dom.title.onclick = new Function("",
					"change_active_function(" + functions.length + ", false, screen.width < screen.height);"
				);

				function_dom.title.ondblclick = new Function("",
					"start_editing_function_name(" + functions.length + ");"
				);

				function_dom.title.onblur = new Function("",
					"end_editing_function_name(" + functions.length + ");"
				);

				function_dom.title.onkeydown = new Function("event",
					"if (event.code == \"Enter\") {" +
						"this.blur();" +
						"end_editing_function_name(" + functions.length + ");" +
					"}"
				);

				function_dom.input.onchange = new Function("",
					"change_function_expression(" + functions.length + ");"
				);

				function_dom.input.onfocus = new Function("",
					"functions[" + functions.length + "].expression_input_focused = true;"
				);

				function_dom.input.onblur = new Function("",
					"functions[" + functions.length + "].expression_input_focused = false;"
				);

				function_dom.controls_get_y_value.onclick = new Function("",
					"prompt_get_y_value(" + functions.length + ");"
				);

				function_dom.controls_delete.onclick = new Function("",
					"delete_function(" + functions.length + ");"
				);

				document.querySelector("section.functions").insertBefore(function_dom.outer, document.querySelector("section.functions footer"));
				function_dom.outer.appendChild(function_dom.function);
				function_dom.function.appendChild(function_dom.title);
				function_dom.function.appendChild(function_dom.more);
				function_dom.more.appendChild(function_dom.input_area);
				function_dom.input_area.appendChild(function_dom.input);
				function_dom.input_area.appendChild(function_dom.label);
				function_dom.input_area.appendChild(function_dom.error_label);
				function_dom.more.appendChild(function_dom.color_panel);
				function_dom.color_panel.appendChild(function_dom.color_panel_title);
				function_dom.color_panel.appendChild(function_dom.color_list);
				function_dom.more.appendChild(function_dom.controls);
				function_dom.controls.appendChild(function_dom.controls_get_y_value);
				function_dom.controls.appendChild(function_dom.controls_delete);

				for (i in used_colors) {
					function_dom.color_list.appendChild(function_dom[i + "_color_input"]);
					function_dom.color_list.appendChild(function_dom[i + "_color_label"]);
				}

				functions.push({
					name_editing: false,
					header: document.querySelectorAll("h2")[functions.length],
					expression_input: document.querySelector("#function-" + (functions.length + 1) + "-expression"),
					expression_function: function(x) {
						return Infinity;
					},
					expression_input_focused: false,
					error_label: document.querySelectorAll("label.error")[functions.length],
					color: not_used_color,
					path: document.createElementNS("http://www.w3.org/2000/svg", "path"),
					colors: {
						red: document.querySelector("#function-" + (functions.length + 1) + "-red"),
						pink: document.querySelector("#function-" + (functions.length + 1) + "-pink"),
						purple: document.querySelector("#function-" + (functions.length + 1) + "-purple"),
						deep_purple: document.querySelector("#function-" + (functions.length + 1) + "-deep_purple"),
						indigo: document.querySelector("#function-" + (functions.length + 1) + "-indigo"),
						blue: document.querySelector("#function-" + (functions.length + 1) + "-blue"),
						light_blue: document.querySelector("#function-" + (functions.length + 1) + "-light_blue"),
						cyan: document.querySelector("#function-" + (functions.length + 1) + "-cyan"),
						teal: document.querySelector("#function-" + (functions.length + 1) + "-teal"),
						green: document.querySelector("#function-" + (functions.length + 1) + "-green"),
						light_green: document.querySelector("#function-" + (functions.length + 1) + "-light_green"),
						lime: document.querySelector("#function-" + (functions.length + 1) + "-lime"),
						yellow: document.querySelector("#function-" + (functions.length + 1) + "-yellow"),
						amber: document.querySelector("#function-" + (functions.length + 1) + "-amber"),
						orange: document.querySelector("#function-" + (functions.length + 1) + "-orange"),
						deep_orange: document.querySelector("#function-" + (functions.length + 1) + "-deep_orange"),
						brown: document.querySelector("#function-" + (functions.length + 1) + "-brown"),
						blue_gray: document.querySelector("#function-" + (functions.length + 1) + "-blue_gray")
					}
				});

				change_active_function(functions.length - 1, innerWidth < innerHeight);
				functions[active_function].path.classList.add(not_used_color, "active");
				functions[active_function].path.onclick = new Function("",
					"if (active_function != " + (functions.length - 1) + ") {" +
						"change_active_function(" + (functions.length - 1) + ");" +
						"get_y_value(" + (functions.length - 1) + ", current_x / zoom.x, true);" +
					"}"
				);

				graph.insertBefore(functions[active_function].path, point);
				manage_function_list("add", functions.length - 1, {
					color: not_used_color, expression: ""
				});
				set_new_function_color(active_function, not_used_color);

				if (expression) {
					change_function_expression(active_function, expression);
					functions[active_function].header.innerHTML = functions[active_function].expression_input.value;
				}

				if (innerHeight > innerWidth) {
					active_function = null;
				}
			 }
		},
		new_function_button = document.querySelector("img[src='add.svg']"),
		set_new_function_color = function(function_number, color) {
			let old_color;

			for (i = 0; i < functions[function_number].header.parentElement.classList.length; i++) {
				if (functions[function_number].header.parentElement.classList.item(i) != "function" && functions[function_number].header.parentElement.classList.item(i) != "opened") {
					old_color = functions[function_number].header.parentElement.classList.item(i);
				}
			}

			functions[function_number].header.parentElement.classList.remove(old_color);
			functions[function_number].path.classList.remove(old_color);
			point.classList.remove(old_color);

			functions[function_number].header.parentElement.classList.add(color);
			functions[function_number].color = color;
			functions[function_number].path.classList.add(color);
			point.classList.add(color);

			for (i = 0; i < functions.length; i++) {
				if (i != function_number) {
					functions[i].colors[old_color].removeAttribute("disabled");
					functions[i].colors[color].setAttribute("disabled", true);
				}
			}

			manage_function_list("change_color", function_number, color);
		},
		change_active_function = function(function_number, do_not_expand, lock_scroll) {
			if (!functions[function_number].name_editing) {
				if (!do_not_expand) {
					functions[function_number].header.parentElement.classList.toggle("opened");
				}

				if (lock_scroll) {
					document.querySelector("section.functions").classList.toggle("scroll-locked");
				}

				if (functions[function_number].header.title == "Нажмите, чтобы скрыть") {
					functions[function_number].header.title = "Нажмите, чтобы раскрыть";
				} else {
					functions[function_number].header.title = "Нажмите, чтобы скрыть";
				}

				if (active_function !== function_number) {
					studying_function = function_number;

					if (active_function !== null) {
						functions[active_function].header.click();
					}

					active_function = function_number;

					if (!do_not_expand) {
						functions[active_function].expression_input.focus();
						functions[active_function].path.classList.add("active");
					}

					for (i = 0; point.classList.item(i) !== null; i++) {
						point.classList.remove(point.classList.item(i));
					}

					point.classList.add(functions[active_function].color);
				} else {
					functions[active_function].expression_input.blur();
					footer_coords.x.innerHTML = "Нажмите на нужный график для его изучения";
					footer_coords.y.innerHTML = "";
					functions[active_function].path.classList.remove("active");
					active_function = null;
				}
			}
		},
		function_list = document.querySelectorAll("ul")[0],
		studying_function_list = document.querySelectorAll("ul")[1],
		manage_function_list = function(action, function_number, parameter) {
			if (action == "add") {
				let new_list_function = document.createElement("li");

				new_list_function.classList.add(parameter.color);
				new_list_function.innerHTML = parameter.expression;
				new_list_function.dataset.function_number = function_number;
				function_list.appendChild(new_list_function);
				studying_function_list.appendChild(new_list_function.cloneNode());
			} else if (action == "change_color") {
				let function_change_color_of = document.querySelector("ul:first-of-type li[data-function_number='" + function_number + "']");

				for (i in function_change_color_of.classList) {
					function_change_color_of.classList.remove(i);
				}

				function_change_color_of.classList.add(parameter);

				function_change_color_of = document.querySelector("ul:last-of-type li[data-function_number='" + function_number + "']");

				for (i in function_change_color_of.classList) {
					function_change_color_of.classList.remove(i);
				}

				function_change_color_of.classList.add(parameter);
			} else if (action == "change_expression") {
				let function_change_expression_of = document.querySelector("ul:first-of-type li[data-function_number='" + function_number + "']");

				function_change_expression_of.innerHTML = parameter;

				function_change_expression_of = document.querySelector("ul:last-of-type li[data-function_number='" + function_number + "']");

				function_change_expression_of.innerHTML = parameter;
			} else if (action == "delete") {
				if (function_number != functions.length) {
					let list_functions = document.querySelectorAll("ul:first-of-type li");

					for (i = 0; i < list_functions.length; i++) {
						if (i > function_number) {
							list_functions[i].dataset.function_number = +list_functions[i].dataset.function_number - 1;
						} else {
							continue;
						}
					}
				}

				document.querySelector("li[data-function_number='" + function_number + "']").remove();
			}
		},
		start_editing_function_name = function(function_number) {
			functions[function_number].header.parentElement.classList.add("opened");
			functions[function_number].header.title = "Нажмите, чтобы скрыть";
			active_function = function_number;
			functions[function_number].path.classList.add("active");

			if (functions[function_number].header.contentEditable == "false") {
				functions[function_number].header.setAttribute("contentEditable", true);
				functions[function_number].header.focus();
				functions[function_number].name_editing = true;
			} else {
				functions[function_number].header.setAttribute("contentEditable", false);
				functions[function_number].name_editing = false;
			}
		},
		end_editing_function_name = function(function_number) {
			functions[function_number].header.setAttribute("contentEditable", false);
			functions[function_number].name_editing = false;
		},
		change_function_expression = function(function_number, not_input_expression) {
			plotting = function_number;
			functions[function_number].error_label.classList.add("hidden");

			if (not_input_expression) {
				expression = parse(not_input_expression.toLowerCase().trim());
			} else {
				expression = parse(functions[function_number].expression_input.value.toLowerCase().trim());
			}

			for (i = 0; i < expression.length; i++) {
				for (k = 0; k < values_to_replace.length; k++) {
					while(~expression[i].indexOf(values_to_replace[k])) {
						expression[i] = expression[i].replace(values_to_replace[k], values_to_replace_with[k]);
					}
				}
			}

			check_safety(expression);

			expression = expression.join(" ");
			functions[function_number].expression_function = new Function("x", "return " + expression);
			functions[function_number].expression_input.blur();

			plot(functions[function_number]);

			for (k = 0; k < values_to_replace_after_plotting.length; k++) {
				while(~expression.indexOf(values_to_replace_after_plotting[k])) {
					expression = expression.replace(values_to_replace_after_plotting[k], values_to_replace_after_plotting_with[k]);
				}
			}

			functions[function_number].expression_input.value = expression.toLowerCase();
			manage_function_list("change_expression", function_number, expression);
		},
		color_names = {
			red: "Красный",
			pink: "Розовый",
			purple: "Фиолетовый",
			deep_purple: "Тёмно-фиолетовый",
			indigo: "Индиго",
			blue: "Синий",
			light_blue: "Голубой",
			cyan: "Бирюзовый",
			teal: "Зеленовато-голубой",
			green: "Зелёный",
			light_green: "Светло-зелёный",
			lime: "Лаймовый",
			yellow: "Жёлтый",
			amber: "Янтарный",
			orange: "Оранжевый",
			deep_orange: "Тёмно-оранжевый",
			brown: "Коричневый",
			blue_gray: "Серо-синий"
		},
		delete_function = function(function_number) {
			if (confirm('Вы уверены, что хотите удалить эту функцию?')) {
				let old_color;

				document.querySelector("section.functions").classList.remove("scroll-locked");

				for (i = 0; i < functions[function_number].header.parentElement.classList.length; i++) {
					if (functions[function_number].header.parentElement.classList.item(i) != "function" && functions[function_number].header.parentElement.classList.item(i) != "opened") {
						old_color = functions[function_number].header.parentElement.classList.item(i);
					}
				}

				for (i = 0; i < functions.length; i++) {
					if (i != function_number) {
						functions[i].colors[old_color].removeAttribute("disabled");
					}
				}

				functions[function_number].path.remove();
				functions[function_number].header.parentElement.parentElement.remove();
				functions.splice(function_number, 1);
				point.classList.remove(old_color);
				active_function = null;

				if (function_number != functions.length) {
					for (i = function_number; i < functions.length; i++) {
						let color_inputs = document.querySelectorAll(".colors input[id^='function-" + (i + 2) + "']"),
							 color_labels = document.querySelectorAll(".colors label[for^='function-" + (i + 2) + "']");

						let j = 0;
						for (k in color_names) {
							color_inputs[j].id = "function-" + (i + 1) + "-" + k;
							color_inputs[j].name = "function-" + (i + 1) + "-colors";
							color_labels[j].setAttribute("for", "function-" + (i + 1) + "-" + k);
							color_inputs[j].onchange = new Function("",
								"set_new_function_color(" + i + ", this.dataset.color);"
							);

							j++;
						}

						functions[i].header = document.querySelectorAll("h2")[i];
						functions[i].expression_input = document.querySelector("#function-" + (i + 2) + "-expression");
						functions[i].expression_input.id = "function-" + (i + 1) + "-expression";
						functions[i].expression_input.nextSibling.setAttribute("for", "function-" + (i + 1) + "-expression");
						functions[i].expression_input.nextSibling.nextSibling.setAttribute("for", "function-" + (i + 1) + "-expression");

						functions[i].header.onclick = new Function("",
							"change_active_function(" + i + ");"
						);

						functions[i].header.ondblclick = new Function("",
							"start_editing_function_name(" + i + ");"
						);

						functions[i].header.onblur = new Function("",
							"end_editing_function_name(" + i + ");"
						);

						functions[i].header.onkeydown = new Function("event",
							"if (event.code == \"Enter\") {" +
								"this.blur();" +
								"end_editing_function_name(" + i + ");" +
							"}"
						);

						functions[i].expression_input.onchange = new Function("",
							"change_function_expression(" + i + ");"
						);

						functions[i].expression_input.onfocus = new Function("",
							"functions[" + i + "].expression_input_focused = true;"
						);

						functions[i].expression_input.onblur = new Function("",
							"functions[" + i + "].expression_input_focused = false;"
						);

						document.querySelectorAll(".function img[src='y_value.svg']")[i].onclick = new Function("",
							"prompt_get_y_value(" + i + ");"
						);

						document.querySelectorAll(".function img[src='delete.svg']")[i].onclick = new Function("",
							"delete_function(" + i + ");"
						);

						functions[i].path.onclick = new Function("",
							"if (active_function != " + i + ") {" +
								"change_active_function(" + i + ");" +
								"get_y_value(" + i + ", current_x / zoom.x, true);" +
							"}"
						);
					}
				}

				manage_function_list("delete", function_number);
			}
		},
		prompt_get_y_value = function(function_number) {
			let x = prompt("Введите Χ", "");

			if (x !== null && x !== "") {
				x = x.replace(",", ".");

				if (+x == x && isFinite(x)) {
					let y = get_y_value(function_number, x, false);

					if (isFinite(y) && +y == y) {
						alert("Y = " + y.toString().replace(".", ","));
					} else {
						alert("Y неизвестен");
					}
				} else {
					alert("X некорректен");
				}
			}
		},
		change_background = function(only_numbers) {
			let existing_numbers = {
				x: [],
				y: []
			}

			graph_numbers.x.forEach(function(item, i, array) {
				if (~existing_numbers.x.indexOf(item.dataset.x) ||
					 item.dataset.x < viewbox.x - viewbox.width ||
					 item.dataset.x > viewbox.x + viewbox.width * 2) {
					item.remove();
					array.splice(i, 1);
				} else {
					existing_numbers.x.push(item.dataset.x);
				}
			});

			graph_numbers.y.forEach(function(item, i, array) {
				if (~existing_numbers.y.indexOf(item.dataset.y) ||
					 item.dataset.y < viewbox.y - viewbox.height ||
					 item.dataset.y > viewbox.y + viewbox.height * 2) {
					item.remove();
					array.splice(i, 1);
				} else {
					existing_numbers.y.push(item.dataset.y);
				}
			});

			for (i = viewbox.x - viewbox.width;
				  i < viewbox.x + viewbox.width * 2;
				  i += 100) {

				if (i % 100) {
					i = (i > 0) ? Math.floor(i / 100) * 100 : Math.ceil(i / 100) * 100;
				}

				if (i == 0) {
					continue;
				}

				if (!~existing_numbers.x.indexOf(i.toString())) {
					let number = document.createElementNS("http://www.w3.org/2000/svg", "text");

					number.innerHTML = i.toString().replace("-", "−").replace(".", ",");
					number.dataset.x = i;
					number.setAttribute("y", 20);
					graph.insertBefore(number, background);
					number.setAttribute("x", i - number.getBBox().width / 2);
					graph_numbers.x.push(number);
				} else {
					let number = document.querySelector("text[data-x='" + i + "']");

					number.innerHTML = +((i * zoom.x).toFixed(5));
					number.innerHTML = number.innerHTML.replace("-", "−").replace(".", ",");

					number.setAttribute("y",
						(viewbox.y >= 0) ? viewbox.y + 20 :

						(graph_hovered && viewbox.y + viewbox.height <= 94) ?
							viewbox.y + viewbox.height - 74 :

						(viewbox.y + viewbox.height <= 30) ?
							viewbox.y + viewbox.height - 10 :

						20
					);
				}
			}

			for (i = viewbox.y - viewbox.height;
				  i < viewbox.y + viewbox.height * 2;
				  i += 100) {

				if (i % 100) {
					i = (i > 0) ? Math.floor(i / 100) * 100 : Math.ceil(i / 100) * 100;
				}

				if (!~existing_numbers.y.indexOf(i.toString())) {
					let number = document.createElementNS("http://www.w3.org/2000/svg", "text");

					number.innerHTML = -i;
					number.innerHTML = number.innerHTML.replace("-", "−").replace(".", ",");
					number.dataset.y = i;
					graph.insertBefore(number, background);

					if (i == 0) {
						number.setAttribute("y", 20);
						number.setAttribute("x", -17);
					} else {
						number.setAttribute("y", i + 7);
						number.setAttribute("x", -number.getBBox().width - 10);
					}
					graph_numbers.y.push(number);
				} else {
					let number = document.querySelector("text[data-y='" + i + "']");

					number.innerHTML = -(i * zoom.y).toFixed(5);
					number.innerHTML = number.innerHTML.replace("-", "−").replace(".", ",");
					if (i != 0) {
						number.setAttribute("x",
							(viewbox.x + viewbox.width <= 0) ? viewbox.x + viewbox.width - number.getBBox().width - 10 :

							(viewbox.x >= -number.getBBox().width - 20) ? viewbox.x + 10 :

							-number.getBBox().width - 10
						);
					}
				}
			}

			if (!only_numbers) {
				tmp = "";

				if (viewbox.y < 0 && viewbox.y + viewbox.height > 0) {
					tmp += "M" + (viewbox.x - viewbox.width) +
					",0h" + (viewbox.width * 3);
				}

				if (viewbox.x < 0 && viewbox.x + viewbox.width > 0) {
					tmp += "M0," + (viewbox.y - viewbox.height) +
					"v" + (viewbox.height * 3);
				}

				background.setAttribute("d", tmp);
			}
		},
		plot = function(function_to_plot) {
			let tmp = "M";
			for (i = viewbox.x * zoom.x - 3;
				  i < (viewbox.width + viewbox.x) * zoom.x + 3;
				  i += accuracy) {
				let y = -(function_to_plot.expression_function(i));

				if (isFinite(y) &&
					 y == y &&
					 y !== null &&
					 y !== undefined &&
					 y !== "" &&
				 	 y > (viewbox.y - viewbox.height) * zoom.y &&
				 	 y < (viewbox.y + viewbox.height * 2) * zoom.y) {

					y = +(y.toFixed(10));
					tmp += i / zoom.x + "," + y / zoom.y;
					tmp += "L";
				} else {
					tmp = tmp.slice(0, -1) + "M";
				}
			}

			function_to_plot.path.setAttribute("d", tmp.slice(0, -1));
			plotting = null;
		},
		change_viewbox = function(x, y, w, h) {
			viewbox.x = x;
			viewbox.y = y;
			viewbox.width = w;
			viewbox.height = h;
			graph.setAttribute("viewBox", x + " " + y + " " + w + " " + h);
			change_background();
		},
		popup = document.querySelector(".popup-coords"),
		move = function(event, is_mouse_event) {
			current_x = (is_mouse_event) ? viewbox.x + event.offsetX : viewbox.x + event.touches[0].clientX;

			if (is_mouse_event) {
				get_y_value(active_function, current_x * zoom.x, true, true);
			} else {
				get_y_value(studying_function, current_x * zoom.x, true, false);
			}

			if (start_points.viewbox_y !== null &&
				 start_points.viewbox_x !== null &&
				 start_points.mouse_x !== null &&
				 start_points.mouse_y !== null) {

				change_viewbox(start_points.viewbox_x - (event.offsetX - start_points.mouse_x), start_points.viewbox_y - (event.offsetY - start_points.mouse_y), innerWidth - 256, innerHeight);

				coords_offset = {
					x: viewbox.width / 2 + viewbox.x,
					y: viewbox.height / 2 + viewbox.y
				}

				for (k = 0; k < functions.length; k++) {
					plotting = k;
					plot(functions[k]);
				}
			}
		};


onerror = function(message, source, line_number, column_number, error) {
	try {
		throw "";
	} catch (error) {
		functions[plotting].error_label.classList.remove("hidden");
		functions[plotting].expression_input.focus();
		functions[plotting].path.removeAttribute("d");
	}
};

local_data.set = function(key, value) {
  local_data[key] = value;
  localStorage["Math Graphs"] = JSON.stringify(local_data);
};

if (local_data.accuracy) {
	accuracy_percentage = local_data.accuracy / 100;
	accuracy = accuracy_percentage;
	settings.accuracy_input.value = local_data.accuracy;
}

if (local_data.panels_on_the_left) {
	document.body.classList.add("left-panel");
	document.querySelector("#left_panels").checked = true;
}

if (local_data.animations || local_data.animations === undefined) {
	document.body.classList.add("animations");
	document.querySelector("#animations").checked = true;
} else {
	document.querySelector("#animations").checked = false;
}

if (local_data.shadows || local_data.animations === undefined) {
	document.body.classList.add("shadows");
	document.querySelector("#shadows").checked = true;
} else {
	document.querySelector("#shadows").checked = false;
}

document.querySelector("img[src='print.svg']").onclick = function() {
	window.print();
};

glossary.open_button.onclick = function() {
	glossary.panel.classList.add("opened");
};

glossary.close_button.onclick = function() {
	glossary.panel.classList.remove("opened");
	glossary.panel.classList.add("closing");

	setTimeout(function() {
		glossary.panel.classList.remove("closing");
	}, 300);
};

settings.open_button.onclick = function() {
	settings.panel.classList.add("opened");
};

settings.close_button.onclick = function() {
	settings.panel.classList.remove("opened");
	settings.panel.classList.add("closing");
	setTimeout(function() {
		settings.panel.classList.remove("closing");
	}, 300);
};

zoom_buttons.in.onclick = function() {
	change_zoom("in");
};

zoom_buttons.out.onclick = function() {
	change_zoom("out");
};

new_function_button.onclick = function() {
	new_function();
};

settings.accuracy_input.onchange = function() {
	if (this.value <= 0) {
		this.value = 1;
	}

	accuracy_percentage = this.value / 100;
	accuracy = zoom.x * accuracy_percentage;

	for (k = 0; k < functions.length; k++) {
		plotting = k;
		plot(functions[k]);
	}

	local_data.set("accuracy", this.value);
};

settings.accuracy_input.onfocus = function() {
	accuracy_input_focused = true;
};

settings.accuracy_input.onblur = function() {
	accuracy_input_focused = false;
};

new_function();

if (screen.width < screen.height) {
	change_viewbox(-(innerWidth / 2), -((innerHeight - 64) / 2), innerWidth, innerHeight - 64);
} else {
	change_viewbox(-((innerWidth - 256) / 2), -(innerHeight / 2), innerWidth - 256, innerHeight);
}

onresize = function() {
	if (screen.width < screen.height) {
		document.body.classList.add("portrait");
		change_viewbox(-(innerWidth / 2), -((innerHeight - 64) / 2), innerWidth, innerHeight - 64);
	} else {
		document.body.classList.remove("portrait");
		change_viewbox(-((innerWidth - 256) / 2), -(innerHeight / 2), innerWidth - 256, innerHeight);
	}

	popup.style.transform = "";

	for (k = 0; k < functions.length; k++) {
		plotting = k;
		plot(functions[k]);
	}
};

document.querySelector(".graphs").onmousemove = function() {
	move(event, true);
};

document.querySelector(".graphs").addEventListener("touchmove", function(event) {
	move(event, false);

	let top = event.touches[0].clientY + 16
		 - getComputedStyle(popup).height.slice(0, -2),
		 left = event.touches[0].clientX - getComputedStyle(popup).width.slice(0, -2) / 2;

		tmp = "translate(";
		tmp += (left < 0) ?
			"0, " :
			(left > screen.width - getComputedStyle(popup).width.slice(0, -2)) ?
				screen.width - getComputedStyle(popup).width.slice(0, -2) + "px, " :
				left + "px, ";
		tmp += (top > 64) ?
			top + "px)" :
			event.touches[0].clientY + 112 + "px)";

	popup.style.transform = tmp;

	event.preventDefault();
});

document.querySelector(".graphs").addEventListener("touchstart", function(event) {
	navigator.vibrate(40);
	move(event, false);
	touched = true;

	let top = event.touches[0].clientY + 16
				 - getComputedStyle(popup).height.slice(0, -2),
		 left = event.touches[0].clientX - getComputedStyle(popup).width.slice(0, -2) / 2;

		tmp = "translate(";
		tmp += (left < 0) ?
			"0, " :
			(left > screen.width - getComputedStyle(popup).width.slice(0, -2)) ?
				screen.width - getComputedStyle(popup).width.slice(0, -2) + "px, " :
				left + "px, ";
		tmp += (top > 64) ?
			top + "px)" :
			event.touches[0].clientY + 112 + "px)";

	popup.style.transform = tmp;

	popup.classList.add("shown");
	event.preventDefault();
});

document.querySelector(".graphs").addEventListener("touchend", function(event) {
	popup.classList.remove("shown");
	touched = false;

	if (local_data.animations) {
		setTimeout(() => {
			if (!touched) {
				popup.style.transform = "";
			}
		}, 300);
	} else {
		popup.style.transform = "";
	}

	event.preventDefault();
});

document.querySelector(".graphs").onmouseover = function() {
	graph_hovered = true;
	change_background(true);
};

document.querySelector(".graphs").onmouseout = function() {
	graph_hovered = false;
	change_background(true);
};

document.querySelector("#left_panels").onchange = function() {
	if (this.checked) {
		document.body.classList.add("left-panel");
		local_data.set("panels_on_the_left", true);
	} else {
		document.body.classList.remove("left-panel");
		local_data.set("panels_on_the_left", false);
	}
};

document.querySelector("#animations").onchange = function() {
	if (this.checked) {
		document.body.classList.add("animations");
		local_data.set("animations", true);
	} else {
		document.body.classList.remove("animations");
		local_data.set("animations", false);
	}
};

document.querySelector("#shadows").onchange = function() {
	if (this.checked) {
		document.body.classList.add("shadows");
		local_data.set("shadows", true);
	} else {
		document.body.classList.remove("shadows");
		local_data.set("shadows", false);
	}
};

graph.onmousedown = function(event) {
	start_points.viewbox_x = viewbox.x;
	start_points.viewbox_y = viewbox.y;
	start_points.mouse_x = event.offsetX;
	start_points.mouse_y = event.offsetY;
};

graph.onwheel = function(event) {
	event.preventDefault();

	if (event.deltaY < 0) {
		change_zoom("in");
	} else {
		change_zoom("out");
	}
}

onmouseup = function() {
	start_points = {
		viewbox_x: null,
		viewbox_y: null,
		mouse_x: null,
		mouse_y: null
	};
}

window.onkeydown = function(event) {
	if (event.code == "ControlLeft") {
		zoom_axises.y = false;
	} else if (event.code == "AltLeft") {
		zoom_axises.x = false;
	} else if (event.code.slice(0, 3) == "Key" ||
				  event.code.slice(0, 5) == "Digit" ||
				  event.code == "Backspace" ||
				  event.key == "-" ||
				  event.key == "+" ||
				  event.key == "." ||
				  event.key == "," ||
				  event.key == "/") {
		if ((active_function !== null && functions[active_function].expression_input_focused) &&
			 (active_function !== null && !functions[active_function].name_editing) &&
		 	 !accuracy_input_focused) {
			functions[active_function].expression_input.focus();
		}
	}

	if (!zoom_axises.y &&
		 !zoom_axises.x) {

		zoom_axises = {
			x: true,
			y: true
		}
	}
}

window.onkeyup = function(event) {
	if (event.code == "ControlLeft") {
		zoom_axises.y = true;
	} else if (event.code == "AltLeft") {
		zoom_axises.x = true;
	}
}

for (i = 0; i < glossary_functions.length; i++) {
	if (i == 6 || i == 17) {
		glossary_functions[i].onclick = new Function("",
			"new_function('" + glossary_functions[i].innerHTML.replace("<i>первый аргумент</i>, <i>второй аргумент</i>", "x, x*" + Math.round(Math.random() * 20)) + "'); glossary.close_button.click();"
		);
	} else if (i == 16 || i == 22 || i == 23) {
		glossary_functions[i].onclick = new Function("",
			"new_function('" + glossary_functions[i].innerHTML.replace("<i>любое число аргументов через запятую</i>", "x, x*" + Math.round(Math.random() * 20)) + "'); glossary.close_button.click();"
		);
		glossary_functions[i].onclick = new Function("",
			"new_function('" + glossary_functions[i].innerHTML.replace("<i>любое число аргументов через запятую</i>", "x, x*" + Math.round(Math.random() * 20)) + "'); glossary.close_button.click();"
		);
	} else if (i == 24) {
		glossary_functions[i].onclick = new Function("",
			"new_function('" + glossary_functions[i].innerHTML.replace("<i>основание</i>, <i>показатель</i>", "x, " + (Math.round(Math.random() * 2) + 1)) + "'); glossary.close_button.click();"
		);
	} else {
		glossary_functions[i].onclick = new Function("",
			"new_function('" + glossary_functions[i].innerHTML.replace("<i>аргумент</i>", "x") + "'); glossary.close_button.click();"
		);
	}
}
