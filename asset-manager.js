var _ = require('underscore'),
		fs = require('fs'),
		qs = require('qs');

module.exports = function assetManager(o) {
	var defaults = {
	};
	var options = _.extend(defaults, o);
	var bundles = {
		main: [
			'lib/jquery-1.6.4.min.js',
			'lib/underscore/underscore.js',
			'lib/backbone/backbone.js'
		]
	};

	var getBundleContent = function(bundle) {
		var content = '';
		for (var i=0; i<bundles[bundle].length; i++) {
			var src = bundles[bundle][i];
			if (src.substring(0,1) === '@') {
				content += getBundleContent(src.substring(1));
			} else {
				content += fs.readFileSync(src);
			}
		}
		return content;
	}

	return function assetManager(req, res, next) {
		var matches = req.url.match(/^\/js\/(.*)/);
		if (matches) {
			var debug = matches[1].match(/^_debug\/(.*)/);
			if (debug) {
				fs.readFile(debug[1], function(err, buffer) {
					if (err) return next(err);
					res.header('Content-Type', 'text/javascript');
					res.send(buffer);
				});
			} else {
				var bundle = matches[1].split('.')[0];
				var querystring = {};
				if (req.headers && req.headers.referer) {
					querystring = qs.parse(req.headers.referer.split('?')[1]);
				}
				if (querystring['debug'] !== undefined) {
					var output = 'var h=document.getElementsByTagName("head")[0];';
					for (var i=0; i<bundles[bundle].length; i++) {
						output += 'var s=document.createElement("script");s.type="text/javascript";s.src="/js/_debug/' + bundles[bundle][i] + '";h.appendChild(s);'
					}
					res.header('Content-Type', 'text/javascript');
					res.send(output);
				} else {
					var orig_code = getBundleContent(bundle);

					//var jsp = require("uglify-js").parser;
					//var pro = require("uglify-js").uglify;
					//var ast = jsp.parse(orig_code); // parse code and get the initial AST
					//ast = pro.ast_mangle(ast); // get a new AST with mangled names
					//ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
					//var final_code = pro.gen_code(ast); // compressed code here

					res.header('Content-Type', 'text/javascript');
					res.send(orig_code);
				}
			}
		} else {
			next();
		}
	}
}
