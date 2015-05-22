var makeItem = function(src, caption) {
  var img = new Image(),
    width = 0,
    height = 0,
    dx, dy, dw, dh;

  var origin_width = function() {
    if (typeof img.naturalWidth !== 'undefined')
      return img.naturalWidth;
    if (typeof img.runtimeStyle !== 'undefined') {
      var run = img.runtimeStyle;
      var mem = run.width;
      run.width = 'auto';
      w = img.width;
      run.width = mem;
      return w;
    }
    return img.width;
  };
  var origin_height = function() {
    if (typeof img.naturalHeight !== 'undefined')
      return img.naturalHeight;
    if (typeof img.runtimeStyle !== 'undefined') {
      var run = img.runtimeStyle;
      var mem = run.height;
      run.height = 'auto';
      w = img.height;
      run.height = mem;
      return w;
    }
    return img.height;
  };

  img.src = src;

  var is_inside = function(x, y) {
      return (x >= dx && x <= dx + dw && y >= dy && dy <= dy + dh);
    };

  var that = {
      set_size: function(w, h) {
        width = w;
        height = h;
        if (width * origin_height() < height * origin_width()) {
          dw = width * 0.9;
          dh = origin_height() * dw / origin_width();
        } else {
          dh = height * 0.9;
          dw = origin_width() * dh / origin_height();
        }

        dx = (width - dw) / 2;
        dy = (height - dh) / 2;
      },
      draw: function(ctx, x, y, w, h) {
        if (w !== undefined && h !== undefined) {
          var ddw, ddh;
          if (w * origin_height() < h * origin_width()) {
            ddw = w * 0.9;
            ddh = origin_height() * ddw / origin_width();
          } else {
            ddh = h * 0.9;
            ddw = origin_width() * ddh / origin_height();
          }
          if (ddw > origin_width() || ddh > origin_height()) {
            ddw = origin_width();
            ddh = origin_height();
          }

          var ddx = (w - ddw) / 2,
            ddy = (h - ddh) / 2;
          ctx.drawImage(img, x + ddx, y + ddy, ddw, ddh);
          ctx.strokeStyle='rgb(255,255,255)';
          ctx.lineWidth = 1.0;
          ctx.strokeRect(x + ddx, y + ddy, ddw, ddh);
        } else {
          ctx.drawImage(img, x + dx, y + dy, dw, dh);
          ctx.strokeStyle='rgb(255,255,255)';
          ctx.lineWidth = 1.0;
          ctx.strokeRect(x + dx, y + dy, dw, dh);
        }
      },
      is_complete: function() {
        return img.complete;
      },
      get_caption: function() {
        return caption;
      },
      click: function(x, y) {
        return is_inside(x, y);
      }
    };
  return that;
};

var makePage = function(col, row) {
  var items = [],
    width = 0,
    height = 0,
    iw = 0,
    ih = 0;

  var is_inside = function(i, j) {
      var rect = (i >= 0 && i < col && j >= 0 && j < row),
        index = (i + j * col < items.length);
      return rect && index;
    };

  var that = {
      add: function(item) {
        if (items.length >= col * row)
          return false;
        item.set_size(iw, ih);
        items.push(item);
        return true;
      },
      set_size: function(w, h) {
        width = w;
        height = h;
        iw = Math.floor(width / col);
        ih = Math.floor(height / row);
        for (var i = 0; i < items.length; i++) {
          items[i].set_size(iw, ih);
        }
      },
      draw: function(ctx, x, y) {
        for (var i = 0; i < items.length; i++) {
          var ix = (i%col) * iw + x,
            iy = Math.floor(i/col) * ih + y;
          items[i].draw(ctx, ix, iy);
        }
      },
      click: function(x, y) {
        var i = Math.floor(x * col / width),
          j = Math.floor(y * row / height);
        if (is_inside(i, j)) {
          var ix = x - i * width / col,
            iy = y - j * height / row,
            index = i + col * j;
          if (items[index].click(ix, iy))
            return index;
        }
      },
      length: function() {
        return items.length;
      },
      item_at: function(i) {
        if (i >= 0 && i < items.length) {
          return items[i];
        }
        return undefined;
      },
      is_complete: function() {
        for (var i = 0; i < items.length; i+=1) {
          if (!items[i].is_complete())
            return false;
        }
        return true;
      }
    };
  return that;
};

