var makeItem = function($img) {
		var _img = new Image(),
			_img_width = parseInt($img.attr('width'),0),
			_img_height = parseInt($img.attr('height'),0),
			_ctx = undefined
			_x =  undefined,
			_y =  undefined,
			_caption = $img.attr('caption'),
			that = {
				width: 0,
				height: 0,
				dx: 0,
				dy: 0,
				dw: 0,
				dh: 0,
				updateSize: function() {
					if (_img_width <= 0 || _img_height <= 0) return;
					if (this.width * _img_height < this.height * _img_width) {
						this.dw = this.width * 0.8;
						this.dh = _img_height * this.dw / _img_width;
					} else {
						this.dh = this.height * 0.8;
						this.dw = _img_width * this.dh / _img_height;
					}
					this.dx = (this.width - this.dw) / 2;
					this.dy = (this.height - this.dh) / 2;
				},
				draw: function(ctx, x, y) {
					_ctx = ctx;
					_x = x;
					_y = y;
					this.updateSize();
					if (_img.complete) {
						ctx.drawImage(_img,x+this.dx,y+this.dy,this.dw,this.dh);
					}
				},
				isComplete: function() {
					return _img.complete;
				},
				getCaption: function() {
					return _caption;
				}
			};
		_img.src = $img.attr('src');
		return that;
	},
	makeGallery = function($gallery){
		var _items = [],
			_index = 0,
			_width = parseInt($gallery.attr('width'),0),
			_height = parseInt($gallery.attr('height'),0),
			ctx = $gallery[0].getContext('2d'),
			caption = null,
			_is_valid_index = function(index) {
				return index >= 0 && index < _items.length;
			},
			draw = function(x,y,i) {
				ctx.clearRect(0,0,_width,_height);
				while (x <= _width && _is_valid_index(i)) {
					_items[i].draw(ctx,x,y);
					x += _items[i].width;
					i++;
				}
			},
			move = function(from,to,i) {
				var x = from,
					y = 0,
					d = (to - from) / 25,
					count = 0;
				var timer = setInterval(function() {
					if (count < 25) {
						draw(x,y,i);
						x += d;
						count++;
					} else {
						clearInterval(timer);
					}
				},20);
				draw(0,0,_index);
			},
			update_caption = function(i) {
				if (caption && _is_valid_index(i)) {
					caption.text(_items[i].getCaption());
				}
			},
			that = {
				next: function() {
					if (_is_valid_index(_index+1)) {
						move(0,-_items[_index].width,_index);
						_index++;
						update_caption(_index);
					}
				},
				prev: function() {
					if (_is_valid_index(_index-1)) {
						move(-_items[_index-1].width,0,_index-1);
						_index--;
						update_caption(_index);
					}
				},
				index: function() {
					return _index;
				},
				draw: function() {
					var x = 0,
						y = 0;
					draw(x,y,_index);
				},
				set_caption: function($caption) {
					caption = $caption;
				}
			};
		$('img',$gallery).each(function() {
			var item = makeItem($(this));
			item.width = _width/5;
			item.height = _height;
			_items.push(item);
		});
		return that;
	};
