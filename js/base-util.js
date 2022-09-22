function baseUtil () {
	const vttesUrl = "https://justas-d.github.io/roll20-enhancement-suite/";
	let shownHardDickWarning = false;

	d20plus.ut = {};

	// d20plus.ut.WIKI_URL = "https://wiki.5e.tools"; // I'll be back ...
	d20plus.ut.WIKI_URL = "https://web.archive.org/web/20210826155610/https://wiki.5e.tools";

	d20plus.ut.log = (...args) => {
		// eslint-disable-next-line no-console
		console.log("%cD20Plus > ", "color: #3076b9; font-size: large", ...args);
	};

	d20plus.ut.error = (...args) => {
		// eslint-disable-next-line no-console
		console.error("%cD20Plus > ", "color: #b93032; font-size: large", ...args);
	};

	d20plus.ut.chatLog = (arg) => {
		d20.textchat.incoming(
			false,
			{
				who: "betteR20",
				type: "general",
				content: (arg || "").toString(),
				playerid: window.currentPlayer.id,
				id: d20plus.ut.generateRowId(),
				target: window.currentPlayer.id,
				avatar: "https://i.imgur.com/bBhudno.png",
			},
		);
	};

	d20plus.ut.ascSort = (a, b) => {
		if (b === a) return 0;
		return b < a ? 1 : -1;
	};

	d20plus.ut.fix3dDice = () => {
		Object.defineProperty(Array.prototype, "filter", {
			enumerable: false,
			value: Array.prototype.filter,
		});

		Object.defineProperty(Array.prototype, "map", {
			enumerable: false,
			value: Array.prototype.map,
		});
	};

	d20plus.ut.checkVersion = () => {
		d20plus.ut.log("Checking current version");

		function cmpVersions (a, b) {
			const regExStrip0 = /(\.0+)+$/;
			const segmentsA = a.replace(regExStrip0, "").split(".");
			const segmentsB = b.replace(regExStrip0, "").split(".");
			const l = Math.min(segmentsA.length, segmentsB.length);

			for (let i = 0; i < l; i++) {
				const diff = parseInt(segmentsA[i], 10) - parseInt(segmentsB[i], 10);
				if (diff) {
					return diff;
				}
			}
			return segmentsA.length - segmentsB.length;
		}

		const isStreamer = !!d20plus.cfg.get("interface", "streamerChatTag");
		const scriptName = isStreamer ? "Script" : "betteR20";
		$.ajax({
			url: `https://raw.githubusercontent.com/TheGiddyLimit/betterR20/development/dist/betteR20-version`,
			success: (data) => {
				if (data) {
					const curr = d20plus.version;
					const avail = data;
					const cmp = cmpVersions(curr, avail);
					if (cmp < 0) {
						setTimeout(() => {
							if (!isStreamer) {
								const rawToolsInstallUrl = "https://github.com/TheGiddyLimit/betterR20/blob/development/dist/betteR20-5etools.user.js?raw=true";
								const rawCoreInstallUrl = "https://github.com/TheGiddyLimit/betterR20/blob/development/dist/betteR20-core.user.js?raw=true";
								d20plus.ut.sendHackerChat(`<br>A newer version of ${scriptName} is available.<br>Get ${avail} <a href="${rawToolsInstallUrl}">5etools</a> OR <a href="${rawCoreInstallUrl}">core</a>.<br><br>`);
							} else {
								d20plus.ut.sendHackerChat(`<br>A newer version of ${scriptName} is available.<br><br>`);
							}
						}, 1000);
					}
				}
			},
			error: () => {
				d20plus.ut.log("Failed to check version");
			},
		})
	};

	d20plus.ut.showHardDickMessage = (scriptName) => {
		if (shownHardDickWarning) return;
		shownHardDickWarning = true;

		d20plus.ut.sendHackerChat(`
			${scriptName} needs VTT Enhancement Suite! Please install it from <a href="${vttesUrl}">here</a>.
			<br>
		`, true);
	};

	d20plus.ut.chatTag = (message) => {
		const isStreamer = !!d20plus.cfg.get("interface", "streamerChatTag");
		const scriptName = isStreamer ? "Script" : message;
		if (window.enhancementSuiteEnabled) {
			d20plus.ut.sendHackerChat(`
				VTT Enhancement Suite detected.
				<br><br>
				${scriptName} initialised.
				<br>
			`);
		} else d20plus.ut.showHardDickMessage(scriptName);
		d20plus.ut.sendHackerChat(`
			${isStreamer ? "" : `
			<br>
			Need help? Visit our <a href="${d20plus.ut.WIKI_URL}/index.php/BetteR20_FAQ">wiki</a> or join our <a href="https://discord.gg/nGvRCDs">Discord</a>.
			<br>
			<br>
			<span title="You'd think this would be obvious.">
			Please DO NOT post about this script or any related content in official channels, including the Roll20 forums.
			<br>
			<br>
			Before reporting a bug on the Roll20 forums, please disable the script and check if the problem persists.
			</span>
			`}
		`);
	};

	d20plus.ut.showLoadingMessage = (message) => {
		const isStreamer = !!d20plus.cfg.get("interface", "streamerChatTag");
		const scriptName = isStreamer ? "Script" : message;
		d20plus.ut.sendHackerChat(`
			${scriptName} initialising, please wait...<br><br>
		`);
		if (!window.enhancementSuiteEnabled) d20plus.ut.showHardDickMessage(scriptName);
	};

	d20plus.ut.sendHackerChat = (message, error = false) => {
		d20.textchat.incoming(false, ({
			who: "system",
			type: "system",
			content: `<span class="${error ? "hacker-chat-error" : "hacker-chat"}">
				${message}
			</span>`,
		}));
	};

	d20plus.ut.addCSS = (sheet, selectors, rules) => {
		if (!(selectors instanceof Array)) selectors = [selectors];

		selectors.forEach(selector => {
			const index = sheet.cssRules.length;
			try {
				if ("insertRule" in sheet) {
					sheet.insertRule(`${selector}{${rules}}`, index);
				} else if ("addRule" in sheet) {
					sheet.addRule(selector, rules, index);
				}
			} catch (e) {
				if ((!selector && selector.startsWith("-webkit-"))) {
					// eslint-disable-next-line no-console
					console.error(`Selector was "${selector}"; rules were "${rules}"`, e);
				}
			}
		});
	};

	d20plus.ut.addAllCss = () => {
		d20plus.ut.log("Adding CSS");

		const targetSheet = [...window.document.styleSheets]
			.filter(it => it.href && (!it.href.startsWith("moz-extension") && !it.href.startsWith("chrome-extension")))
			.find(it => it.href.includes("app.css"));

		_.each(d20plus.css.baseCssRules, function (r) {
			d20plus.ut.addCSS(targetSheet, r.s, r.r);
		});
		if (!window.is_gm) {
			_.each(d20plus.css.baseCssRulesPlayer, function (r) {
				d20plus.ut.addCSS(targetSheet, r.s, r.r);
			});
		}
		_.each(d20plus.css.cssRules, function (r) {
			d20plus.ut.addCSS(targetSheet, r.s, r.r);
		});
	};

	d20plus.ut.getAntiCacheSuffix = () => {
		return `?${(new Date()).getTime()}`;
	};

	d20plus.ut.generateRowId = () => {
		return window.generateUUID().replace(/_/g, "Z");
	};

	d20plus.ut.randomRoll = (roll, success, error) => {
		d20.textchat.diceengine.process(roll, success, error);
	};

	d20plus.ut.getJournalFolderObj = () => {
		d20.journal.refreshJournalList();
		let journalFolder = d20.Campaign.get("journalfolder");
		if (journalFolder === "") {
			d20.journal.addFolderToFolderStructure("Characters");
			d20.journal.refreshJournalList();
			journalFolder = d20.Campaign.get("journalfolder");
		}
		return JSON.parse(journalFolder);
	};

	d20plus.ut._lastInput = null;
	d20plus.ut.getNumberRange = (promptText, min, max) => {
		function alertInvalid () {
			alert("Please enter a valid range.");
		}

		function isOutOfRange (num) {
			return num < min || num > max;
		}

		function addToRangeVal (range, num) {
			range.add(num);
		}

		function addToRangeLoHi (range, lo, hi) {
			for (let i = lo; i <= hi; ++i) {
				range.add(i);
			}
		}

		function alertOutOfRange () {
			alert(`Please enter numbers in the range ${min}-${max} (inclusive).`);
		}

		while (true) {
			const res = prompt(promptText, d20plus.ut._lastInput || "E.g. 1-5, 8, 11-13");
			if (res && res.trim()) {
				d20plus.ut._lastInput = res;
				const clean = res.replace(/\s*/g, "");
				if (/^((\d+-\d+|\d+),)*(\d+-\d+|\d+)$/.exec(clean)) {
					const parts = clean.split(",");
					const out = new Set();
					let failed = false;

					for (const part of parts) {
						if (part.includes("-")) {
							const spl = part.split("-");
							const numLo = Number(spl[0]);
							const numHi = Number(spl[1]);

							if (isNaN(numLo) || isNaN(numHi) || numLo === 0 || numHi === 0 || numLo > numHi) {
								alertInvalid();
								failed = true;
								break;
							}

							if (isOutOfRange(numLo) || isOutOfRange(numHi)) {
								alertOutOfRange();
								failed = true;
								break;
							}

							if (numLo === numHi) {
								addToRangeVal(out, numLo);
							} else {
								addToRangeLoHi(out, numLo, numHi);
							}
						} else {
							const num = Number(part);
							if (isNaN(num) || num === 0) {
								alertInvalid();
								failed = true;
								break;
							} else {
								if (isOutOfRange(num)) {
									alertOutOfRange();
									failed = true;
									break;
								}
								addToRangeVal(out, num);
							}
						}
					}

					if (!failed) {
						d20plus.ut._lastInput = null;
						return out;
					}
				} else {
					alertInvalid();
				}
			} else {
				d20plus.ut._lastInput = null;
				return null;
			}
		}
	};

	d20plus.ut.getPathById = (pathId) => {
		return d20plus.ut._getCanvasElementById(pathId, "thepaths");
	};

	d20plus.ut.getTokenById = (tokenId) => {
		return d20plus.ut._getCanvasElementById(tokenId, "thegraphics");
	};

	d20plus.ut._getCanvasElementById = (id, prop) => {
		const foundArr = d20.Campaign.pages.models.map(model => model[prop] && model[prop].models ? model[prop].models.find(it => it.id === id) : null).filter(it => it);
		return foundArr.length ? foundArr[0] : null;
	};

	d20plus.ut.getMacroByName = (macroName) => {
		const macros = d20.Campaign.players.map(p => p.macros.find(m => m.get("name") === macroName && (p.id === window.currentPlayer.id || m.visibleToCurrentPlayer())))
			.filter(Boolean);
		if (macros.length) {
			return macros[0];
		}
		return null;
	};

	d20plus.ut._BYTE_UNITS = ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
	d20plus.ut.getReadableFileSizeString = (fileSizeInBytes) => {
		let i = -1;
		do {
			fileSizeInBytes = fileSizeInBytes / 1024;
			i++;
		} while (fileSizeInBytes > 1024);
		return Math.max(fileSizeInBytes, 0.1).toFixed(1) + d20plus.ut._BYTE_UNITS[i];
	};

	d20plus.ut.sanitizeFilename = function (str) {
		return str.trim().replace(/[^-\w]/g, "_");
	};

	d20plus.ut.saveAsJson = function (filename, data) {
		const blob = new Blob([JSON.stringify(data, null, "\t")], {type: "application/json"});
		d20plus.ut.saveAs(blob, `${filename}.json`);
	};

	// based on:
	/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/src/FileSaver.js */
	d20plus.ut.saveAs = (function () {
		const view = window;
		let
			doc = view.document;
			// only get URL when necessary in case Blob.js hasn't overridden it yet
		let get_URL = function () {
			return view.URL || view.webkitURL || view;
		};
		let save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a");
		let can_use_save_link = "download" in save_link;
		let click = function (node) {
			let event = new MouseEvent("click");
			node.dispatchEvent(event);
		};
		let is_safari = /constructor/i.test(view.HTMLElement) || view.safari;
		let is_chrome_ios = /CriOS\/[\d]+/.test(navigator.userAgent);
		let setImmediate = view.setImmediate || view.setTimeout;
		let throw_outside = function (ex) {
			setImmediate(function () {
				throw ex;
			}, 0);
		};
		let force_saveable_type = "application/octet-stream";
		// the Blob API is fundamentally broken as there is no "downloadfinished" event to subscribe to
		let arbitrary_revoke_timeout = 1000 * 40; // in ms
		let revoke = function (file) {
			let revoker = function () {
				if (typeof file === "string") { // file is an object URL
					get_URL().revokeObjectURL(file);
				} else { // file is a File
					file.remove();
				}
			};
			setTimeout(revoker, arbitrary_revoke_timeout);
		};
		let dispatch = function (filesaver, event_types, event) {
			event_types = [].concat(event_types);
			let i = event_types.length;
			while (i--) {
				let listener = filesaver[`on${event_types[i]}`];
				if (typeof listener === "function") {
					try {
						listener.call(filesaver, event || filesaver);
					} catch (ex) {
						throw_outside(ex);
					}
				}
			}
		};
		let auto_bom = function (blob) {
			// prepend BOM for UTF-8 XML and text/* types (including HTML)
			// note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF
			if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
				return new Blob([String.fromCharCode(0xFEFF), blob], {type: blob.type});
			}
			return blob;
		};
		let FileSaver = function (blob, name, no_auto_bom) {
			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			// First try a.download, then web filesystem, then object URLs
			let
				filesaver = this;
			let type = blob.type;
			let force = type === force_saveable_type;
			let object_url;
			let dispatch_all = function () {
				dispatch(filesaver, "writestart progress write writeend".split(" "));
			};
			// on any filesys errors revert to saving with object URLs
			let fs_error = function () {
				if ((is_chrome_ios || (force && is_safari)) && view.FileReader) {
					// Safari doesn't allow downloading of blob urls
					let reader = new FileReader();
					reader.onloadend = function () {
						let url = is_chrome_ios ? reader.result : reader.result.replace(/^data:[^;]*;/, "data:attachment/file;");
						let popup = view.open(url, "_blank");
						if (!popup) view.location.href = url;
						url = undefined; // release reference before dispatching
						filesaver.readyState = filesaver.DONE;
						dispatch_all();
					};
					reader.readAsDataURL(blob);
					filesaver.readyState = filesaver.INIT;
					return;
				}
				// don't create more object URLs than needed
				if (!object_url) {
					object_url = get_URL().createObjectURL(blob);
				}
				if (force) {
					view.location.href = object_url;
				} else {
					let opened = view.open(object_url, "_blank");
					if (!opened) {
						// Apple does not allow window.open, see https://developer.apple.com/library/safari/documentation/Tools/Conceptual/SafariExtensionGuide/WorkingwithWindowsandTabs/WorkingwithWindowsandTabs.html
						view.location.href = object_url;
					}
				}
				filesaver.readyState = filesaver.DONE;
				dispatch_all();
				revoke(object_url);
			};
			filesaver.readyState = filesaver.INIT;

			if (can_use_save_link) {
				object_url = get_URL().createObjectURL(blob);
				setImmediate(function () {
					save_link.href = object_url;
					save_link.download = name;
					click(save_link);
					dispatch_all();
					revoke(object_url);
					filesaver.readyState = filesaver.DONE;
				}, 0);
				return;
			}

			fs_error();
		};
		let FS_proto = FileSaver.prototype;
		let saveAs = function (blob, name, no_auto_bom) {
			return new FileSaver(blob, name || blob.name || "download", no_auto_bom);
		};
		// IE 10+ (native saveAs)
		if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
			return function (blob, name, no_auto_bom) {
				name = name || blob.name || "download";

				if (!no_auto_bom) {
					blob = auto_bom(blob);
				}
				return navigator.msSaveOrOpenBlob(blob, name);
			};
		}
		FS_proto.abort = function () {};
		FS_proto.readyState = FS_proto.INIT = 0;
		FS_proto.WRITING = 1;
		FS_proto.DONE = 2;
		FS_proto.error =
			FS_proto.onwritestart =
				FS_proto.onprogress =
					FS_proto.onwrite =
						FS_proto.onabort =
							FS_proto.onerror =
								FS_proto.onwriteend =
									null;

		return saveAs;
	}());

	d20plus.ut.promiseDelay = function (delay) {
		return new Promise(resolve => {
			setTimeout(() => resolve(), delay);
		})
	};

	d20plus.ut.LAYERS = ["map", "background", "objects", "foreground", "gmlayer", "walls", "weather"];
	d20plus.ut.layerToName = (l) => {
		switch (l) {
			case "map": return "Map";
			case "background": return "Background";
			case "objects": return "Objects & Tokens";
			case "foreground": return "Foreground";
			case "gmlayer": return "GM Info Overlay";
			case "walls": return "Dynamic Lighting";
			case "weather": return "Weather Exclusions";
		}
	};

	d20plus.ut.get$SelValue = ($sel) => {
		return $sel[0].options[$sel[0].selectedIndex].value;
	};

	d20plus.ut.isUseSharedJs = () => {
		return BASE_SITE_URL.includes("://5e.tools")
			|| BASE_SITE_URL.includes("://5etools.com")
			|| /:\/\/5etools-mirror-\d+\./.test(BASE_SITE_URL);
	};

	d20plus.ut.fixSidebarLayout = () => {
		$(`#textchat-input`).insertAfter(`#textchat`);
		const cached = d20.textchat.showPopout;
		d20.textchat.showPopout = function () {
			cached();
			const cached2 = d20.textchat.childWindow.onbeforeunload;
			d20.textchat.childWindow.onbeforeunload = function () {
				cached2();
				$(`#textchat-input`).insertAfter(`#textchat`);
			}
		}
	};

	d20plus.ut.dynamicStyles = (slug) => {
		if (!d20plus.css.dynamic) d20plus.css.dynamic = {};
		if (!d20plus.css.dynamic[slug]) {
			d20plus.css.dynamic[slug] = $("<style></style>").appendTo("body");
		}
		return d20plus.css.dynamic[slug];
	}

	/**
	* Assumes any other lists have been searched using the same term
	*/
	d20plus.ut.getSearchTermAndReset = (list, ...otherLists) => {
		let lastSearch = null;
		if (list.searched) {
			lastSearch = $(`#search`).val();
			list.search();
			otherLists.forEach(l => l.search());
		}
		list.filter();
		otherLists.forEach(l => l.filter());
		return lastSearch;
	};
}

SCRIPT_EXTENSIONS.push(baseUtil);

/*

map
afow
grid
background
objects
foreground
gmlayer
walls
weather

 */
