var makeItem = function(src, img_width, img_height, caption) {
		var img = new Image(),
			img_width = parseInt(img_width,0),
			img_height = parseInt(img_height,0),
			width = 0,
			height = 0,
			dx, dy, dw, dh;

		img.src = src;

		if (img_width <= 0 || img_height <= 0)
			return;

		var is_inside = function(x, y) {
				return (x >= dx && x <= dx + dw && y >= dy && dy <= dy + dh);
			};

		var that = {
				set_size: function(w, h) {
					width = w;
					height = h;
					if (width * img_height < height * img_width) {
						dw = width * 0.9;
						dh = img_height * dw / img_width;
					} else {
						dh = height * 0.9;
						dw = img_width * dh / img_height;
					}

					dx = (width - dw) / 2;
					dy = (height - dh) / 2;
				},
				draw: function(ctx, x, y, w, h) {
					if (w !== undefined && h !== undefined) {
						var ddw, ddh;
						if (w * img_height < h * img_width) {
							ddw = w * 0.9;
							ddh = img_height * ddw / img_width;
						} else {
							ddh = h * 0.9;
							ddw = img_width * ddh / img_height;
						}

						var ddx = (w - ddw) / 2,
							ddy = (h - ddh) / 2;
						ctx.drawImage(img, x + ddx, y + ddy, ddw, ddh);
						ctx.strokeStyle='rgb(255,255,255)';
						ctx.strokeRect(x + ddx, y + ddy, ddw, ddh);
					} else {
						ctx.drawImage(img, x + dx, y + dy, dw, dh);
						ctx.strokeStyle='rgb(255,255,255)';
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
	},

	makePage = function(col, row) {
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
				item_at: function(i) {
					if (i >= 0 && i < items.length) {
						return items[i];
					}
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
	},

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
			draw = function(x,y) {
				ctx.clearRect(0,0,width,height);
				if (pages[index])
					pages[index].draw(ctx, x + width*0.1, y);

				if (x < 0 && pages[index+1])
					pages[index+1].draw(ctx, x+width*1.1, y);
				if (x > 0 && pages[index-1])
					pages[index-1].draw(ctx, x-width*0.9, y);

				if (!is_moving) {
					var n = notice();
					if (n !== undefined) {
						ctx.fillStyle = "rgba(30, 30, 30, 0.9)";
						ctx.fillRect(x, y, width, height);
						n.draw(ctx,0,0,width,height);
						if ($caption !== undefined) {
							$caption.html(n.get_caption());
							$caption.show();
						}
					} else {
						if ($caption !== undefined) {
							$caption.hide();
						}
						if (index>=1) {
							if (on_left){
								ctx.fillStyle = "rgba(30, 30, 30, 0.7)";
								ctx.fillRect(x, y, width*0.1, height);
							}
							var cx = width*0.05,
								cy = height * 0.5;
							ctx.strokeStyle = "#bbb";
							ctx.beginPath();
							ctx.moveTo(cx+5, cy-10);
							ctx.lineTo(cx-5, cy);
							ctx.lineTo(cx+5, cy+10);
							ctx.stroke();
						} else if (index<pages.length-1) {
							if (on_right) {
								ctx.fillStyle = "rgba(30, 30, 30, 0.7)";
								ctx.fillRect(x+width*0.9, y, width*0.1, height);
							}
							var cx = width*0.95,
								cy = height * 0.5;
							ctx.strokeStyle = "#bbb";
							ctx.beginPath();
							ctx.moveTo(cx-5, cy-10);
							ctx.lineTo(cx+5, cy);
							ctx.lineTo(cx-5, cy+10);
							ctx.stroke();
						}
					}
				}
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
						term: 15,
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
				for (var i = 0; i < pages.length; i++) {
					pages[i].set_size(width*0.8, height);
				}
			};

		var is_left = function (x) {
				return x >= 0 && x <= width*0.1;
			},
			is_right = function(x) {
				return x >= width*0.9 && x <= width;
			},
			click = function(e) {
				if (is_moving)
					return;
				if (notice() !== undefined) {
					notice_ = -1;
					draw(0,0);
				} else if (on_left) {
					that.prev();
				} else if (on_right) {
					that.next();
				} else {
					var x = e.pageX - $gallery.offset().left,
						y = e.pageY - $gallery.offset().top;
					var i = pages[index].click(x-width*0.1, y);
					if (i !== undefined) {
						notice_ = i;
					}
					draw(0, 0);
				}
			},
			mousemove = function(e) {
				if (is_moving)
					return;
				var x = e.pageX - $gallery.offset().left;
				if (is_left(x)) {
					if (on_right)
						on_right = false;
					if (!on_left) {
						on_left = true;
						draw(0,0);
					}
				} else if (is_right(x)) {
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
			};
		$gallery.click(click);
		$gallery.mousemove(mousemove);

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
				add: function(src, w, h, alt) {
					var item = makeItem(src, w, h, alt);
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
				start: function() {
					if (!timer && is_initialized)
						fire();
				}
			};

		$('img',$gallery).each(function() {
			var src = $(this).attr('src'),
				width = $(this).attr('width'),
				height = $(this).attr('height'),
				alt = $(this).attr('alt');
			that.add(src, width, height, alt);
		});

		$(window).resize(function() {
			if($base) {
				resize($base.innerWidth(), $base.innerHeight());
				that.draw();
			}
		});

		return that;
	};
