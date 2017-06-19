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
    i, k, j;

const set_workplace = function(to) {
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
                  _listeners: {
                    click: function() {
                      theme = {};
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
                });

            workplace.appendChild(title);
            buttons_container.appendChild(new_theme);
            buttons_container.appendChild(open_theme);
            buttons_container.appendChild(copy_theme_code);
            workplace.appendChild(buttons_container);
            workplace.appendChild(file_input);
            break;
          case "workplace":
            workplace.classList = "workplace";
            workplace.innerHTML = "";
            elements = {};
            let theme_name = create_element("input", {
                  className: "workplace_theme-name",
                  type: "input",
                  placeholder: "Theme name",
                  value: localStorage.theme_name,
                  _listeners: {
                    change: function() {
                      localStorage.theme_name = elements.theme_name.value;
                    }
                  }
                }),
                buttons = create_element("div", {
                  className: "workplace_buttons"
                }),
                download_button = create_element("button", {
                  className: "workplace_buttons_button download-button",
                  type: "button",
                  _listeners: {
                    click: function() {
                      let file_content = "";

                      for (i in theme) {
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
                    }
                  }
                }),
                close_button = create_element("button", {
                  className: "workplace_buttons_button red",
                  type: "button",
                  innerHTML: "Close theme",
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
                    keydown: function(event) {
                      setTimeout(() => {
                        elements.suggestions.innerHTML = "";
                        suggestions = [];
                        for (k = 0; k < default_variables.length; k++) {
                          let query = this.value.toLowerCase(),
                              variable = default_variables[k].toLowerCase();

                          while (query.indexOf("_") + 1 || variable.indexOf("_") + 1 || query.indexOf(" ") + 1 || variable.indexOf(" ") + 1) {
                            query = query.replace("_", "");
                            query = query.replace(" ", "");
                            variable = variable.replace("_", "");
                            variable = variable.replace(" ", "");
                          }

                          if (variable.indexOf(query) + 1) {
                            let suggestion = suggestions.push(create_element("li", {
                                  innerHTML: default_variables[k],
                                  className: "workplace_add-variable_suggestion",
                                  _listeners: {
                                    click: function() {
                                      if (!theme[this.innerHTML]) {
                                        variables_amount.innerHTML = parseInt(variables_amount.innerHTML) + 1 + " of " + default_variables.length + " variables are added to your theme";
                                        theme[this.innerHTML] = {
                                          alpha: defaults[this.innerHTML].alpha,
                                          red: defaults[this.innerHTML].red,
                                          green: defaults[this.innerHTML].green,
                                          blue: defaults[this.innerHTML].blue
                                        }
                                        let variable = create_element("li", {
                                              className: "workplace_variables_variable",
                                              _listeners: {
                                                click: function() {
                                                  editing = this.dataset.variable;
                                                  show_dialog("variable-edit");
                                                }
                                              }
                                            }),
                                            variable_name = create_element("h2", {
                                              className: "workplace_variables_variable_name",
                                              innerHTML: this.innerHTML
                                            }),
                                            variable_color = create_element("p", {
                                              className: "workplace_variables_variable_color",
                                              innerHTML: "#" + b16(theme[this.innerHTML].alpha) + b16(theme[this.innerHTML].red) + b16(theme[this.innerHTML].green) + b16(theme[this.innerHTML].blue) + " / " + theme[this.innerHTML].red + ", " + theme[this.innerHTML].green + ", " + theme[this.innerHTML].blue + ", " + theme[this.innerHTML].alpha
                                            });

                                        variable.style.background = css_rgb(theme[this.innerHTML]);
                                        if (brightness(theme[this.innerHTML]) > .75) {
                                          variable.className += " dark-text";
                                        }
                                        variable.appendChild(variable_name);
                                        variable.appendChild(variable_color);
                                        variable.dataset.variable = this.innerHTML;
                                        elements.variables[this.innerHTML] = variable;
                                        elements.variable_list.appendChild(variable);
                                      }
                                      editing = this.innerHTML;
                                      show_dialog("variable-edit");
                                    }
                                  }
                                }));

                            if (theme[default_variables[k]]) {
                              suggestions[suggestion - 1].style.setProperty("--color", css_rgb(theme[default_variables[k]]));
                              suggestions[suggestion - 1].className += " before-shadow";
                            }
                            elements.suggestions.appendChild(suggestions[suggestion - 1]);
                            if (suggestions.length == 1) {
                              suggestions[suggestion - 1].className += " focused";
                            }
                          }
                        }
                      }, 1);
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
              if (document.body.scrollTop >= 261) {
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
            for (k in theme) {
              let variable_container = create_element("li", {
                    className: "workplace_variables_variable-container"
                  }),
                  variable = create_element("div", {
                    className: "workplace_variables_variable",
                    _listeners: {
                      click: function() {
                        editing = this.dataset.variable;
                        show_dialog("variable-edit");
                      }
                    }
                  }),
                  variable_name = create_element("h2", {
                    className: "workplace_variables_variable_name",
                    innerHTML: k
                  }),
                  variable_color = create_element("p", {
                    className: "workplace_variables_variable_color",
                    innerHTML: hex(theme[k]) + " / " + theme[k].red + ", " + theme[k].green + ", " + theme[k].blue + ", " + theme[k].alpha
                  });

              if (theme[k].alpha != 255) {
                variable_container.className += " transparency";
              }

              variable.style.background = css_rgb(theme[k]);
              if (brightness(theme[k]) > .75) {
                variable.className += " dark-text";
              }
              variable.appendChild(variable_name);
              variable.appendChild(variable_color);
              if (!defaults[k]) {
                variable.appendChild(create_element("p", {
                  className: "workplace_variables_variable_warning",
                  innerHTML: "This variable is not standart."
                }));
              }
              variable.dataset.variable = k;
              elements.variables[k] = variable;
              variable_container.appendChild(variable);
              variable_list.appendChild(variable_container);
              amount++;
            }

            variables_amount.innerHTML = amount + " of " + default_variables.length + " variables are added to your theme";

            if (image) {
              let image_removing_warning = create_element("div", {
                    className: "workplace_warning",
                    innerHTML: "The wallpaper from this theme will be removed after downloading. You'll have to add it with the in-app editor."
                  }),
                  warning_close = document.createElementNS("http://www.w3.org/2000/svg", "svg"),
                  warning_close_path = document.createElementNS("http://www.w3.org/2000/svg", "path");

              warning_close.setAttribute("class", "workplace_warning_close");
              warning_close.setAttribute("viewBox", "0 0 24 24");
              warning_close.addEventListener("click", function() {
                elements.warning.remove();
                delete elements.warning;
              });
              warning_close_path.setAttribute("d", "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z");

              warning_close.appendChild(warning_close_path);
              image_removing_warning.appendChild(warning_close);
              workplace.appendChild(image_removing_warning);
              elements.warning = image_removing_warning;
            }
            buttons.appendChild(close_button);
            add_varaible_container.appendChild(add_varaible_input);
            add_varaible_container.appendChild(add_varaible_suggestions);
            workplace.appendChild(theme_name);
            workplace.appendChild(buttons);
            workplace.appendChild(add_varaible_container);
            workplace.appendChild(variable_list);
            workplace.appendChild(variables_amount);
            workplace.appendChild(download_button);

            addEventListener("keydown", function(event) {
              if (event.ctrlKey && !event.shiftKey && event.code == "KeyF") {
                event.preventDefault();
                scrollTo(0, document.querySelector(".workplace_add-variable_input").getBoundingClientRect().top + document.body.scrollTop);
                document.querySelector(".workplace_add-variable_input").focus();
              }
            });

            elements.theme_name = theme_name;
            elements.suggestions = add_varaible_suggestions;
            elements.variable_list = variable_list;

            if (image) {
              elements.warning = elements.warning;
            }
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
        save_theme();
        generate_theme_palette();
      },
      save_theme = function() {
        localStorage.theme = JSON.stringify(theme);
        generate_theme_palette();
        localStorage.palette = JSON.stringify(theme_palette);
      },
      show_dialog = function(type) {
        let container = create_element("div", {
              className: "window-container",
              _listeners: {
                click: function(event) {
                  close_dialog(event);
                  history.back();
                }
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
          title.innerHTML = editing.split("").join("<wbr>");
          let hex_input = create_element("input", {
                className: "window_input",
                placeholder: "#aarrggbb",
                id: "hex",
                value: hex(theme[editing]),
                _listeners: {
                  keydown: function(event) {
                    setTimeout(() => {
                      if (event.key != "Enter") {
                        change_rgba_values(this);
                      } else {
                        dialog.ok.click();
                      }
                    }, 1)
                  },
                  paste: function() {
                    setTimeout(function() {
                      change_rgba_values(hex_input);
                    }, 1);
                  }
                }
              }),
              hex_input_label = create_element("label", {
                for: "hex",
                className: "window_label",
                innerHTML: "HEX value"
              }),
              red_label = create_element("label", {
                for: "red",
                className: "window_label",
                innerHTML: "Red"
              }),
              green_label = create_element("label", {
                for: "green",
                className: "window_label",
                innerHTML: "Green"
              }),
              blue_label = create_element("label", {
                for: "blue",
                className: "window_label",
                innerHTML: "Blue"
              }),
              alpha_label = create_element("label", {
                for: "alpha",
                className: "window_label",
                innerHTML: "Alpha"
              }),
              rgba = create_element("div", {
                className: "window_fieldset"
              }),
              red = create_element("input", {
                type: "number",
                className: "window_input",
                max: "255",
                min: "0",
                placeholder: (theme[editing].red !== undefined) ? theme[editing].red : Math.floor(Math.random() * 256),
                id: "red",
                value: (theme[editing].red !== undefined) ? theme[editing].red : Math.floor(Math.random() * 256),
                _listeners: {
                  keydown: function(event) {
                    setTimeout(function() {
                      if (this.value > 255) {
                        this.value = 255;
                      } else if (this.value < 0) {
                        this.value = 0;
                      }
                      change_value(dialog);
                    }, 1);
                  },
                  change: function(event) {
                    setTimeout(function() {
                      if (this.value > 255) {
                        this.value = 255;
                      } else if (this.value < 0) {
                        this.value = 0;
                      }
                      change_value(dialog);
                    }, 1);
                  }
                }
              }),
              green = create_element("input", {
                type: "number",
                className: "window_input",
                max: "255",
                min: "0",
                placeholder: (theme[editing].green !== undefined) ? theme[editing].green : Math.floor(Math.random() * 256),
                id: "green",
                value: (theme[editing].green !== undefined) ? theme[editing].green : Math.floor(Math.random() * 256),
                _listeners: {
                  keydown: function(event) {
                    setTimeout(function() {
                      if (this.value > 255) {
                        this.value = 255;
                      } else if (this.value < 0) {
                        this.value = 0;
                      }
                      change_value(dialog);
                    }, 1);
                  },
                  change: function(event) {
                    setTimeout(function() {
                      if (this.value > 255) {
                        this.value = 255;
                      } else if (this.value < 0) {
                        this.value = 0;
                      }
                      change_value(dialog);
                    }, 1);
                  }
                }
              }),
              blue = create_element("input", {
                type: "number",
                className: "window_input",
                max: "255",
                min: "0",
                placeholder: (theme[editing].blue !== undefined) ? theme[editing].blue : Math.floor(Math.random() * 256),
                id: "blue",
                value: (theme[editing].blue !== undefined) ? theme[editing].blue : Math.floor(Math.random() * 256),
                _listeners: {
                  keydown: function(event) {
                    setTimeout(function() {
                      if (this.value > 255) {
                        this.value = 255;
                      } else if (this.value < 0) {
                        this.value = 0;
                      }
                      change_value(dialog);
                    }, 1);
                  },
                  change: function(event) {
                    setTimeout(function() {
                      if (this.value > 255) {
                        this.value = 255;
                      } else if (this.value < 0) {
                        this.value = 0;
                      }
                      change_value(dialog);
                    }, 1);
                  }
                }
              }),
              alpha = create_element("input", {
                type: "number",
                className: "window_input",
                max: "255",
                min: "0",
                placeholder: (theme[editing].alpha !== undefined) ? theme[editing].alpha : Math.floor(Math.random() * 256),
                id: "alpha",
                value: (theme[editing].alpha !== undefined) ? theme[editing].alpha : Math.floor(Math.random() * 256),
                _listeners: {
                  keydown: function(event) {
                    setTimeout(function() {
                      if (this.value > 255) {
                        this.value = 255;
                      } else if (this.value < 0) {
                        this.value = 0;
                      }
                      change_value(dialog);
                    }, 1);
                  },
                  change: function(event) {
                    setTimeout(function() {
                      if (this.value > 255) {
                        this.value = 255;
                      } else if (this.value < 0) {
                        this.value = 0;
                      }
                      change_value(dialog);
                    }, 1);
                  }
                }
              }),
              color_container = create_element("div", {
                className: "window_color-container"
              }),
              color = create_element("div", {
                className: "window_color",
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
              }),
              preview;

          content_container.appendChild(color_container);

          get_preview(editing, function(response) {
            if (!response.error) {
              preview = response;
              content_container.insertBefore(preview.element, color_container);
              preview.element.setAttribute("class", "window_preview");
              preview.element.removeAttribute("height");
              color_container.remove();
              preview.color(theme);
              dialog.preview = preview;
            }
          });

          color.style.background = css_rgb(theme[editing]);

          dialog.red = red;
          dialog.green = green;
          dialog.blue = blue;
          dialog.alpha = alpha;
          dialog.hex = hex_input;
          ok.addEventListener("click", function() {
            theme[editing] = {
              alpha: +dialog.alpha.value,
              red: +dialog.red.value,
              green: +dialog.green.value,
              blue: +dialog.blue.value
            }

            if (brightness(theme[editing]) > .75) {
              if (!(elements.variables[editing].className.indexOf(" dark-text") + 1)) {
                elements.variables[editing].className += " dark-text";
              }
            } else {
              elements.variables[editing].className = elements.variables[editing].className.replace(" dark-text", "");
            }

            if (theme[editing].alpha != 255) {
              if (!(elements.variables[editing].parentElement.className.indexOf(" transparency") + 1)) {
                elements.variables[editing].parentElement.className += " transparency";
              }
            } else {
              elements.variables[editing].parentElement.className = elements.variables[editing].parentElement.className.replace(" transparency", "");
            }

            elements.variables[editing].style.background = css_rgb(theme[editing]);
            elements.variables[editing].childNodes[1].innerHTML = hex(theme[editing]) + " / " + theme[editing].red + ", " + theme[editing].green + ", " + theme[editing].blue + ", " + theme[editing].alpha;
            save_theme();
            dialog.container.click();
          });

          let palette_colors = [];

          if (editing != "chat_wallpaper" && defaults[editing]) {
            palette_colors.push(create_element("div", {
              className: "window_palette_color",
              innerHTML: "Default",
              data: {
                color: hex(defaults[editing])
              },
              _listeners: {
                click: function() {
                  alpha.value = b10(this.dataset.color.slice(1, 3));
                  red.value = b10(this.dataset.color.slice(3, 5));
                  green.value = b10(this.dataset.color.slice(5, 7));
                  blue.value = b10(this.dataset.color.slice(7, 9));
                  change_value();
                }
              }
            }));

            if (brightness(defaults[editing]) > .75) {
              palette_colors[0].className += " dark-color";
            }
            palette_colors[0].style.background = css_rgb(defaults[editing]);
            palette_container.appendChild(palette_colors[0]);
          }

          for (k = 0; k < theme_palette.length; k++) {
            let n = palette_colors.push(create_element("div", {
                  className: "window_palette_color",
                  innerHTML: theme_palette[k],
                  data: {
                    color: theme_palette[k]
                  },
                  _listeners: {
                    click: function() {
                      red.value = b10(this.dataset.color.slice(1, 3));
                      green.value = b10(this.dataset.color.slice(3, 5));
                      blue.value = b10(this.dataset.color.slice(5, 7));
                      change_value();
                    }
                  }
                })) - 1;

            if (brightness({
                  red: b10(theme_palette[k].slice(1, 3)),
                  green: b10(theme_palette[k].slice(3, 5)),
                  blue: b10(theme_palette[k].slice(5, 7))
                }) > .75) {
              palette_colors[n].className += " dark-color";
            }
            palette_colors[n].style.background = palette_colors[n].dataset.color;
            palette_container.appendChild(palette_colors[n]);
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

          dialog.color = color;
          dialog.color_input = color_input;

          container.className += " full-width";
        } else if (type == "incorrect-file") {
          title.innerHTML = "You selected a file with an incorrect extension (it should be .attheme)";
          ok.innerHTML = "Got it";
          ok.addEventListener("click", function() {
            dialog.container.click();
          });
        }

        if (!localStorage.dark || !sessionStorage.dark) {
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
        document.body.className += " no-overflow";
        document.body.style.paddingRight = scrollbar_width + "px";
        history.pushState(null, document.title, location.href + "#");
        history.onpushstate = close_dialog;
        onpopstate = close_dialog;
      },
      close_dialog = function(event) {
        event.preventDefault();
        dialog.container.className = "window-container disappear";
        if (!localStorage.dark || !sessionStorage.dark) {
          document.querySelector("meta[name='theme-color']").content = "#eee";
        } else {
          document.querySelector("meta[name='theme-color']").content = "#424242";
        }
        dialog.container.addEventListener("animationend", function() {
          if (dialog.container) {
            dialog.container.remove();
          }
          delete dialog.container;
          delete dialog.code_input;
          document.body.className = document.body.className.replace(" no-overflow", "");
          document.body.style.paddingRight = 0;
        });
        history.onpushstate = null;
        onpopstate = null;
      },
      change_value = function() {
        dialog.hex.value = hex({
          red: +dialog.red.value,
          green: +dialog.green.value,
          blue: +dialog.blue.value,
          alpha: +dialog.alpha.value
        });
        if (!dialog.preview) {
          dialog.color.style.background = css_rgb({
            red: +dialog.red.value,
            green: +dialog.green.value,
            blue: +dialog.blue.value,
            alpha: +dialog.alpha.value
          });
        } else {
          let recolor = {};
          recolor[editing] = css_rgb({
            red: +dialog.red.value,
            green: +dialog.green.value,
            blue: +dialog.blue.value,
            alpha: +dialog.alpha.value
          });
          dialog.preview.color(recolor);
        }
        dialog.color_input.value = "#" + b16(+dialog.red.value) + b16(+dialog.green.value) + b16(+dialog.blue.value);
      },
      generate_theme_palette = function() {
        theme_palette = [];
        for (i in theme) {
          if (theme[i].alpha != 0) {
            let color = "#" + b16(theme[i].red) + b16(theme[i].green) + b16(theme[i].blue),
                already_in_palette = false;
            for (k = 0; k < theme_palette.length; k++) {
              if (theme_palette[k] == color) {
                already_in_palette = true;
                break;
              }
            }

            if (!already_in_palette) {
              theme_palette.push(color);
            }
          }
        }

        theme_palette = theme_palette.sort(function(first_color, second_color) {
          first_color = to_hsl(first_color);
          second_color = to_hsl(second_color);

          if (first_color.hue > second_color.hue) {
            return -1;
          } else if (first_color.hue < second_color.hue) {
            return 1;
          } else if (first_color.saturation > second_color.saturation) {
            return -1;
          } else if (first_color.saturation < second_color.saturation) {
            return 1;
          } else if (first_color.lightness > second_color.lightness) {
            return -1;
          } else if (first_color.lightness < second_color.lightness) {
            return 1;
          } else {
            return 0;
          }
        });
      },
      change_rgba_values = function(hex_input) {
        if (hex_input.value.slice(0, 1) != "#" && hex_input.value.length != 0) {
          hex_input.value = "#" + hex_input.value;
        }

        for (i = 1; i < hex_input.value.length; i++) {
          if (b10(hex_input.value[i]) != b10(hex_input.value[i])) {
            hex_input.value = hex_input.value.slice(0, i);
          }
        }

        if (hex_input.value.length == 9) {
          dialog.alpha.value = b10(hex_input.value.slice(1, 3));
          dialog.red.value = b10(hex_input.value.slice(3, 5));
          dialog.green.value = b10(hex_input.value.slice(5, 7));
          dialog.blue.value = b10(hex_input.value.slice(7, 9));
        } else {
          dialog.alpha.value = 255;
          dialog.red.value = 0;
          dialog.green.value = 0;
          dialog.blue.value = 0;
          if (hex_input.value.length > 2) {
            dialog.red.value = b10(hex_input.value.slice(1, 3));
          }
          if (hex_input.value.length > 4) {
            dialog.green.value = b10(hex_input.value.slice(3, 5));
          }
          if (hex_input.value.length > 6) {
            dialog.blue.value = b10(hex_input.value.slice(5, 7));
          }
        }
        if (!dialog.preview) {
          dialog.color.style.background = css_rgb({
            red: +dialog.red.value,
            green: +dialog.green.value,
            blue: +dialog.blue.value,
            alpha: +dialog.alpha.value
          });
        } else {
          let recolor = {};
          recolor[editing] = css_rgb({
            red: +dialog.red.value,
            green: +dialog.green.value,
            blue: +dialog.blue.value,
            alpha: +dialog.alpha.value
          });
          dialog.preview.color(recolor);
        }
        dialog.color_input.value = "#" + b16(+dialog.red.value) + b16(+dialog.green.value) + b16(+dialog.blue.value);
      };

if (!localStorage.theme) {
  set_workplace("welcome");
} else {
  set_workplace("workplace");
}

if (location.href.slice(-2) == "/#") {
  history.replaceState(null, document.title, location.href.slice(0, -2));
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}

document.querySelector(".change-theme").addEventListener("click", function(event) {
  event.preventDefault();
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
});

addEventListener("resize", function() {
  if (dialog && screen.width / devicePixelRatio < 500) {
    dialog.content_container.style.maxHeight = innerHeight - 52 + "px";
    dialog.parentElement.style.paddingBottom = screen.availHeight - innerHeight + "px";
  }
});