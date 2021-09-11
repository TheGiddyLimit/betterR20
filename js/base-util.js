function baseUtil () {
	d20plus.ut = {};

	d20plus.ut.log = (...args) => {
		console.log("%cD20Plus > ", "color: #3076b9; font-size: large", ...args);
	};

	d20plus.ut.error = (...args) => {
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
				avatar: "https://i.imgur.com/bBhudno.png"
			}
		);
	};

	d20plus.ut.ascSort = (a, b) => {
		if (b === a) return 0;
		return b < a ? 1 : -1;
	};

	d20plus.ut.disable3dDice = () => {
		d20plus.ut.log("Disabling 3D dice");
		const $cb3dDice = $(`#enable3ddice`);
		$cb3dDice.prop("checked", false).attr("disabled", true);
		$cb3dDice.closest("p").after(`<p><i>3D dice are incompatible with betteR20. We apologise for any inconvenience caused.</i></p>`);

		$(`#autoroll`).prop("checked", false).attr("disabled", true);;

		d20.tddice.canRoll3D = () => false;
	};

	d20plus.ut.checkVersion = (scriptType) => {
		d20plus.ut.log("Checking current version");

		function cmpVersions (a, b) {
			const regExStrip0 = /(\.0+)+$/;
			const segmentsA = a.replace(regExStrip0, '').split('.');
			const segmentsB = b.replace(regExStrip0, '').split('.');
			const l = Math.min(segmentsA.length, segmentsB.length);

			for (let i = 0; i < l; i++) {
				const diff = parseInt(segmentsA[i], 10) - parseInt(segmentsB[i], 10);
				if (diff) {
					return diff;
				}
			}
			return segmentsA.length - segmentsB.length;
		}

		let scriptUrl;
		switch (scriptType) {
			case "core": scriptType = `https://get.5e.tools/script/betteR20-core.user.js${d20plus.ut.getAntiCacheSuffix()}`; break;
			case "5etools": scriptType = `https://get.5e.tools/script/betteR20-5etools.user.js${d20plus.ut.getAntiCacheSuffix()}`; break;
			default: scriptUrl = "https://get.5e.tools/"; break;
		}

		$.ajax({
			url: `https://get.5e.tools`,
			success: (data) => {
				const m = /<!--\s*(\d+\.\d+\.\d+)\s*-->/.exec(data);
				if (m) {
					const curr = d20plus.version;
					const avail = m[1];
					const cmp = cmpVersions(curr, avail);
					if (cmp < 0) {
						setTimeout(() => {
							d20plus.ut.sendHackerChat(`A newer version of betteR20 is available. Get ${avail} <a href="https://get.5e.tools/">here</a>. For help and support, see our <a href="https://wiki.5e.tools/index.php/BetteR20_FAQ">wiki</a> or join our <a href="https://discord.gg/nGvRCDs">Discord</a>.`);
						}, 1000);
					}
				}
			},
			error: () => {
				d20plus.ut.log("Failed to check version");
			}
		})
	};

	d20plus.ut.chatTag = (message) => {
		const isStreamer = !!d20plus.cfg.get("interface", "streamerChatTag");
		d20plus.ut.sendHackerChat(`
				${isStreamer ? "Script" : message} initialised.
				${window.enhancementSuiteEnabled ? `<br><br>Roll20 Enhancement Suite detected.` : ""}
				${isStreamer ? "" : `
				<br>
				<br>
				Need help? Visit our <a href="https://wiki.5e.tools/index.php/Feature:_BetteR20">Wiki</a> or Join our <a href="https://discord.gg/nGvRCDs">Discord</a>.
				<br>
				<br>
				<span title="You'd think this would be obvious.">
				Please DO NOT post about this script or any related content in official channels, including the Roll20 forums.
				<br>
				<br>
				Before reporting a bug on the Roll20 forums, please disable the script and check if the problem persists.
				`}
				</span>
			`);
	};

	d20plus.ut.showLoadingMessage = (message) => {
		const isStreamer = !!d20plus.cfg.get("interface", "streamerChatTag");
		d20plus.ut.sendHackerChat(`
			${isStreamer ? "Script" : message} initialising, please wait...<br><br>
		`);
		d20plus.ut.sendHackerChat(`
			VTT Enhancement Suite version 1.15.35 or above is required.<br><br>
		`);
	};

	d20plus.ut.sendHackerChat = (message) => {
		d20.textchat.incoming(false, ({
			who: "system",
			type: "system",
			content: `<span class="hacker-chat">
				${message}
			</span>`
		}));
	};

	d20plus.ut.addCSS = (sheet, selectors, rules) => {
		if (!(selectors instanceof Array)) selectors = [selectors];

		selectors.forEach(selector => {
			const index = sheet.cssRules.length;
			try {
				if ("insertRule" in sheet) {
					sheet.insertRule(selector + "{" + rules + "}", index);
				} else if ("addRule" in sheet) {
					sheet.addRule(selector, rules, index);
				}
			} catch (e) {
				if ((!selector && selector.startsWith("-webkit-"))) {
					console.error(e);
					console.error(`Selector was "${selector}"; rules were "${rules}"`);
				}
			}
		});
	};

	d20plus.ut.addAllCss = () => {
		d20plus.ut.log("Adding CSS");

		const targetSheet =  [...window.document.styleSheets]
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
		return "?" + (new Date()).getTime();
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
			const res =  prompt(promptText, d20plus.ut._lastInput || "E.g. 1-5, 8, 11-13");
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

	d20plus.ut._BYTE_UNITS = ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	d20plus.ut.getReadableFileSizeString = (fileSizeInBytes) => {
		let i = -1;
		do {
			fileSizeInBytes = fileSizeInBytes / 1024;
			i++;
		} while (fileSizeInBytes > 1024);
		return Math.max(fileSizeInBytes, 0.1).toFixed(1) + d20plus.ut._BYTE_UNITS[i];
	};

	d20plus.ut.sanitizeFilename = function (str) {
		return str.trim().replace(/[^\w\-]/g, "_");
	};

	d20plus.ut.saveAsJson = function (filename, data) {
		const blob = new Blob([JSON.stringify(data, null, "\t")], {type: "application/json"});
		d20plus.ut.saveAs(blob, `${filename}.json`);
	};

	// based on:
	/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/src/FileSaver.js */
	d20plus.ut.saveAs = function() {
		const view = window;
		var
			doc = view.document
			// only get URL when necessary in case Blob.js hasn't overridden it yet
			, get_URL = function() {
				return view.URL || view.webkitURL || view;
			}
			, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
			, can_use_save_link = "download" in save_link
			, click = function(node) {
				var event = new MouseEvent("click");
				node.dispatchEvent(event);
			}
			, is_safari = /constructor/i.test(view.HTMLElement) || view.safari
			, is_chrome_ios =/CriOS\/[\d]+/.test(navigator.userAgent)
			, setImmediate = view.setImmediate || view.setTimeout
			, throw_outside = function(ex) {
				setImmediate(function() {
					throw ex;
				}, 0);
			}
			, force_saveable_type = "application/octet-stream"
			// the Blob API is fundamentally broken as there is no "downloadfinished" event to subscribe to
			, arbitrary_revoke_timeout = 1000 * 40 // in ms
			, revoke = function(file) {
				var revoker = function() {
					if (typeof file === "string") { // file is an object URL
						get_URL().revokeObjectURL(file);
					} else { // file is a File
						file.remove();
					}
				};
				setTimeout(revoker, arbitrary_revoke_timeout);
			}
			, dispatch = function(filesaver, event_types, event) {
				event_types = [].concat(event_types);
				var i = event_types.length;
				while (i--) {
					var listener = filesaver["on" + event_types[i]];
					if (typeof listener === "function") {
						try {
							listener.call(filesaver, event || filesaver);
						} catch (ex) {
							throw_outside(ex);
						}
					}
				}
			}
			, auto_bom = function(blob) {
				// prepend BOM for UTF-8 XML and text/* types (including HTML)
				// note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF
				if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
					return new Blob([String.fromCharCode(0xFEFF), blob], {type: blob.type});
				}
				return blob;
			}
			, FileSaver = function(blob, name, no_auto_bom) {
				if (!no_auto_bom) {
					blob = auto_bom(blob);
				}
				// First try a.download, then web filesystem, then object URLs
				var
					filesaver = this
					, type = blob.type
					, force = type === force_saveable_type
					, object_url
					, dispatch_all = function() {
						dispatch(filesaver, "writestart progress write writeend".split(" "));
					}
					// on any filesys errors revert to saving with object URLs
					, fs_error = function() {
						if ((is_chrome_ios || (force && is_safari)) && view.FileReader) {
							// Safari doesn't allow downloading of blob urls
							var reader = new FileReader();
							reader.onloadend = function() {
								var url = is_chrome_ios ? reader.result : reader.result.replace(/^data:[^;]*;/, 'data:attachment/file;');
								var popup = view.open(url, '_blank');
								if(!popup) view.location.href = url;
								url=undefined; // release reference before dispatching
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
							var opened = view.open(object_url, "_blank");
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
					setImmediate(function() {
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
			}
			, FS_proto = FileSaver.prototype
			, saveAs = function(blob, name, no_auto_bom) {
				return new FileSaver(blob, name || blob.name || "download", no_auto_bom);
			};
		// IE 10+ (native saveAs)
		if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
			return function(blob, name, no_auto_bom) {
				name = name || blob.name || "download";

				if (!no_auto_bom) {
					blob = auto_bom(blob);
				}
				return navigator.msSaveOrOpenBlob(blob, name);
			};
		}
		FS_proto.abort = function(){};
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
	}();

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
			case "walls":  return "Dynamic Lighting";
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
