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
    action_button = null,
    themeName = {
      set(name) {
        localStorage.themeName = name;
      },
      get() {
        return localStorage.themeName;
      }
    },
    reader = new FileReader();

const header = document.querySelector("header"),
      set_workplace = function(to) {
        switch(to) {
          case "welcome":
            workplace.className = "welcome";
            workplace.innerHTML = "";

            let title = createElement("h1.welcome_title", "Start working on your theme"),
                buttons_container = createElement(".welcome_buttons"),
                new_theme = createElement("button.welcome_button", {
                  innerHTML: "Create a new theme",
                  type: "button",
                  title: "Create a new empty theme"
                }, {
                  click() {
                    theme = {};
                    theme_palette = [];
                    save_theme();
                    themeName.set("Awesome theme");
                    set_workplace("workplace");
                  }
                }),
                open_theme = createElement("button.welcome_button", {
                  innerHTML: "Open an existing file",
                  type: "button",
                  title: "Select a local theme file and open it"
                }, {
                  click() {
                    file_input.click();
                  }
                }),
                copy_theme_code = createElement("button.welcome_button", {
                  innerHTML: "Put your theme's code",
                  type: "button",
                  title: "Put a theme's code"
                }, {
                  click() {
                    show_dialog("code_putting");
                  }
                }),
                file_input = createElement("input", {
                  type: "file",
                  accept: ".attheme,.attheme-editor"
                }, {
                  change() {
                    if (this.files[0].name.slice(-8) == ".attheme") {
                      reader.onload = function() {
                        load_theme(reader.result);
                        set_workplace("workplace");
                      };
                      reader.readAsText(this.files[0], "ansi");
                      themeName.set(this.files[0].name.replace(".attheme", ""));
                    } else if (this.files[0].name.slice(-15) == ".attheme-editor") {
                      reader.onload = function() {
                        let data = JSON.parse(reader.result);
                        theme = data.theme;
                        theme_palette = data.palette;
                        themeName.set(data.name);
                        localStorage.theme = JSON.stringify(theme);
                        localStorage.palette = JSON.stringify(theme_palette);
                        set_workplace("workplace");
                      };
                      reader.readAsText(this.files[0], "ansi");
                    } else {
                      show_dialog("incorrect-file");
                    }
                  }
                }),
                drop_hint = createElement("p.welcome_drop-hint", "or drop an .attheme file here");

            buttons_container.append(new_theme, open_theme, copy_theme_code);
            workplace.append(title, buttons_container, drop_hint, file_input);
            title = null;
            buttons_container = null;
            new_theme = null;
            open_theme = null;
            copy_theme_code = null;
            break;
          case "workplace":
            workplace.classList = "workplace";
            workplace.innerHTML = "";
            elements = {};

            let theme_name = createElement("input.workplace_theme-name", {
                  type: "input",
                  placeholder: "Theme name",
                  title: "Click to change your theme name",
                  autocapitalize: "words",
                  value: themeName.get()
                }, {
                  change() {
                    themeName.set(this.value);
                  },
                  keypress(event) {
                    if (event.key == "Enter") {
                      this.blur();
                    }
                  }
                }),
                buttons = createElement(".workplace_buttons"),
                download_button = createElement("button.workplace_button.download-button", {
                  type: "button",
                  title: "Download your theme"
                }, {
                  click() {
                    let file_content = "";

                    for (let i in theme) {
                      if (defaults[i] && !Color.are_the_same(theme[i], defaults[i])) {
                        let alpha = b16(theme[i].alpha),
                          red = b16(theme[i].red),
                          blue = b16(theme[i].blue),
                          green = b16(theme[i].green),
                          hex = red + green + blue,
                          int = b10(alpha + hex) << 0 + "";

                        switch(alpha) {
                          case "ff":
                            if (int.length > 7) {
                              file_content += `${i}=#${hex}\n`;
                            } else {
                              file_content += `${i}=${int}\n`;
                            }
                            break;
                          case "00":
                            file_content += i + "=0\n";
                            break;
                          default:
                            if (int.length > 9) {
                              file_content += `${i}=#${alpha + hex}\n`;
                            } else {
                              file_content += `${i}=${int}\n`;
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

                    let file = createElement("a", {
                      href: "data:text/plain;charset=ansi," + encodeURIComponent(file_content),
                      download: themeName.get() + ".attheme"
                    });
                    document.body.append(file);
                    file.click();
                    file.remove();

                    file = null;
                    file_content = null;
                  }
                }),
                download_for_editing_button = createElement("button.workplace_button", {
                  type: "button",
                  innerHTML: "Download for further editing",
                  title: "Download the theme editing file with saving all parameters for further editing but openable only in the editor"
                }, {
                  click() {
                    let file_content = JSON.stringify({
                          name: themeName.get(),
                          theme: theme,
                          palette: theme_palette
                        }),
                        file = createElement("a", {
                          href: "data:text/plain," + encodeURIComponent(file_content),
                          download: themeName.get() + ".attheme-editor"
                        });
                    document.body.append(file);
                    file.click();
                    file.remove();

                    file = null;
                    file_content = null;
                  }
                }),
                CompareWithAnotherThemeButton = createElement("button.workplace_button.green", {
                  type: "button",
                  innerHTML: "Compare with another theme",
                  title: "Go to Compare .attheme's tool with this theme as one of themes to compare"
                }, {
                  click() {
                    localStorage.openEditorTheme = true;
                    location.href = "/compare-atthemes/";
                  }
                }),
                close_button = createElement("button.workplace_button.red", {
                  type: "button",
                  innerHTML: "Close theme",
                  title: "Close the theme and start working on another one"
                }, {
                  click() {
                    show_dialog("closing_theme");
                  }
                }),
                add_variable_container = createElement(".workplace_add-variable-container"),
                add_variable_input = createElement("input.workplace_add-variable_input", {
                  placeholder: "Find or add a variable..."
                }, {
                  input() {
                    show_suggestion_list(this.value);
                  },
                  click() {
                    if (!suggestions) {
                      show_suggestion_list(this.value);
                    }
                  }
                }),
                add_variable_suggestions = createElement("ul.workplace_add-variable_suggestions"),
                variable_list = createElement("ul.workplace_variables"),
                amount = 0;
            variables_amount = createElement(".workplace_variables-amount");

            addEventListener("scroll", function() {
              if (window.scrollY >= add_variable_input.top) {
                addClass(add_variable_container, "fixed");
              } else {
                removeClass(add_variable_container, "fixed");
              }
            }, {
              passive: true
            });

            elements.variables = {};
            for (let k in theme) {
              new_variable_element(k, variable_list);
              amount++;
            }

            variables_amount.innerHTML = `${amount} of ${default_variables.length} variables are added to your theme`;

            if (image) {
              let image_removing_warning = createElement(".workplace_warning"),
                  warning_close = document.createElementNS("http://www.w3.org/2000/svg", "svg"),
                  warning_close_path = document.createElementNS("http://www.w3.org/2000/svg", "path"),
                  warning_text = createElement(".workplace_warning_text", "The theme's wallpaper will be removed after downloading. You'll need to add it with the in-app editor.");

              warning_close.setAttribute("class", "workplace_warning_close");
              warning_close.setAttribute("viewBox", "0 0 24 24");
              warning_close_path.setAttribute("d", "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z");

              warning_close.addEventListener("click", function() {
                elements.warning.remove();
                delete elements.warning;
              });

              warning_close.append(warning_close_path);
              image_removing_warning.append(warning_text, warning_close);
              workplace.append(image_removing_warning);
              elements.warning = image_removing_warning;
              image_removing_warning = null;
              warning_close = null;
              warning_close_path = null;
              warning_text = null;
            }
            buttons.append(close_button, download_for_editing_button, CompareWithAnotherThemeButton);
            add_variable_container.append(add_variable_input, add_variable_suggestions);
            workplace.append(theme_name, buttons, download_button, add_variable_container, variable_list, variables_amount);

            add_variable_input.top = add_variable_input.offsetTop;
            action_button = download_button;

            addEventListener("keydown", function(event) {
              if (event.ctrlKey && !event.shiftKey && !event.altKey && event.code == "KeyF") {
                event.preventDefault();
                scrollTo(0, add_variable_input.getBoundingClientRect().top + document.body.scrollTop);
                add_variable_input.focus();
              }
            });

            elements.theme_name = theme_name;
            elements.suggestions = add_variable_suggestions;
            elements.variable_list = variable_list;
            action_button = download_button;
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
        let container = createElement(".window-container", null, {
              click: dialog_container_close_event
            }),
            contentContainer = createElement(".window_container"),
            title = createElement("h1.window_title"),
            ok = createElement("button.window_buttons_button", {
              type: "button",
              innerHTML: "OK"
            }),
            cancel = createElement("button.window_buttons_button", {
              type: "button",
              innerHTML: "Cancel"
            }, {
              click() {
                dialog.container.click();
              }
            }),
            buttonsContainer = createElement(".window_buttons"),
            scrollbarWidth = innerWidth - document.body.clientWidth;

        dialog = createElement(".window", null, {
          click(event) {
            event.stopPropagation();
          }
        });

        dialog.container = container;
        container.append(dialog);
        contentContainer.append(title);

        switch(type) {
          case "code_putting":
            title.innerHTML = "Put your theme's code";

            let codeInput = createElement("textarea.window_textarea", {
              autofocus: true,
              placeholder: "Pur your theme's code here…"
            });

            contentContainer.append(codeInput);
            ok.addEventListener("click", function() {
              load_theme(codeInput.value);
              themeName.set("Awesome theme");
              set_workplace("workplace");
              dialog.container.click();
            });
            dialog.codeInput = codeInput;
            container.className += " full-width";
            break;
          case "closing_theme":
            title.innerHTML = "Are you sure you want to stop working on the theme and close it?";
            ok.addEventListener("click", function() {
              dialog.container.click();
              theme = {};
              image = false;
              localStorage.removeItem("theme");
              localStorage.removeItem("themeName");
              set_workplace("welcome");
            });
            break;
          case "incorrect-file":
            title.innerHTML = "You selected a file with an incorrect extension (it should be .attheme or .attheme-editor)";
            ok.innerHTML = "Got it";
            ok.addEventListener("click", function() {
              dialog.container.click();
            });
            cancel.hidden = true;
            break;
          case "variable-edit":
            title.innerHTML = editing;
            addClass(title, "monospace");
            dialog.color = new Color(theme[editing]);

            let [redInput, greenInput, blueInput] = dialog.color.create_rgb_inputs(),
                [hueInput, saturationInput, lightnessInput] = dialog.color.create_hsl_inputs(),
                hexInput = dialog.color.create_hex_input(),
                alphaInput = dialog.color.create_alpha_input(),

                hexLabel = createElement("label.window_label", "HEX"),
                redLabel = createElement("label.window_label", "Red"),
                greenLabel = createElement("label.window_label", "Green"),
                blueLabel = createElement("label.window_label", "Blue"),
                hueLabel = createElement("label.window_label", "Hue"),
                saturationLabel = createElement("label.window_label", "Saturation"),
                lightnessLabel = createElement("label.window_label", "Lightness"),
                alphaLabel = createElement("label.window_label.alpha", "Alpha"),

                hexAndAlphaFieldset = createElement(".window_fieldset"),
                rgbFieldset = createElement(".window_fieldset"),
                hslFieldset = createElement(".window_fieldset"),

                tabsContainer = createElement(".window_tab-container"),
                valuesTab = createElement(".window_tab"),
                paletteTab = createElement(".window_tab.window_palette"),

                switches = createElement(".window_tab-switches"),
                valueSwitch = createElement("button.window_tab-switch value", "Value", {
                  click() {
                    removeClass(tabsContainer, "palette");
                    addClass(tabsContainer, "inputs");
                    addClass(this, "active");
                    removeClass(paletteSwitch, "active");
                    localStorage.lastTab = "value";
                    this.blur();
                  }
                }),
                paletteSwitch = createElement("button.window_tab-switch palette", "Palette", {
                  click() {
                    removeClass(tabsContainer, "inputs");
                    addClass(tabsContainer, "palette");
                    addClass(this, "active");
                    removeClass(valueSwitch, "active");
                    localStorage.lastTab = "palette";
                    this.blur();
                  }
                }),

                colorContainer = createElement(".window_color-container"),
                color = createElement(".window_color", {
                  update() {
                    this.style.background = dialog.color.cssrgb;
                  }
                });

            contentContainer.append(colorContainer);

            get_preview(editing)
              .then(function(response) {
                let editingElement = response.tree.querySelector("." + editing);

                dialog.color.update_list.pop();
                dialog.color.update_list.push(editingElement);
                colorContainer.replaceWith(response.tree);
                response.tree.setAttribute("class", "window_preview");
                editingElement.update = function() {
                  this.style.fill = dialog.color.cssrgb;
                };
              })
              .catch(function(error) {
                if (error == "Couldn't fetch") {
                  showSnackbar("Couldn't load the variable preview. Check if you have internet connection", 5);
                }
              });

            if (localStorage.lastTab == "palette") {
              add_class(paletteSwitch, "active");
              add_class(tabsContainer, "palette");
            } else {
              add_class(valueSwitch, "active");
            }

            dialog.color.update_list.push(color);
            colorContainer.appendChild(color);
            contentContainer.append(colorContainer);

            color.style.background = dialog.color.cssrgb;
            ok.addEventListener("click", function() {
              let oldColor = theme[editing];
              theme[editing] = {
                red: dialog.color.red,
                green: dialog.color.green,
                blue: dialog.color.blue,
                alpha: dialog.color.alpha
              };
              removePaletteColor(oldColor);

              if (suggestions && suggestions[editing]) {
                addClass(suggestions[editing], "before-shadow");
                suggestions[editing].style.setProperty("--color", dialog.color.cssrgb);
              }

              let overlayColor;
              if (dialog.color.alpha == 255) {
                overlayColor = theme[editing];
              } else if (dialog.color.alpha == 0) {
                if (sessionStorage.dark) {
                  overlayColor = DARK_THEME_COLOR;
                } else {
                  overlayColor = LIGHT_THEME_COLOR;
                }
              } else {
                if (sessionStorage.dark) {
                  overlayColor = Color.overlay(theme[editing], DARK_THEME_COLOR);
                } else {
                  overlayColor = Color.overlay(theme[editing], LIGHT_THEME_COLOR);
                }
              }

              if (Color.brightness(overlayColor) > .75) {
                addClass(elements.variables[editing], "dark-text");
              } else {
                removeClass(elements.variables[editing], "dark-text");
              }

              if (dialog.color.alpha == 255) {
                removeClass(elements.variables[editing].parentElement, "transparency");
              } else {
                addClass(elements.variables[editing].parentElement, "transparency");
              }

              elements.variables[editing].style.background = dialog.color.cssrgb;
              elements.variables[editing].childNodes[1].innerHTML = `${dialog.color.hex} / ${dialog.color.red}, ${dialog.color.green}, ${dialog.color.blue}, ${dialog.color.alpha}`;
              add_palette_color(theme[editing]);
              save_theme();
              dialog.container.click();
            });

            let paletteColors = [],
                createPaletteColor = function(color, isDefault) {
                  let paletteColor = createElement("button.window_palette_color", (isDefault) ? "Default" : color, {
                        click() {
                          if (!this.oldColor) {
                            this.oldColor = dialog.color.hex;
                          }
                          let alpha = dialog.color.alpha;
                          dialog.color.hex = color;
                          dialog.color.alpha = alpha;
                          alpha = null;
                        },
                        dblclick() {
                          if (!isDefault) {
                            dialog.color.hex = this.oldColor;
                            this.oldColor = null;
                            removePaletteColor(this.innerHTML, true);
                            this.remove();
                            save_theme();
                          }
                        }
                      });

                  if (Color.brightness(color) > .75) {
                    addClass(paletteColor, "dark-color");
                  }
                  paletteColor.style.background = Color.cssrgb(color);
                  paletteColors.push(paletteColor);
                  paletteTab.append(paletteColor);
                  setTimeout(() => {
                    paletteColor = null;
                  }, 0);
                  return paletteColor;
                };

            if (editing != "chat_wallpaper" && defaults[editing]) {
              paletteColors.push(createPaletteColor(Color.hex(defaults[editing]), true));
            }

            for (let k = 0; k < theme_palette.length; k++) {
              paletteColors.push(createPaletteColor(theme_palette[k]));
            }

            switches.append(valueSwitch, paletteSwitch);
            tabsContainer.append(valuesTab, paletteTab);
            valuesTab.append(hexAndAlphaFieldset, rgbFieldset, hslFieldset);
            hexAndAlphaFieldset.append(hexLabel, alphaLabel);
            rgbFieldset.append(redLabel, greenLabel, blueLabel);
            hslFieldset.append(hueLabel, saturationLabel, lightnessLabel);

            hexLabel.append(hexInput);
            alphaLabel.append(alphaInput);
            redLabel.append(redInput);
            blueLabel.append(blueInput);
            greenLabel.append(greenInput);
            hueLabel.append(hueInput);
            saturationLabel.append(saturationInput);
            lightnessLabel.append(lightnessInput);

            contentContainer.append(switches, tabsContainer);
            addClass(container, "full-width");
            dialog.palette = paletteTab;
            dialog.hexInput = hexInput;
            break;
        }

        if (!sessionStorage.dark) {
          document.querySelector("meta[name='theme-color']").content = "#5f5f5f";
        } else {
          document.querySelector("meta[name='theme-color']").content = "#1a1a1a";
        }

        if (screen.width / devicePixelRatio < 512) {
          contentContainer.style.maxHeight = innerHeight - 52 + "px";
          dialog.container.style.paddingBottom = screen.availHeight - innerHeight + "px";
        }

        dialog.container = container;
        dialog.contentContainer = contentContainer;
        dialog.ok = ok;

        buttonsContainer.append(ok);
        if (type != "incorrect-file") {
          buttonsContainer.append(cancel);
        }

        dialog.append(contentContainer, buttonsContainer);
        document.body.append(container);

        addClass(document.body, "no-overflow");
        addClass(header, "full-width");
        document.body.style.paddingRight = scrollbarWidth + "px";
        header.style.paddingRight = scrollbarWidth + "px";
        action_button.style.right = 24 + scrollbarWidth + "px";

        if (type == "variable-edit") {
          if (localStorage.lastTab == "value") {
            dialog.hexInput.focus();
          }
          if (dialog.palette.offsetWidth == dialog.palette.clientWidth) {
            dialog.palette.className += " right-margin";
          }
        } else {
          dialog.ok.focus();
        }
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
      removePaletteColor = function(color, forcily) {
        if (!forcily) {
          for (let i in theme) {
            if (Color.are_the_same(theme[i], color)) {
              return;
            }
          }
          color = `#${b16(color.red)}${b16(color.green)}${b16(color.blue)}`;
        }
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
      isUseless = function(variable) {
        switch(variable) {
          case "chat_mediaBroadcast":
          case "chat_outBroadcast":
            return true;
          defaut:
            return false;
        }
      },
      new_variable_element = function(name, variable_list) {
        let variable_container = createElement("li.workplace_variable-container", {
              title: "Click to change the variable value"
            }),
            variable = createElement("button.workplace_variable", null, {
              click() {
                editing = name;
                show_dialog("variable-edit");
                this.blur();
              }
            }),
            variable_name = createElement("h2.workplace_variable_name", name),
            variable_color = createElement("p.workplace_variable_color", `${Color.hex(theme[name])} / ${theme[name].red}, ${theme[name].green}, ${theme[name].blue}, ${theme[name].alpha}`),
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
          addClass(variable, "dark-text");
        }

        variable.append(variable_name, variable_color);

        if (isUseless(name)) {
          variable.appendChild(createElement("p.workplace_variable_warning", "This variable isn't used by Telegram."));
        } else if (!defaults[name]) {
          variable.appendChild(createElement("p.workplace_variable_warning", "This variable is not standart."));
        }
        elements.variables[name] = variable;
        variable_container.append(variable);
        variable_list.append(variable_container);
        variable = null;
        variable_name = null;
        variable_color = null;
        overlayed_color = null;
        setTimeout(() => {
          variable_container = null;
        }, 0);
        return variable_container;
      },
      drag_hint = createElement(".drag", "Drop an .attheme file here", {
        click() {
          removeClass(this, "shown");
        }
      });

if (!localStorage.theme) {
  set_workplace("welcome");
} else {
  set_workplace("workplace");
}

if (location.href.slice(-1) == "#") {
  history.replaceState(null, document.title, location.href.slice(0, -1));
}

if (navigator.serviceWorker) {
  navigator.serviceWorker.register("service-worker.js");
}

document.querySelector(".change-theme").addEventListener("click", function(event) {
  this.blur();

  if (~document.body.className.indexOf("dark")) {
    removeClass(document.body, "dark");
    document.querySelector("meta[name='theme-color']").content = "#eee";
    localStorage.removeItem("dark");
    sessionStorage.removeItem("dark");
  } else {
    addClass(document.body, "dark");
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
        addClass(elements.variables[i], "dark-text");
      } else {
        removeClass(elements.variables[i], "dark-text");
      }
      overlayed_color = null;
    }
  }
});

addEventListener("resize", function() {
  if (dialog && screen.width / devicePixelRatio < 500) {
    dialog.contentContainer.style.maxHeight = innerHeight - 52 + "px";
    dialog.parentElement.style.paddingBottom = screen.availHeight - innerHeight + "px";
  }
});

addEventListener("keydown", function(event) {
  if (dialog && event.key == "Escape") {
    dialog.container.click();
  }
});

addEventListener("dragenter", function() {
  addClass(drag_hint, "shown");
});

addEventListener("dragleave", function(event) {
  if (event.screenX == 0 && event.screenY == 0 &&
      event.clientX == 0 && event.clientY == 0 &&
      event.pageY == 0 && event.pageY == 0) {
    removeClass(drag_hint, "shown");
  }
});

document.body.append(drag_hint);

document.addEventListener("dragover", function(event) {
  event.preventDefault();
});

document.addEventListener("drop", function(event) {
  removeClass(drag_hint, "shown");
  event.preventDefault();

  for (let i = 0; i < event.dataTransfer.files.length; i++) {
    if (event.dataTransfer.files[i].name.slice(-8) == ".attheme") {
      image = false;
      theme = {};
      reader.onload = function() {
        load_theme(reader.result);
        set_workplace("workplace");
      };
      reader.readAsText(event.dataTransfer.files[i]);
      themeName.set(event.dataTransfer.files[i].name.replace(".attheme", ""));
      return;
    } else if (event.dataTransfer.files[i].name.slice(-15) == ".attheme-editor") {
      image = false;
      theme = {};
      reader.onload = function() {
        let data = JSON.parse(reader.result);
        theme = data.theme;
        theme_palette = data.palette;
        themeName.set(data.name);
        localStorage.theme = JSON.stringify(theme);
        localStorage.palette = JSON.stringify(theme_palette);
        set_workplace("workplace");
      };
      reader.readAsText(event.dataTransfer.files[i], "ANSI");
      return;
    }
  }

  show_dialog("incorrect-file");
});

if (localStorage.theme_name) {
  themeName.set(localStorage.theme_name);
  localStorage.removeItem("theme_name");
  location.href = location.href;
}