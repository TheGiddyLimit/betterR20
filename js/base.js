if (unsafeWindow.d20plus) {
	unsafeWindow.eval(`alert("An instance of betteR20 is already running! You may have two versions of betteR20 installed (e.g core and 5etools). Please only use one.");`);
	unsafeWindow.eval(`alert("Your game may not launch. Please only run one instance of betteR20.");`);
	throw new Error("");
}

unsafeWindow.d20plus = {};

const betteR20Base = function () {
	/* eslint-disable */
	CONSOLE_LOG = console.log;
	console.log = (...args) => {
		if (args.length === 1 && typeof args[0] === "string" && args[0].startsWith("Switch mode to ")) {
			const mode = args[0].replace("Switch mode to ", "");
			if (typeof d20plus !== "undefined" && d20plus.setMode) d20plus.setMode(mode);
		}
		CONSOLE_LOG(...args);
	};
	/* eslint-enable */
};

const D20plus = function (version) {
	d20plus.version = version;

	// Window loaded
	function doBootstrap () {
		d20plus.ut.log("Waiting for enhancement suite...");

		let timeWaitedForEnhancementSuiteMs = 0;

		(function waitForEnhancementSuite () {
			let hasRunInit = false;
			if (window.d20 || window.enhancementSuiteEnabled) {
				d20plus.ut.log("Bootstrapping...");

				// r20es will expose the d20 variable if we wait
				// this should always trigger after window.onload has fired, but track init state just in case
				(function waitForD20 () {
					if (typeof window.d20 !== "undefined" && !$("#loading-overlay").is(":visible") && !hasRunInit) {
						hasRunInit = true;
						d20plus.Init();
					} else {
						setTimeout(waitForD20, 50);
					}
				})();

				window.d20plus = d20plus;
				d20plus.ut.log("Injected");
			} else {
				if (timeWaitedForEnhancementSuiteMs > 2 * 5000) {
					alert("betteR20 requires the VTTES (R20ES) extension to be installed!\nPlease install it from https://ssstormy.github.io/roll20-enhancement-suite/\nClicking ok will take you there.");
					window.open("https://ssstormy.github.io/roll20-enhancement-suite/", "_blank");
				} else {
					timeWaitedForEnhancementSuiteMs += 100;
					setTimeout(waitForEnhancementSuite, 100);
				}
			}
		})();
	}

	(function doCheckDepsLoaded () {
		if (typeof $ !== "undefined") {
			doBootstrap();
		} else {
			setTimeout(doCheckDepsLoaded, 50);
		}
	})();
};

// if we are the topmost frame, inject
if (window.top === window.self) {
	const strip = (str) => {
		return `${str.replace(/use strict/, "").substring(str.indexOf("\n") + 1, str.lastIndexOf("\n"))}\n`;
	};

	let stack = "function (version) {\n";
	stack += strip(betteR20Base.toString());

	for (let i = 0; i < SCRIPT_EXTENSIONS.length; ++i) {
		stack += strip(SCRIPT_EXTENSIONS[i].toString())
	}
	stack += strip(D20plus.toString());

	stack += "\n}";
	unsafeWindow.eval(`(${stack})('${GM_info.script.version}')`);
}
