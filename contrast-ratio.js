function $(expr, con) {
	return typeof expr === 'string'? (con || document).querySelector(expr) : expr;
}

function $$(expr, con) {
	return Array.prototype.slice.call((con || document).querySelectorAll(expr));
}

// Make each ID a global variable
// Many browsers do this anyway (it’s in the HTML5 spec), so it ensures consistency
$$('[id]').forEach(function(element) { window[element.id] = element; });

var messages = {
	'semitransparent': 'The background is semi-transparent, so the contrast ratio cannot be precise. Depending on what’s going to be underneath, it could be any of the following:',
	'fail': 'Fails WCAG 2.0 :-(',
	'aa-large': 'Passes AA for large text (above 18pt or bold above 14pt)',
	'aa': 'Passes AA level for any size text and AAA for large text (above 18pt or bold above 14pt)',
	'aaa': 'Passes AAA level for any size text'
};

incrementable.onload = function() {
	if (window.Incrementable) {
		new Incrementable(background);
		new Incrementable(foreground);
	}
};

if (window.Incrementable) {
	incrementable.onload();
}

var output = $('output');

var levels = {
	'fail': {
		range: [0, 3],
		color: 'hsl(0, 100%, 40%)'
	},
	'aa-large': {
		range: [3, 4.5],
		color: 'hsl(40, 100%, 45%)'
	},
	'aa': {
		range: [4.5, 7],
		color: 'hsl(80, 60%, 45%)'
	},
	'aaa': {
		range: [7, 22],
		color: 'hsl(95, 60%, 41%)'
	}
};

function rangeIntersect(min, max, upper, lower) {
	return (max < upper? max : upper) - (lower < min? min : lower);
}

function update() {
	if (foreground.color && background.color) {
		var contrast = background.color.contrast(foreground.color);

		var min = contrast.min,
		    max = contrast.max,
		    range = max - min,
		    classes = [], percentages = [];
		
		for (var level in levels) {
			var bounds = levels[level].range,
			    lower = bounds[0],
			    upper = bounds[1];
			
			if (min < upper && max >= lower) {
				classes.push(level);
				
				percentages.push({
					level: level,
					percentage: 100 * rangeIntersect(min, max, upper, lower) / range
				});
			}
		}
		
		$('strong', output).textContent = contrast.ratio;
		
		var error = $('.error', output);
		
		if (contrast.error) {
			error.textContent = '±' + contrast.error;
			error.title = min + ' - ' + max;
		}
		else {
			error.textContent = '';
			error.title = '';
		}
		
		if (classes.length <= 1) {
			results.textContent = messages[classes[0]];
			output.style.backgroundImage = '';
			output.style.backgroundColor = levels[classes[0]].color;
		}
		else {
			var fragment = document.createDocumentFragment();
			
			var p = document.createElement('p');
			p.textContent = messages.semitransparent;
			fragment.appendChild(p);
			
			var ul = document.createElement('ul');
			
			
			var message = '<p></p><ul>';
			
			for (var i=0; i<classes.length; i++) {
				var li = document.createElement('li');
				
				li.textContent = messages[classes[i]];
				
				ul.appendChild(li);
			}
			
			fragment.appendChild(ul);
			
			results.textContent = '';
			results.appendChild(fragment);
			
			// Create gradient illustrating levels
			var stops = [], previousPercentage = 0;
			
			for (var i=0; i < 2 * percentages.length; i++) {
				var info = percentages[i % percentages.length];
				
				var level = info.level;
				var color = levels[level].color,
				    percentage = previousPercentage + info.percentage / 2;
				
				stops.push(color + ' ' + previousPercentage + '%', color + ' ' + percentage + '%');
				
				previousPercentage = percentage;
			}
			
			var gradient = 'linear-gradient(-45deg, ' + stops.join(', ') + ')';
			
			//console.log(gradient);
			output.style.backgroundImage = PrefixFree.prefix + gradient;
			output.style.backgroundImage = gradient;
		}
		
		output.className = classes.join(' '); 
	}
}

function colorChanged(input) {
	input.style.width = input.value.length * .56 + 'em';
	input.style.width = input.value.length + 'ch';
	
	var isForeground = input == foreground;
	
	var display = isForeground? foregroundDisplay : backgroundDisplay;
	
	var previousColor = getComputedStyle(display).backgroundColor;
	
	display.style.background = input.value;
	
	var color = getComputedStyle(display).backgroundColor;
	
	if (color !== previousColor && color) {
		// Valid & different color
		if (isForeground) {
			backgroundDisplay.style.color = input.value;
		}
		
		input.color = new Color(color);
		
		return true;
	}
	
	return false;
}

background.oninput =
foreground.oninput = function() {
	var valid = colorChanged(this);
	
	if (valid) {
		update();
		
		this.title = 'Relative luminance: ' + (this.color && this.color.luminance);
		
		var onhashchange = window.onhashchange;
		window.onhashchange = null;
		
		location.hash = '#' + encodeURIComponent(foreground.value) + '-on-' + encodeURIComponent(background.value);
		
		setTimeout(function() {
			window.onhashchange = onhashchange;
		}, 10);
	}
}

swap.onclick = function() {
	var backgroundColor = background.value;
	background.value = foreground.value;
	foreground.value = backgroundColor;
	
	colorChanged(background);
	colorChanged(foreground);
	
	update();
}

window.encodeURIComponent = (function(){
	var encodeURIComponent = window.encodeURIComponent;

	return function (str) {
		return encodeURIComponent(str).replace(/[()]/g, function ($0) {
			return escape($0);
		});
	};
})();

window.decodeURIComponent = (function(){
	var decodeURIComponent = window.decodeURIComponent;

	return function (str) {
		return str.search(/%[\da-f]/i) > -1? decodeURIComponent(str) : str;
	};
})();

onhashchange = function () {
	if (location.hash) {
		var colors = location.hash.slice(1).split('-on-');
		
		foreground.value = decodeURIComponent(colors[0]);
		background.value = decodeURIComponent(colors[1]);
	}
	else {
		foreground.value = foreground.defaultValue;
		background.value = background.defaultValue;
	}
	
	background.oninput();
	foreground.oninput();
};

onhashchange();