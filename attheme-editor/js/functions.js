"use strict";

const get_preview = function(variable) {
        return new Promise(function(resolve, reject) {
          if (previews[variable]) {
            let request = fetch(`variables-previews/${previews[variable]}.svg`).then(function(response) {
              if (response.ok) {
                response.text().then(function(text) {
                  let svg = new DOMParser().parseFromString(text, "text/xml"),
                      tree = svg.querySelector("svg"),
                      changable_elements = svg.querySelectorAll("*[class]");

                  for (let i = 0; i < changable_elements.length; i++) {
                    let variable = changable_elements[i].className.baseVal;
                    changable_elements[i].style.fill = Color.cssrgb(defaults[variable]);
                  }

                  resolve({
                    color: function(colors) {
                      for (let i in colors) {
                        let elements = this.tree.querySelectorAll(`.${i}`),
                            color;

                        if (typeof(colors[i]) == "string") {
                          color = colors[i];
                        } else if (typeof(colors[i]) == "object") {
                          color = Color.cssrgb(colors[i]);
                        } else {
                          continue;
                        }

                        for (let k = 0; k < elements.length; k++) {
                          elements[k].style.fill = color;
                        }
                      }
                    },
                    tree: tree,
                    customizable_elements: changable_elements
                  });
                })
              } else {
                reject({
                  error: "Error while loading"
                })
              }
            })
          } else {
            reject({
              error: "No preview exists"
            });
          }
        });
      },
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
        return new Array(3 - number.length).join("0") + number;
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
                      alpha: defaults[this.innerHTML].alpha,
                      red: defaults[this.innerHTML].red,
                      green: defaults[this.innerHTML].green,
                      blue: defaults[this.innerHTML].blue
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
      };