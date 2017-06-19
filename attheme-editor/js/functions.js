"use strict";

const get_preview = function(variable, callback) {
        let request = fetch("variables-previews/" + variable + ".svg").then(function(response) {
              if (response.ok) {
                response.text().then(function(text) {
                  let svg = new DOMParser().parseFromString(text, "text/xml"),
                      tree = svg.querySelector("svg"),
                      changable_elements = svg.querySelectorAll("*[class]");

                  for (let i = 0; i < changable_elements.length; i++) {
                    let variable = changable_elements[i].className.baseVal;
                    changable_elements[i].style.fill = css_rgb(defaults[variable]);
                  }

                  callback({
                    color: function(colors) {
                      for (let i in colors) {
                        let elements = this.element.querySelectorAll("." + i),
                            color;

                        if (typeof(colors[i]) == "string") {
                          color = colors[i];
                        } else if (typeof(colors[i]) == "object") {
                          color = css_rgb(colors[i]);
                        } else {
                          continue;
                        }

                        for (let k = 0; k < elements.length; k++) {
                          elements[k].style.fill = color;
                        }
                      }
                    },
                    element: tree
                  });
                })
              } else {
                return {
                  error: true
                };
              }
            });
      },
      create_element = function(name, options) {
        let element = document.createElement(name);
        for (i in options) {
          if (i != "data" && i != "_listeners") {
            element[i] = options[i];
          } else if (i == "data") {
            for (j in options.data) {
              element.dataset[j] = options.data[j];
            }
          } else {
            for (j in options._listeners) {
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
      to_hsl = function(hex) {
        let red = b10(hex.slice(1, 3)) / 255,
            green = b10(hex.slice(3, 5)) / 255,
            blue = b10(hex.slice(5, 7)) / 255,
            min = Math.min(red, green, blue),
            max = Math.max(red, green, blue),
            lightness = .5 * (max + min),
            saturation = (max - min) / (1 - Math.abs(1 - (max + min))),
            hue;

        if (saturation != saturation) {
          saturation = 0;
        }

        if (max == min) {
          hue = 0;
        } else if (max == red && green >= blue) {
          hue = 60 * ((green - blue) / (max - min));
        } else if (max == red && green < blue) {
          hue = 60 * ((green - blue) / (max - min)) + 360;
        } else if (max == green) {
          hue = 60 * ((blue - red) / (max - min)) + 120;
        } else if (max == blue) {
          hue = 60 * ((red - green) / (max - min)) + 240;
        }

        if (max == 0) {
          saturation = 0;
        } else {
          saturation = 1 - (min / max);
        }

        return {
          hue: Math.round(hue),
          saturation: Math.round(saturation * 100) / 100,
          lightness: Math.round(lightness * 100) / 100
        };
      },
      brightness = function(color) {
        let alpha = (color.alpha !== undefined) ? color.alpha / 255 : 1;
        return (alpha) ? ((.2126 * color.red + .7152 * color.green + .0722 * color.blue) / alpha) / 255 : 255;
      },
      b10 = function(number) {
        return parseInt(number, 16);
      },
      css_rgb = function(color) {
        let alpha = (color.alpha !== undefined) ? color.alpha : 255;
        return "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (alpha / 255) + ")";
      },
      hex = function(color) {
        let alpha = (color.alpha !== undefined) ? color.alpha : 255;
        return "#" + b16(color.alpha) + b16(color.red) + b16(color.green) + b16(color.blue);
      };