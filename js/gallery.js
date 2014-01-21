var makeItem = function(src, img_width, img_height, alt) {
		var img = new Image(),
			img_width = parseInt(img_width,0),
			img_height = parseInt(img_height,0),
			width = 0,
			height = 0,
			dx, dy, dw, dh,
			is_complete = false,
			is_inside = function(x, y) {
				return (x >= dx && x <= dx + dw && y >= dy && dy <= dy + dh);
			},
			timer = undefined,
			that = {
				setSize: function(w, h) {
					width = w;
					height = h;
					if (img_width <= 0 || img_height <= 0) return;
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
				draw: function(ctx, x, y) {
					if (img.complete)
						is_complete = true;
					if (is_complete) {
						ctx.strokeStyle='rgb(255,255,255)';
						ctx.drawImage(img, x + dx, y + dy, dw, dh);
						ctx.strokeRect(x + dx, y + dy, dw, dh);
						clearInterval(timer);
						return;
					}
					timer = setInterval(function() {
						if (img.complete) {
							ctx.strokeStyle='rgb(255,255,255)';
							ctx.drawImage(img, x + dx, y + dy, dw, dh);
							ctx.strokeRect(x + dx, y + dy, dw, dh);
							clearInterval(timer);
							is_complete = true;
						}
					}, 50);
				},
				reset: function() {
					clearInterval(timer);
				},
				isComplete: function() {
					return is_complete;
				},
				getCaption: function() {
					return alt;
				},
				click: function(x, y) {
					return is_inside(x, y);
				}
			};
		img.src = src;
		return that;
	},
	makePage = function(col, row) {
		var items = [],
			width = 0,
			height = 0,
			iw = 0,
			ih = 0,
			is_notice = false,
			is_inside = function(i, j) {
				var rect = (i >= 0 && i < col && j >= 0 && j < row),
					index = (i + j * col < items.length);
				return rect && index;
			},
			that = {
				add: function(item) {
					if (items.length >= col * row)
						return false;
					item.setSize(iw, ih);
					items.push(item);
					return true;
				},
				setSize: function(w, h) {
					width = w;
					height = h;
					iw = Math.floor(width / col);
					ih = Math.floor(height / row);
					for (var i = 0; i < items.length; i++) {
						items[i].setSize(iw, ih);
					}
				},
				draw: function(ctx, x, y) {
					ctx.clearRect(x, y, width, height);
					for (var i = 0; i < items.length; i++) {
						var ix = (i%col) * iw + x,
							iy = Math.floor(i/col) * ih + y;
						items[i].draw(ctx, ix, iy);
					}
				},
				click: function(x, y) {
					if (is_notice) {
						return -1;
					}
					var i = Math.floor(x * col / width),
						j = Math.floor(y * row / height);
					if (is_inside(i, j)) {
						var ix = x - i * width / col,
							iy = y - j * height / row,
							index = i + col * j;
						if (items[index].click(ix, iy))
							return index;
					}
					return -2
				},
				reset: function() {
					for (var i = 0; i < items.length; i++) {
						items[i].reset();
					}
				},
				notice: function(i, ctx, x, y) {
					if(i >= 0 && i < items.length) {
						is_notice = true;
						ctx.fillStyle = "rgba(30, 30, 30, 0.9)";
						ctx.fillRect(x, y, width, height);
						// TODO transparent background
						items[i].setSize(width, height);
						items[i].draw(ctx, x, y);
						return items[i].getCaption();
					} else if (i == -1) {
						is_notice = false;
						this.setSize(width, height);
						this.draw(ctx, x, y);
						return "";
					}
				},
				is_notice: function() {
					return is_notice;
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
			caption,
			is_moving = false,
			is_valid_index = function(index) {
				return index >= 0 && index < pages.length;
			},
			draw = function(x,y) {
				if (pages[index])
					pages[index].draw(ctx, x, y);
				if (x < 0 && pages[index+1])
					pages[index+1].draw(ctx, x+width, y);
				if (x > 0 && pages[index-1])
					pages[index-1].draw(ctx, x-width, y);
			},
			move = function(to) {
				if (!is_valid_index(to)) {
					draw(0, 0);
					return;
				}
				var x = 0,
					dx = 0,
					y = 0,
					interval = index - to,
					count = 0;
				is_moving = true;
				var timer = setInterval(function() {
					if (x + dx > width / 2) {
						index--;
						x -= width;
					} else if (x + dx < width / (-2)) {
						index++;
						x += width;
					}
					if (count < 25) {
						dx = interval * width * count / 25;
						draw(x + dx, y);
						count++;
					} else {
						is_moving = false;
						draw(0,0);
						clearInterval(timer);
					}
				},500/25);
			},
			click = function(e) {
				if (is_moving)
					return;
				var x = e.pageX - $gallery.offset().left,
					y = e.pageY - $gallery.offset().top;
				var i = pages[index].click(x, y);
				if ( i != -2 ) {
					var notice = pages[index].notice(i, ctx, 0, 0);
					caption.html(notice);
				} else {
					draw(0, 0);
				}
			},
			that = {
				next: function() {
					if (pages[index].is_notice())
						return;
					if (is_moving)
						return;
					move(index+1);
				},
				prev: function() {
					if (pages[index].is_notice())
						return;
					if (is_moving)
						return;
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
						page.setSize(width, height);
						page.add(item);
						pages.push(page);
					}
				},
				setCaption: function($caption) {
					caption = $caption;
				}
			};
		$gallery.click(click);
		$('img',$gallery).each(function() {
			var src = $(this).attr('src'),
				width = $(this).attr('width'),
				height = $(this).attr('height'),
				alt = $(this).attr('alt');
			that.add(src, width, height, alt);
		});
		return that;
	};

$(function() {
	sizing();
	$(window).resize(function() {
		sizing();
	});
});

function sizing() {
	var width = $("#gallery_base").width(),
		height = Math.floor($("#gallery_base").height() * 0.8);
	$("#gallery").attr({height:height});
	$("#gallery").attr({width:width});
}
