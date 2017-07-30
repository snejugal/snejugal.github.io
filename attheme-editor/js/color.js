"use strict";

const Color = function(color_) {
  if (typeof color_ == "object" &&
      color_.red !== undefined &&
      color_.green !== undefined &&
      color_.blue !== undefined) {

    let color = {};
    for (let i in color_) {
      color[i] = color_[i];
    }

    let hsl = Color.hsl(color);
    color.hue = hsl.hue;
    color.saturation = hsl.saturation;
    color.lightness = hsl.lightness;
    color.brightness = Color.brightness(color);
    color.alpha = (color.alpha !== undefined) ? color.alpha : 255;
    color.cssrgb = Color.cssrgb(color);
    color.hex = Color.hex(color);
    color.update_list = [];

    color.create_hex_input = function(options = {}) {
      let input = create_element("input", {
            placeholder: "#aarrggbb",
            value: this.hex || "",
            className: "window_input",
            type: "text",
            color: this,
            update: function() {
              this.value = this.color.hex;
            },
            _listeners: {
              input: function() {
                if (this.value[0] != "#") {
                  this.value = "#" + this.value;
                }

                for (let i = 1; i < this.value.length; i++) {
                  if (!this.value[i].match(/[a-f0-9]/i)) {
                    this.value = this.value.split().splice(i, 1).join();
                    i--;
                  }
                }
                this.color.hex = this.value;
              },
              keypress: function(event) {
                if (this.value.length > 8 || !event.key.match(/[#a-f0-9]/i)) {
                  event.preventDefault();
                }

                if (event.key == "Enter") {
                  dialog.ok.click();
                }
              }
            }
          });

      color.update_list.push(input);
      setTimeout(() => {
        input = null;
      }, 0);
      return input;
    };

    color.create_rgb_inputs = function(options = {}) {
      let red = create_element("input", {
            placeholder: this.red,
            value: this.red,
            className: "window_input",
            color: this,
            type: "number",
            max: 255,
            min: 0,
            update: function() {
              this.value = this.color.red;
            },
            _listeners: {
              input: function() {
                if (+this.value < 0) { this.value = 0; }
                if (+this.value > 255) { this.value = 255; }
                this.color.red = +this.value;
              },
              keypress: function(event) {
                if (!event.key.match(/\d/i)) {
                  event.preventDefault();
                }
                if (event.key == "Enter") {
                  this.parentElement.nextSibling.childNodes[1].focus();
                }
              }
            }
          }),
          green = create_element("input", {
            placeholder: this.green,
            value: this.green,
            className: "window_input",
            color: this,
            type: "number",
            max: 255,
            min: 0,
            update: function() {
              this.value = this.color.green;
            },
            _listeners: {
              input: function() {
                if (+this.value < 0) { this.value = 0; }
                if (+this.value > 255) { this.value = 255; }
                this.color.green = +this.value;
              },
              keypress: function(event) {
                if (!event.key.match(/\d/i)) {
                  event.preventDefault();
                }
                if (event.key == "Enter") {
                  this.parentElement.nextSibling.childNodes[1].focus();
                }
              }
            }
          }),
          blue = create_element("input", {
            placeholder: this.blue,
            value: this.blue,
            className: "window_input",
            color: this,
            type: "number",
            max: 255,
            min: 0,
            update: function() {
              this.value = this.color.blue;
            },
            _listeners: {
              input: function() {
                if (+this.value < 0) { this.value = 0; }
                if (+this.value > 255) { this.value = 255; }
                this.color.blue = +this.value;
              },
              keypress: function(event) {
                if (!event.key.match(/\d/i)) {
                  event.preventDefault();
                }
                if (event.key == "Enter") {
                  dialog.ok.focus();
                }
              }
            }
          });

      color.update_list.push(red, green, blue);
      setTimeout(() => {
        red = null;
        green = null;
        blue = null;
      }, 0);
      return [red, green, blue];
    };
    color.create_hsl_inputs = function(options = {}) {
      let hue = create_element("input", {
            placeholder: Math.round(this.hue),
            value: Math.round(this.hue),
            className: "window_input",
            color: this,
            type: "number",
            max: 360,
            min: 0,
            update: function() {
              this.value = Math.round(this.color.hue);
            },
            _listeners: {
              input: function() {
                if (+this.value < 0) { this.value = 0; }
                if (+this.value > 360) { this.value = 360; }
                this.color.hue = +this.value;
              },
              keypress: function(event) {
                if (!event.key.match(/[\d.,]/i)) {
                  event.preventDefault();
                }
                if (event.key == "Enter") {
                  this.parentElement.nextSibling.childNodes[1].focus();
                }
              }
            }
          }),
          saturation = create_element("input", {
            placeholder: Math.round(this.saturation * 100),
            value: Math.round(this.saturation * 100),
            className: "window_input",
            color: this,
            type: "number",
            max: 100,
            min: 0,
            update: function() {
              this.value = Math.round(this.color.saturation * 100);
            },
            _listeners: {
              input: function() {
                if (+this.value < 0) { this.value = 0; }
                if (+this.value > 100) { this.value = 100; }
                this.color.saturation = this.value / 100;
              },
              keypress: function(event) {
                if (!event.key.match(/[\d.,]/i)) {
                  event.preventDefault();
                }
                if (event.key == "Enter") {
                  this.parentElement.nextSibling.childNodes[1].focus();
                }
              }
            }
          }),
          lightness = create_element("input", {
            placeholder: Math.round(this.lightness * 100),
            value: Math.round(this.lightness * 100),
            className: "window_input",
            color: this,
            type: "number",
            max: 100,
            min: 0,
            update: function() {
              this.value = Math.round(this.color.lightness * 100);
            },
            _listeners: {
              input: function() {
                if (+this.value < 0) { this.value = 0; }
                if (+this.value > 100) { this.value = 100; }
                this.color.lightness = this.value / 100;
              },
              keypress: function(event) {
                if (!event.key.match(/[\d.,]/i)) {
                  event.preventDefault();
                }
                if (event.key == "Enter") {
                  dialog.ok.focus();
                }
              }
            }
          });

      color.update_list.push(hue, saturation, lightness);
      setTimeout(() => {
        hue = null;
        saturation = null;
        lightness = null;
      }, 0);
      return [hue, saturation, lightness];
    };
    color.create_alpha_input = function(options = {}) {
      let input = create_element("input", {
            placeholder: this.alpha,
            value: this.alpha,
            className: "window_input",
            color: this,
            type: "number",
            max: 255,
            min: 0,
            update: function() {
              this.value = this.color.alpha;
            },
            _listeners: {
              input: function() {
                if (+this.value < 0) { this.value = 0; }
                if (+this.value > 255) { this.value = 255; }
                this.color.alpha = +this.value;
              },
              keypress: function(event) {
                if (!event.key.match(/[\d.]/i)) {
                  event.preventDefault();
                }
                if (event.key == "Enter") {
                  dialog.ok.click();
                }
              }
            }
          });


      color.update_list.push(input);
      setTimeout(() => {
        input = null;
      }, 0);
      return input;
    };

    hsl = null;

    return new Proxy(color, {
      set: function(target, property, value) {
        switch(property) {
          case "alpha":
            target.alpha = value;

            target.hex = Color.hex(target);
            target.cssrgb = Color.cssrgb(target);

            for (let i = 0; i < target.update_list.length; i++) {
              if (!target.update_list[i] != document.activeElement) {
                target.update_list[i].update();
              }
            }
            break;

          case "red":
          case "green":
          case "blue":
            target[property] = value;

            target.hex = Color.hex(target);
            target.cssrgb = Color.cssrgb(target);
            target.brightness = Color.brightness(target);

            let hsl = Color.hsl(target);
            target.hue = hsl.hue;
            target.saturation = hsl.saturation;
            target.lightness = hsl.lightness;
            hsl = null;

            for (let i = 0; i < target.update_list.length; i++) {
              if (!target.update_list[i] != document.activeElement) {
                target.update_list[i].update();
              }
            }
            break;

          case "hue":
          case "saturation":
          case "lightness":
            target[property] = value;

            let rgb = Color.rgb(target);
            target.red = rgb.red;
            target.green = rgb.green;
            target.blue = rgb.blue;
            rgb = null;

            target.hex = Color.hex(target);
            target.cssrgb = Color.cssrgb(target);
            target.brightness = Color.brightness(target);

            for (let i = 0; i < target.update_list.length; i++) {
              if (!target.update_list[i] != document.activeElement) {
                target.update_list[i].update();
              }
            }
            break;

          case "hex":
            if (value.match(Color.regexp.hex)) {
              switch(value.length) {
                case 4:
                  target.red = b10(value.slice(1, 2).repeat(2));
                  target.green = b10(value.slice(2, 3).repeat(2));
                  target.blue = b10(value.slice(3, 4).repeat(2));
                  target.alpha = 255;
                  break;

                case 5:
                  target.red = b10(value.slice(2, 3).repeat(2));
                  target.green = b10(value.slice(3, 4).repeat(2));
                  target.blue = b10(value.slice(4, 5).repeat(2));
                  target.alpha = b10(value.slice(1, 2).repeat(2));
                  break;

                case 7:
                  target.red = b10(value.slice(1, 3));
                  target.green = b10(value.slice(3, 5));
                  target.blue = b10(value.slice(5, 7));
                  target.alpha = 255;
                  break;

                case 9:
                  target.red = b10(value.slice(3, 5));
                  target.green = b10(value.slice(5, 7));
                  target.blue = b10(value.slice(7, 9));
                  target.alpha = b10(value.slice(1, 3));
                  break;
              }

              let hsl = Color.hsl(target);
              target.hue = hsl.hue;
              target.saturation = hsl.saturation;
              target.lightness = hsl.lightness;
              hsl = null;

              target.brightness = Color.brightness(target);
              target.cssrgb = Color.cssrgb(target);
              target.hex = Color.hex(target);

              for (let i = 0; i < target.update_list.length; i++) {
                if (target.update_list[i] != document.activeElement) {
                  target.update_list[i].update();
                }
              }
            }
            break;
        }

        return true;
      }
    });
  }
};

Color.hex = function(color) {
  if (typeof color == "object" &&
      color.red !== undefined &&
      color.green !== undefined &&
      color.blue !== undefined) {

    let alpha = (color.alpha) ? b16(color.alpha) : "00";
    setTimeout(() => {
      alpha = null;
    }, 0);
    return `#${alpha}${b16(color.red)}${b16(color.green)}${b16(color.blue)}`;
  }
};

Color.cssrgb = function(color) {
  if (typeof color == "object" &&
      color.red !== undefined &&
      color.green !== undefined &&
      color.blue !== undefined) {

    let alpha = (color.alpha) ? color.alpha / 255 : 0;
    setTimeout(() => {
      alpha = null;
    }, 0);
    return `rgba(${color.red}, ${color.green}, ${color.blue}, ${alpha})`;
  }

  if (typeof color == "string" &&
      color[0] == "#") {

    if (color.length == 7) {
      return Color.cssrgb({
        red: b10(color.slice(1, 3)),
        green: b10(color.slice(3, 5)),
        blue: b10(color.slice(5, 7)),
        alpha: 255
      });
    }

    if (color.length == 9) {
      return Color.cssrgb({
        red: b10(color.slice(3, 5)),
        green: b10(color.slice(5, 7)),
        blue: b10(color.slice(7, 9)),
        alpha: b10(color.slice(1, 3))
      });
    }
  }
};

Color.brightness = function(color) {
  if (typeof color == "object" &&
      color.red !== undefined &&
      color.green !== undefined &&
      color.blue !== undefined) {

    return .2126 * (color.red / 255) + .7152 * (color.green / 255) + .0722 * (color.blue / 255);
  } else if (typeof color == "string") {
    if (color[0] == "#") {
      switch(color.length) {
        case 7:
          return Color.brightness({
            red: b10(color.slice(1, 3)),
            green: b10(color.slice(3, 5)),
            blue: b10(color.slice(5, 7))
          });
      }
    }
  }
};

Color.hsl = function(color) {
  if (typeof color == "object" &&
      color.red !== undefined &&
      color.green !== undefined &&
      color.blue !== undefined) {

    let red = color.red / 255,
        green = color.green / 255,
        blue = color.blue / 255,
        max = Math.max(red, green, blue),
        min = Math.min(red, green, blue),
        lightness = .5 * (max + min),
        saturation = (max - min) / (1 - Math.abs(1 - (max + min))),
        hue;

    if (isNaN(saturation)) {
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

    red = null;
    green = null;
    blue = null;
    max = null;
    min = null;
    setTimeout(() => {
      hue = null;
      saturation = null;
      lightness = null;
    }, 0);

    return {
      hue: hue,
      saturation: saturation,
      lightness: lightness
    };
  } else if (typeof color == "string") {
    return Color.hsl({
      red: b10(color.slice(1, 3)),
      green: b10(color.slice(3, 5)),
      blue: b10(color.slice(5, 7))
    });
  }
};

Color.rgb = function(color) {
  if (typeof color == "object" &&
      color.hue !== undefined &&
      color.saturation !== undefined &&
      color.lightness !== undefined) {

    let h = color.hue / 360,
        t = {
          red: h + 1 / 3,
          green: h,
          blue: h - 1 / 3
        },
        c = ["red", "green", "blue"],
        rgb = {
          red: 0,
          green: 0,
          blue: 0,
          alpha: (color.alpha) ? color.alpha : 255
        },
        q, p;

    for (let i = 0; i < 3; i++) {
      if (t[c[i]] < 0) { t[c[i]] += 1; }
      if (t[c[i]] > 1) { t[c[i]] -= 1; }
    }

    if (color.lightness < .5) {
      q = color.lightness * (1 + color.saturation);
    } else {
      q = color.lightness + color.saturation - (color.lightness * color.saturation);
    }

    p = 2 * color.lightness - q;

    for (let i = 0; i < 3; i++) {
      if (t[c[i]] < 1 / 6) {
        rgb[c[i]] = p + ((q - p) * 6 * t[c[i]])
      } else if (1 / 6 <= t[c[i]] && t[c[i]] < .5) {
        rgb[c[i]] = q;
      } else if (.5 <= t[c[i]] && t[c[i]] < 2 / 3) {
        rgb[c[i]] = p + ((q - p) * (2 / 3 - t[c[i]]) * 6);
      } else {
        rgb[c[i]] = p;
      }

      rgb[c[i]] = Math.round(rgb[c[i]] * 255);
    }

    h = null;
    q = null;
    t = null;
    p = null;
    c = null;
    setTimeout(() => {
      rgb = null;
    }, 0);

    return rgb;
  }
};

Color.overlay = function(new_color, old_color) {
  if (new_color !== undefined &&
      old_color !== undefined &&
      typeof new_color == "object" &&
      typeof old_color == "object" &&
      new_color.red !== undefined &&
      new_color.green !== undefined &&
      new_color.blue !== undefined &&
      new_color.alpha !== undefined &&
      old_color.red !== undefined &&
      old_color.green !== undefined &&
      old_color.blue !== undefined) {

    let alpha = new_color.alpha / 255;
    setTimeout(() => {
      alpha = null;
    }, 0);
    return {
      red: alpha * (new_color.red - old_color.red) + old_color.red,
      green: alpha * (new_color.green - old_color.green) + old_color.green,
      blue: alpha * (new_color.blue - old_color.blue) + old_color.blue
    };
  }
}

Color.are_the_same = function(first_color, second_color) {
  if (first_color !== undefined &&
      second_color !== undefined &&
      typeof first_color == "object" &&
      typeof second_color == "object") {

    if (first_color.red !== second_color.red ||
        first_color.green !== second_color.green ||
        first_color.blue !== second_color.blue ||
        first_color.alpha !== second_color.alpha) {
      return false;
    }
    return true;
  }
}

Color.regexp = {
  hex: /^#[0-9a-f]{8}$|#[0-9a-f]{6}$|#[0-9a-f]{3,4}$/i
};

for (let i in Color) {
  Object.freeze(Color[i]);
}
Object.freeze(Color.regexp.hex);
Object.freeze(Color);