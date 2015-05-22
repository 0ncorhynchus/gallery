
var make_gallery = function($base, list, options) {
  list = get(list, []);
  options = get(options, {});

  /* create a canvas */
  var $canvas = $create_dom("canvas"),
      $frame =  $create_dom("canvas");
  $canvas.css({
    position: "absolute",
    left: 0
  });
  $frame.css({
    position: "fixed",
    backgroundColor: "rgba(30,30,30,0.8)",
    display: "none"
  });
  if ($base.css("position") === "static")
    $base.css("position", "relative");
  $base.append($canvas);
  $base.append($frame);

  /* create a gallery object */
  var col = get(options.col, 2),
      row = get(options.row, 3);
  var gallery = pack_gallery($base, $canvas, $frame, col, row);
  add_images(gallery, list, /* default_src= */"img/notfound.jpg");

  $canvas.click(function(e) {
    var x = e.pageX - $canvas.offset().left,
        y = e.pageY - $canvas.offset().top;
    for (var index=0; index < gallery.list.length; index++) {
      var elem = gallery.list[index];
      if (elem.rectangle === undefined) continue;
      var dx = x - elem.rectangle.x,
          dy = y - elem.rectangle.y;
      if (0 <= dx && dx <= elem.rectangle.width &&
             0 <= dy && dy <= elem.rectangle.height) {
        pick_up(gallery, index);
      }
    }
  });
  $frame.click(function(e) {
    $frame.hide();
  });

  /* set resize */
  var resize_timer = undefined;
  var resize_interval = 200; // ms
  $(window).resize(function() {
    if (resize_timer !== undefined) {
      clearTimeout(resize_timer);
    }
    resize_timer = setTimeout(function() {
      resize(gallery);
      update(gallery);
    }, resize_interval);
  });

  update(gallery);

  return gallery;
};

/* Manipulate Gallery */

var pack_gallery = function($base, $canvas, $frame, col_size, row_size) {
  return {
    $base: $base,
    $canvas: $canvas,
    $frame: $frame,
    list: [],
    picked: undefined,
    col_size: col_size,
    row_size: row_size
  };
};

var add_image = function(gallery, src, desc, default_src) {
  var packed = {
    img: new Image(),
    description: desc,
    rectagle: undefined,
    complete: false
  };
  packed.img.onload = function() {
    packed.complete = true;
    update(gallery);
  };
  packed.img.onerror = function() {
    console.log("Failed to load " + packed.img.src);
    var onload = packed.img.onload;
    packed.img = new Image();
    packed.img.onload = onload;
    packed.img.src = default_src;
  };
  packed.img.src = src;
  gallery.list.push(packed);
};

var add_images = function(gallery, list, default_src) {
  var default_src = get(default_src, "");
  list.forEach(function(elem, index, array) {
    add_image(gallery, elem[0], elem[1], default_src);
  });
  resize(gallery);
};

var resize = function(gallery) {
  gallery.$canvas.attr("width",
      gallery.$base.width() * Math.max(num_pages(gallery), 1));
  gallery.$canvas.attr("height",
      gallery.$base.height());

  gallery.$frame.attr("width",  gallery.$base.width());
  gallery.$frame.attr("height", gallery.$base.height());
};

var shift_page = function(gallery, page_num, duration) {
  if (0 > page_num || page_num >= num_pages(gallery)) {
    console.log("invalid page: " + page_num);
    return;
  }
  var dest_left = page_num * gallery.$base.width();
  gallery.$base.animate({
    scrollLeft: dest_left
  }, duration);
};

var num_pages = function(gallery) {
  return Math.ceil(gallery.list.length /
      (gallery.col_size * gallery.row_size));
};

var get_box_size = function(gallery) {
  return to_size(
      gallery.$base.width() / gallery.row_size,
      gallery.$base.height() / gallery.col_size
      );
};

var clear_gallery = function(gallery) {
  var ctx = get_context(gallery.$canvas);
  ctx.clearRect(0, 0,
      gallery.$canvas.attr("width"),
      gallery.$canvas.attr("height"));
};

var update = function(gallery) {
  clear_gallery(gallery);
  var box_size = get_box_size(gallery);
  gallery.list.forEach(function(elem, index, array) {
    if (!elem.complete)
      return;
    var cumulated_col = Math.floor(index / gallery.row_size),
        col = cumulated_col % gallery.col_size,
        page = Math.floor(cumulated_col / gallery.col_size),
        row = index % gallery.row_size + page * gallery.row_size;
    var x = box_size.width  * row,
        y = box_size.height * col;
    var ctx = get_context(gallery.$canvas);
    elem.rectangle = show_img_in(ctx, elem.img,
        x, y, box_size.width, box_size.height);
  });
};

var pick_up = function(gallery, index) {
  if (index < 0 || index >= gallery.list.length)
    return;
  gallery.picked = index;
  var elem = gallery.list[index];
  gallery.$frame.show();
  console.log("pick up " + elem.description);
};

/* Manipulate jQuery Object */

var $create_dom = function(tag) {
  return $("<"+tag+"/>");
};

var get_context = function($canvas) {
  return $canvas[0].getContext('2d');
};

/* Original Utility Functions */

var get = function(value, default_value) {
  if (value !== undefined)
    return value;
  return default_value;
};

var to_size = function(width, height) {
  return {
    width: width,
    height: height
  };
};

if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this == null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}

/* Manipulate Image Object */

var get_width = function(img) {
  /* FireFox, Safari, Chrome */
  if (typeof img.naturalWidth !== 'undefined')
    return img.naturalWidth;
  /* IE */
  if (typeof img.runtimeStyle !== 'undefined') {
    var runtime = img.runtimeStyle;
    var tmp_width = runtime.width;
    runtime.width = 'auto';
    width = img.width;
    runtime.width = tmp_width;
    return width;
  }
  return img.width;
};

var get_height = function(img) {
  /* FireFox, Safari, Chrome */
  if (typeof img.naturalHeight !== 'undefined')
    return img.naturalHeight;
  /* IE */
  if (typeof img.runtimeStyle !== 'undefined') {
    var runtime = img.runtimeStyle;
    var tmp_height = runtime.height;
    runtime.height = 'auto';
    height = img.height;
    runtime.height = tmp_height;
    return height;
  }
};

var fit_size = function(img, width, height) {
  var original = to_size(get_width(img), get_height(img));
  var width_ratio = original.width / width,
      height_ratio = original.height / height;

  if (width_ratio < 1 && height_ratio < 1)
    return original;

  if (width_ratio > height_ratio) {
    return to_size(
        width,
        original.height / width_ratio);
  }

  return to_size(
      original.width / height_ratio,
      height
      )
};

var show_img_in = function(ctx, img, x, y, width, height) {
  if (!img.complete)
    return;
  var fitted = fit_size(img, width, height);
  var dx = (width - fitted.width) / 2;
      dy = (height - fitted.height) / 2;
  ctx.drawImage(img, x+dx, y+dy, fitted.width, fitted.height);

  return {
    x: x+dx,
    y: y+dy,
    width: fitted.width,
    height: fitted.height
  };
};

