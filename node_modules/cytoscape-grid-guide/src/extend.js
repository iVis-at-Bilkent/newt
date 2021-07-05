/**
 * Deep copy or merge objects - replacement for jQuery deep extend
 * Taken from http://youmightnotneedjquery.com/#deep_extend
 * and bug related to deep copy of Arrays is fixed.
 * Usage:Object.extend({}, objA, objB)
 */

Object.extend = function(out) {
	out = out || {};

	for (var i = 1; i < arguments.length; i++) {
		var obj = arguments[i];

		if (!obj)
			continue;

		for (var key in obj) {
			if (obj.hasOwnProperty(key)) {
				if (Array.isArray(obj[key])) {
					out[key] = obj[key].slice();
				} else if (typeof obj[key] === 'object') {
					out[key] = Object.extend(out[key], obj[key]);
				} else {
					out[key] = obj[key];
				}
			}
		}
	}

	return out;
};
