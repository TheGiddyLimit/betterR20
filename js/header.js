ART_HANDOUT = "betteR20-art";
CONFIG_HANDOUT = "betteR20-config";

// TODO automate to use mirror if main site is unavailable
// BASE_SITE_URL = "https://5e.tools/";
BASE_SITE_URL = "https://5etools-mirror-1.github.io/";

SITE_JS_URL = BASE_SITE_URL + "js/";
DATA_URL = BASE_SITE_URL + "data/";

SCRIPT_EXTENSIONS = [];

EXT_LIB_SCRIPTS = [];
EXT_LIB_API_SCRIPTS = [];

JSON_DATA = {};

CONFIG_OPTIONS = {
	interface: {
		_name: "Interface",
		showCustomArtPreview: {
			name: "Show Custom Art Previews",
			default: true,
			_type: "boolean"
		}
	}
};

addConfigOptions = function (category, options) {
	if (!CONFIG_OPTIONS[category]) CONFIG_OPTIONS[category] = options;
	else CONFIG_OPTIONS[category] = Object.assign(CONFIG_OPTIONS[category], options);
};

OBJECT_DEFINE_PROPERTY = Object.defineProperty;
ACCOUNT_ORIGINAL_PERMS = {
	largefeats: false,
	xlfeats: false
};
Object.defineProperty = function (obj, prop, vals) {
	try {
		if (prop === "largefeats" || prop === "xlfeats") {
			ACCOUNT_ORIGINAL_PERMS[prop] = vals.value;
			vals.value = true;
		}
		OBJECT_DEFINE_PROPERTY(obj, prop, vals);
	} catch (e) {
		console.log("failed to define property:");
		console.log(e);
		console.log(obj, prop, vals);
	}
};

FINAL_CANVAS_MOUSEDOWN_LIST = [];
FINAL_CANVAS_MOUSEMOVE_LIST = [];
FINAL_CANVAS_MOUSEDOWN = null;
FINAL_CANVAS_MOUSEMOVE = null;
EventTarget.prototype.addEventListenerBase = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function(type, listener, options, ...others) {
	if (typeof d20 !== "undefined") {
		if (type === "mousedown" && this === d20.engine.final_canvas) FINAL_CANVAS_MOUSEDOWN = listener;
		if (type === "mousemove" && this === d20.engine.final_canvas) FINAL_CANVAS_MOUSEMOVE = listener;
	} else {
		if (type === "mousedown") FINAL_CANVAS_MOUSEDOWN_LIST.push({listener, on: this});
		if (type === "mousemove") FINAL_CANVAS_MOUSEMOVE_LIST.push({listener, on: this});
	}
	this.addEventListenerBase(type, listener, options, ...others);
};
