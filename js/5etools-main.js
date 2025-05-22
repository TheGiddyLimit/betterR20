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
	VEHICLE_DATA_URL = `${DATA_URL}vehicles.json`;
	BACKGROUND_DATA_URL = `${DATA_URL}backgrounds.json`;
	OPT_FEATURE_DATA_URL = `${DATA_URL}optionalfeatures.json`;
	RACE_DATA_URL = `${DATA_URL}races.json`;
	DEITY_DATA_URL = `${DATA_URL}deities.json`;

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
		"vehicle": [
			"name",
			"source",
			"vehicleType",
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
		"deity": [
			"name",
			"source",
			"pantheon",
		],
	};

	/**
	 * This is the main variable that should be modified when adding a new importable category (eg. spells, monsters, feats)
	 * Each category is represented with the following fields:
	 *
	 * name: the category name (singular)
	 * plural: the category name (plural)
	 * playerImport: if the category is player importable
	 * allImport: if the category has an import from all sources option
	 * fileImport: if the category has an import from file option
	 * uniqueImport: if the category has a unique import and not able to be handled by the showImportList function
	 * baseUrl: the url of the official JSON or directory of JSONs
	 * defaultSource: if there are multiple sources, the one to be shown by default
	 * finalText: any text to be shown after the buttons
	 */
	const IMPORT_CATEGORIES = [
		{
			name: "adventure",
			plural: "adventures",
			baseUrl: ADVENTURE_DATA_DIR,
			uniqueImport: true,
		},
		{
			name: "background",
			plural: "backgrounds",
			playerImport: true,
			baseUrl: BACKGROUND_DATA_URL,
		},
		{
			name: "class",
			plural: "classes",
			playerImport: true,
			baseUrl: CLASS_DATA_DIR,
		},
		{
			name: "deity",
			plural: "deities",
			baseUrl: DEITY_DATA_URL,
		},
		{
			name: "feat",
			plural: "feats",
			playerImport: true,
			baseUrl: FEAT_DATA_URL,
		},
		{
			name: "item",
			plural: "items",
			playerImport: true,
			baseUrl: ITEM_DATA_URL,
		},
		{
			name: "monster",
			plural: "monsters",
			allImport: true,
			fileImport: true,
			baseUrl: MONSTER_DATA_DIR,
			defaultSource: "MM",
			finalText: ` WARNING: Importing huge numbers of character sheets slows the game down. We recommend you import them as needed.<br>The "Import Monsters From All Sources" button presents a list containing monsters from official sources only.<br>To import from third-party sources, either individually select one available in the list, enter a custom URL, or upload a custom file, and "Import Monsters."`,
		},
		{
			name: "object",
			plural: "objects",
			baseUrl: OBJECT_DATA_URL,
		},
		{
			name: "optionalfeature",
			plural: "optionalfeatures",
			titleSing: "Optional Feature (Invocations, etc.)",
			titlePl: "Optional Features (Invocations, etc.)",
			playerImport: true,
			baseUrl: OPT_FEATURE_DATA_URL,
		},
		{
			name: "psionic",
			plural: "psionics",
			playerImport: true,
			baseUrl: PSIONIC_DATA_URL,
		},
		{
			name: "race",
			plural: "races",
			playerImport: true,
			baseUrl: RACE_DATA_URL,
		},
		{
			name: "spell",
			plural: "spells",
			playerImport: true,
			baseUrl: SPELL_DATA_DIR,
		},
		{
			name: "subclass",
			plural: "subclasses",
			playerImport: true,
			baseUrl: "",
		},
		{
			name: "vehicle",
			plural: "vehicles",
			baseUrl: VEHICLE_DATA_URL,
		},
	]

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
		// {name: "adventures index", url: `${DATA_URL}adventures.json`},  // error retrieving from 5e.tools
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
				// Roll20 creates thegraphics and similar variables on page load, not page creation
				if (!page.thegraphics) {
					page.fullyLoadPage();
				}
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
				const multipliers = [1, 1.5, 2, 2.5, 3, 4, 5];
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
				multiplier = multipliers[index];
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

	d20plus.updateDifficulty = function () {
		const $initWindow = $("div#initiativewindow");
		if (!$initWindow.parent().is("body")) {
			const $btnPane = $initWindow.parent().find(".ui-dialog-buttonpane");

			let $span = $btnPane.find("span.difficulty");

			if (!$span.length) {
				$btnPane.prepend(d20plus.template5e.difficultyHtml);
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
				d20.journal.addFolderToFolderStructure("Deities");
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
				d20plus.importer.doFakeDrop(event, character, data);
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
								var data = "";

								// Take a JSON that may be a URI encoded string and return it in non URI format
								function decodeIfURI (notes) {
									if (!notes) return "";

									if (notes.charAt(0) == "%") return decodeURIComponent(notes);

									return notes;
								}

								if (window.is_gm) {
									handout._getLatestBlob("gmnotes", function (gmnotes) {
										data = decodeIfURI(gmnotes);
										handout.updateBlobs({gmnotes: gmnotes});
										importData(character, JSON.parse(data), t);
									});
								} else {
									handout._getLatestBlob("notes", function (notes) {
										data = $(decodeIfURI(notes)).filter("del").html();
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
								const t = $(i.helper[0]).attr("data-pagename"),
								n = $(i.helper[0]).attr("data-subhead"),
								v = $(i.helper[0]).attr('data-expansionid');
								$.ajax({
									url: "/compendium/compendium/getPages",
									data: {
										bookName: d20.compendium.shortName,
										pages: [t],
										sharedCompendium: campaign_id,
										expansionId: v,
										dragDropRequest: !0
									},
									cache: !1,
									dataType: "JSON"
								}).done(i=>{
										const o = JSON.parse(i[0]),
										r = _.clone(o.data);
										r.Name = o.name,
										r.data = o.data,
										r.data = JSON.stringify(r.data),
										r.uniqueName = t,
										r.Content = o.content,
										r.dropSubhead = n,
										e.$currentDropTarget.find("*[accept]").each(function() {
											const t = $(this),
											i = t.attr("accept");
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
		const sheets = d20.journal.customSheets ?? d20.journal.characterSheetsManager.getAllSheets();
		const noSheetsFound = !d20.journal.customSheets && Array.isArray(sheets) && sheets.length < 1;
		if (window.is_gm && noSheetsFound) {
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
		const firstSheet = d20.journal.customSheets ?? sheets.first();
		if (firstSheet.layouthtml.includes("shaped_d20")) d20plus.sheet = "shaped";
		if (firstSheet.layouthtml.includes("DnD5e_Character_Sheet")) d20plus.sheet = "community";
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
			let html = d20plus.template5e.initiativeTemplate;
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
};

SCRIPT_EXTENSIONS.push(betteR205etoolsMain);
