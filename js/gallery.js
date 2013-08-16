var makeItem = function($img) {
		var _src = $img.attr('src'),
			_img_width = $img.attr('width'),
			_img_height = $img.attr('height')
			that = {
				width: 0,
				height: 0,
				draw: function(ctx, x, y) {
					ctx.strokeRect(x+5,y+5,this.width-10,this.height-10);
				}
			};
		return that;
	},
	makeGallery = function($gallery){
		var _items = [],
			_index = 0,
			_width = $gallery.attr('width'),
			_height = $gallery.attr('height'),
			ctx = $gallery[0].getContext('2d'),
			_is_valid_index = function(index) {
				return index >= 0 && index < _items.length;
			},
			that = {
				next: function() {
					if (_is_valid_index(_index+1)) {
						_index++;
					}
				},
				prev: function() {
					if (_is_valid_index(_index-1)) {
						_index--;
					}
				},
				index: function() {
					return _index;
				},
				draw: function() {
					var x = 0,
						y = 0,
						i = _index;
					while (x <= _width && _is_valid_index(i)) {
						_items[i].draw(ctx,x,y);
						x += _items[i].width;
						i++;
					}
					ctx.strokeRect(0,0,_width,_height);
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
