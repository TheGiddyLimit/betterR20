const betteR205etoolsMain = function () {
	IMG_URL = `${BASE_SITE_URL}img/`;

	SPELL_DATA_DIR = `${DATA_URL}spells/`;
	SPELL_META_URL = `${SPELL_DATA_DIR}roll20.json`;
	MONSTER_DATA_DIR = `${DATA_URL}bestiary/`;
	ADVENTURE_DATA_DIR = `${DATA_URL}adventure/`;
	CLASS_DATA_DIR = `${DATA_URL}class/`;

	ITEM_DATA_URL = `${DATA_URL}items.json`;
	FEAT_DATA_URL = `${DATA_URL}feats.json`;
	PSIONIC_DATA_URL = `${DATA_URL}psionics.json`;
	OBJECT_DATA_URL = `${DATA_URL}objects.json`;
	BACKGROUND_DATA_URL = `${DATA_URL}backgrounds.json`;
	OPT_FEATURE_DATA_URL = `${DATA_URL}optionalfeatures.json`;
	RACE_DATA_URL = `${DATA_URL}races.json`;

	// the GitHub API has a 60 requests/hour limit per IP which we quickly hit if the user refreshes their Roll20 a couple of times
	// embed shitty OAth2 details here to enable 5k/hour requests per IP (sending them with requests to the API relaxes the limit)
	// naturally these are client-visible and should not be used to secure anything
	const HOMEBREW_CLIENT_ID = `67e57877469da38a85a7`;
	const HOMEBREW_CLIENT_SECRET = `c00dede21ca63a855abcd9a113415e840aca3f92`;

	const REQUIRED_PROPS = {
		"monster": [
			"ac",
			"alignment",
			"cha",
			"con",
			"cr",
			"dex",
			"hp",
			"int",
			"name",
			"passive",
			"size",
			"source",
			"speed",
			"str",
			"type",
			"wis",
		],
		"spell": [
			"name",
			"level",
			"school",
			"time",
			"range",
			"components",
			"duration",
			"classes",
			"entries",
			"source",
		],
		"item": [
			"name",
			"rarity",
			"source",
		],
		"psionic": [
			"name",
			"source",
			"type",
		],
		"feat": [
			"name",
			"source",
			"entries",
		],
		"object": [
			"name",
			"source",
			"size",
			"type",
			"ac",
			"hp",
			"immune",
			"entries",
		],
		"class": [
			"name",
			"source",
			"hd",
			"proficiency",
			"classTableGroups",
			"startingProficiencies",
			"startingEquipment",
			"classFeatures",
			"subclassTitle",
			"subclasses",
		],
		"subclass": [

		],
		"background": [
			"name",
			"source",
			"skillProficiencies",
			"entries",
		],
		"race": [
			"name",
			"source",
		],
		"optionalfeature": [
			"name",
			"source",
			"entries",
		],
	};

	let spellDataUrls = {};
	let spellMetaData = {};
	let monsterDataUrls = {};
	let monsterFluffDataUrls = {};
	let monsterFluffData = {};
	let monsterMetadata = {};
	let adventureMetadata = {};
	let itemMetadata = {};
	let classDataUrls = {};
	let brewIndex = {};

	// build a big dictionary of sheet properties to be used as reference throughout // TODO use these as reference throughout
	function SheetAttribute (name, ogl, shaped) {
		this.name = name;
		this.ogl = ogl;
		this.shaped = shaped;
	}

	NPC_SHEET_ATTRIBUTES = {};
	// these (other than the name, which is for display only) are all lowercased; any comparison should be lowercased
	NPC_SHEET_ATTRIBUTES["empty"] = new SheetAttribute("--Empty--", "", "");
	// TODO: implement custom entry (enable textarea)
	// NPC_SHEET_ATTRIBUTES["custom"] = new SheetAttribute("-Custom-", "-Custom-", "-Custom-");
	NPC_SHEET_ATTRIBUTES["npc_hpbase"] = new SheetAttribute("HP", "npc_hpbase", "npc_hpbase");
	NPC_SHEET_ATTRIBUTES["npc_ac"] = new SheetAttribute("AC", "npc_ac", "ac");
	NPC_SHEET_ATTRIBUTES["passive"] = new SheetAttribute("Passive Perception", "passive", "passive");
	NPC_SHEET_ATTRIBUTES["npc_hpformula"] = new SheetAttribute("HP Formula", "npc_hpformula", "npc_hpformula");
	NPC_SHEET_ATTRIBUTES["npc_speed"] = new SheetAttribute("Speed", "npc_speed", "npc_speed");
	NPC_SHEET_ATTRIBUTES["spell_save_dc"] = new SheetAttribute("Spell Save DC", "spell_save_dc", "spell_save_DC");
	NPC_SHEET_ATTRIBUTES["npc_legendary_actions"] = new SheetAttribute("Legendary Actions", "npc_legendary_actions", "npc_legendary_actions");
	NPC_SHEET_ATTRIBUTES["npc_challenge"] = new SheetAttribute("CR", "npc_challenge", "challenge");

	PC_SHEET_ATTRIBUTES = {};
	PC_SHEET_ATTRIBUTES["empty"] = new SheetAttribute("--Default--", "", "");
	PC_SHEET_ATTRIBUTES["hp"] = new SheetAttribute("Current HP", "hp", "HP");
	PC_SHEET_ATTRIBUTES["ac"] = new SheetAttribute("AC", "ac", "ac"); // TODO check shaped
	PC_SHEET_ATTRIBUTES["passive_wisdom"] = new SheetAttribute("Passive Perception", "passive_wisdom", "passive_wisdom"); // TODO check shaped
	PC_SHEET_ATTRIBUTES["speed"] = new SheetAttribute("Speed", "speed", "speed"); // TODO check shaped
	PC_SHEET_ATTRIBUTES["spell_save_dc"] = new SheetAttribute("Spell Save DC", "spell_save_dc", "spell_save_dc"); // TODO check shaped

	d20plus.sheet = "ogl";

	d20plus.advantageModes = ["Toggle (Default Advantage)", "Toggle", "Toggle (Default Disadvantage)", "Always", "Query", "Never"];
	d20plus.whisperModes = ["Toggle (Default GM)", "Toggle (Default Public)", "Always", "Query", "Never"];
	d20plus.damageModes = ["Auto Roll", "Don't Auto Roll"];

	d20plus.formulas = {
		_options: ["--Empty--", "AC", "HP", "Passive Perception", "Spell DC"],
		"ogl": {
			"cr": "@{npc_challenge}",
			"ac": "@{ac}",
			"npcac": "@{npc_ac}",
			"hp": "@{hp}",
			"pp": "@{passive_wisdom}",
			"macro": "",
			"spellDc": "@{spell_save_dc}",
		},
		"community": {
			"cr": "@{npc_challenge}",
			"ac": "@{AC}",
			"npcac": "@{AC}",
			"hp": "@{HP}",
			"pp": "10 + @{perception}",
			"macro": "",
			"spellDc": "@{spell_save_dc}",
		},
		"shaped": {
			"cr": "@{challenge}",
			"ac": "@{AC}",
			"npcac": "@{AC}",
			"hp": "@{HP}",
			"pp": "@{repeating_skill_$11_passive}",
			"macro": "shaped_statblock",
			"spellDc": "@{spell_save_dc}",
		},
	};

	if (!d20plus.ut.isUseSharedJs()) {
		// d20plus.js.scripts.push({name: "5etoolsRender", url: `${SITE_JS_URL}render.js`});
		// d20plus.js.scripts.push({name: "5etoolsScalecreature", url: `${SITE_JS_URL}scalecreature.js`});
	}

	d20plus.json = [
		{name: "class index", url: `${CLASS_DATA_DIR}index.json`},
		{name: "spell index", url: `${SPELL_DATA_DIR}index.json`},
		{name: "spell metadata", url: SPELL_META_URL},
		{name: "bestiary index", url: `${MONSTER_DATA_DIR}index.json`},
		{name: "bestiary fluff index", url: `${MONSTER_DATA_DIR}fluff-index.json`},
		{name: "bestiary metadata", url: `${MONSTER_DATA_DIR}legendarygroups.json`},
		{name: "adventures index", url: `${DATA_URL}adventures.json`},
		{name: "base items", url: `${DATA_URL}items-base.json`},
		{name: "item modifiers", url: `${DATA_URL}roll20-items.json`},
	];

	// add JSON index/metadata
	d20plus.pAddJson = async function () {
		d20plus.ut.log("Load JSON");

		await Promise.all(d20plus.json.map(async it => {
			const data = await DataUtil.loadJSON(it.url);

			if (it.name === "class index") classDataUrls = data;
			else if (it.name === "spell index") spellDataUrls = data;
			else if (it.name === "spell metadata") spellMetaData = data;
			else if (it.name === "bestiary index") monsterDataUrls = data;
			else if (it.name === "bestiary fluff index") monsterFluffDataUrls = data;
			else if (it.name === "bestiary metadata") monsterMetadata = data;
			else if (it.name === "adventures index") adventureMetadata = data;
			else if (it.name === "base items") {
				data.itemProperty.forEach(p => Renderer.item._addProperty(p));
				data.itemType.forEach(t => Renderer.item._addType(t));
			} else if (it.name === "item modifiers") itemMetadata = data;
			else throw new Error(`Unhandled data from JSON ${it.name} (${it.url})`);

			d20plus.ut.log(`JSON [${it.name}] Loaded`);
		}));
	};

	// Bind Graphics Add on page
	d20plus.bindGraphics = function (page) {
		d20plus.ut.log("Bind Graphics");
		try {
			if (page.get("archived") === false) {
				page.thegraphics.on("add", function (e) {
					let character = e.character;
					if (character) {
						let npc = character.attribs.find(function (a) {
							return a.get("name").toLowerCase() === "npc";
						});
						let isNPC = npc ? parseInt(npc.get("current")) : 0;
						// Set bars if configured to do so
						let barsList = ["bar1", "bar2", "bar3"];
						$.each(barsList, (i, barName) => {
							// PC config keys are suffixed "_pc"
							const confVal = d20plus.cfg.get("token", `${barName}${isNPC ? "" : "_pc"}`);
							if (confVal) {
								const charAttr = character.attribs.find(a => a.get("name").toLowerCase() === confVal);
								if (charAttr) {
									e.attributes[`${barName}_value`] = charAttr.get("current");
									if (d20plus.cfg.has("token", `${barName}_max`)) {
										if (d20plus.cfg.get("token", `${barName}_max`) && !isNPC && confVal === "hp") { // player HP is current; need to set max to max
											e.attributes[`${barName}_max`] = charAttr.get("max");
										} else {
											if (isNPC) {
												// TODO: Setting a value to empty/null does not overwrite existing values on the token.
												// setting a specific value does. Must figure this out.
												e.attributes[`${barName}_max`] = d20plus.cfg.get("token", `${barName}_max`) ? charAttr.get("current") : "";
											} else {
												// preserve default token for player tokens
												if (d20plus.cfg.get("token", `${barName}_max`)) {
													e.attributes[`${barName}_max`] = charAttr.get("current");
												}
											}
										}
									}
									if (d20plus.cfg.has("token", `${barName}_reveal`)) {
										e.attributes[`showplayers_${barName}`] = d20plus.cfg.get("token", `${barName}_reveal`);
									}
								}
							}
						});

						// NPC-only settings
						if (isNPC) {
							// Set Nametag
							if (d20plus.cfg.has("token", "name")) {
								e.attributes["showname"] = d20plus.cfg.get("token", "name");
								if (d20plus.cfg.has("token", "name_reveal")) {
									e.attributes["showplayers_name"] = d20plus.cfg.get("token", "name_reveal");
								}
							}

							// Roll HP
							// TODO: npc_hpbase appears to be hardcoded here? Refactor for NPC_SHEET_ATTRIBUTES?
							if ((d20plus.cfg.get("token", "rollHP") || d20plus.cfg.get("token", "maximiseHp")) && d20plus.cfg.getCfgKey("token", "npc_hpbase")) {
								let hpf = character.attribs.find(function (a) {
									return a.get("name").toLowerCase() === NPC_SHEET_ATTRIBUTES["npc_hpformula"][d20plus.sheet];
								});
								let barName = d20plus.cfg.getCfgKey("token", "npc_hpbase");

								if (hpf && hpf.get("current")) {
									let hpformula = hpf.get("current");
									if (d20plus.cfg.get("token", "maximiseHp")) {
										const maxSum = hpformula.replace("d", "*");
										try {
											// eslint-disable-next-line no-eval
											const max = eval(maxSum);
											if (!isNaN(max)) {
												e.attributes[`${barName}_value`] = max;
												e.attributes[`${barName}_max`] = max;
											}
										} catch (error) {
											d20plus.ut.log("Error Maximising HP");
											// eslint-disable-next-line no-console
											console.log(error);
										}
									} else {
										d20plus.ut.randomRoll(hpformula, function (result) {
											e.attributes[`${barName}_value`] = result.total;
											e.attributes[`${barName}_max`] = result.total;
											d20plus.ut.log(`Rolled HP for [${character.get("name")}]`);
										}, function (error) {
											d20plus.ut.log("Error Rolling HP Dice");
											// eslint-disable-next-line no-console
											console.log(error);
										});
									}
								}
							}
						}
					}
				});
			}
		} catch (e) {
			// eslint-disable-next-line no-console
			console.log("D20Plus bindGraphics Exception", e);
			// eslint-disable-next-line no-console
			console.log("PAGE", page);
		}
	};

	// bind token HP to initiative tracker window HP field
	d20plus.bindToken = function (token) {
		function getInitTrackerToken () {
			const $window = $("#initiativewindow");
			if (!$window.length) return [];
			return $window.find(`li.token`).filter((i, e) => {
				return $(e).data("tokenid") === token.id;
			});
		}

		const $initToken = getInitTrackerToken();
		if (!$initToken.length) return;
		const $iptHp = $initToken.find(`.hp.editable`);
		const npcFlag = token.character ? token.character.attribs.find((a) => {
			return a.get("name").toLowerCase() === "npc";
		}) : null;
		// if there's a HP column enabled
		if ($iptHp.length) {
			let toBind;
			if (!token.character || (npcFlag && `${npcFlag.get("current")}` === "1")) {
				const hpBar = d20plus.cfg5e.getCfgHpBarNumber();
				// and a HP bar chosen
				if (hpBar) {
					$iptHp.text(token.attributes[`bar${hpBar}_value`])
				}

				toBind = (token, changes) => {
					const $initToken = getInitTrackerToken();
					if (!$initToken.length) return;
					const $iptHp = $initToken.find(`.hp.editable`);
					const hpBar = d20plus.cfg5e.getCfgHpBarNumber();

					if ($iptHp && hpBar) {
						if (changes.changes[`bar${hpBar}_value`]) {
							$iptHp.text(token.changed[`bar${hpBar}_value`]);
						}
					}
				};
			} else {
				toBind = (token, changes) => {
					const $initToken = getInitTrackerToken();
					if (!$initToken.length) return;
					const $iptHp = $initToken.find(`.hp.editable`);
					if ($iptHp) {
						$iptHp.text(token.character.autoCalcFormula(d20plus.formulas[d20plus.sheet].hp));
					}
				}
			}
			// clean up old handler
			if (d20plus.tokenBindings[token.id]) token.off("change", d20plus.tokenBindings[token.id]);
			// add new handler
			d20plus.tokenBindings[token.id] = toBind;
			token.on("change", toBind);
		}
	};
	d20plus.tokenBindings = {};

	// Determine difficulty of current encounter (iniativewindow)
	d20plus.getDifficulty = function () {
		let difficulty = "Unknown";
		let partyXPThreshold = [0, 0, 0, 0];
		let players = [];
		let npcs = [];
		try {
			$.each(d20.Campaign.initiativewindow.cleanList(), function (i, v) {
				let page = d20.Campaign.pages.get(v._pageid);
				if (page) {
					let token = page.thegraphics.get(v.id);
					if (token) {
						let char = token.character;
						if (char) {
							let npc = char.attribs.find(function (a) {
								return a.get("name").toLowerCase() === "npc";
							});
							if (npc && (npc.get("current") === 1 || npc.get("current") === "1")) { // just in casies
								npcs.push(char);
							} else {
								let level = char.attribs.find(function (a) {
									return a.get("name").toLowerCase() === "level";
								});
								// Can't determine difficulty without level
								if (!level || partyXPThreshold === null) {
									partyXPThreshold = null;
									return;
								}
								// Total party threshold
								for (i = 0; i < partyXPThreshold.length; i++) partyXPThreshold[i] += Parser.levelToXpThreshold(level.get("current"))[i];
								players.push(players.length + 1);
							}
						}
					}
				}
			});
			if (!players.length) return difficulty;
			// If a player doesn't have level set, fail out.
			if (partyXPThreshold !== null) {
				let len = npcs.length;
				let multiplier = 0;
				let adjustedxp = 0;
				let xp = 0;
				let index = 0;
				// Adjust for number of monsters
				if (len < 2) index = 0;
				else if (len < 3) index = 1;
				else if (len < 7) index = 2;
				else if (len < 11) index = 3;
				else if (len < 15) index = 4;
				else { index = 5; }
				// Adjust for smaller parties
				if (players.length < 3) index++;
				// Set multiplier
				multiplier = d20plus.multipliers[index];
				// Total monster xp
				$.each(npcs, function (i, v) {
					let cr = v.attribs.find(function (a) {
						return a.get("name").toLowerCase() === "npc_challenge";
					});
					if (cr && cr.get("current")) xp += parseInt(Parser.crToXpNumber(cr.get("current")));
				});
				// Encounter's adjusted xp
				adjustedxp = xp * multiplier;
				// eslint-disable-next-line no-console
				console.log("Party XP Threshold", partyXPThreshold);
				// eslint-disable-next-line no-console
				console.log("Adjusted XP", adjustedxp);
				// Determine difficulty
				if (adjustedxp < partyXPThreshold[0]) difficulty = "Trivial";
				else if (adjustedxp < partyXPThreshold[1]) difficulty = "Easy";
				else if (adjustedxp < partyXPThreshold[2]) difficulty = "Medium";
				else if (adjustedxp < partyXPThreshold[3]) difficulty = "Hard";
				else difficulty = "Deadly";
			}
		} catch (e) {
			// eslint-disable-next-line no-console
			console.log("D20Plus getDifficulty Exception", e);
		}
		return difficulty;
	};

	d20plus.formSrcUrl = function (dataDir, fileName) {
		return dataDir + fileName;
	};

	d20plus.addCustomHTML = function () {
		function populateDropdown (dropdownId, inputFieldId, baseUrl, srcUrlObject, defaultSel, brewProps) {
			const defaultUrl = defaultSel ? d20plus.formSrcUrl(baseUrl, srcUrlObject[defaultSel]) : "";
			$(inputFieldId).val(defaultUrl);
			const dropdown = $(dropdownId);
			$.each(Object.keys(srcUrlObject), function (i, src) {
				dropdown.append($("<option>", {
					value: d20plus.formSrcUrl(baseUrl, srcUrlObject[src]),
					text: brewProps.includes("class") ? src.uppercaseFirst() : Parser.sourceJsonToFullCompactPrefix(src),
				}));
			});
			dropdown.append($("<option>", {
				value: "",
				text: "Custom",
			}));

			const dataList = [];
			const seenPaths = new Set();
			brewProps.forEach(prop => {
				Object.entries(brewIndex[prop] || {})
					.forEach(([path, dir]) => {
						if (seenPaths.has(path)) return;
						seenPaths.add(path);
						dataList.push({
							download_url: DataUtil.brew.getFileUrl(path),
							path,
							name: path.split("/").slice(1).join("/"),
						});
					});
			});
			dataList.sort((a, b) => SortUtil.ascSortLower(a.name, b.name)).forEach(it => {
				dropdown.append($("<option>", {
					value: `${it.download_url}${d20plus.ut.getAntiCacheSuffix()}`,
					text: `Homebrew: ${it.name.trim().replace(/\.json$/i, "")}`,
				}));
			});

			dropdown.val(defaultUrl);
			dropdown.change(function () {
				$(inputFieldId).val(this.value);
			});
		}

		function populateBasicDropdown (dropdownId, inputFieldId, defaultSel, brewProps, addForPlayers) {
			function doPopulate (dropdownId, inputFieldId) {
				const $sel = $(dropdownId);
				const existingItems = !!$sel.find(`option`).length;
				if (defaultSel) {
					$(inputFieldId).val(defaultSel);
					$sel.append($("<option>", {
						value: defaultSel,
						text: "Official Sources",
					}));
				}
				if (!existingItems) {
					$sel.append($("<option>", {
						value: "",
						text: "Custom",
					}));
				}

				const dataList = [];
				const seenPaths = new Set();
				brewProps.forEach(prop => {
					Object.entries(brewIndex[prop] || {})
						.forEach(([path, dir]) => {
							if (seenPaths.has(path)) return;
							seenPaths.add(path);
							dataList.push({
								download_url: DataUtil.brew.getFileUrl(path),
								path,
								name: path.split("/").slice(1).join("/"),
							});
						});
				});
				dataList.sort((a, b) => SortUtil.ascSortLower(a.name, b.name)).forEach(it => {
					$sel.append($("<option>", {
						value: `${it.download_url}${d20plus.ut.getAntiCacheSuffix()}`,
						text: `Homebrew: ${it.name.trim().replace(/\.json$/i, "")}`,
					}));
				});

				$sel.val(defaultSel);
				$sel.change(function () {
					$(inputFieldId).val(this.value);
				});
			}

			doPopulate(dropdownId, inputFieldId);
			if (addForPlayers) doPopulate(`${dropdownId}-player`, `${inputFieldId}-player`);
		}

		const $body = $("body");
		if (window.is_gm) {
			const $wrpSettings = $(`#betteR20-settings`);

			$wrpSettings.append(d20plus.settingsHtmlImportHeader);
			$wrpSettings.append(d20plus.settingsHtmlSelector);
			$wrpSettings.append(d20plus.settingsHtmlPtMonsters);
			$wrpSettings.append(d20plus.settingsHtmlPtItems);
			$wrpSettings.append(d20plus.settingsHtmlPtSpells);
			$wrpSettings.append(d20plus.settingsHtmlPtPsionics);
			$wrpSettings.append(d20plus.settingsHtmlPtRaces);
			$wrpSettings.append(d20plus.settingsHtmlPtFeats);
			$wrpSettings.append(d20plus.settingsHtmlPtObjects);
			$wrpSettings.append(d20plus.settingsHtmlPtClasses);
			$wrpSettings.append(d20plus.settingsHtmlPtSubclasses);
			$wrpSettings.append(d20plus.settingsHtmlPtBackgrounds);
			$wrpSettings.append(d20plus.settingsHtmlPtOptfeatures);
			const $ptAdventures = $(d20plus.settingsHtmlPtAdventures);
			$wrpSettings.append($ptAdventures);
			$ptAdventures.find(`.Vetools-module-tool-open`).click(() => d20plus.tool.get("MODULES").openFn());
			$wrpSettings.append(d20plus.settingsHtmlPtImportFooter);

			$("#button-monsters-load").on(window.mousedowntype, d20plus.monsters.button);
			$("#button-monsters-load-all").on(window.mousedowntype, d20plus.monsters.buttonAll);
			$("#button-monsters-load-file").on(window.mousedowntype, d20plus.monsters.buttonFile);
			$("#import-objects-load").on(window.mousedowntype, d20plus.objects.button);
			$("#button-adventures-load").on(window.mousedowntype, d20plus.adventures.button);

			$("#bind-drop-locations").on(window.mousedowntype, d20plus.bindDropLocations);
			$("#initiativewindow .characterlist").before(d20plus.initiativeHeaders);

			d20plus.setTurnOrderTemplate();
			d20.Campaign.initiativewindow.rebuildInitiativeList();
			d20plus.hpAllowEdit();
			d20.Campaign.initiativewindow.model.on("change:turnorder", function () {
				d20plus.updateDifficulty();
			});
			d20plus.updateDifficulty();

			populateDropdown("#button-monsters-select", "#import-monster-url", MONSTER_DATA_DIR, monsterDataUrls, "MM", ["monster"]);
			populateBasicDropdown("#button-objects-select", "#import-objects-url", OBJECT_DATA_URL, ["object"]);

			const populateAdventuresDropdown = () => {
				const defaultAdvUrl = d20plus.formSrcUrl(ADVENTURE_DATA_DIR, "adventure-lmop.json");
				const $iptUrl = $("#import-adventures-url");
				$iptUrl.val(defaultAdvUrl);
				$iptUrl.data("id", "lmop");
				const $sel = $("#button-adventures-select");
				adventureMetadata.adventure.forEach(a => {
					$sel.append($("<option>", {
						value: d20plus.formSrcUrl(ADVENTURE_DATA_DIR, `adventure-${a.id.toLowerCase()}.json|${a.id}`),
						text: a.name,
					}));
				});
				$sel.append($("<option>", {
					value: "",
					text: "Custom",
				}));
				$sel.val(defaultAdvUrl);
				$sel.change(() => {
					const [url, id] = $sel.val().split("|");
					$($iptUrl).val(url);
					$iptUrl.data("id", id);
				});
			}

			populateAdventuresDropdown();

			// import
			$("a#button-spells-load").on(window.mousedowntype, () => d20plus.spells.button());
			$("a#button-spells-load-all").on(window.mousedowntype, () => d20plus.spells.buttonAll());
			$("a#import-psionics-load").on(window.mousedowntype, () => d20plus.psionics.button());
			$("a#import-items-load").on(window.mousedowntype, () => d20plus.items.button());
			$("a#import-races-load").on(window.mousedowntype, () => d20plus.races.button());
			$("a#import-feats-load").on(window.mousedowntype, () => d20plus.feats.button());
			$("a#button-classes-load").on(window.mousedowntype, () => d20plus.classes.button());
			$("a#button-classes-load-all").on(window.mousedowntype, () => d20plus.classes.buttonAll());
			$("a#import-subclasses-load").on(window.mousedowntype, () => d20plus.subclasses.button());
			$("a#import-backgrounds-load").on(window.mousedowntype, () => d20plus.backgrounds.button());
			$("a#import-optionalfeatures-load").on(window.mousedowntype, () => d20plus.optionalfeatures.button());
			$("select#import-mode-select").on("change", () => d20plus.importer.importModeSwitch());
		} else {
			// player-only HTML if required
		}

		$body.append(d20plus.playerImportHtml);
		const $winPlayer = $("#d20plus-playerimport");
		const $appTo = $winPlayer.find(`.append-target`);
		$appTo.append(d20plus.settingsHtmlSelectorPlayer);
		$appTo.append(d20plus.settingsHtmlPtItemsPlayer);
		$appTo.append(d20plus.settingsHtmlPtSpellsPlayer);
		$appTo.append(d20plus.settingsHtmlPtPsionicsPlayer);
		$appTo.append(d20plus.settingsHtmlPtRacesPlayer);
		$appTo.append(d20plus.settingsHtmlPtFeatsPlayer);
		$appTo.append(d20plus.settingsHtmlPtClassesPlayer);
		$appTo.append(d20plus.settingsHtmlPtSubclassesPlayer);
		$appTo.append(d20plus.settingsHtmlPtBackgroundsPlayer);
		$appTo.append(d20plus.settingsHtmlPtOptfeaturesPlayer);

		$winPlayer.dialog({
			autoOpen: false,
			resizable: true,
			width: 800,
			height: 650,
		});

		const $wrpPlayerImport = $(`
			<div style="padding: 0 10px">
				<h3 style="margin-bottom: 4px">BetteR20</h3>
				<button id="b20-temp-import-open-button" class="btn" href="#" title="A tool to import temporary copies of various things, which can be drag-and-dropped to character sheets." style="margin-top: 5px">Temp Import Spells, Items, Classes,...</button>
					<div style="clear: both"></div>
				<hr></hr>
			</div>`);

		$wrpPlayerImport.find("#b20-temp-import-open-button").on("click", () => {
			$winPlayer.dialog("open");
		});

		$(`#journal`).prepend($wrpPlayerImport);

		// SHARED WINDOWS/BUTTONS
		// import
		$("a#button-spells-load-player").on(window.mousedowntype, () => d20plus.spells.button(true));
		$("a#button-spells-load-all-player").on(window.mousedowntype, () => d20plus.spells.buttonAll(true));
		$("a#import-psionics-load-player").on(window.mousedowntype, () => d20plus.psionics.button(true));
		$("a#import-items-load-player").on(window.mousedowntype, () => d20plus.items.button(true));
		$("a#import-races-load-player").on(window.mousedowntype, () => d20plus.races.button(true));
		$("a#import-feats-load-player").on(window.mousedowntype, () => d20plus.feats.button(true));
		$("a#button-classes-load-player").on(window.mousedowntype, () => d20plus.classes.button(true));
		$("a#button-classes-load-all-player").on(window.mousedowntype, () => d20plus.classes.buttonAll(true));
		$("a#import-subclasses-load-player").on(window.mousedowntype, () => d20plus.subclasses.button(true));
		$("a#import-backgrounds-load-player").on(window.mousedowntype, () => d20plus.backgrounds.button(true));
		$("a#import-optionalfeatures-load-player").on(window.mousedowntype, () => d20plus.optionalfeatures.button(true));
		$("select#import-mode-select-player").on("change", () => d20plus.importer.importModeSwitch());

		$body.append(d20plus.importDialogHtml);
		$body.append(d20plus.importListHTML);
		$body.append(d20plus.importListPropsHTML);
		$("#d20plus-import").dialog({
			autoOpen: false,
			resizable: false,
		});
		$("#d20plus-importlist").dialog({
			autoOpen: false,
			resizable: true,
			width: 1000,
			height: 700,
		});
		$("#d20plus-import-props").dialog({
			autoOpen: false,
			resizable: true,
			width: 300,
			height: 600,
		});

		populateDropdown("#button-spell-select", "#import-spell-url", SPELL_DATA_DIR, spellDataUrls, "PHB", ["spell"]);
		populateDropdown("#button-spell-select-player", "#import-spell-url-player", SPELL_DATA_DIR, spellDataUrls, "PHB", ["spell"]);
		populateDropdown("#button-classes-select", "#import-classes-url", CLASS_DATA_DIR, classDataUrls, "", ["class"]);
		populateDropdown("#button-classes-select-player", "#import-classes-url-player", CLASS_DATA_DIR, classDataUrls, "", ["class"]);

		// add class subclasses to the subclasses dropdown(s)
		populateDropdown("#button-subclasses-select", "#import-subclasses-url", CLASS_DATA_DIR, classDataUrls, "", ["class"]);
		populateDropdown("#button-subclasses-select-player", "#import-subclasses-url-player", CLASS_DATA_DIR, classDataUrls, "", ["class"]);

		populateBasicDropdown("#button-items-select", "#import-items-url", ITEM_DATA_URL, ["item"], true);
		populateBasicDropdown("#button-psionics-select", "#import-psionics-url", PSIONIC_DATA_URL, ["psionic"], true);
		populateBasicDropdown("#button-feats-select", "#import-feats-url", FEAT_DATA_URL, ["feat"], true);
		populateBasicDropdown("#button-races-select", "#import-races-url", RACE_DATA_URL, ["race"], true);
		populateBasicDropdown("#button-subclasses-select", "#import-subclasses-url", "", ["subclass"], true);
		populateBasicDropdown("#button-backgrounds-select", "#import-backgrounds-url", BACKGROUND_DATA_URL, ["background"], true);
		populateBasicDropdown("#button-optionalfeatures-select", "#import-optionalfeatures-url", OPT_FEATURE_DATA_URL, ["optionalfeature"], true);

		// bind tokens button
		const altBindButton = $(`<button id="bind-drop-locations-alt" class="btn bind-drop-locations" title="Bind drop locations and handouts">Bind Drag-n-Drop</button>`);
		altBindButton.on("click", function () {
			d20plus.bindDropLocations();
		});

		if (window.is_gm) {
			const $addPoint = $(`#journal button.btn.superadd`);
			altBindButton.css("margin-right", "5px");
			$addPoint.after(altBindButton);
		} else {
			altBindButton.css("margin-top", "5px");
			const $wrprControls = $(`#search-wrp-controls`);
			$wrprControls.append(altBindButton);
		}
		$("#journal #bind-drop-locations").on(window.mousedowntype, d20plus.bindDropLocations);
	};

	d20plus.updateDifficulty = function () {
		const $initWindow = $("div#initiativewindow");
		if (!$initWindow.parent().is("body")) {
			const $btnPane = $initWindow.parent().find(".ui-dialog-buttonpane");

			let $span = $btnPane.find("span.difficulty");

			if (!$span.length) {
				$btnPane.prepend(d20plus.difficultyHtml);
				$span = $btnPane.find("span.difficulty");
			}

			if (d20plus.cfg.get("interface", "showDifficulty")) {
				$span.text(`Difficulty: ${d20plus.getDifficulty()}`);
				$span.show();
			} else {
				$span.hide();
			}
		}
	};

	// bind tokens to the initiative tracker
	d20plus.bindTokens = function () {
		// Gets a list of all the tokens on the current page:
		const curTokens = d20.Campaign.pages.get(d20.Campaign.activePage()).thegraphics.toArray();
		curTokens.forEach(t => {
			d20plus.bindToken(t);
		});
	};

	// bind drop locations on sheet to accept custom handouts
	d20plus.bindDropLocations = function () {
		if (window.is_gm) {
			// Bind Spells and Items, add compendium-item to each of them
			let journalFolder = d20.Campaign.get("journalfolder");
			if (journalFolder === "") {
				d20.journal.addFolderToFolderStructure("Spells");
				d20.journal.addFolderToFolderStructure("Psionics");
				d20.journal.addFolderToFolderStructure("Items");
				d20.journal.addFolderToFolderStructure("Feats");
				d20.journal.addFolderToFolderStructure("Classes");
				d20.journal.addFolderToFolderStructure("Subclasses");
				d20.journal.addFolderToFolderStructure("Backgrounds");
				d20.journal.addFolderToFolderStructure("Races");
				d20.journal.addFolderToFolderStructure("Optional Features");
				d20.journal.refreshJournalList();
				journalFolder = d20.Campaign.get("journalfolder");
			}
		}

		function addClasses (folderName) {
			$(`#journalfolderroot > ol.dd-list > li.dd-folder > div.dd-content:contains(${folderName})`).parent().find("ol li[data-itemid]").addClass("compendium-item").addClass("ui-draggable").addClass("Vetools-draggable");
		}

		addClasses("Spells");
		addClasses("Psionics");
		addClasses("Items");
		addClasses("Feats");
		addClasses("Classes");
		addClasses("Subclasses");
		addClasses("Backgrounds");
		addClasses("Races");
		addClasses("Optional Features");

		// ~~if player,~~ force-enable dragging
		$(`.Vetools-draggable`).each((i, e) => {
			d20plus.importer.bindFakeCompendiumDraggable($(e));
		});

		function importData (character, data, event) {
			// TODO remove feature import workarounds below when roll20 and sheets supports their drag-n-drop properly
			if (data.data.Category === "Feats") {
				d20plus.feats.importFeat(character, data);
			} else if (data.data.Category === "Backgrounds") {
				d20plus.backgrounds.importBackground(character, data);
			} else if (data.data.Category === "Races") {
				d20plus.races.importRace(character, data);
			} else if (data.data.Category === "Optional Features") {
				d20plus.optionalfeatures.importOptionalFeature(character, data);
			} else if (data.data.Category === "Classes") {
				d20plus.classes.importClass(character, data);
			} else if (data.data.Category === "Subclasses") {
				d20plus.subclasses.importSubclass(character, data);
			} else if (data.data.Category === "Psionics") {
				d20plus.psionics.importPsionicAbility(character, data);
			} else if (data.data.Category === "Items") {
				d20plus.items.importItem(character, data, event);
			} else if (data.data.Category === "Spells") {
				d20plus.spells.importSpells(character, data, event);
			} else {
				d20plus.importer.doFakeDrop(event, character, data, null);
			}
		}

		d20.Campaign.characters.models.each(function (v, i) {
			/* eslint-disable */

			// region BEGIN ROLL20 CODE
			v.view.compendiumDragOver = function (e, t) {
				if (this.popoutWindow) return
				this.$currentDropTarget = this.childWindow.d20.compendiumDragOver(e, t)

				// Cache the last drop target, since it has a habit of disappearing every other loop.
				// This probably breaks other things, but, who cares!
				if (this.$currentDropTarget) this._b20_$prevDropTarget = this.$currentDropTarget;
				if (!this.$currentDropTarget) this.$currentDropTarget = this._b20_$prevDropTarget;
			};
			// endregion END ROLL20 CODE

			v.view.bindCompendiumDropTarget = function () {
				if (this.popoutWindow) return;
				const e = this;

				this.$compendiumDropTarget.droppable({
					accept: ".compendium-item",
					tolerance: "pointer",
					over() {
						e.dragOver = !0
					},
					out() {
						e.dragOver = !1,
							e.childWindow.d20.deactivateDrop()
					},
					drop(t, i) {
						const characterid = $(".characterdialog").has(t.target).attr("data-characterid");
						const character = d20.Campaign.characters.get(characterid).view;
						const $hlpr = $(i.helper[0]);

						if ($hlpr.hasClass("handout")) {
							console.log("Handout item dropped onto target!");
							t.originalEvent.dropHandled = !0;
							if (e.activeDrop) {
								e.dragOver = !1;
                            	e.childWindow.d20.deactivateDrop();
							}

							if ($hlpr.hasClass(`player-imported`)) {
								const data = d20plus.importer.retrievePlayerImport($hlpr.attr("data-playerimportid"));
								importData(character, data, t);
							} else {
								var id = $hlpr.attr("data-itemid");
								var handout = d20.Campaign.handouts.get(id);
								console.log(character);
								var data = "";
								if (window.is_gm) {
									handout._getLatestBlob("gmnotes", function (gmnotes) {
										data = gmnotes;
										handout.updateBlobs({gmnotes: gmnotes});
										importData(character, JSON.parse(data), t);
									});
								} else {
									handout._getLatestBlob("notes", function (notes) {
										data = $(notes).filter("del").html();
										importData(character, JSON.parse(data), t);
									});
								}
							}
							return;
						}

						console.log("Compendium item dropped onto target!");
						// region BEGIN ROLL20 CODE
						t.originalEvent.dropHandled = !0,
						e.activeDrop && (e.dragOver = !1,
							e.childWindow.d20.deactivateDrop(),
						e.$currentDropTarget && window.wantsToReceiveDrop(this, t, ()=>{
								const t = $(i.helper[0]).attr("data-pagename")
									, n = $(i.helper[0]).attr("data-subhead");
								$.ajax({
									url: "/compendium/compendium/getPages",
									data: {
										bookName: d20.compendium.shortName,
										pages: [t],
										sharedCompendium: campaign_id
									},
									cache: !1,
									dataType: "JSON"
								}).done(i=>{
										const o = JSON.parse(i[0])
											, r = _.clone(o.data);
										r.Name = o.name,
											r.data = o.data,
											r.data = JSON.stringify(r.data),
											r.uniqueName = t,
											r.Content = o.content,
											r.dropSubhead = n,
											e.$currentDropTarget.find("*[accept]").each(function() {
												const t = $(this)
													, i = t.attr("accept");
												r[i] && ("input" === t[0].tagName.toLowerCase() && "checkbox" === t.attr("type") || "input" === t[0].tagName.toLowerCase() && "radio" === t.attr("type") ? t.val() === r[i] ? t.prop("checked", !0) : t.prop("checked", !1) : "select" === t[0].tagName.toLowerCase() ? t.find("option").each(function() {
													const e = $(this);
													e.val() !== r[i] && e.text() !== r[i] || e.prop("selected", !0)
												}) : $(this).val(r[i]),
													e.saveSheetValues(this, "compendium"))
											})
									}
								)
							}
						))
						// endregion END ROLL20 CODE
					}
				})
			}

			/* eslint-enable */
		});
	};

	// Create editable HP variable and autocalculate + or -
	d20plus.hpAllowEdit = function () {
		$("#initiativewindow").on(window.mousedowntype, ".hp.editable", function () {
			if ($(this).find("input").length > 0) return void $(this).find("input").focus();
			let val = $.trim($(this).text());
			const $span = $(this);
			$span.html(`<input type='text' value='${val}'/>`);
			const $ipt = $(this).find("input");
			$ipt[0].focus();
		});
		$("#initiativewindow").on("keydown", ".hp.editable", function (event) {
			if (event.which === 13) {
				const $span = $(this);
				const $ipt = $span.find("input");
				if (!$ipt.length) return;

				let el; let token; let id; let char; let hp;
				let val = $.trim($ipt.val());

				// roll20 token modification supports plus/minus for a single integer; mimic this
				const m = /^((\d+)?([+-]))?(\d+)$/.exec(val);
				if (m) {
					let op = null;
					if (m[3]) {
						op = m[3] === "+" ? "ADD" : "SUB";
					}
					// eslint-disable-next-line no-eval
					const base = m[2] ? eval(m[0]) : null;
					const mod = Number(m[4]);

					el = $(this).parents("li.token");
					id = el.data("tokenid");
					token = d20.Campaign.pages.get(d20.Campaign.activePage()).thegraphics.get(id);
					char = token.character;

					npc = char.attribs ? char.attribs.find(function (a) {
						return a.get("name").toLowerCase() === "npc";
					}) : null;
					let total;
					// char.attribs doesn't exist for generico tokens, in this case stick stuff in an appropriate bar
					if (!char.attribs || (npc && `${npc.get("current")}` === "1")) {
						const hpBar = d20plus.cfg5e.getCfgHpBarNumber();
						if (hpBar) {
							if (base !== null) {
								total = base;
							} else if (op) {
								const curr = token.attributes[`bar${hpBar}_value`];
								if (op === "ADD") total = curr + mod;
								else total = curr - mod;
							} else {
								total = mod;
							}
							token.attributes[`bar${hpBar}_value`] = total;
						}
					} else {
						hp = char.attribs.find(function (a) {
							return a.get("name").toLowerCase() === "hp";
						});
						if (hp) {
							if (base !== null) {
								total = base;
							} else if (op) {
								if (op === "ADD") total = hp.attributes.current + mod;
								else total = hp.attributes.current - mod;
							} else {
								total = mod;
							}
							hp.syncedSave({current: total});
						} else {
							if (base !== null) {
								total = base;
							} else if (op) {
								if (op === "ADD") total = mod;
								else total = 0 - mod;
							} else {
								total = mod;
							}
							char.attribs.create({name: "hp", current: total});
						}
					}
					// convert the field back to text
					$span.html(total);
				}
				d20.Campaign.initiativewindow.rebuildInitiativeList();
			}
		});
	};

	// Change character sheet formulas
	d20plus.setSheet = function () {
		d20plus.ut.log("Switched Character Sheet Template");
		d20plus.sheet = "ogl";
		if (window.is_gm && (!d20.journal.customSheets || !d20.journal.customSheets)) {
			const $body = $(`body`);
			$body.addClass("ve-nosheet__body");
			const $btnClose = $(`<button class="btn btn-danger ve-nosheet__btn-close">X</button>`)
				.click(() => {
					$overlay.remove();
					$body.removeClass("ve-nosheet__body");
				});
			const $overlay = $(`<div class="flex-col flex-vh-center ve-nosheet__overlay"/>`);
			$btnClose.appendTo($overlay);
			$overlay.append(`<div class="flex-col flex-vh-center">
				<div class="ve-nosheet__title mb-2">NO CHARACTER SHEET</div>
				<div><i>Your game does not have a character sheet template selected.<br>
				Please either disable betteR20, or visit the settings page for your game to choose one. We recommend the OGL sheet, which is listed as &quot;D&D 5E by Roll20.&quot;</i></div>
			</div>`).appendTo($body);

			d20.textchat.incoming(false, ({
				who: "system",
				type: "system",
				content: `<span style="color: red;">5etoolsR20: no character sheet selected! Exiting...</span>`,
			}));
			throw new Error("No character sheet selected!");
		}
		if (d20.journal.customSheets.layouthtml.indexOf("shaped_d20") > 0) d20plus.sheet = "shaped";
		if (d20.journal.customSheets.layouthtml.indexOf("DnD5e_Character_Sheet") > 0) d20plus.sheet = "community";
		d20plus.ut.log(`Switched Character Sheet Template to ${d20plus.sheet}`);
	};

	// Return Initiative Tracker template with formulas
	d20plus.initErrorHandler = null;
	d20plus.setTurnOrderTemplate = function () {
		if (!d20plus.turnOrderCachedFunction) {
			d20plus.turnOrderCachedFunction = d20.Campaign.initiativewindow.rebuildInitiativeList;
			d20plus.turnOrderCachedTemplate = $("#tmpl_initiativecharacter").clone();
		}

		d20.Campaign.initiativewindow.rebuildInitiativeList = function () {
			let html = d20plus.initiativeTemplate;
			let columnsAdded = [];
			$(".tracker-header-extra-columns").empty();

			const cols = [
				d20plus.cfg.get("interface", "trackerCol1"),
				d20plus.cfg.get("interface", "trackerCol2"),
				d20plus.cfg.get("interface", "trackerCol3"),
			];

			const headerStack = [];
			const replaceStack = [
				// this is hidden by CSS
				`<span class='cr' alt='CR' title='CR'>
					<$ if(npc && npc.get("current") == "1") { $>
						<$ var crAttr = char.attribs.find(function(e) { return e.get("name").toLowerCase() === "npc_challenge" }); $>
						<$ if(crAttr) { $>
							<$!crAttr.get("current")$>
						<$ } $>
					<$ } $>
				</span>`,
			];
			cols.forEach((c, i) => {
				switch (c) {
					case "HP": {
						const hpBar = d20plus.cfg5e.getCfgHpBarNumber();
						replaceStack.push(`
							<span class='hp editable tracker-col' alt='HP' title='HP'>
								<$ if(npc && npc.get("current") == "1") { $>
									${hpBar ? `<$!token.attributes.bar${hpBar}_value$>` : ""}
								<$ } else if (typeof char !== "undefined" && char && typeof char.autoCalcFormula !== "undefined") { $>
									<$!char.autoCalcFormula('${d20plus.formulas[d20plus.sheet].hp}')$>
								<$ } else { $>
									<$!"\u2014"$>
								<$ } $>
							</span>
						`);
						headerStack.push(`<span class='tracker-col'>HP</span>`);
						break;
					}
					case "AC": {
						replaceStack.push(`
							<span class='ac tracker-col' alt='AC' title='AC'>
								<$ if(npc && npc.get("current") == "1" && typeof char !== "undefined" && char && typeof char.autoCalcFormula !== "undefined") { $>
									<$!char.autoCalcFormula('${d20plus.formulas[d20plus.sheet].npcac}')$>
								<$ } else if (typeof char !== "undefined" && char && typeof char.autoCalcFormula !== "undefined") { $>
									<$!char.autoCalcFormula('${d20plus.formulas[d20plus.sheet].ac}')$>
								<$ } else { $>
									<$!"\u2014"$>
								<$ } $>
							</span>
						`);
						headerStack.push(`<span class='tracker-col'>AC</span>`);
						break;
					}
					case "Passive Perception": {
						replaceStack.push(`
							<$ var passive = (typeof char !== "undefined" && char && typeof char.autoCalcFormula !== "undefined") ? (char.autoCalcFormula('@{passive}') || char.autoCalcFormula('${d20plus.formulas[d20plus.sheet].pp}')) : "\u2014"; $>
							<span class='pp tracker-col' alt='Passive Perception' title='Passive Perception'><$!passive$></span>
						`);
						headerStack.push(`<span class='tracker-col'>PP</span>`);
						break;
					}
					case "Spell DC": {
						replaceStack.push(`
							<$ var dc = (typeof char !== "undefined" && char && typeof char.autoCalcFormula !== "undefined") ? (char.autoCalcFormula('${d20plus.formulas[d20plus.sheet].spellDc}')) : "\u2014"; $>
							<span class='dc tracker-col' alt='Spell DC' title='Spell DC'><$!dc$></span>
						`);
						headerStack.push(`<span class='tracker-col'>DC</span>`);
						break;
					}
					default: {
						replaceStack.push(`<span class="tracker-col"/>`);
						headerStack.push(`<span class="tracker-col"/>`);
					}
				}
			});

			// eslint-disable-next-line no-console
			console.log("use custom tracker val was ", d20plus.cfg.get("interface", "customTracker"))
			if (d20plus.cfg.get("interface", "customTracker")) {
				$(`.init-header`).show();
				if (d20plus.cfg.get("interface", "trackerSheetButton")) {
					$(`.init-sheet-header`).show();
				} else {
					$(`.init-sheet-header`).hide();
				}
				$(`.init-init-header`).show();
				const $header = $(".tracker-header-extra-columns");
				// prepend/reverse used since tracker gets populated in right-to-left order
				headerStack.forEach(h => $header.prepend(h))
				html = html.replace(`<!--5ETOOLS_REPLACE_TARGET-->`, replaceStack.reverse().join(" \n"));
			} else {
				$(`.init-header`).hide();
				$(`.init-sheet-header`).hide();
				$(`.init-init-header`).hide();
			}

			$("#tmpl_initiativecharacter").replaceWith(html);

			// Hack to catch errors, part 1
			const startTime = (new Date()).getTime();

			let results = d20plus.turnOrderCachedFunction.apply(this, []);
			setTimeout(function () {
				$(".initmacrobutton").unbind("click");
				$(".initmacrobutton").bind("click", function () {
					tokenid = $(this).parent().parent().data("tokenid");
					let token, char;
					let page = d20.Campaign.activePage();
					if (page) token = page.thegraphics.get(tokenid);
					if (token) char = token.character;
					if (char) {
						char.view.showDialog();
						// d20.textchat.doChatInput(`%{` + char.id + `|` + d20plus.formulas[d20plus.sheet]["macro"] + `}`)
					}
				});

				d20plus.bindTokens();
			}, 100);

			// Hack to catch errors, part 2
			if (d20plus.initErrorHandler) {
				window.removeEventListener("error", d20plus.initErrorHandler);
			}
			d20plus.initErrorHandler = function (event) {
				// if we see an error within 250 msec of trying to override the initiative window...
				if (((new Date()).getTime() - startTime) < 250) {
					d20plus.ut.log("ERROR: failed to populate custom initiative tracker, restoring default...");
					// restore the default functionality
					$("#tmpl_initiativecharacter").replaceWith(d20plus.turnOrderCachedTemplate);
					return d20plus.turnOrderCachedFunction();
				}
			};
			window.addEventListener("error", d20plus.initErrorHandler);
			return results;
		};

		const getTargetWidth = () => d20plus.cfg.get("interface", "minifyTracker") ? 250 : 350;
		// wider tracker
		const cachedDialog = d20.Campaign.initiativewindow.$el.dialog;
		d20.Campaign.initiativewindow.$el.dialog = (...args) => {
			const widen = d20plus.cfg.get("interface", "customTracker");
			if (widen && args[0] && args[0].width) {
				args[0].width = getTargetWidth();
			}
			cachedDialog.bind(d20.Campaign.initiativewindow.$el)(...args);
		};

		// if the tracker is already open, widen it
		if (d20.Campaign.initiativewindow.model.attributes.initiativepage) d20.Campaign.initiativewindow.$el.dialog("option", "width", getTargetWidth());
	};

	d20plus.miniInitStyle = `
	#initiativewindow button.initmacrobutton {
		padding: 1px 4px;
	}

	#initiativewindow input {
		font-size: 8px;
	}

	#initiativewindow ul li span.name {
		font-size: 13px;
		padding-top: 0;
		padding-left: 4px;
		margin-top: -3px;
	}

	#initiativewindow ul li img {
		min-height: 15px;
		max-height: 15px;
	}

	#initiativewindow ul li {
		min-height: 15px;
	}

	#initiativewindow div.header span.initiative,
	#initiativewindow ul li span.initiative,
	#initiativewindow ul li span.tracker-col,
	#initiativewindow div.header span.tracker-col,
	#initiativewindow div.header span.initmacro,
	#initiativewindow ul li span.initmacro {
		font-size: 10px;
		font-weight: bold;
		text-align: right;
		float: right;
		padding: 0 5px;
		width: 7%;
		min-height: 20px;
		display: block;
		overflow: hidden;
	}

	#initiativewindow ul li .controls {
		padding: 0 3px;
	}
`;

	d20plus.setInitiativeShrink = function (doShrink) {
		const customStyle = $(`#dynamicStyle`);
		if (doShrink) {
			customStyle.html(d20plus.miniInitStyle);
		} else {
			customStyle.html("");
		}
	};

	d20plus.difficultyHtml = `<span class="difficulty" style="position: absolute; pointer-events: none"></span>`;

	d20plus.multipliers = [1, 1.5, 2, 2.5, 3, 4, 5];

	d20plus.playerImportHtml = `<div id="d20plus-playerimport" title="BetteR20 - Temporary Import">
	<div class="append-target">
		<!-- populate with js -->
	</div>
	<div class="append-list-journal" style="max-height: 400px; overflow-y: auto;">
		<!-- populate with js -->
	</div>
	<p><i>Player-imported items are temporary, as players can't make handouts. GMs may also use this functionality to avoid cluttering the journal. Once imported, items can be drag-dropped to character sheets.</i></p>
	</div>`;

	d20plus.importListHTML = `<div id="d20plus-importlist" title="BetteR20 - Import..." style="width: 1000px;">
<p style="display: flex">
	<button type="button" id="importlist-selectvis" class="btn" style="margin: 0 2px;"><span>Select Visible</span></button>
	<button type="button" id="importlist-deselectvis" class="btn" style="margin: 0 2px;"><span>Deselect Visible</span></button>
	<span style="width:1px;background: #bbb;height: 26px;margin: 2px;"></span>
	<button type="button" id="importlist-selectall-published" class="btn" style="margin: 0 2px;"><span>Select All Published</span></button>
</p>
<p>
<span id="import-list">
	<input class="search" autocomplete="off" placeholder="Search list...">
	<input type="search" id="import-list-filter" class="filter" placeholder="Filter...">
	<span id ="import-list-filter-help" title="Filter format example: 'cr:1/4; cr:1/2; type:beast; source:MM' -- hover over the columns to see the filterable name." style="cursor: help;">[?]</span>
	<br>
	<span class="list" style="max-height: 400px; overflow-y: auto; overflow-x: hidden; display: block; margin-top: 1em; transform: translateZ(0);"></span>
</span>
</p>
<p id="import-options">
<label style="display: inline-block">Group Handouts By... <select id="organize-by"></select></label>
<button type="button" id="import-open-props" class="btn" role="button" aria-disabled="false" style="padding: 3px; display: inline-block;">Select Properties</button>
<label>Make handouts visible to all players? <input type="checkbox" title="Make items visible to all players" id="import-showplayers" checked></label>
<label>Overwrite existing? <input type="checkbox" title="Overwrite existing" id="import-overwrite"></label>
</p>
<button type="button" id="importstart" class="btn" role="button" aria-disabled="false">
<span>Start Import</span>
</button>
</div>`;

	d20plus.importListPropsHTML = `<div id="d20plus-import-props" title="Choose Properties to Import">
	<div class="select-props" style="max-height: 400px; overflow-y: auto; transform: translateZ(0)">
		<!-- populate with JS -->
	</div>
	<p>
		Warning: this feature is highly experimental, and disabling <span style="color: red;">properties which are assumed to always exist</span> is not recommended.
		<br>
		<button type="button" id="save-import-props" class="btn" role="button" aria-disabled="false">Save</button>
	</p>
	</div>`;

	d20plus.importDialogHtml = `<div id="d20plus-import" title="Importing">
<p>
<h3 id="import-name"></h3>
</p>
<b id="import-remaining"></b> <span id="import-remaining-text">remaining</span>
<p>
Errors: <b id="import-errors">0</b>
</p>
<p>
<button style="width: 90%" type="button" id="importcancel" alt="Cancel" title="Cancel Import" class="btn btn-danger" role="button" aria-disabled="false">
	<span>Cancel</span>
</button>
</p>
</div>`;

	d20plus.settingsHtmlImportHeader = `
<h4>Import By Category</h4>
<p><small><i>We strongly recommend the OGL sheet for importing. You can switch afterwards.</i></small></p>
`;
	d20plus.settingsHtmlSelector = `
<select id="import-mode-select">
<option value="none" disabled selected>Select category...</option>
<option value="adventure">Adventures</option>
<option value="background">Backgrounds</option>
<option value="class">Classes</option>
<option value="feat">Feats</option>
<option value="item">Items</option>
<option value="monster">Monsters</option>
<option value="object">Objects</option>
<option value="optionalfeature">Optional Features (Invocations, etc.)</option>
<option value="psionic">Psionics</option>
<option value="race">Races</option>
<option value="spell">Spells</option>
<option value="subclass">Subclasses</option>
</select>
`;
	d20plus.settingsHtmlSelectorPlayer = `
<select id="import-mode-select-player">
<option value="none" disabled selected>Select category...</option>
<option value="background">Backgrounds</option>
<option value="class">Classes</option>
<option value="feat">Feats</option>
<option value="item">Items</option>
<option value="optionalfeature">Optional Features (Invocations, etc.)</option>
<option value="psionic">Psionics</option>
<option value="race">Races</option>
<option value="spell">Spells</option>
<option value="subclass">Subclasses</option>
</select>
`;
	d20plus.settingsHtmlPtMonsters = `
<div class="importer-section" data-import-group="monster">
<h4>Monster Importing</h4>
<label for="import-monster-url">Monster Data URL:</label>
<select id="button-monsters-select">
<!-- populate with JS-->
</select>
<input type="text" id="import-monster-url">
<p><a class="btn" href="#" id="button-monsters-load">Import Monsters</a></p>
<p><a class="btn" href="#" id="button-monsters-load-all" title="Standard sources only; no third-party or UA">Import Monsters From All Sources</a></p>
<p><a class="btn" href="#" id="button-monsters-load-file" title="5eTools JSON formats only">Import Monsters From File</a></p>
<p>
WARNING: Importing huge numbers of character sheets slows the game down. We recommend you import them as needed.<br>
The "Import Monsters From All Sources" button presents a list containing monsters from official sources only.<br>
To import from third-party sources, either individually select one available in the list, enter a custom URL, or upload a custom file, and "Import Monsters."
</p>
</div>
`;

	d20plus.settingsHtmlPtItems = `
<div class="importer-section" data-import-group="item">
<h4>Item Importing</h4>
<label for="import-items-url">Item Data URL:</label>
<select id="button-items-select"><!-- populate with JS--></select>
<input type="text" id="import-items-url">
<a class="btn" href="#" id="import-items-load">Import Items</a>
</div>
`;

	d20plus.settingsHtmlPtItemsPlayer = `
<div class="importer-section" data-import-group="item">
<h4>Item Importing</h4>
<label for="import-items-url-player">Item Data URL:</label>
<select id="button-items-select-player"><!-- populate with JS--></select>
<input type="text" id="import-items-url-player">
<a class="btn" href="#" id="import-items-load-player">Import Items</a>
</div>
`;

	d20plus.settingsHtmlPtSpells = `
<div class="importer-section" data-import-group="spell">
<h4>Spell Importing</h4>
<label for="import-spell-url">Spell Data URL:</label>
<select id="button-spell-select">
<!-- populate with JS-->
</select>
<input type="text" id="import-spell-url">
<p><a class="btn" href="#" id="button-spells-load">Import Spells</a><p/>
<p><a class="btn" href="#" id="button-spells-load-all" title="Standard sources only; no third-party or UA">Import Spells From All Sources</a></p>
<p>
The "Import Spells From All Sources" button presents a list containing spells from official sources only.<br>
To import from third-party sources, either individually select one available in the list or enter a custom URL, and "Import Spells."
</p>
</div>
`;

	d20plus.settingsHtmlPtSpellsPlayer = `
<div class="importer-section" data-import-group="spell">
<h4>Spell Importing</h4>
<label for="import-spell-url-player">Spell Data URL:</label>
<select id="button-spell-select-player">
<!-- populate with JS-->
</select>
<input type="text" id="import-spell-url-player">
<p><a class="btn" href="#" id="button-spells-load-player">Import Spells</a><p/>
<p><a class="btn" href="#" id="button-spells-load-all-player" title="Standard sources only; no third-party or UA">Import Spells From All Sources</a></p>
<p>
The "Import Spells From All Sources" button presents a list containing spells from official sources only.<br>
To import from third-party sources, either individually select one available in the list or enter a custom URL, and "Import Spells."
</p>
</div>
`;

	d20plus.settingsHtmlPtPsionics = `
<div class="importer-section" data-import-group="psionic">
<h4>Psionic Importing</h4>
<label for="import-psionics-url">Psionics Data URL:</label>
<select id="button-psionics-select"><!-- populate with JS--></select>
<input type="text" id="import-psionics-url">
<a class="btn" href="#" id="import-psionics-load">Import Psionics</a>
</div>
`;

	d20plus.settingsHtmlPtPsionicsPlayer = `
<div class="importer-section" data-import-group="psionic">
<h4>Psionic Importing</h4>
<label for="import-psionics-url-player">Psionics Data URL:</label>
<select id="button-psionics-select-player"><!-- populate with JS--></select>
<input type="text" id="import-psionics-url-player">
<a class="btn" href="#" id="import-psionics-load-player">Import Psionics</a>
</div>
`;

	d20plus.settingsHtmlPtFeats = `
<div class="importer-section" data-import-group="feat">
<h4>Feat Importing</h4>
<label for="import-feats-url">Feat Data URL:</label>
<select id="button-feats-select"><!-- populate with JS--></select>
<input type="text" id="import-feats-url">
<a class="btn" href="#" id="import-feats-load">Import Feats</a>
</div>
`;

	d20plus.settingsHtmlPtFeatsPlayer = `
<div class="importer-section" data-import-group="feat">
<h4>Feat Importing</h4>
<label for="import-feats-url-player">Feat Data URL:</label>
<select id="button-feats-select-player"><!-- populate with JS--></select>
<input type="text" id="import-feats-url-player">
<a class="btn" href="#" id="import-feats-load-player">Import Feats</a>
</div>
`;

	d20plus.settingsHtmlPtObjects = `
<div class="importer-section" data-import-group="object">
<h4>Object Importing</h4>
<label for="import-objects-url">Object Data URL:</label>
<select id="button-objects-select"><!-- populate with JS--></select>
<input type="text" id="import-objects-url">
<a class="btn" href="#" id="import-objects-load">Import Objects</a>
</div>
`;

	d20plus.settingsHtmlPtRaces = `
<div class="importer-section" data-import-group="race">
<h4>Race Importing</h4>
<label for="import-races-url">Race Data URL:</label>
<select id="button-races-select"><!-- populate with JS--></select>
<input type="text" id="import-races-url">
<a class="btn" href="#" id="import-races-load">Import Races</a>
</div>
`;

	d20plus.settingsHtmlPtRacesPlayer = `
<div class="importer-section" data-import-group="race">
<h4>Race Importing</h4>
<label for="import-races-url-player">Race Data URL:</label>
<select id="button-races-select-player"><!-- populate with JS--></select>
<input type="text" id="import-races-url-player">
<a class="btn" href="#" id="import-races-load-player">Import Races</a>
</div>
`;

	d20plus.settingsHtmlPtClasses = `
<div class="importer-section" data-import-group="class">
<h4>Class Importing</h4>
<p style="margin-top: 5px"><a class="btn" href="#" id="button-classes-load-all" title="Standard sources only; no third-party or UA">Import Classes from 5etools</a></p>
<label for="import-classes-url">Class Data URL:</label>
<select id="button-classes-select">
<!-- populate with JS-->
</select>
<input type="text" id="import-classes-url">
<p><a class="btn" href="#" id="button-classes-load">Import Classes from URL</a><p/>
</div>
`;

	d20plus.settingsHtmlPtClassesPlayer = `
<div class="importer-section" data-import-group="class">
<h4>Class Importing</h4>
<p style="margin-top: 5px"><a class="btn" href="#" id="button-classes-load-all-player">Import Classes from 5etools</a></p>
<label for="import-classes-url-player">Class Data URL:</label>
<select id="button-classes-select-player">
<!-- populate with JS-->
</select>
<input type="text" id="import-classes-url-player">
<p><a class="btn" href="#" id="button-classes-load-player">Import Classes from URL</a><p/>
</div>
`;

	d20plus.settingsHtmlPtSubclasses = `
<div class="importer-section" data-import-group="subclass">
<h4>Subclass Importing</h4>
<label for="import-subclasses-url">Subclass Data URL:</label>
<select id="button-subclasses-select"><!-- populate with JS--></select>
<input type="text" id="import-subclasses-url">
<a class="btn" href="#" id="import-subclasses-load">Import Subclasses</a>
</div>
`;

	d20plus.settingsHtmlPtSubclassesPlayer = `
<div class="importer-section" data-import-group="subclass">
<h4>Subclass Importing</h4>
<label for="import-subclasses-url-player">Subclass Data URL:</label>
<select id="button-subclasses-select-player"><!-- populate with JS--></select>
<input type="text" id="import-subclasses-url-player">
<a class="btn" href="#" id="import-subclasses-load-player">Import Subclasses</a>
</div>
`;

	d20plus.settingsHtmlPtBackgrounds = `
<div class="importer-section" data-import-group="background">
<h4>Background Importing</h4>
<label for="import-backgrounds-url">Background Data URL:</label>
<select id="button-backgrounds-select"><!-- populate with JS--></select>
<input type="text" id="import-backgrounds-url">
<a class="btn" href="#" id="import-backgrounds-load">Import Backgrounds</a>
</div>
`;

	d20plus.settingsHtmlPtBackgroundsPlayer = `
<div class="importer-section" data-import-group="background">
<h4>Background Importing</h4>
<label for="import-backgrounds-url-player">Background Data URL:</label>
<select id="button-backgrounds-select-player"><!-- populate with JS--></select>
<input type="text" id="import-backgrounds-url-player">
<a class="btn" href="#" id="import-backgrounds-load-player">Import Backgrounds</a>
</div>
`;

	d20plus.settingsHtmlPtOptfeatures = `
<div class="importer-section" data-import-group="optionalfeature">
<h4>Optional Feature (Invocations, etc.) Importing</h4>
<label for="import-optionalfeatures-url">Optional Feature Data URL:</label>
<select id="button-optionalfeatures-select"><!-- populate with JS--></select>
<input type="text" id="import-optionalfeatures-url">
<a class="btn" href="#" id="import-optionalfeatures-load">Import Optional Features</a>
</div>
`;

	d20plus.settingsHtmlPtOptfeaturesPlayer = `
<div class="importer-section" data-import-group="optionalfeature">
<h4>Optional Feature (Invocations, etc.) Importing</h4>
<label for="import-optionalfeatures-url-player">Optional Feature Data URL:</label>
<select id="button-optionalfeatures-select-player"><!-- populate with JS--></select>
<input type="text" id="import-optionalfeatures-url-player">
<a class="btn" href="#" id="import-optionalfeatures-load-player">Import Optional Features</a>
</div>
`;

	d20plus.settingsHtmlPtAdventures = `
<div class="importer-section" data-import-group="adventure">
<b style="color: red">Please note that this importer has been superceded by the Module Importer tool, found in the Tools List, or <a href="#" class="Vetools-module-tool-open" style="color: darkred; font-style: italic">by clicking here</a>.</b>
<h4>Adventure Importing</h4>
<label for="import-adventures-url">Adventure Data URL:</label>
<select id="button-adventures-select">
<!-- populate with JS-->
</select>
<input type="text" id="import-adventures-url">
<p><a class="btn" href="#" id="button-adventures-load">Import Adventure</a><p/>
<p>
</p>
</div>
`;

	d20plus.settingsHtmlPtImportFooter = `
<p><a class="btn bind-drop-locations" href="#" id="bind-drop-locations" style="margin-top: 5px;width: 100%;box-sizing: border-box;">Bind Drag-n-Drop</a></p>
<p><strong>Readme</strong></p>
<p>
You can drag-and-drop imported handouts to character sheets.<br>
If a handout is glowing green in the journal, it's draggable. This breaks when Roll20 decides to hard-refresh the journal.<br>
To restore this functionality, press the "Bind Drag-n-Drop" button.<br>
<i>Note: to drag a handout to a character sheet, you need to drag the name, and not the handout icon.</i>
</p>
`;

	d20plus.css.cssRules = d20plus.css.cssRules.concat([
		{
			s: ".no-shrink",
			r: "flex-shrink: 0;",
		},
		{
			s: "#initiativewindow ul li span.initiative,#initiativewindow ul li span.tracker-col,#initiativewindow ul li span.initmacro",
			r: "font-size: 25px;font-weight: bold;text-align: right;float: right;padding: 2px 5px;width: 10%;min-height: 20px;display: block;",
		},
		{
			s: "#initiativewindow ul li span.editable input",
			r: "width: 100%; box-sizing: border-box;height: 100%;",
		},
		{
			s: "#initiativewindow div.header",
			r: "height: 30px;",
		},
		{
			s: "#initiativewindow div.header span",
			r: "cursor: default;font-size: 15px;font-weight: bold;text-align: right;float: right;width: 10%;min-height: 20px;padding: 5px;",
		},
		{
			s: ".ui-dialog-buttonpane span.difficulty",
			r: "display: inline-block;padding: 5px 4px 6px;margin: .5em .4em .5em 0;font-size: 18px;",
		},
		{
			s: ".ui-dialog-buttonpane.buttonpane-absolute-position",
			r: "position: absolute;bottom: 0;box-sizing: border-box;width: 100%;",
		},
		{
			s: ".ui-dialog.dialog-collapsed .ui-dialog-buttonpane",
			r: "position: initial;",
		},
		{
			s: ".token .cr,.header .cr",
			r: "display: none!important;",
		},
		{
			s: "li.handout.compendium-item .namecontainer",
			r: "box-shadow: inset 0px 0px 25px 2px rgb(195, 239, 184);",
		},
		{
			s: ".bind-drop-locations:active",
			r: "box-shadow: inset 0px 0px 25px 2px rgb(195, 239, 184);",
		},
		{
			s: "del.userscript-hidden",
			r: "display: none;",
		},
		{
			s: ".importer-section",
			r: "display: none;",
		},
		{
			s: ".userscript-rd__h",
			r: "font-weight: bold;",
		},
		{
			s: ".userscript-rd__h--0",
			r: "font-weight: bold; font-size: 1.5em;",
		},
		{
			s: ".userscript-rd__h--2",
			r: "font-weight: bold; font-size: 1.3em;",
		},
		{
			s: ".userscript-rd__h--3, .userscript-rd__h--4",
			r: "font-style: italic",
		},
		{
			s: ".userscript-rd__b-inset--readaloud",
			r: "background: #cbd6c688 !important",
		},
		// "No character sheet" message
		{
			s: ".ve-nosheet__body",
			r: "overflow: hidden !important;",
		},
		{
			s: ".ve-nosheet__overlay",
			r: `
				background: darkred;
				position: fixed;
				z-index: 99999;
				top: 0;
				right: 0;
				bottom: 0;
				left: 0;
				width: 100vw;
				height: 100vh;
				color: white;
				font-family: monospace;`,
		},
		{
			s: ".ve-nosheet__title",
			r: "font-size: 72px;",
		},
		{
			s: ".ve-nosheet__btn-close",
			r: `position: absolute;
				top: 8px;
				right: 8px;
				font-size: 16px;`,
		},
	]);

	d20plus.initiativeHeaders = `<div class="header init-header">
<span class="ui-button-text initmacro init-sheet-header"></span>
<span class="initiative init-init-header" alt="Initiative" title="Initiative">Init</span>
<span class="cr" alt="CR" title="CR">CR</span>
<div class="tracker-header-extra-columns"></div>
</div>`;

	d20plus.initiativeTemplate = `<script id="tmpl_initiativecharacter" type="text/html">
<![CDATA[
	<li class='token <$ if (this.layer === "gmlayer") { $>gmlayer<$ } $>' data-tokenid='<$!this.id$>' data-currentindex='<$!this.idx$>'>
		<$ var token = d20.Campaign.pages.get(d20.Campaign.activePage()).thegraphics.get(this.id); $>
		<$ var char = (token) ? token.character : null; $>
		<$ if (d20plus.cfg.get("interface", "customTracker") && d20plus.cfg.get("interface", "trackerSheetButton")) { $>
			<span alt='Sheet Macro' title='Sheet Macro' class='initmacro'>
				<button type='button' class='initmacrobutton ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only pictos' role='button' aria-disabled='false'>
				<span class='ui-button-text'>N</span>
				</button>
			</span>
		<$ } $>
		<span alt='Initiative' title='Initiative' class='initiative <$ if (this.iseditable) { $>editable<$ } $>'>
			<$!this.pr$>
		</span>
		<$ if (char) { $>
			<$ var npc = char.attribs ? char.attribs.find(function(a){return a.get("name").toLowerCase() == "npc" }) : null; $>
		<$ } $>
		<div class="tracker-extra-columns">
			<!--5ETOOLS_REPLACE_TARGET-->
		</div>
		<$ if (this.avatar) { $><img src='<$!this.avatar$>' /><$ } $>
		<span class='name'><$!this.name$></span>
			<div class='clear' style='height: 0px;'></div>
			<div class='controls'>
		<span class='pictos remove'>#</span>
		</div>
	</li>
]]>
</script>`;

	d20plus.actionMacroPerception = "%{Selected|npc_perception} @{selected|wtype} &{template:default} {{name=Senses}}  @{selected|wtype} @{Selected|npc_senses} ";
	d20plus.actionMacroInit = "%{selected|npc_init}";
	d20plus.actionMacroDrImmunities = "@{selected|wtype} &{template:default} {{name=DR/Immunities}} {{Damage Resistance= @{selected|npc_resistances}}} {{Damage Vulnerability= @{selected|npc_vulnerabilities}}} {{Damage Immunity= @{selected|npc_immunities}}} {{Condition Immunity= @{selected|npc_condition_immunities}}} ";
	d20plus.actionMacroStats = "@{selected|wtype} &{template:default} {{name=Stats}} {{Armor Class= @{selected|npc_AC}}} {{Hit Dice= @{selected|npc_hpformula}}} {{Speed= @{selected|npc_speed}}} {{Senses= @{selected|npc_senses}}} {{Languages= @{selected|npc_languages}}} {{Challenge= @{selected|npc_challenge}(@{selected|npc_xp}xp)}}";
	d20plus.actionMacroSaves = "@{selected|wtype} &{template:simple}{{always=1}}?{Saving Throw?|STR,{{rname=Strength Save&#125;&#125;{{mod=@{npc_str_save}&#125;&#125; {{r1=[[1d20+@{npc_str_save}]]&#125;&#125;{{r2=[[1d20+@{npc_str_save}]]&#125;&#125;|DEX,{{rname=Dexterity Save&#125;&#125;{{mod=@{npc_dex_save}&#125;&#125; {{r1=[[1d20+@{npc_dex_save}]]&#125;&#125;{{r2=[[1d20+@{npc_dex_save}]]&#125;&#125;|CON,{{rname=Constitution Save&#125;&#125;{{mod=@{npc_con_save}&#125;&#125; {{r1=[[1d20+@{npc_con_save}]]&#125;&#125;{{r2=[[1d20+@{npc_con_save}]]&#125;&#125;|INT,{{rname=Intelligence Save&#125;&#125;{{mod=@{npc_int_save}&#125;&#125; {{r1=[[1d20+@{npc_int_save}]]&#125;&#125;{{r2=[[1d20+@{npc_int_save}]]&#125;&#125;|WIS,{{rname=Wisdom Save&#125;&#125;{{mod=@{npc_wis_save}&#125;&#125; {{r1=[[1d20+@{npc_wis_save}]]&#125;&#125;{{r2=[[1d20+@{npc_wis_save}]]&#125;&#125;|CHA,{{rname=Charisma Save&#125;&#125;{{mod=@{npc_cha_save}&#125;&#125; {{r1=[[1d20+@{npc_cha_save}]]&#125;&#125;{{r2=[[1d20+@{npc_cha_save}]]&#125;&#125;}{{charname=@{character_name}}} ";
	d20plus.actionMacroSkillCheck = "@{selected|wtype} &{template:simple}{{always=1}}?{Ability?|Acrobatics,{{rname=Acrobatics&#125;&#125;{{mod=@{npc_acrobatics}&#125;&#125; {{r1=[[1d20+@{npc_acrobatics}]]&#125;&#125;{{r2=[[1d20+@{npc_acrobatics}]]&#125;&#125;|Animal Handling,{{rname=Animal Handling&#125;&#125;{{mod=@{npc_animal_handling}&#125;&#125; {{r1=[[1d20+@{npc_animal_handling}]]&#125;&#125;{{r2=[[1d20+@{npc_animal_handling}]]&#125;&#125;|Arcana,{{rname=Arcana&#125;&#125;{{mod=@{npc_arcana}&#125;&#125; {{r1=[[1d20+@{npc_arcana}]]&#125;&#125;{{r2=[[1d20+@{npc_arcana}]]&#125;&#125;|Athletics,{{rname=Athletics&#125;&#125;{{mod=@{npc_athletics}&#125;&#125; {{r1=[[1d20+@{npc_athletics}]]&#125;&#125;{{r2=[[1d20+@{npc_athletics}]]&#125;&#125;|Deception,{{rname=Deception&#125;&#125;{{mod=@{npc_deception}&#125;&#125; {{r1=[[1d20+@{npc_deception}]]&#125;&#125;{{r2=[[1d20+@{npc_deception}]]&#125;&#125;|History,{{rname=History&#125;&#125;{{mod=@{npc_history}&#125;&#125; {{r1=[[1d20+@{npc_history}]]&#125;&#125;{{r2=[[1d20+@{npc_history}]]&#125;&#125;|Insight,{{rname=Insight&#125;&#125;{{mod=@{npc_insight}&#125;&#125; {{r1=[[1d20+@{npc_insight}]]&#125;&#125;{{r2=[[1d20+@{npc_insight}]]&#125;&#125;|Intimidation,{{rname=Intimidation&#125;&#125;{{mod=@{npc_intimidation}&#125;&#125; {{r1=[[1d20+@{npc_intimidation}]]&#125;&#125;{{r2=[[1d20+@{npc_intimidation}]]&#125;&#125;|Investigation,{{rname=Investigation&#125;&#125;{{mod=@{npc_investigation}&#125;&#125; {{r1=[[1d20+@{npc_investigation}]]&#125;&#125;{{r2=[[1d20+@{npc_investigation}]]&#125;&#125;|Medicine,{{rname=Medicine&#125;&#125;{{mod=@{npc_medicine}&#125;&#125; {{r1=[[1d20+@{npc_medicine}]]&#125;&#125;{{r2=[[1d20+@{npc_medicine}]]&#125;&#125;|Nature,{{rname=Nature&#125;&#125;{{mod=@{npc_nature}&#125;&#125; {{r1=[[1d20+@{npc_nature}]]&#125;&#125;{{r2=[[1d20+@{npc_nature}]]&#125;&#125;|Perception,{{rname=Perception&#125;&#125;{{mod=@{npc_perception}&#125;&#125; {{r1=[[1d20+@{npc_perception}]]&#125;&#125;{{r2=[[1d20+@{npc_perception}]]&#125;&#125;|Performance,{{rname=Performance&#125;&#125;{{mod=@{npc_performance}&#125;&#125; {{r1=[[1d20+@{npc_performance}]]&#125;&#125;{{r2=[[1d20+@{npc_performance}]]&#125;&#125;|Persuasion,{{rname=Persuasion&#125;&#125;{{mod=@{npc_persuasion}&#125;&#125; {{r1=[[1d20+@{npc_persuasion}]]&#125;&#125;{{r2=[[1d20+@{npc_persuasion}]]&#125;&#125;|Religion,{{rname=Religion&#125;&#125;{{mod=@{npc_religion}&#125;&#125; {{r1=[[1d20+@{npc_religion}]]&#125;&#125;{{r2=[[1d20+@{npc_religion}]]&#125;&#125;|Sleight of Hand,{{rname=Sleight of Hand&#125;&#125;{{mod=@{npc_sleight_of_hand}&#125;&#125; {{r1=[[1d20+@{npc_sleight_of_hand}]]&#125;&#125;{{r2=[[1d20+@{npc_sleight_of_hand}]]&#125;&#125;|Stealth,{{rname=Stealth&#125;&#125;{{mod=@{npc_stealth}&#125;&#125; {{r1=[[1d20+@{npc_stealth}]]&#125;&#125;{{r2=[[1d20+@{npc_stealth}]]&#125;&#125;|Survival,{{rname=Survival&#125;&#125;{{mod=@{npc_survival}&#125;&#125; {{r1=[[1d20+@{npc_survival}]]&#125;&#125;{{r2=[[1d20+@{npc_survival}]]&#125;&#125;}{{charname=@{character_name}}} ";
	d20plus.actionMacroAbilityCheck = "@{selected|wtype} &{template:simple}{{always=1}}?{Ability?|STR,{{rname=Strength&#125;&#125;{{mod=@{strength_mod}&#125;&#125; {{r1=[[1d20+@{strength_mod}]]&#125;&#125;{{r2=[[1d20+@{strength_mod}]]&#125;&#125;|DEX,{{rname=Dexterity&#125;&#125;{{mod=@{dexterity_mod}&#125;&#125; {{r1=[[1d20+@{dexterity_mod}]]&#125;&#125;{{r2=[[1d20+@{dexterity_mod}]]&#125;&#125;|CON,{{rname=Constitution&#125;&#125;{{mod=@{constitution_mod}&#125;&#125; {{r1=[[1d20+@{constitution_mod}]]&#125;&#125;{{r2=[[1d20+@{constitution_mod}]]&#125;&#125;|INT,{{rname=Intelligence&#125;&#125;{{mod=@{intelligence_mod}&#125;&#125; {{r1=[[1d20+@{intelligence_mod}]]&#125;&#125;{{r2=[[1d20+@{intelligence_mod}]]&#125;&#125;|WIS,{{rname=Wisdom&#125;&#125;{{mod=@{wisdom_mod}&#125;&#125; {{r1=[[1d20+@{wisdom_mod}]]&#125;&#125;{{r2=[[1d20+@{wisdom_mod}]]&#125;&#125;|CHA,{{rname=Charisma&#125;&#125;{{mod=@{charisma_mod}&#125;&#125; {{r1=[[1d20+@{charisma_mod}]]&#125;&#125;{{r2=[[1d20+@{charisma_mod}]]&#125;&#125;}{{charname=@{character_name}}} ";

	d20plus.actionMacroTrait = function (index) {
		return `@{selected|wtype} &{template:npcaction} {{name=@{selected|npc_name}}} {{rname=@{selected|repeating_npctrait_$${index}_name}}} {{description=@{selected|repeating_npctrait_$${index}_desc} }}`;
	};

	d20plus.actionMacroAction = function (baseAction, index) {
		return `%{selected|${baseAction}_$${index}_npc_action}`;
	};

	d20plus.actionMacroReaction = function (index) {
		return `@{selected|wtype} &{template:npcaction} {{name=@{selected|npc_name}}} {{rname=@{selected|repeating_npcreaction_$${index}_name}}} {{description=@{selected|repeating_npcreaction_$${index}_desc} }} `;
	};

	d20plus.actionMacroLegendary = function (tokenactiontext) {
		return `@{selected|wtype} @{selected|wtype}&{template:npcaction} {{name=@{selected|npc_name}}} {{rname=Legendary Actions}} {{description=The @{selected|npc_name} can take @{selected|npc_legendary_actions} legendary actions, choosing from the options below. Only one legendary option can be used at a time and only at the end of another creature's turn. The @{selected|npc_name} regains spent legendary actions at the start of its turn.\n\r${tokenactiontext}}} `;
	}

	d20plus.actionMacroMythic = function (tokenactiontext) {
		return `@{selected|wtype} @{selected|wtype}&{template:npcaction} {{name=@{selected|npc_name}}} {{rname=Mythic Actions}} {{description=The @{selected|npc_name} can take @{selected|npc_legendary_actions} mythic actions, choosing from the options below. Only one mythic option can be used at a time and only at the end of another creature's turn. The @{selected|npc_name} regains spent mythic actions at the start of its turn.\n\r${tokenactiontext}}} `;
	}
};

SCRIPT_EXTENSIONS.push(betteR205etoolsMain);
