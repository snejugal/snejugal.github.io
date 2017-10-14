"use strict";

const get_preview = function(variable) {
        return new Promise(function(resolve, reject) {
          if (previews[variable]) {
            let request = fetch(`variables-previews/${previews[variable]}.svg`)
                  .then((response) => {
                    if (response.ok) {
                      return response.text()
                    }
                    reject("Couldn't fetch");
                  })
                  .then(function(text) {
                    let svg = new DOMParser().parseFromString(text, "text/xml"),
                        tree = svg.querySelector("svg"),
                        changableElements = svg.querySelectorAll("*[class]");

                    for (let i = 0; i < changableElements.length; i++) {
                      let variable = changableElements[i].className.baseVal;
                      if (theme[variable]) {
                        changableElements[i].style.fill = Color.cssrgb(theme[variable]);
                      } else {
                        changableElements[i].style.fill = Color.cssrgb(defaultVariablesValues[variable]);
                      }
                      variable = null;
                    }

                    resolve({
                      tree: tree
                    })
                  }).catch(function() {
                    reject("Couldn't fetch");
                  });
          } else {
            reject("Preview doesn't exist");
          }
        });
      },
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
        return element;
      },
      // to be removed soon
      create_element = function(name, options) {
        let element = document.createElement(name);
        for (let i in options) {
          if (i != "data" && i != "_listeners") {
            element[i] = options[i];
          } else if (i == "data") {
            for (let j in options.data) {
              element.dataset[j] = options.data[j];
            }
          } else {
            for (let j in options._listeners) {
              element.addEventListener(j, options._listeners[j]);
            }
          }
        }
        return element;
      },
      b16 = function(number) {
        number = number.toString(16);
        if (number.length == 1) {
          number = "0" + number;
        }
        return number;
      },
      b10 = function(number) {
        return parseInt(number, 16);
      },
      sort_colors = function(first_color, second_color) {
        first_color = Color.hsl(first_color);
        second_color = Color.hsl(second_color);

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
      },
      show_suggestion_list = function(search) {
        elements.suggestions.innerHTML = "";
        suggestions = {};
        for (let k = 0; k < default_variables.length; k++) {
          let query = search.toLowerCase(),
              variable = default_variables[k].toLowerCase();

          while (query.indexOf("_") + 1 || variable.indexOf("_") + 1 || query.indexOf(" ") + 1 || variable.indexOf(" ") + 1) {
            query = query.replace("_", "");
            query = query.replace(" ", "");
            variable = variable.replace("_", "");
            variable = variable.replace(" ", "");
          }

          if (variable.indexOf(query) + 1) {
            suggestions[default_variables[k]] = create_element("li", {
              innerHTML: default_variables[k],
              className: "workplace_add-variable_suggestion",
              _listeners: {
                click: function() {
                  if (!theme[this.innerHTML]) {
                    variables_amount.innerHTML = `${parseInt(variables_amount.innerHTML) + 1} of ${default_variables.length} variables are added to your theme`;
                    theme[this.innerHTML] = {
                      alpha: defaultVariablesValues[this.innerHTML].alpha,
                      red: defaultVariablesValues[this.innerHTML].red,
                      green: defaultVariablesValues[this.innerHTML].green,
                      blue: defaultVariablesValues[this.innerHTML].blue
                    }
                    new_variable_element(this.innerHTML, elements.variable_list);
                  }
                  editing = this.innerHTML;
                  show_dialog("variable-edit");
                }
              }
            });

            if (theme[default_variables[k]]) {
              suggestions[default_variables[k]].style.setProperty("--color", Color.cssrgb(theme[default_variables[k]]));
              suggestions[default_variables[k]].className += " before-shadow";
            }
            elements.suggestions.appendChild(suggestions[default_variables[k]]);
            if (Object.keys(suggestions).length == 1) {
              suggestions[default_variables[k]].className += " focused";
            }
          }
        }
      },
      addClass = function(element, classToAdd) {
        let classes = element.className.split(" ");

        if (!~classes.indexOf(classToAdd)) {
          classes.push(classToAdd);
        }
        element.className = classes.join(" ");
      },
      add_class = function(element, classToAdd) {
        addClass(element, classToAdd);
      },
      removeClass = function(element, classToRemove) {
        let classes = element.className.split(" ");

        while(~classes.indexOf(classToRemove)) {
          let index = classes.indexOf(classToRemove);
          classes.splice(index, 1);
        }
        element.className = classes.join(" ");
      },
      remove_class = function(element, classToRemove) {
        removeClass(element, classToRemove);
      },
      showSnackbar = function(text, timer) {
        let snackbarContainer = create_element("div", {
              className: "snackbar-container",
              _listeners: {
                animationend() {
                  this.remove();
                }
              }
            }),
            snackbar = create_element("div", {
              className: "snackbar",
              innerHTML: text
            });

            snackbarContainer.appendChild(snackbar);
            document.body.appendChild(snackbarContainer);
      };