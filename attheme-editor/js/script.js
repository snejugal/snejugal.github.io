"use strict";

let workplace = document.querySelector("section"),
    theme = (localStorage.theme) ? JSON.parse(localStorage.theme) : {},
    elements = {},
    image = false,
    editing = null,
    suggestions,
    dialog,
    theme_palette = (localStorage.palette) ? JSON.parse(localStorage.palette) : [],
    variables_amount,
    action_button = null;

const header = document.querySelector("header"),
      set_workplace = function(to) {
        switch(to) {
          case "welcome":
            workplace.className = "welcome";
            workplace.innerHTML = "";

            let title = create_element("h1", {
                  innerHTML: "Start working on your theme",
                  className: "welcome_title"
                }),
                buttons_container = create_element("div", {
                  className: "welcome_buttons"
                }),
                new_theme = create_element("button", {
                  innerHTML: "Create a new theme",
                  type: "button",
                  className: "welcome_button",
                  title: "Create a new empty theme",
                  _listeners: {
                    click: function() {
                      theme = {};
                      theme_palette = [];
                      save_theme();
                      localStorage.theme_name = "Awesome theme";
                      set_workplace("workplace");
                    }
                  }
                }),
                open_theme = create_element("button", {
                  innerHTML: "Open an existing file",
                  type: "button",
                  className: "welcome_button",
                  title: "Select a local theme file and open it",
                  _listeners: {
                    click: function() {
                      document.querySelector("input").click();
                    }
                  }
                }),
                copy_theme_code = create_element("button", {
                  innerHTML: "Put your theme's code",
                  type: "button",
                  className: "welcome_button",
                  title: "Put a theme's code",
                  _listeners: {
                    click: function() {
                      show_dialog("code_putting");
                    }
                  }
                }),
                file_input = create_element("input", {
                  type: "file",
                  _listeners: {
                    change: function() {
                      if (this.files[0].name.slice(-8) == ".attheme"){
                        let reader = new FileReader();
                        reader.onload = function() {
                          load_theme(reader.result);
                          set_workplace("workplace");
                        };
                        reader.readAsText(this.files[0]);
                        localStorage.theme_name = this.files[0].name.replace(".attheme", "");
                      } else {
                        show_dialog("incorrect-file");
                      }
                    }
                  }
                }),
                drop_hint = create_element("p", {
                  className: "welcome_drop-hint",
                  innerHTML: "or drop an .attheme file here"
                });

            workplace.appendChild(title);
            buttons_container.appendChild(new_theme);
            buttons_container.appendChild(open_theme);
            buttons_container.appendChild(copy_theme_code);
            workplace.appendChild(buttons_container);
            workplace.appendChild(drop_hint);
            workplace.appendChild(file_input);
            title = null;
            buttons_container = null;
            new_theme = null;
            open_theme = null;
            copy_theme_code = null;
            file_input = null;
            break;
          case "workplace":
            workplace.classList = "workplace";
            workplace.innerHTML = "";
            elements = {};
            let theme_name = create_element("input", {
                  className: "workplace_theme-name",
                  type: "input",
                  placeholder: "Theme name",
                  title: "Click to change your theme name",
                  autocapitalize: "words",
                  value: localStorage.theme_name,
                  _listeners: {
                    change: function() {
                      localStorage.theme_name = elements.theme_name.value;
                    },
                    keypress: function(event) {
                      if (event.key == "Enter") {
                        this.blur();
                      }
                    }
                  }
                }),
                buttons = create_element("div", {
                  className: "workplace_buttons"
                }),
                download_button = create_element("button", {
                  className: "workplace_button download-button",
                  type: "button",
                  title: "Download your theme",
                  _listeners: {
                    click: function() {
                      let file_content = "";

                      for (let i in theme) {
                        if (defaults[i] &&
                            (theme[i].alpha != defaults[i].alpha ||
                            theme[i].red != defaults[i].red ||
                            theme[i].green != defaults[i].green ||
                            theme[i].blue != defaults[i].blue)) {
                          let alpha = b16(theme[i].alpha),
                            red = b16(theme[i].red),
                            blue = b16(theme[i].blue),
                            green = b16(theme[i].green),
                            hex = red + green + blue,
                            int = (b10(alpha + hex) << 0).toString();

                          if (alpha == "ff") {
                            if (int.length > 7) {
                              file_content += i + "=#" + hex + "\n";
                            } else {
                              file_content += i + "=" + int + "\n";
                            }
                          } else if (alpha == "00") {
                            file_content += i + "=0\n";
                          } else {
                            if (int.length > 9) {
                              file_content += i + "=#" + alpha + hex + "\n";
                            } else {
                              file_content += i + "=" + int + "\n";
                            }
                          }

                          alpha = null;
                          red = null;
                          green = null;
                          blue = null;
                          hex = null;
                          int = null;
                        }
                      }

                      if (localStorage.image) {
                        file_content += "WPS\n" + localStorage.image;
                      }
                      let file = create_element("a", {
                        href: "data:text/plain;charset=ansi," + encodeURIComponent(file_content),
                        download: localStorage.theme_name + ".attheme"
                      });
                      document.body.appendChild(file);
                      file.click();
                      file.remove();
                      file = null;
                      file_content = null;
                    }
                  }
                }),
                close_button = create_element("button", {
                  className: "workplace_button red",
                  type: "button",
                  innerHTML: "Close theme",
                  title: "Close the theme and start working on another one",
                  _listeners: {
                    click: function() {
                      show_dialog("closing_theme");
                    }
                  }
                }),
                add_varaible_container = create_element("div", {
                  className: "workplace_add-variable-container"
                }),
                add_varaible_input = create_element("input", {
                  className: "workplace_add-variable_input",
                  placeholder: "Find or add a variable...",
                  _listeners: {
                    input: function() {
                      show_suggestion_list(this.value);
                    },
                    click: function() {
                      if (!suggestions) {
                        show_suggestion_list(this.value);
                      }
                    }
                  }
                }),
                add_varaible_suggestions = create_element("ul", {
                  className: "workplace_add-variable_suggestions"
                }),
                variable_list = create_element("ul", {
                  className: "workplace_variables"
                }),
                amount = 0;

            addEventListener("scroll", function() {
              if (window.scrollY >= 261) {
                if (!(add_varaible_container.className.indexOf(" fixed") + 1)) {
                  add_varaible_container.className += " fixed";
                }
              } else {
                add_varaible_container.className = add_varaible_container.className.replace(" fixed", "");
              }
            }, {
              passive: true
            });

            variables_amount = create_element("div", {
              className: "workplace_variables-amount"
            });
            elements.variables = {};
            for (let k in theme) {
              new_variable_element(k, variable_list);
              amount++;
            }

            variables_amount.innerHTML = `${amount} of ${default_variables.length} variables are added to your theme`;

            if (image) {
              let image_removing_warning = create_element("div", {
                    className: "workplace_warning"
                  }),
                  warning_close = document.createElementNS("http://www.w3.org/2000/svg", "svg"),
                  warning_close_path = document.createElementNS("http://www.w3.org/2000/svg", "path"),
                  warning_text = create_element("span", {
                    innerHTML: "The theme's wallpaper will be removed after downloading. You'll need to add it with the in-app editor.",
                    className: "workplace_warning_text"
                  });

              warning_close.setAttribute("class", "workplace_warning_close");
              warning_close.setAttribute("viewBox", "0 0 24 24");
              warning_close_path.setAttribute("d", "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z");

              warning_close.addEventListener("click", function() {
                elements.warning.remove();
                delete elements.warning;
              });

              warning_close.appendChild(warning_close_path);
              image_removing_warning.appendChild(warning_text);
              image_removing_warning.appendChild(warning_close);
              workplace.appendChild(image_removing_warning);
              elements.warning = image_removing_warning;
              image_removing_warning = null;
              warning_close = null;
              warning_close_path = null;
              warning_text = null;
            }
            buttons.appendChild(close_button);
            add_varaible_container.appendChild(add_varaible_input);
            add_varaible_container.appendChild(add_varaible_suggestions);
            workplace.appendChild(theme_name);
            workplace.appendChild(buttons);
            workplace.appendChild(download_button);
            workplace.appendChild(add_varaible_container);
            workplace.appendChild(variable_list);
            workplace.appendChild(variables_amount);

            action_button = download_button;

            addEventListener("keydown", function(event) {
              if (event.ctrlKey && !event.shiftKey && !event.altKey && event.code == "KeyF") {
                event.preventDefault();
                scrollTo(0, add_varaible_input.getBoundingClientRect().top + document.body.scrollTop);
                add_varaible_input.focus();
              }
            });

            elements.theme_name = theme_name;
            elements.suggestions = add_varaible_suggestions;
            elements.variable_list = variable_list;
        }
      },
      load_theme = function(text) {
        let rows = text.split("\n");
        for (let i = 0; i < rows.length; i++) {
          if (rows[i] != "" && rows[i].indexOf("=") + 1 && rows[i].slice(0, 2) != "//") {
            let row = rows[i].split("="),
                variable = row[0],
                value = row[1];

            if (value.slice(0, 1) != "#") {
              value = (value >>> 0).toString(16);
              value = (new Array(9 - value.length).join("0") + value);
            } else {
              value = value.slice(1);
              if (value.length == 6) {
                value = "ff" + value;
              }
            }

            theme[variable] = {
              alpha: b10(value.slice(0, 2)),
              red: b10(value.slice(2, 4)),
              green: b10(value.slice(4, 6)),
              blue: b10(value.slice(6, 8))
            };
          } else if (rows[i] == "WPS") {
            image = true;
            break;
          }
        }
        generate_theme_palette();
        save_theme();
      },
      save_theme = function() {
        localStorage.theme = JSON.stringify(theme);
        localStorage.palette = JSON.stringify(theme_palette);
      },
      dialog_container_close_event = function(event) {
        close_dialog(event);
        history.back();
      },
      show_dialog = function(type) {
        let container = create_element("div", {
              className: "window-container",
              _listeners: {
                click: dialog_container_close_event
              }
            }),
            content_container = create_element("div", {
              className: "window_container"
            }),
            title = create_element("h1", {
              className: "window_title"
            }),
            ok = create_element("button", {
              type: "button",
              innerHTML: "OK",
              className: "window_buttons_button"
            }),
            cancel = create_element("button", {
              type: "button",
              innerHTML: "Cancel",
              className: "window_buttons_button",
              _listeners: {
                click: function() {
                  dialog.container.click();
                }
              }
            }),
            buttons_container = create_element("div", {
              className: "window_buttons"
            }),
            scrollbar_width = innerWidth - document.body.clientWidth;

        dialog = create_element("div", {
          className: "window",
          _listeners: {
            click: function(event) {
              event.stopPropagation();
            }
          }
        });

        dialog.container = container;
        container.appendChild(dialog);
        content_container.appendChild(title);

        if (type == "code_putting") {
          title.innerHTML = "Put your theme's code";
          let code_input = create_element("textarea", {
            className: "window_textarea",
            autofocus: true,
            placeholder: "Put the code here..."
          });

          content_container.appendChild(code_input);
          ok.addEventListener("click", function() {
            load_theme(elements.code_input.value);
            dialog.container.click();
            localStorage.theme_name = "Awesome theme";
            set_workplace("workplace");
          });
          elements.code_input = code_input;
          container.className += " full-width";
        } else if (type == "closing_theme") {
          title.innerHTML = "Are you sure you want to stop working on the theme and close it?";
          ok.addEventListener("click", function() {
            dialog.container.click();
            theme = {};
            image = false;
            localStorage.removeItem("theme");
            localStorage.removeItem("theme_name");
            set_workplace("welcome");
          });
        } else if (type == "variable-edit") {
          title.innerHTML = editing;
          title.className += " monospace";
          dialog.color = Color(theme[editing]);
          let rgb_inputs = dialog.color.create_rgb_inputs({
                red_placeholder: theme[editing].red,
                green_placeholder: theme[editing].green,
                blue_placeholder: theme[editing].blue,
                class: "window_input",
                keypress: function() {
                  if (event.key == "Enter") {
                    this.parentElement.nextSibling.childNodes[1].focus();
                  }
                }
              }),
              hex_input = dialog.color.create_hex_input({
                id: "hex",
                class: "window_input",
                keypress: function(event) {
                  if (event.key == "Enter") {
                    dialog.ok.click();
                  }
                }
              }),
              hex_input_label = create_element("label", {
                for: "hex",
                className: "window_label",
                innerHTML: "HEX value"
              }),
              red_label = create_element("label", {
                className: "window_label",
                innerHTML: "Red"
              }),
              green_label = create_element("label", {
                className: "window_label",
                innerHTML: "Green"
              }),
              blue_label = create_element("label", {
                className: "window_label",
                innerHTML: "Blue"
              }),
              alpha_label = create_element("label", {
                className: "window_label",
                innerHTML: "Alpha"
              }),
              rgba = create_element("div", {
                className: "window_fieldset"
              }),
              red = rgb_inputs[0],
              green = rgb_inputs[1],
              blue = rgb_inputs[2],
              alpha = dialog.color.create_alpha_input({
                placeholder: theme[editing].alpha,
                class: "window_input",
                keypress: function() {
                  if (event.key == "Enter") {
                    dialog.ok.click();
                  }
                }
              }),
              color_container = create_element("div", {
                className: "window_color-container"
              }),
              color = create_element("div", {
                className: "window_color",
                update: function() {
                  this.style.background = dialog.color.cssrgb;
                },
                _listeners: {
                  click: function() {
                    dialog.color_input.click();
                  }
                }
              }),
              color_input = create_element("input", {
                type: "color",
                value: "#" + b16(theme[editing].red) + b16(theme[editing].green) + b16(theme[editing].blue),
                _listeners: {
                  change: function() {
                    red.value = b10(this.value.slice(1, 3));
                    green.value = b10(this.value.slice(3, 5));
                    blue.value = b10(this.value.slice(5, 7));
                    change_value();
                  }
                }
              }),
              palette_container = create_element("div", {
                className: "window_palette"
              });

          dialog.color.update_list.push(color);

          content_container.appendChild(color_container);

          get_preview(editing).then(function(response) {
            let editing_element = response.tree.querySelector(`.${editing}`);
            editing_element.update = function() {
              this.style.fill = dialog.color.cssrgb;
            }
            dialog.color.update_list[dialog.color.update_list.length - 1] = editing_element;
            content_container.insertBefore(response.tree, color_container);
            response.tree.setAttribute("class", "window_preview");
            color_container.remove();
            response.color(theme);
          }).catch(function(){});

          color.style.background = Color.cssrgb(theme[editing]);

          dialog.red = red;
          dialog.green = green;
          dialog.blue = blue;
          dialog.alpha = alpha;
          dialog.hex = hex_input;
          ok.addEventListener("click", function() {
            let old_color = {
              red: theme[editing].red,
              green: theme[editing].green,
              blue: theme[editing].blue
            };
            theme[editing] = {
              alpha: dialog.color.alpha,
              red: dialog.color.red,
              green: dialog.color.green,
              blue: dialog.color.blue
            }
            is_color_not_used(old_color);

            if (suggestions && suggestions[editing]) {
              if (!suggestions[editing].className.match(/ before-shadow/)) {
                suggestions[editing].className += " before-shadow";
              }
              suggestions[editing].style.setProperty("--color", Color.cssrgb(theme[editing]));
            }

            let overlayed_color;
            if (theme[editing].alpha == 255) {
              overlayed_color = theme[editing];
            } else {
              if (sessionStorage.dark) {
                overlayed_color = Color.overlay(theme[editing], {
                  red: 42,
                  green: 42,
                  blue: 42
                });
              } else {
                overlayed_color = Color.overlay(theme[editing], {
                  red: 255,
                  green: 255,
                  blue: 255
                });
              }
            }

            if (Color.brightness(overlayed_color) > .75) {
              if (!(elements.variables[editing].className.indexOf(" dark-text") + 1)) {
                elements.variables[editing].className += " dark-text";
              }
            } else {
              elements.variables[editing].className = elements.variables[editing].className.replace(" dark-text", "");
            }

            if (theme[editing].alpha != 255) {
              if (elements.variables[editing].parentElement.className.indexOf(" transparency") == -1) {
                elements.variables[editing].parentElement.className += " transparency";
              }
            } else {
              elements.variables[editing].parentElement.className = elements.variables[editing].parentElement.className.replace(" transparency", "");
            }

            elements.variables[editing].style.background = Color.cssrgb(theme[editing]);
            elements.variables[editing].childNodes[1].innerHTML = `${Color.hex(theme[editing])} / ${theme[editing].red}, ${theme[editing].green}, ${theme[editing].blue}, ${theme[editing].alpha}`;
            add_palette_color(theme[editing]);
            save_theme();
            dialog.container.click();
          });

          let palette_colors = [];

          if (editing != "chat_wallpaper" && defaults[editing]) {
            palette_colors.push(create_element("button", {
              className: "window_palette_color",
              innerHTML: "Default",
              data: {
                color: Color.hex(defaults[editing])
              },
              _listeners: {
                click: function() {
                  dialog.color.hex = this.dataset.color;
                  dialog.hex.value = dialog.color.hex;
                }
              }
            }));

            if (Color.brightness(defaults[editing]) > .75) {
              palette_colors[0].className += " dark-color";
            }
            palette_colors[0].style.background = Color.cssrgb(defaults[editing]);
            palette_container.appendChild(palette_colors[0]);
          }

          for (let k = 0; k < theme_palette.length; k++) {
            let n = palette_colors.push(create_element("button", {
                  className: "window_palette_color",
                  innerHTML: theme_palette[k],
                  data: {
                    color: theme_palette[k]
                  },
                  _listeners: {
                    click: function() {
                      let alpha = dialog.color.alpha;
                      dialog.color.hex = this.dataset.color;
                      dialog.color.alpha = alpha;
                      dialog.hex.value = dialog.color.hex;
                      dialog.alpha.value = alpha;
                      alpha = null;
                    }
                  }
                })) - 1;

            if (Color.brightness({
                  red: b10(theme_palette[k].slice(1, 3)),
                  green: b10(theme_palette[k].slice(3, 5)),
                  blue: b10(theme_palette[k].slice(5, 7))
                }) > .75) {
              palette_colors[n].className += " dark-color";
            }
            palette_colors[n].style.background = palette_colors[n].dataset.color;
            palette_container.appendChild(palette_colors[n]);
            n = null;
          }

          content_container.appendChild(color_input);
          content_container.appendChild(hex_input_label);
          content_container.appendChild(hex_input);
          content_container.appendChild(rgba);
          content_container.appendChild(palette_container);

          color_container.appendChild(color);
          rgba.appendChild(red_label);
          rgba.appendChild(green_label);
          rgba.appendChild(blue_label);
          rgba.appendChild(alpha_label);

          red_label.appendChild(red);
          green_label.appendChild(green);
          blue_label.appendChild(blue);
          alpha_label.appendChild(alpha);

          dialog.color_preview = color;
          dialog.color_input = color_input;
          dialog.palette = palette_container;

          container.className += " full-width";
        } else if (type == "incorrect-file") {
          title.innerHTML = "You selected a file with an incorrect extension (it should be .attheme)";
          ok.innerHTML = "Got it";
          ok.addEventListener("click", function() {
            dialog.container.click();
          });
        }

        if (!sessionStorage.dark) {
          document.querySelector("meta[name='theme-color']").content = "#5f5f5f";
        } else {
          document.querySelector("meta[name='theme-color']").content = "#1a1a1a";
        }

        dialog.content_container = content_container;
        if (screen.width / devicePixelRatio < 500) {
          dialog.content_container.style.maxHeight = innerHeight - 52 + "px";
          dialog.parentElement.style.paddingBottom = screen.availHeight - innerHeight + "px";
        }
        dialog.appendChild(content_container);
        dialog.appendChild(buttons_container);
        dialog.ok = ok;
        buttons_container.appendChild(ok);
        if (type != "incorrect-file") {
          buttons_container.appendChild(cancel);
        }
        document.body.appendChild(container);
        if (type == "variable-edit") {
          dialog.hex.focus();
          if (dialog.palette.offsetWidth == dialog.palette.clientWidth) {
            dialog.palette.className += " right-margin";
          }
        } else {
          dialog.ok.focus();
        }
        document.body.className += " no-overflow";
        document.body.style.paddingRight = scrollbar_width + "px";
        header.className += " full-width";
        header.style.paddingRight = scrollbar_width + "px";
        action_button.style.right = `${24 + scrollbar_width}px`;

        history.pushState(null, document.title, location.href + "#");
        history.onpushstate = close_dialog;
        onpopstate = close_dialog;
      },
      close_dialog = function(event) {
        event.preventDefault();
        dialog.container.removeEventListener("click", dialog_container_close_event);
        dialog.container.className = "window-container disappear";
        if (!sessionStorage.dark) {
          document.querySelector("meta[name='theme-color']").content = "#eee";
        } else {
          document.querySelector("meta[name='theme-color']").content = "#424242";
        }
        dialog.container.addEventListener("animationend", function() {
          if (dialog && dialog.container) {
            dialog.container.remove();
          }
          dialog = null;
        });
        document.body.className = document.body.className.replace(" no-overflow", "");
        document.body.style.paddingRight = "";
        header.className = header.className.replace(" full-width", "");
        header.style.paddingRight = "";
        action_button.style.right = "";
        history.onpushstate = null;
        onpopstate = null;
      },
      add_palette_color = function(color) {
        if (color.alpha != 0) {
          color = `#${b16(color.red)}${b16(color.green)}${b16(color.blue)}`;
          if (theme_palette.indexOf(color) == -1) {
            theme_palette.push(color);
            theme_palette = theme_palette.sort(sort_colors);
          }
        }
      },
      is_color_not_used = function(color) {
        for (let i in theme) {
          if (Color.are_the_same(theme[i], color)) {
            return;
          }
        }
        color = `#${b16(color.red)}${b16(color.green)}${b16(color.blue)}`;
        let index = theme_palette.indexOf(color);
        if (index != -1) {
          theme_palette.splice(theme_palette.indexOf(color), 1);
        }
        index = null;
      },
      generate_theme_palette = function() {
        theme_palette = [];
        for (let i in theme) {
          if (theme[i].alpha != 0) {
            let color = `#${b16(theme[i].red)}${b16(theme[i].green)}${b16(theme[i].blue)}`;

            if (theme_palette.indexOf(color) == -1) {
              theme_palette.push(color);
            }
            color = null;
          }
        }

        theme_palette = theme_palette.sort(sort_colors);
      },
      is_useless = function(variable) {
        switch(variable) {
          case "chat_mediaBroadcast":
          case "chat_outBroadcast":
            return true;
          defaut:
            return false;
        }
      },
      new_variable_element = function(name, variable_list) {
        let variable_container = create_element("li", {
              className: "workplace_variable-container",
              title: "Click to change the variable value"
            }),
            variable = create_element("button", {
              className: "workplace_variable",
              _listeners: {
                click: function() {
                  editing = name;
                  show_dialog("variable-edit");
                  this.blur();
                }
              }
            }),
            variable_name = create_element("h2", {
              className: "workplace_variable_name",
              innerHTML: name
            }),
            variable_color = create_element("p", {
              className: "workplace_variable_color",
              innerHTML: `${Color.hex(theme[name])} / ${theme[name].red}, ${theme[name].green}, ${theme[name].blue}, ${theme[name].alpha}`
            }),
            overlayed_color;

        if (theme[name].alpha != 255) {
          variable_container.className += " transparency";
        }

        variable.style.background = Color.cssrgb(theme[name]);

        if (theme[name].alpha == 255) {
          overlayed_color = theme[name];
        } else {
          if (sessionStorage.dark) {
            overlayed_color = Color.overlay(theme[name], {
              red: 42,
              green: 42,
              blue: 42
            });
          } else {
            overlayed_color = Color.overlay(theme[name], {
              red: 255,
              green: 255,
              blue: 255
            });
          }
        }

        if (Color.brightness(overlayed_color) > .75) {
          variable.className += " dark-text";
        }
        variable.appendChild(variable_name);
        variable.appendChild(variable_color);
        if (is_useless(name)) {
          variable.appendChild(create_element("p", {
            className: "workplace_variable_warning",
            innerHTML: "This variable isn't used by Telegram."
          }));
        } else if (!defaults[name]) {
          variable.appendChild(create_element("p", {
            className: "workplace_variable_warning",
            innerHTML: "This variable is not standart."
          }));
        }
        elements.variables[name] = variable;
        variable_container.appendChild(variable);
        variable_list.appendChild(variable_container);
        variable = null;
        variable_name = null;
        variable_color = null;
        overlayed_color = null;
        setTimeout(() => {
          variable_container = null;
        }, 0);
        return variable_container;
      },
      drag_hint = create_element("div", {
        className: "drag",
        innerHTML: "Drop an .attheme file here"
      });

