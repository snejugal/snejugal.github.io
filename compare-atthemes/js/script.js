"use strict";

let themes = [],
    elements = {},
    compareResults = {
      areSimilar: {}
    };

const IMAGE_KEY = Symbol("image"),
      NAME_KEY = Symbol("name"),
      b10 = (number) => parseInt(number, 16),
      b16 = (number) => {
        if (number !== undefined && number !== null) {
          number = number.toString(16);
          if (number.length == 1) {
            number = "0" + number;
          }
          return number;
        }
      },
      overlay = function(color) {
        let alpha = color.alpha / 255;
        return {
          red: alpha * (color.red - 255) + 255,
          green: alpha * (color.green - 255) + 255,
          blue: alpha * (color.blue - 255) + 255
        };
      },
      brightness = (color) => .2126 * (color.red / 255) + .7152 * (color.green / 255) + .0722 * (color.blue / 255),
      cssrgb = (color) => `rgba(${color.red}, ${color.green}, ${color.blue}, ${color.alpha / 255})`,
      hex = (color) => `#${b16(color.alpha)}${b16(color.red)}${b16(color.green)}${b16(color.blue)}`,
      createElement = function(name, attributes, listeners) {
        let elementName, classes = "";
        if (~name.indexOf(".")) {
          classes = name.slice(name.indexOf(".") + 1).split(".").join(" ");
          elementName = name.slice(0, name.indexOf("."));
          if (!elementName) {
            elementName = "div";
          }
        } else {
          elementName = name;
        }
        let element = document.createElement(elementName);
        element.className = classes;

        if (attributes) {
          if (typeof attributes == "object") {
            for (let i in attributes) {
              element[i] = attributes[i];
            }
          } else {
            element.innerHTML = attributes;
          }
        }

        if (listeners) {
          for (let i in listeners) {
            element.addEventListener(i, listeners[i]);
          }
        }

        setTimeout(function() {
          elementName = null;
          classes = null;
          element = null;
          name = null;
          attributes = null;
          listeners = null;
        }, 0);
        return element;
      },
      parseThemeFile = function(text) {
        return new Promise(function(resolve) {
          let rows = text.split("\n"),
              theme = {};

          for (let i = 0; i < variables.length; i++) {
            theme[variables[i]] = defaultVariableValues[variables[i]];
          }

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

              if (defaultVariableValues[variable]) {
                theme[variable] = {
                  alpha: b10(value.slice(0, 2)),
                  red: b10(value.slice(2, 4)),
                  green: b10(value.slice(4, 6)),
                  blue: b10(value.slice(6, 8))
                };
              }

              row = null;
              variable = null;
              value = null;
            } else if (rows[i] == "WPS") {
              theme[IMAGE_KEY] = rows.slice(i).join("\n");
              break;
            }
          }
          resolve(theme);
          rows = null;
          theme = null;
          text = null;
        });
      },
      loadThemes = function(files) {
        elements.openThemesButton.classList.add("loading");
        elements.openThemesButtonInput.disabled = true;
        let themesCount = themes.length;
        for (let i = 0; i < files.length; i++) {
          if (files[i].name.slice(-8) == ".attheme") {
            themesCount++;

            let reader = new FileReader();
            reader.onload = function() {
              parseThemeFile(reader.result).then(function(theme) {
                theme[NAME_KEY] = files[i].name.slice(0, -8);
                themes.push(theme);

                if (themesCount == themes.length) {
                  if (themesCount == 1) {
                    elements.openThemesButton.classList.add("end");
                    document.body.classList.add("disappear");
                    setTimeout(function() {
                      document.body.className = "";
                    }, 1000);
                    setTimeout(function() {
                      setBody("selectAnotherTheme");
                    }, 1250);
                  } else if (themesCount >= 2) {
                    elements.openThemesButton.classList.add("end");
                    document.body.classList.add("disappear");
                    setTimeout(function() {
                      setBody("bitLoading");
                      compareThemes();
                    }, 1250);
                  } else if (themesCount == 0) {
                    elements.openThemesButton.shake();
                    elements.openThemesButton.innerHTML = "Please select two files with .attheme extension";
                    elements.openThemesButtonInput.disabled = false;
                  }
                }
              });
            };
            reader.readAsText(files[i]);
            if (themesCount >= 2) {
              break;
            }
          }
        }
      },
      compareThemes = async function() {
        let similarVariablesAmount = 0;

        for (let i = 0; i < variables.length; i++) {
          let key = variables[i];

          if (key == "chat_wallpaper") {
            if (themes[0][IMAGE_KEY] && themes[1][IMAGE_KEY]) {
              if (themes[0][IMAGE_KEY] == themes[1][IMAGE_KEY]) {
                compareResults.areChatWallpapersTheSame = true;
              } else {
                compareResults.areChatWallpapersTheSame = false;
              }
            } else if (themes[0][IMAGE_KEY] || themes[1][IMAGE_KEY]) {
              compareResults.areChatWallpapersTheSame = false;
            }
          }

          let red = [themes[0][key].red, themes[1][key].red],
              green = [themes[0][key].green, themes[1][key].green],
              blue = [themes[0][key].blue, themes[1][key].blue],
              alpha = [themes[0][key].alpha, themes[1][key].alpha],
              difference = Math.sqrt((red[1] - red[0]) ** 2 + (green[1] - green[0]) ** 2 + (blue[1] - blue[0]) ** 2 + (alpha[1] - alpha[0]) ** 2);
              console.log(key, difference);

          if (difference < 100) {
            compareResults.areSimilar[key] = true;
            similarVariablesAmount++;
          } else {
            compareResults.areSimilar[key] = false;
          }
        }
        compareResults.similarAmount = similarVariablesAmount;
        compareResults.similarPercentage = similarVariablesAmount / variables.length;
        setBody("compareResults");
      },
      setBody = function(name) {
        elements = {};
        document.body.innerHTML = "";
        document.body.className = "";
        if (name == "selectAnotherTheme") {
          let awesomeWords = ["Awesome", "Cool", "Excellent", "Good", "Beautiful"],
              randomWord = awesomeWords[Math.floor(Math.random() * 5)],
              title = createElement("h1.welcome-screen__title", randomWord + "! Now select another theme"),
              openThemesLabel = createElement("label.welcome-screen__button", {
                innerHTML: "Select another theme",
                htmlFor: "open-themes",
                shake() {
                  let stopShaking = function() {
                    this.classList.remove("shaking");
                    this.removeEventListener("animationend", stopShaking);
                  };

                  this.classList.add("shaking");
                  this.addEventListener("animationend", stopShaking);
                }
              }),
              openThemesInput = createElement("input.welcome-screen__select-input", {
                type: "file",
                accept: ".attheme",
                id: "open-themes",
                multiple: true
              }, {
                click() {
                  this.blur();
                },
                change() {
                  loadThemes(this.files);
                }
              });

          document.body.append(title, openThemesInput, openThemesLabel);
          document.body.classList.add("welcome-screen", "select-another-theme");
          elements.openThemesButton = openThemesLabel;
          elements.openThemesButtonInput = openThemesInput;
        } else if (name == "welcome") {
          let title = createElement("h1.welcome-screen__title", "Compare .attheme's", {
                click(event) {
                  event.preventDefault();
                }
              }),
              description = createElement("p.welcome-screen__description", "Seen a theme that looks like someone else's one or even yours? This tool will help you find out whether they are the same.", {
                click(event) {
                  event.preventDefault();
                }
              }),
              openThemesLabel = createElement("label.welcome-screen__button", {
                innerHTML: "Select two themes",
                htmlFor: "open-themes",
                shake() {
                  let stopShaking = function() {
                    this.classList.remove("shaking");
                    this.removeEventListener("animationend", stopShaking);
                  };

                  this.classList.add("shaking");
                  this.addEventListener("animationend", stopShaking);
                }
              }),
              openThemesInput = createElement("input.welcome-screen__select-input", {
                type: "file",
                accept: ".attheme",
                id: "open-themes",
                multiple: true
              }, {
                click() {
                  this.blur();
                },
                change() {
                  loadThemes(this.files);
                }
              });

          document.body.append(title, description, openThemesInput, openThemesLabel);
          elements.openThemesButton = openThemesLabel;
          elements.openThemesButtonInput = openThemesInput;
          document.body.classList.add("welcome-screen");
          title = null;
          description = null;
          openThemesInput = null;
          openThemesLabel = null;
        } else if (name == "bitLoading") {
          let bitsContainer = createElement(".bits-container", "Comparing themes...<br>"),
              bits = [0, 1],
              addBit = async function() {
                bitsContainer.innerHTML += bits[Math.floor(Math.random() * 2)];
              };
          window.addBitTimer = setInterval(async function() {
            addBit();
          }, 100);
          window.clearBitsTimer = setInterval(async function() {
            bitsContainer.innerHTML = "Comparing themes...<br>";
          }, 10000);

          document.body.append(bitsContainer);
          document.body.className = "bit-loading";
        } else if (name == "compareResults") {
          let title = createElement("h1.compare-results__title", `Compare result: ${Math.round(compareResults.similarPercentage * 10000) / 100}% (${compareResults.similarAmount} of ${variables.length})`),
              comparedThemes = createElement("p.compare-results__text", `Compared themes: ${themes[0][NAME_KEY]} and ${themes[1][NAME_KEY]}`),
              tableContainer = createElement(".compare-results__table-container"),
              table = createElement(".compare-results__table");

          let header = createElement(".compare-resutls__table--row.header"),
              variableNameCell = createElement(".compare-results__table--cell.variable", "Variable"),
              firstThemeCell = createElement(".compare-results__table--cell.color", themes[0][NAME_KEY]),
              secondThemeCell = createElement(".compare-results__table--cell.color", themes[1][NAME_KEY]),
              areSimilarCell = createElement(".compare-results__table--cell.are-similar", "Are similar?");
          header.append(variableNameCell, firstThemeCell, secondThemeCell, areSimilarCell);
          table.append(header);

          for (let i = 0; i < variables.length; i++) {
            let key = variables[i],
                row = createElement(".compare-resutls__table--row"),
                variableNameCell = createElement(".compare-results__table--cell.variable", key),
                firstThemeColorCell = createElement(".compare-results__table--cell.color"),
                secondThemeColorCell = createElement(".compare-results__table--cell.color"),
                areSimilarCell = createElement(".compare-results__table--cell.are-similar");

            if (key == "chat_wallpaper") { continue; }

            if (brightness(overlay(themes[0][key])) > .75) {
              firstThemeColorCell.classList.add("dark-text");
            }

            if (brightness(overlay(themes[1][key])) > .75) {
              secondThemeColorCell.classList.add("dark-text");
            }

            if (compareResults.areSimilar[key]) {
              areSimilarCell.classList.add("true");
            } else {
              areSimilarCell.classList.add("false");
            }

            firstThemeColorCell.dataset.hex = hex(themes[0][key]);
            secondThemeColorCell.dataset.hex = hex(themes[1][key]);
            firstThemeColorCell.style.setProperty("--color", cssrgb(themes[0][key]));
            secondThemeColorCell.style.setProperty("--color", cssrgb(themes[1][key]));
            row.append(variableNameCell, firstThemeColorCell, secondThemeColorCell, areSimilarCell);
            table.append(row);
          }
          tableContainer.append(table);
          document.body.append(comparedThemes, title, tableContainer);
        }
      },
      openEditorTheme = function() {
        localStorage.openEditorTheme = false;
        let editorTheme = JSON.parse(localStorage.theme);
        for (let i = 0; i < variables.length; i++) {
          let key = variables[i];
          if (!editorTheme[key]) {
            editorTheme[key] = defaultVariableValues[key];
          }
        }
        editorTheme[NAME_KEY] = localStorage.themeName;
        themes.push(editorTheme);

        setBody("selectAnotherTheme");
      };