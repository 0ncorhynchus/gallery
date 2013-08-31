var makeItem = function(src, img_width, img_height, alt) {
		var img = new Image(),
			img_width = parseInt(img_width,0),
			img_height = parseInt(img_height,0),
			dx, dy, dw, dh,
			that = {
				updateSize: function(width, height) {
					if (img_width <= 0 || img_height <= 0) return;
					if (width * img_height < height * img_width) {
						dw = width * 0.8;
						dh = img_height * dw / img_width;
					} else {
						dh = height * 0.8;
						dw = img_width * dh / img_height;
					}
					dx = (width - dw) / 2;
					dy = (height - dh) / 2;
				},
				draw: function(ctx, x, y, width, height) {
					this.updateSize(width, height);
					if (img.complete) {
						ctx.strokeStyle='rgb(255,255,255)';
						ctx.strokeRect(x + dx, y + dy, dw, dh);
						ctx.drawImage(img, x + dx, y + dy, dw, dh);
					}
				},
				isComplete: function() {
					return img.complete;
				},
				getCaption: function() {
					return alt;
				}
			};
		img.src = src;
		return that;
	},
	makePage = function(col, row) {
		var items = [],
			isInside = function(i, j) {
				return (i >= 0 && i < col && j >= 0 && j < row);
			},
			that = {
				draw: function(ctx, x, y, width, height) {
					ctx.clearRect(x, y, width, height);
					var dw = width / col,
						dh = height / row;
					for (var i = 0; i < items.length; i++) {
						var ix = (i%col) * dw + x,
							iy = Math.floor(i/col) * dh + y;
						items[i].draw(ctx, ix, iy, dw, dh);
					}
				},
				add: function(item) {
					if (items.length >= col * row)
						return false;
					items.push(item);
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
			is_valid_index = function(index) {
				return index >= 0 && index < pages.length;
			},
			draw = function(x,y) {
				if (pages[index])
					pages[index].draw(ctx, x, y, width, height);
				if (x < 0 && pages[index+1])
					pages[index+1].draw(ctx, x+width, y, width, height);
				if (x > 0 && pages[index-1])
					pages[index-1].draw(ctx, x-width, y, width, height);
			},
			move = function(to) {
				if (!is_valid_index(to))
					return;
				var x = 0,
					y = 0,
					d = (index - to) * width / 25,
					count = 0;
				var timer = setInterval(function() {
					if (x >= width) {
						index--;
						x -= width;
					} else if (x < 0) {
						index++;
						x += width;
					}
					if (count < 25) {
						x += d;
						draw(x,y);
						count++;
					} else {
						clearInterval(timer);
					}
				},20);
				draw(0,0);
			},
			that = {
				next: function() {
					move(index+1);
				},
				prev: function() {
					move(index-1);
				},
				index: function() {
					return index;
				},
				draw: function() {
					draw(0,0);
				},
				add: function(src, width, height, alt) {
					var item = makeItem(src, width, height, alt);
					if (pages.length == 0 || !pages[pages.length-1].add(item)) {
						var page = makePage(col, row);
						page.add(item);
						pages.push(page);
					}
				}
			};
		$('img',$gallery).each(function() {
			var src = $(this).attr('src'),
				width = $(this).attr('width'),
				height = $(this).attr('height'),
				alt = $(this).attr('alt');
			that.add(src, width, height, alt);
		});
		return that;
	};