if (!localStorage.theme) {
  set_workplace("welcome");
} else {
  set_workplace("workplace");
}

if (location.href.slice(-1) == "#") {
  history.replaceState(null, document.title, location.href.slice(0, -1));
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}

document.querySelector(".change-theme").addEventListener("click", function(event) {
  this.blur();
  if (document.body.className.indexOf("dark") + 1) {
    document.body.className = document.body.className.replace("dark", "");
    document.querySelector("meta[name='theme-color']").content = "#eee";
    localStorage.removeItem("dark");
    sessionStorage.removeItem("dark");
  } else {
    document.body.className += " dark";
    document.querySelector("meta[name='theme-color']").content = "#424242";
    localStorage.dark = true;
    sessionStorage.dark = true;
  }

  for (let i in theme) {
    if (theme[i].alpha != 255) {
      let overlayed_color;
      if (sessionStorage.dark) {
        overlayed_color = Color.overlay(theme[i], {
          red: 42,
          green: 42,
          blue: 42
        });
      } else {
        overlayed_color = Color.overlay(theme[i], {
          red: 255,
          green: 255,
          blue: 255
        });
      }

      if (Color.brightness(overlayed_color) > .75) {
        if (elements.variables[i].className.indexOf(" dark-text") == -1) {
          elements.variables[i].className += " dark-text";
        }
      } else {
        elements.variables[i].className = elements.variables[i].className.replace(" dark-text", "");
      }
      overlayed_color = null;
    }
  }
});