makeGallery = function($gallery, options){
  var pages = [],
    index = 0,
    width = parseInt($gallery.attr('width'),0),
    height = parseInt($gallery.attr('height'),0),
    ctx = $gallery[0].getContext('2d'),
    col = 3,
    row = 2,
    $base = undefined,
    $caption = undefined,
    $ncanvas = $gallery,
    nwidth = width,
    nheight = height,
    nctx = ctx,
    nleft = false,
    nright = false,
    notice_ = -1,
    is_moving = false,
    is_initialized = false,
    on_left = false,
    on_right = false;

  var queue = new Array(),
    timer = undefined;

  var is_valid_index = function(index) {
      return index >= 0 && index < pages.length;
    },
    initialize = function() {
      if (!pages[index])
        return;
      timer = setInterval(function() {
        if (pages[index].is_complete()) {
          is_initialized = true;
          draw(0,0);
          clearInterval(timer);
          timer = undefined;
        }
      }, 25);
    },
    notice = function() {
      return pages[index].item_at(notice_);
    },
    prev_notice = function(flg) {
      var retval = notice_ > 0 || index > 0;
      if (retval && flg) {
        notice_--;
        if (notice_ < 0) {
          index--;
          notice_ = pages[index].length()-1;
        }
      }
      return retval;
    },
    next_notice = function(flg) {
      var retval = notice_ < pages[index].length()-1 ||
        index < pages.length-1;
      if (retval && flg) {
        notice_++;
        if (notice_ >= pages[index].length()) {
          index++;
          notice_ = 0;
        }
      }
      return retval;
    },
    draw = function(x,y) {
      ctx.clearRect(0,0,width,height);
      nctx.clearRect(0,0,nwidth,nheight);

      if (pages[index])
        pages[index].draw(ctx, x + width*0.1, y);

      if (x < 0 && pages[index+1])
        pages[index+1].draw(ctx, x+width*1.1, y);
      if (x > 0 && pages[index-1])
        pages[index-1].draw(ctx, x-width*0.9, y);

      if (!is_moving) {
        var n = notice();
        if (n !== undefined) {
          draw_notice(0,0,n);
        } else {
          if ($ncanvas != $gallery)
            $ncanvas.hide();
          if ($caption !== undefined) {
            $caption.hide();
          }
          if (index>=1) {
            draw_left_arrow(ctx,x,y,width,height,on_left);
          }
          if (index<pages.length-1) {
            draw_right_arrow(ctx,x,y,width,height,on_right);
          }
        }
      }
    },
    draw_notice = function(x,y,n) {
      if ($ncanvas != $gallery)
        $ncanvas.show();
      nctx.fillStyle = "rgba(30, 30, 30, 0.9)";
      nctx.fillRect(x, y, nwidth, nheight);
      n.draw(nctx,nwidth*0.1,0,
          nwidth*0.8,nheight-100);
      if ($caption !== undefined) {
        $caption.html(n.get_caption());
        $caption.show();
      }
      if (prev_notice(false)) {
        draw_left_arrow(nctx,x,y,nwidth,nheight,nleft);
      }
      if (next_notice(false)) {
        draw_right_arrow(nctx,x,y,nwidth,nheight,nright);
      }
    },
    draw_left_arrow = function(ctx,x,y,w,h,flg) {
      var cx = w * 0.05,
        cy = h * 0.5,
        d = 5;
      ctx.lineWidth = 2.0;
      if (flg){
        d = 10;
        ctx.lineWidth = 4.0;
      }
      ctx.strokeStyle = "#bbb";
      ctx.beginPath();
      ctx.moveTo(cx+d, cy-2*d);
      ctx.lineTo(cx-d, cy);
      ctx.lineTo(cx+d, cy+2*d);
      ctx.stroke();
    },
    draw_right_arrow = function(ctx,x,y,w,h,flg) {
      var cx = w * 0.95,
        cy = h * 0.5,
        d = 5;
      ctx.lineWidth = 2.0;
      if (flg) {
        d = 10;
        ctx.lineWidth = 4.0;
      }
      ctx.strokeStyle = "#bbb";
      ctx.beginPath();
      ctx.moveTo(cx-d, cy-2*d);
      ctx.lineTo(cx+d, cy);
      ctx.lineTo(cx-d, cy+2*d);
      ctx.stroke();
    },
    move = function(to) {
      if (!is_valid_index(to)) {
        draw(0, 0);
        return;
      }
      var x = 0,
        dx = 0,
        y = 0,
        interval = index - to;
      is_moving = true;

      for (var i = 0; i < 20; i++) {
        push({
          term: 10,
          dx: interval * width * i / 20.,
          fire: function() {
            if (x + this.dx > width / 2) {
              index--;
              x -= width;
            } else if(x + this.dx < width / (-2)) {
              index++;
              x += width;
            }
            draw(x + this.dx, y);
          }
        });
      }
      push({
        term: 15,
        fire: function() {
          is_moving = false;
          draw(0,0);
        }
      });
      that.start();
    },
    fire = function() {
      clearInterval(timer);
      timer = undefined;
      var item = queue.shift();
      if (item)
        item.fire();
      if (queue[0])
        timer = setInterval(fire, queue[0].term);
    },
    push = function(item) {
      if (is_initialized) {
        queue.push(item);
      }
    },
    resize = function(new_width, new_height) {
      width = new_width;
      height = new_height;
      $gallery.attr({
        width: width,
        height: height
      });
      if ($gallery == $ncanvas) {
        nwidth = width;
        nheight = height;
      }
      for (var i = 0; i < pages.length; i++) {
        pages[i].set_size(width*0.8, height);
      }
    };

  var is_left = function (x,w) {
      return x >= 0 && x <= w*0.1;
    },
    is_right = function(x,w) {
      return x >= w*0.9 && x <= w;
    },
    click = function(e) {
      if (is_moving)
        return;
      if ($ncanvas != $gallery && notice() !== undefined) {
        notice_ = -1;
        draw(0,0);
        return;
      }
      if (on_left) {
        that.prev();
      } else if (on_right) {
        that.next();
      } else {
        if ($ncanvas == $gallery && notice() !== undefined) {
          notice_ = -1;
        } else {
          var x = e.pageX - $gallery.offset().left,
            y = e.pageY - $gallery.offset().top;
          var i = pages[index].click(x-width*0.1, y);
          if (i !== undefined) {
            notice_ = i;
          }
        }
        draw(0,0);
      }
    },
    nclick = function(e) {
      if (is_moving)
        return;
      if (notice() === undefined)
        return;
      if (nleft) {
        prev_notice(true);
      } else if (nright) {
        next_notice(true);
      } else if ($ncanvas != $gallery) {
        notice_ = -1;
      }
      draw(0,0);
    },
    mousemove = function(e) {
      if (is_moving)
        return;
      var x = e.pageX - $gallery.offset().left;
      if (is_left(x, width)) {
        if (on_right)
          on_right = false;
        if (!on_left) {
          on_left = true;
          draw(0,0);
        }
      } else if (is_right(x, width)) {
        if (on_left)
          on_left = false;
        if (!on_right) {
          on_right = true;
          draw(0,0);
        }
      } else {
        if (on_left || on_right) {
          on_left = false;
          on_right = false;
          draw(0,0);
        }
      }
    },
    nmousemove = function(e) {
      if (is_moving)
        return;
      var x = e.pageX - $ncanvas.offset().left;
      if (is_left(x, nwidth)) {
        if (nright)
          nright = false;
        if (!nleft) {
          nleft = true;
          draw(0,0);
        }
      } else if (is_right(x, nwidth)) {
        if (nleft)
          nleft = false;
        if (!nright) {
          nright = true;
          draw(0,0);
        }
      } else {
        if (nleft || nright) {
          nleft = false;
          nright = false;
          draw(0,0);
        }
      }
    };
  $gallery.click(click);
  $gallery.mousemove(mousemove);
  $ncanvas.click(nclick);
  $ncanvas.mousemove(nmousemove);

  var that = {
      init: function() {
        initialize();
      },
      resize: function(new_width, new_height) {
        if ($base)
          return;
        resize(new_width, new_height);
      },
      next: function() {
        if (notice() !== undefined || is_moving)
          return;
        if (pages[index].is_complete() && pages[index+1].is_complete())
          move(index+1);
      },
      prev: function() {
        if (notice() !== undefined || is_moving)
          return;
        if (pages[index].is_complete() && pages[index-1].is_complete())
          move(index-1);
      },
      index: function() {
        return index;
      },
      draw: function() {
        draw(0,0);
      },
      add: function(src, alt) {
        var item = makeItem(src, alt);
        if (pages.length == 0 || !pages[pages.length-1].add(item)) {
          var page = makePage(col, row);
          page.set_size(width*0.8, height);
          page.add(item);
          pages.push(page);
        }
      },
      set_caption: function($new_caption) {
        $caption = $new_caption;
      },
      set_base: function($new_base) {
        $base = $new_base;
        resize($base.innerWidth(), $base.innerHeight());
      },
      set_expansion_canvas: function($new_canvas) {
        $ncanvas.unbind('click', nclick);
        $ncanvas.unbind('mousemoce', nmousemove);
        $ncanvas = $new_canvas;
        $ncanvas.click(nclick);
        $ncanvas.mousemove(nmousemove);
        nwidth = parseInt($ncanvas.attr('width'),0);
        nheight = parseInt($ncanvas.attr('height'),0);
        nctx = $ncanvas[0].getContext('2d');
        if ($ncanvas != $gallery) {
          $ncanvas.hide();
        }
      },
      start: function() {
        if (!timer && is_initialized)
          fire();
      }
    };

  $('img',$gallery).each(function() {
    var src = $(this).attr('src'),
      alt = $(this).attr('alt');
    that.add(src, alt);
  });

  $(window).resize(function() {
    if($base) {
      resize($base.innerWidth(), $base.innerHeight());
      that.draw();
    }
  });

  return that;
};