addEventListener("resize", function() {
  if (dialog && screen.width / devicePixelRatio < 500) {
    dialog.content_container.style.maxHeight = innerHeight - 52 + "px";
    dialog.parentElement.style.paddingBottom = screen.availHeight - innerHeight + "px";
  }
});

addEventListener("keydown", function(event) {
  if (dialog && event.key == "Escape") {
    dialog.container.click();
  }
});

addEventListener("dragenter", function() {
  drag_hint.className += " shown";
});

addEventListener("dragleave", function() {
  drag_hint.className = drag_hint.className.replace(" shown", "");
});

document.body.appendChild(drag_hint);

document.addEventListener("dragover", function(event) {
  event.preventDefault();
});

document.addEventListener("drop", function(event) {
  drag_hint.className = drag_hint.className.replace(" shown", "");
  event.preventDefault();
  for (let i = 0; i < event.dataTransfer.files.length; i++) {
    if (event.dataTransfer.files[i].name.slice(-8) == ".attheme") {
      image = false;
      theme = {};
      let reader = new FileReader();
      reader.onload = function() {
        load_theme(reader.result);
        set_workplace("workplace");
      };
      reader.readAsText(event.dataTransfer.files[i]);
      localStorage.theme_name = event.dataTransfer.files[i].name.replace(".attheme", "");

      return;
    }
  }

  show_dialog("incorrect-file");
});