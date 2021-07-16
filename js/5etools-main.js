const betteR205etoolsMain = function () {
	const IMG_URL = BASE_SITE_URL + "img/";

	const SPELL_DATA_DIR = `${DATA_URL}spells/`;
	const SPELL_META_URL = `${SPELL_DATA_DIR}roll20.json`;
	const MONSTER_DATA_DIR = `${DATA_URL}bestiary/`;
	const ADVENTURE_DATA_DIR = `${DATA_URL}adventure/`;
	const CLASS_DATA_DIR = `${DATA_URL}class/`;

	const ITEM_DATA_URL = `${DATA_URL}items.json`;
	const FEAT_DATA_URL = `${DATA_URL}feats.json`;
	const PSIONIC_DATA_URL = `${DATA_URL}psionics.json`;
	const OBJECT_DATA_URL = `${DATA_URL}objects.json`;
	const BACKGROUND_DATA_URL = `${DATA_URL}backgrounds.json`;
	const OPT_FEATURE_DATA_URL = `${DATA_URL}optionalfeatures.json`;
	const RACE_DATA_URL = `${DATA_URL}races.json`;

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
			"wis"
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
			"source"
		],
		"item": [
			"name",
			"rarity",
			"source"
		],
		"psionic": [
			"name",
			"source",
			"type"
		],
		"feat": [
			"name",
			"source",
			"entries"
		],
		"object": [
			"name",
			"source",
			"size",
			"type",
			"ac",
			"hp",
			"immune",
			"entries"
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
			"subclasses"
		],
		"subclass": [

		],
		"background": [
			"name",
			"source",
			"skillProficiencies",
			"entries"
		],
		"race": [
			"name",
			"source"
		],
		"optionalfeature": [
			"name",
			"source",
			"entries"
		]
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
//NPC_SHEET_ATTRIBUTES["custom"] = new SheetAttribute("-Custom-", "-Custom-", "-Custom-");
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

	addConfigOptions("token", {
		"_name": "Tokens",
		"_player": true,
		"bar1": {
			"name": "Bar 1 (NPC)",
			"default": "npc_hpbase",
			"_type": "_SHEET_ATTRIBUTE",
			"_player": true
		},
		"bar1_pc": {
			"name": "Bar 1 (PC)",
			"default": "",
			"_type": "_SHEET_ATTRIBUTE_PC"
		},
		"bar1_max": {
			"name": "Set Bar 1 Max",
			"default": true,
			"_type": "boolean",
			"_player": true
		},
		"bar1_reveal": {
			"name": "Reveal Bar 1",
			"default": false,
			"_type": "boolean",
			"_player": true
		},
		"bar2": {
			"name": "Bar 2 (NPC)",
			"default": "npc_ac",
			"_type": "_SHEET_ATTRIBUTE",
			"_player": true
		},
		"bar2_pc": {
			"name": "Bar 2 (PC)",
			"default": "",
			"_type": "_SHEET_ATTRIBUTE_PC"
		},
		"bar2_max": {
			"name": "Set Bar 2 Max",
			"default": false,
			"_type": "boolean",
			"_player": true
		},
		"bar2_reveal": {
			"name": "Reveal Bar 2",
			"default": false,
			"_type": "boolean",
			"_player": true
		},
		"bar3": {
			"name": "Bar 3 (NPC)",
			"default": "passive",
			"_type": "_SHEET_ATTRIBUTE",
			"_player": true
		},
		"bar3_pc": {
			"name": "Bar 3 (PC)",
			"default": "",
			"_type": "_SHEET_ATTRIBUTE_PC"
		},
		"bar3_max": {
			"name": "Set Bar 3 Max",
			"default": false,
			"_type": "boolean",
			"_player": true
		},
		"bar3_reveal": {
			"name": "Reveal Bar 3",
			"default": false,
			"_type": "boolean",
			"_player": true
		},
		"rollHP": {
			"name": "Roll Token HP",
			"default": false,
			"_type": "boolean"
		},
		"maximiseHp": {
			"name": "Maximise Token HP",
			"default": false,
			"_type": "boolean"
		},
		"name": {
			"name": "Show Nameplate",
			"default": true,
			"_type": "boolean",
			"_player": true
		},
		"name_reveal": {
			"name": "Reveal Nameplate",
			"default": false,
			"_type": "boolean",
			"_player": true
		},
		"barLocation": {
			"name": "Bar Location",
			"default": "above",
			"_type": "_enum",
			"__values": [
				"Above",
				"Top Overlapping",
				"Bottom Overlapping",
				"Below"
			],
			"_player": true
		},
		"isCompactBars": {
			"name": "Compact Bars",
			"default": false,
			"_type": "boolean",
			"_player": true
		},
	});
	addConfigOptions("import", {
		"_name": "Import",
		"allSourcesIncludeUnofficial": {
			"name": `Include Unofficial (UA/etc) Content in "Import Monsters From All Sources" List`,
			"default": false,
			"_type": "boolean"
		},
		"allSourcesIncludeHomebrew": {
			"name": `Include Homebrew in "Import Monsters From All Sources" List (Warning: Slow)`,
			"default": false,
			"_type": "boolean"
		},
		"importIntervalHandout": {
			"name": "Rest Time between Each Handout (msec)",
			"default": 100,
			"_type": "integer"
		},
		"importIntervalCharacter": {
			"name": "Rest Time between Each Character (msec)",
			"default": 2500,
			"_type": "integer"
		},
		"importFluffAs": {
			"name": "Import Creature Fluff As...",
			"default": "Bio",
			"_type": "_enum",
			"__values": ["Bio", "GM Notes"]
		},
		"importCharAvatar": {
			"name": "Set Character Avatar As...",
			"default": "Portrait (where available)",
			"_type": "_enum",
			"__values": ["Portrait (where available)", "Token"]
		},
		"whispermode": {
			"name": "Sheet Whisper Mode on Import",
			"default": "Toggle (Default GM)",
			"_type": "_WHISPERMODE"
		},
		"advantagemode": {
			"name": "Sheet Advantage Mode on Import",
			"default": "Toggle (Default Advantage)",
			"_type": "_ADVANTAGEMODE"
		},
		"damagemode": {
			"name": "Sheet Auto Roll Damage Mode on Import",
			"default": "Auto Roll",
			"_type": "_DAMAGEMODE"
		},
		"hideActionDescs": {
			"name": "Hide Action Descriptions on Import",
			"default": false,
			"_type": "boolean"
		},
		"skipSenses": {
			"name": "Skip Importing Creature Senses",
			"default": false,
			"_type": "boolean"
		},
		"showNpcNames": {
			"name": "Show NPC Names in Rolls",
			"default": true,
			"_type": "boolean"
		},
		"dexTiebreaker": {
			"name": "Add DEX Tiebreaker to Initiative",
			"default": false,
			"_type": "boolean"
		},
		"tokenactions": {
			"name": "Add TokenAction Macros on Import (Actions)",
			"default": true,
			"_type": "boolean"
		},
		"tokenactionsTraits": {
			"name": "Add TokenAction Macros on Import (Traits)",
			"default": true,
			"_type": "boolean"
		},
		"tokenactionsSkills": {
			"name": "Add TokenAction Macros on Import (Skills)",
			"default": true,
			"_type": "boolean"
		},
		"tokenactionsPerception": {
			"name": "Add TokenAction Macros on Import (Perception)",
			"default": true,
			"_type": "boolean"
		},
		"tokenactionsSaves": {
			"name": "Add TokenAction Macros on Import (Saves)",
			"default": true,
			"_type": "boolean"
		},
		"tokenactionsInitiative": {
			"name": "Add TokenAction Macros on Import (Initiative)",
			"default": true,
			"_type": "boolean"
		},
		"tokenactionsChecks": {
			"name": "Add TokenAction Macros on Import (Checks)",
			"default": true,
			"_type": "boolean"
		},
		"tokenactionsOther": {
			"name": "Add TokenAction Macros on Import (Other)",
			"default": true,
			"_type": "boolean"
		},
		"tokenactionsSpells": {
			"name": "Add TokenAction Macros on Import (Spells)",
			"default": true,
			"_type": "boolean"
		},
		"namesuffix": {
			"name": "Append Text to Names on Import",
			"default": "",
			"_type": "String"
		}
	});
	addConfigOptions("interface", {
		"_name": "Interface",
		"_player": true,
		"customTracker": {
			"name": "Add Additional Info to Tracker",
			"default": true,
			"_type": "boolean"
		},
		"trackerCol1": {
			"name": "Tracker Column 1",
			"default": "HP",
			"_type": "_FORMULA"
		},
		"trackerCol2": {
			"name": "Tracker Column 2",
			"default": "AC",
			"_type": "_FORMULA"
		},
		"trackerCol3": {
			"name": "Tracker Column 3",
			"default": "PP",
			"_type": "_FORMULA"
		},
		"trackerSheetButton": {
			"name": "Add Sheet Button To Tracker",
			"default": false,
			"_type": "boolean"
		},
		"minifyTracker": {
			"name": "Shrink Initiative Tracker Text",
			"default": false,
			"_type": "boolean"
		},
		"showDifficulty": {
			"name": "Show Difficulty in Tracker",
			"default": true,
			"_type": "boolean"
		},
		"emoji": {
			"name": "Add Emoji Replacement to Chat",
			"default": true,
			"_type": "boolean",
			"_player": true
		},
		"showCustomArtPreview": {
			"name": "Show Custom Art Previews",
			"default": true,
			"_type": "boolean"
		}
	});

	d20plus.sheet = "ogl";
	d20plus.psionics = {};
	d20plus.races = {};
	d20plus.adventures = {};
	d20plus.optionalfeatures = {};

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
			"spellDc": "@{spell_save_dc}"
		},
		"community": {
			"cr": "@{npc_challenge}",
			"ac": "@{AC}",
			"npcac": "@{AC}",
			"hp": "@{HP}",
			"pp": "10 + @{perception}",
			"macro": "",
			"spellDc": "@{spell_save_dc}"
		},
		"shaped": {
			"cr": "@{challenge}",
			"ac": "@{AC}",
			"npcac": "@{AC}",
			"hp": "@{HP}",
			"pp": "@{repeating_skill_$11_passive}",
			"macro": "shaped_statblock",
			"spellDc": "@{spell_save_dc}"
		}
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
			}
			else if (it.name === "item modifiers") itemMetadata = data;
			else throw new Error(`Unhandled data from JSON ${it.name} (${it.url})`);

			d20plus.ut.log(`JSON [${it.name}] Loaded`);
		}));
	};

	d20plus.handleConfigChange = function (isSyncingPlayer) {
		if (!isSyncingPlayer) d20plus.ut.log("Applying config");
		if (window.is_gm) {
			d20plus.setInitiativeShrink(d20plus.cfg.get("interface", "minifyTracker"));
			d20.Campaign.initiativewindow.rebuildInitiativeList();
			d20plus.updateDifficulty();
			if (d20plus.art.refreshList) d20plus.art.refreshList();
		}
	};

	// get the user config'd token HP bar
	d20plus.getCfgHpBarNumber = function () {
		const bars = [
			d20plus.cfg.get("token", "bar1"),
			d20plus.cfg.get("token", "bar2"),
			d20plus.cfg.get("token", "bar3")
		];
		return bars[0] === "npc_hpbase" ? 1 : bars[1] === "npc_hpbase" ? 2 : bars[2] === "npc_hpbase" ? 3 : null;
	};

	// Bind Graphics Add on page
	d20plus.bindGraphics = function (page) {
		d20plus.ut.log("Bind Graphics");
		try {
			if (page.get("archived") === false) {
				page.thegraphics.on("add", function (e) {
					var character = e.character;
					if (character) {
						var npc = character.attribs.find(function (a) {
							return a.get("name").toLowerCase() == "npc";
						});
						var isNPC = npc ? parseInt(npc.get("current")) : 0;
						// Set bars if configured to do so
						var barsList = ["bar1", "bar2", "bar3"];
						$.each(barsList, (i, barName) => {
							// PC config keys are suffixed "_pc"
							const confVal = d20plus.cfg.get("token", `${barName}${isNPC ? "" : "_pc"}`);
							if (confVal) {
								const charAttr = character.attribs.find(a => a.get("name").toLowerCase() == confVal);
								if (charAttr) {
									e.attributes[barName + "_value"] = charAttr.get("current");
									if (d20plus.cfg.has("token", barName + "_max")) {
										if (d20plus.cfg.get("token", barName + "_max") && !isNPC && confVal === "hp") { // player HP is current; need to set max to max
											e.attributes[barName + "_max"] = charAttr.get("max");
										} else {
											if (isNPC) {
												// TODO: Setting a value to empty/null does not overwrite existing values on the token.
												// setting a specific value does. Must figure this out.
												e.attributes[barName + "_max"] = d20plus.cfg.get("token", barName + "_max") ? charAttr.get("current") : "";
											} else {
												// preserve default token for player tokens
												if (d20plus.cfg.get("token", barName + "_max")) {
													e.attributes[barName + "_max"] = charAttr.get("current");
												}
											}
										}
									}
									if (d20plus.cfg.has("token", barName + "_reveal")) {
										e.attributes["showplayers_" + barName] = d20plus.cfg.get("token", barName + "_reveal");
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
								var hpf = character.attribs.find(function (a) {
									return a.get("name").toLowerCase() == NPC_SHEET_ATTRIBUTES["npc_hpformula"][d20plus.sheet];
								});
								var barName = d20plus.cfg.getCfgKey("token", "npc_hpbase");

								if (hpf && hpf.get("current")) {
									var hpformula = hpf.get("current");
									if (d20plus.cfg.get("token", "maximiseHp")) {
										const maxSum = hpformula.replace("d", "*");
										try {
											const max = eval(maxSum);
											if (!isNaN(max)) {
												e.attributes[barName + "_value"] = max;
												e.attributes[barName + "_max"] = max;
											}
										} catch (error) {
											d20plus.ut.log("Error Maximising HP");
											console.log(error);
										}
									} else {
										d20plus.ut.randomRoll(hpformula, function (result) {
											e.attributes[barName + "_value"] = result.total;
											e.attributes[barName + "_max"] = result.total;
											d20plus.ut.log("Rolled HP for [" + character.get("name") + "]");
										}, function (error) {
											d20plus.ut.log("Error Rolling HP Dice");
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
			console.log("D20Plus bindGraphics Exception", e);
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
			if (!token.character || npcFlag && npcFlag.get("current") == "1") {
				const hpBar = d20plus.getCfgHpBarNumber();
				// and a HP bar chosen
				if (hpBar) {
					$iptHp.text(token.attributes[`bar${hpBar}_value`])
				}

				toBind = (token, changes) => {
					const $initToken = getInitTrackerToken();
					if (!$initToken.length) return;
					const $iptHp = $initToken.find(`.hp.editable`);
					const hpBar = d20plus.getCfgHpBarNumber();

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
		var difficulty = "Unknown";
		var partyXPThreshold = [0, 0, 0, 0];
		var players = [];
		var npcs = [];
		try {
			$.each(d20.Campaign.initiativewindow.cleanList(), function (i, v) {
				var page = d20.Campaign.pages.get(v._pageid);
				if (page) {
					var token = page.thegraphics.get(v.id);
					if (token) {
						var char = token.character;
						if (char) {
							var npc = char.attribs.find(function (a) {
								return a.get("name").toLowerCase() === "npc";
							});
							if (npc && (npc.get("current") === 1 || npc.get("current") === "1")) { // just in casies
								npcs.push(char);
							} else {
								var level = char.attribs.find(function (a) {
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
				var len = npcs.length;
				var multiplier = 0;
				var adjustedxp = 0;
				var xp = 0;
				var index = 0;
				// Adjust for number of monsters
				if (len < 2) index = 0;
				else if (len < 3) index = 1;
				else if (len < 7) index = 2;
				else if (len < 11) index = 3;
				else if (len < 15) index = 4;
				else
					index = 5;
				// Adjust for smaller parties
				if (players.length < 3) index++;
				// Set multiplier
				multiplier = d20plus.multipliers[index];
				// Total monster xp
				$.each(npcs, function (i, v) {
					var cr = v.attribs.find(function (a) {
						return a.get("name").toLowerCase() === "npc_challenge";
					});
					if (cr && cr.get("current")) xp += parseInt(Parser.crToXpNumber(cr.get("current")));
				});
				// Encounter's adjusted xp
				adjustedxp = xp * multiplier;
				console.log("Party XP Threshold", partyXPThreshold);
				console.log("Adjusted XP", adjustedxp);
				// Determine difficulty
				if (adjustedxp < partyXPThreshold[0]) difficulty = "Trivial";
				else if (adjustedxp < partyXPThreshold[1]) difficulty = "Easy";
				else if (adjustedxp < partyXPThreshold[2]) difficulty = "Medium";
				else if (adjustedxp < partyXPThreshold[3]) difficulty = "Hard";
				else difficulty = "Deadly";
			}
		} catch (e) {
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
				dropdown.append($('<option>', {
					value: d20plus.formSrcUrl(baseUrl, srcUrlObject[src]),
					text: brewProps.includes("class") ? src.uppercaseFirst() : Parser.sourceJsonToFullCompactPrefix(src)
				}));
			});
			dropdown.append($('<option>', {
				value: "",
				text: "Custom"
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
							name: path.split("/").slice(1).join("/")
						});
					});
			});
			dataList.sort((a, b) => SortUtil.ascSortLower(a.name, b.name)).forEach(it => {
				dropdown.append($('<option>', {
					value: `${it.download_url}${d20plus.ut.getAntiCacheSuffix()}`,
					text: `Homebrew: ${it.name.trim().replace(/\.json$/i, "")}`
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
					$sel.append($('<option>', {
						value: defaultSel,
						text: "Official Sources"
					}));
				}
				if (!existingItems) {
					$sel.append($('<option>', {
						value: "",
						text: "Custom"
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
								name: path.split("/").slice(1).join("/")
							});
						});
				});
				dataList.sort((a, b) => SortUtil.ascSortLower(a.name, b.name)).forEach(it => {
					$sel.append($('<option>', {
						value: `${it.download_url}${d20plus.ut.getAntiCacheSuffix()}`,
						text: `Homebrew: ${it.name.trim().replace(/\.json$/i, "")}`
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
			$ptAdventures.find(`.Vetools-module-tool-open`).click(() => d20plus.tool.get('MODULES').openFn());
			$wrpSettings.append(d20plus.settingsHtmlPtImportFooter);

			$("#mysettings > .content a#button-monsters-load").on(window.mousedowntype, d20plus.monsters.button);
			$("#mysettings > .content a#button-monsters-load-all").on(window.mousedowntype, d20plus.monsters.buttonAll);
			$("#mysettings > .content a#import-objects-load").on(window.mousedowntype, d20plus.objects.button);
			$("#mysettings > .content a#button-adventures-load").on(window.mousedowntype, d20plus.adventures.button);

			$("#mysettings > .content a#bind-drop-locations").on(window.mousedowntype, d20plus.bindDropLocations);
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

			populateAdventuresDropdown();

			function populateAdventuresDropdown () {
				const defaultAdvUrl = d20plus.formSrcUrl(ADVENTURE_DATA_DIR, "adventure-lmop.json");
				const $iptUrl = $("#import-adventures-url");
				$iptUrl.val(defaultAdvUrl);
				$iptUrl.data("id", "lmop");
				const $sel = $("#button-adventures-select");
				adventureMetadata.adventure.forEach(a => {
					$sel.append($('<option>', {
						value: d20plus.formSrcUrl(ADVENTURE_DATA_DIR, `adventure-${a.id.toLowerCase()}.json|${a.id}`),
						text: a.name
					}));
				});
				$sel.append($('<option>', {
					value: "",
					text: "Custom"
				}));
				$sel.val(defaultAdvUrl);
				$sel.change(() => {
					const [url, id] = $sel.val().split("|");
					$($iptUrl).val(url);
					$iptUrl.data("id", id);
				});
			}

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
			resizable: false
		});
		$("#d20plus-importlist").dialog({
			autoOpen: false,
			resizable: true,
			width: 1000,
			height: 700
		});
		$("#d20plus-import-props").dialog({
			autoOpen: false,
			resizable: true,
			width: 300,
			height: 600
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
				$span.text("Difficulty: " + d20plus.getDifficulty());
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
			var journalFolder = d20.Campaign.get("journalfolder");
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

		class CharacterAttributesProxy {
			constructor (character) {
				this.character = character;
				this._changedAttrs = [];
			}

			findByName (attrName) {
				return this.character.model.attribs.toJSON()
					.find(a => a.name === attrName) || {};
			}

			findOrGenerateRepeatingRowId (namePattern, current) {
				const [namePrefix, nameSuffix] = namePattern.split(/\$\d?/);
				const attr = this.character.model.attribs.toJSON()
					.find(a => a.name.startsWith(namePrefix) && a.name.endsWith(nameSuffix) && a.current == current);
				return attr ?
					attr.name.replace(RegExp(`^${namePrefix}(.*)${nameSuffix}$`), "$1") :
					d20plus.ut.generateRowId();
			}

			add (name, current, max) {
				this.character.model.attribs.create({
					name: name,
					current: current,
					...(max == undefined ? {} : {max: max})
				}).save();
				this._changedAttrs.push(name);
			}

			addOrUpdate (name, current, max) {
				const id = this.findByName(name).id;
				if (id) {
					this.character.model.attribs.get(id).set({
						current: current,
						...(max == undefined ? {} : {max: max})
					}).save();
					this._changedAttrs.push(name);
				} else {
					this.add(name, current, max);
				}
			}

			notifySheetWorkers () {
				d20.journal.notifyWorkersOfAttrChanges(this.character.model.id, this._changedAttrs);
				this._changedAttrs = [];
			}
		}

		function importFeat (character, data) {
			const featName = data.name;
			const featText = data.Vetoolscontent;
			const attrs = new CharacterAttributesProxy(character);
			const rowId = d20plus.ut.generateRowId();

			if (d20plus.sheet == "ogl") {
				attrs.add(`repeating_traits_${rowId}_options-flag`, "0");
				attrs.add(`repeating_traits_${rowId}_name`, featName);
				attrs.add(`repeating_traits_${rowId}_description`, featText);
				attrs.add(`repeating_traits_${rowId}_source`, "Feat");
			} else if (d20plus.sheet == "shaped") {
				attrs.add(`repeating_feat_${rowId}_name`, featName);
				attrs.add(`repeating_feat_${rowId}_content`, featText);
				attrs.add(`repeating_feat_${rowId}_content_toggle`, "1");
			} else {
				console.warn(`Feat import is not supported for ${d20plus.sheet} character sheet`);
			}

			attrs.notifySheetWorkers();
		}

		async function importBackground (character, data) {
			const bg = data.Vetoolscontent;

			const renderer = new Renderer();
			renderer.setBaseUrl(BASE_SITE_URL);
			const renderStack = [];
			let feature = {};
			bg.entries.forEach(e => {
				if (e.name && e.name.includes("Feature:")) {
					feature = JSON.parse(JSON.stringify(e));
					feature.name = feature.name.replace("Feature:", "").trim();
				}
			});
			if (feature) renderer.recursiveRender({entries: feature.entries}, renderStack);
			feature.text = renderStack.length ? d20plus.importer.getCleanText(renderStack.join("")) : "";

			// Add skills
			async function chooseSkills (from, count) {
				return new Promise((resolve, reject) => {
					const $dialog = $(`
						<div title="Choose Skills">
							<div name="remain" style="font-weight: bold">Remaining: ${count}</div>
							<div>
								${from.map(it => `<label class="split"><span>${it.toTitleCase()}</span> <input data-skill="${it}" type="checkbox"></label>`).join("")}
							</div>
						</div>
					`).appendTo($("body"));
					const $remain = $dialog.find(`[name="remain"]`);
					const $cbSkill = $dialog.find(`input[type="checkbox"]`);

					$cbSkill.on("change", function () {
						const $e = $(this);
						let selectedCount = getSelected().length;
						if (selectedCount > count) {
							$e.prop("checked", false);
							selectedCount--;
						}
						$remain.text(`Remaining: ${count - selectedCount}`);
					});

					function getSelected () {
						return $cbSkill.map((i, e) => ({skill: $(e).data("skill"), selected: $(e).prop("checked")})).get()
							.filter(it => it.selected).map(it => it.skill);
					}

					$dialog.dialog({
						dialogClass: "no-close",
						buttons: [
							{
								text: "Cancel",
								click: function () {
									$(this).dialog("close");
									$dialog.remove();
									reject(`User cancelled the prompt`);
								}
							},
							{
								text: "OK",
								click: function () {
									const selected = getSelected();
									if (selected.length === count) {
										$(this).dialog("close");
										$dialog.remove();
										resolve(selected);
									} else {
										alert(`Please select ${count} skill${count === 1 ? "" : "s"}`);
									}
								}
							}
						]
					})
				});
			}

			async function chooseSkillsGroup (options) {
				return new Promise((resolve, reject) => {
					const $dialog = $(`
						<div title="Choose Skills">
							<div>
								${options.map((it, i) => `<label class="split"><input name="skill-group" data-ix="${i}" type="radio" ${i === 0 ? `checked` : ""}> <span>${it}</span></label>`).join("")}
							</div>
						</div>
					`).appendTo($("body"));
					const $rdOpt = $dialog.find(`input[type="radio"]`);

					$dialog.dialog({
						dialogClass: "no-close",
						buttons: [
							{
								text: "Cancel",
								click: function () {
									$(this).dialog("close");
									$dialog.remove();
									reject(`User cancelled the prompt`);
								}
							},
							{
								text: "OK",
								click: function () {
									const selected = $rdOpt.filter((i, e) => $(e).prop("checked"))
										.map((i, e) => $(e).data("ix")).get()[0];
									$(this).dialog("close");
									$dialog.remove();
									resolve(selected);
								}
							}
						]
					})
				});
			}

			const skills = [];

			async function handleSkillsItem (item) {
				Object.keys(item).forEach(k => {
					if (k !== "choose") skills.push(k);
				});

				if (item.choose) {
					const choose = item.choose;
					const sansExisting = choose.from.filter(it => !skills.includes(it));
					const count = choose.count || 1;
					const chosenSkills = await chooseSkills(sansExisting, count);
					chosenSkills.forEach(it => skills.push(it));
				}
			}

			if (bg.skillProficiencies && bg.skillProficiencies.length) {
				if (bg.skillProficiencies.length > 1) {
					const options = bg.skillProficiencies.map(item => Renderer.background.getSkillSummary([item], true, []))
					const chosenIndex = await chooseSkillsGroup(options);
					await handleSkillsItem(bg.skillProficiencies[chosenIndex]);
				} else {
					await handleSkillsItem(bg.skillProficiencies[0]);
				}
			}

			// Add Proficiencies (mainly language and tool, but extendable)
			// Skills are still done Giddy's way so I don't need to mess with his code (and I couldn't easily convert his code to my method)
			// Note: Doing this mostly stealing from Giddy's code
			async function chooseProfs (from, count, profType) {
				// Shamelessly stolen from Giddy
				return new Promise((resolve, reject) => {
					const $dialog = $(`
						<div title="Choose ${profType}">
							<div name="remain" style="font-weight: bold">Remaining: ${count}</div>
							<div>
								${from.map(it => `<label class="split"><span>${it.toTitleCase()}</span> <input data-prof="${it}" type="checkbox"></label>`).join("")}
							</div>
						</div>
					`).appendTo($("body"));
					const $remain = $dialog.find(`[name="remain"]`);
					const $cbSkill = $dialog.find(`input[type="checkbox"]`);

					$cbSkill.on("change", function () {
						const $e = $(this);
						let selectedCount = getSelected().length;
						if (selectedCount > count) {
							$e.prop("checked", false);
							selectedCount--;
						}
						$remain.text(`Remaining: ${count - selectedCount}`);
					});

					function getSelected () {
						return $cbSkill.map((i, e) => ({skill: $(e).data("prof"), selected: $(e).prop("checked")})).get()
							.filter(it => it.selected).map(it => it.skill);
					}

					$dialog.dialog({
						dialogClass: "no-close",
						buttons: [
							{
								text: "Cancel",
								click: function () {
									$(this).dialog("close");
									$dialog.remove();
									reject(`User cancelled the prompt`);
								}
							},
							{
								text: "OK",
								click: function () {
									const selected = getSelected();
									if (selected.length === count) {
										$(this).dialog("close");
										$dialog.remove();
										resolve(selected);
									} else {
										alert(`Please select ${count} language${count === 1 ? "" : "s"}`);
									}
								}
							}
						]
					})
				});
			}

			async function chooseProfsGroup (options, profType) {
				// For when there are two separate ways to choose languages
				return new Promise((resolve, reject) => {
					const $dialog = $(`
						<div title="Choose ${profType}">
							<div>
								${options.map((it, i) => `<label class="split"><input name="prof-group" data-ix="${i}" type="radio" ${i === 0 ? `checked` : ""}> <span>${
									// Format it nicely
									Object.entries(it).map(a => a[0]).map(a => a === "anyStandard" ? "any" : a).map(a => a.toTitleCase()).join(", ")
								}</span></label>`).join("")}
							</div>
						</div>
					`).appendTo($("body"));
					const $rdOpt = $dialog.find(`input[type="radio"]`);

					$dialog.dialog({
						dialogClass: "no-close",
						buttons: [
							{
								text: "Cancel",
								click: function () {
									$(this).dialog("close");
									$dialog.remove();
									reject(`User cancelled the prompt`);
								}
							},
							{
								text: "OK",
								click: function () {
									const selected = $rdOpt.filter((i, e) => $(e).prop("checked"))
										.map((i, e) => $(e).data("ix")).get()[0];
									$(this).dialog("close");
									$dialog.remove();
									resolve(selected);
								}
							}
						]
					})
				});
			}

			async function handleProfs(profs, profType) {
				// Handle the language options, let user choose if needed
				// Handles most edge cases I think
				const ret = []
				for (const [key, value] of Object.entries(profs)) {
					// Loop must be in this form -- Thanks for figuring this out Giddy
					if (key === "choose") {
						// If choice is needed, call popup function
						let numChoice = 1;
						if (value.count) numChoice = value.count;
						const choice = await chooseProfs(value.from, numChoice, profType);
						choice.forEach(c => ret.push(c));
					}
					else if (key === "anyStandard") {
						// If any language is available, add any
						for (let i = 0; i < value; i++) ret.push("any");
					}
					else if (value) {
						// If no choice is needed, add the proficiency normally
						ret.push(key);
					}
				}
				return ret;
			}

			// Get data for language proficiencies specifically
			let backgroundLanguages = [];
			if (bg.languageProficiencies && bg.languageProficiencies.length) {
				if (bg.languageProficiencies.length > 1) {
					// See Clan Crafter for an example
					let profIndex = await chooseProfsGroup(bg.languageProficiencies, "Languages");
					backgroundLanguages = await handleProfs(bg.languageProficiencies[profIndex], "Languages");
				}
				else if (bg.languageProficiencies.length > 0) {
					// Most common case
					backgroundLanguages = await handleProfs(bg.languageProficiencies[0], "Languages");
				}
			}

			// Tool Proficiencies
			let backgroundTools = [];
			if (bg.toolProficiencies && bg.toolProficiencies.length) {
				if (bg.toolProficiencies.length > 1) {
					// If there are different types of options
					let profIndex = await chooseProfsGroup(bg.toolProficiencies, "Tools");
					backgroundTools = await handleProfs(bg.toolProficiencies[profIndex], "Tools")
				}
				else if (bg.toolProficiencies.length > 0) {
					// Most common case
					backgroundTools = await handleProfs(bg.toolProficiencies[0] , "Tools");
				}
			}

			// Import items
			async function parseItems(itemlist) {
				const allitemList = await Renderer.item.pBuildList();
				const x = Object.values(itemlist).map(function (item) {
					// Returns a standardized object from a very unstandardized object
					// Get the important variables
					let iname = "";
					if (typeof item !== 'object') {
						iname = item;
					}
					else if ('item' in item) {
						iname = item.item;
					}
					else if ('special' in item) {
						iname = item.special;
					}

					// Make the input object
					const pareseditem = {"name": iname.split("|")[0].toTitleCase()};
					const it = allitemList.find(pareseditem) || pareseditem;
					// Create item data in the format importItem likes,
					//   then call the importItem function usually used to import items
					return JSON.parse(d20plus.items._getHandoutData(it)[1])
				});

				const y = x.map(it => ({subItem: JSON.stringify(it), count: 1}));

				const allItems = {
					name: 'All Items',
					_subItems: [...y],
					data: {}
				};

				importItem(character, allItems, null);
			}

			async function  chooseItemsFromBackground (itemChoices) {
				return new Promise((resolve, reject) => {
					const $dialog = $(`
							<div title="Items Import">
								<label class="flex">
									<span>Which item would you like to import?</span>
									 <select title="Note: this does not include homebrew. For homebrew subclasses, use the dedicated subclass importer." style="width: 250px;">
								   ${Object.entries(itemChoices).map(([key,value]) => `<option value="${key}">${(value[0].item || value[0].special).split("|")[0].toTitleCase()}</option>`)}
									 </select>
								</label>
							</div>
						`).appendTo($("body"));
					const $selStrat = $dialog.find(`select`);

					$dialog.dialog({
						dialogClass: "no-close",
						buttons: [
							{
								text: "Cancel",
								click: function () {
									$(this).dialog("close");
									$dialog.remove();
									reject(`User cancelled the prompt`);
								}
							},
							{
								text: "OK",
								click: function () {
									const selected = $selStrat.val();
									$(this).dialog("close");
									$dialog.remove();
									resolve(selected);
								}
							}
						]
					})
				});
			}

			if (bg.startingEquipment) {
				for (const equip of bg.startingEquipment) {
					// Loop because there can be any number of objects and in any order
					if (equip._) {
						// The _ property means not a will be imported
						parseItems(equip._);
					}
					else {
						// Otherwise there is a choice of what to import
						const itemchoicefrombackgorund = await chooseItemsFromBackground(equip);
                		parseItems(equip[itemchoicefrombackgorund]);
					}
				}
			}

			// Update Sheet
			const attrs = new CharacterAttributesProxy(character);
			const fRowId = d20plus.ut.generateRowId();

			if (d20plus.sheet === "ogl") {
				attrs.addOrUpdate("background", bg.name);

				attrs.add(`repeating_traits_${fRowId}_name`, feature.name);
				attrs.add(`repeating_traits_${fRowId}_source`, "Background");
				attrs.add(`repeating_traits_${fRowId}_source_type`, bg.name);
				attrs.add(`repeating_traits_${fRowId}_options-flag`, "0");
				if (feature.text) {
					attrs.add(`repeating_traits_${fRowId}_description`, feature.text);
				}

				skills.map(s => s.toLowerCase().replace(/ /g, "_")).forEach(s => {
					attrs.addOrUpdate(`${s}_prof`, `(@{pb}*@{${s}_type})`);
				});

				backgroundLanguages.map(l => l.toTitleCase()).forEach(l => {
					const lRowId = d20plus.ut.generateRowId();
					attrs.add(`repeating_proficiencies_${lRowId}_name`, l);
					attrs.add(`repeating_proficiencies_${lRowId}_options-flag`, "0");
				});

				backgroundTools.map(t => t.toTitleCase()).forEach(t => {
					const tRowID = d20plus.ut.generateRowId();
					attrs.add(`repeating_tool_${tRowID}_toolname`, t);
					attrs.add(`repeating_tool_${tRowID}_toolbonus_base`, "@{pb}");
					attrs.add(`repeating_tool_${tRowID}_options-flag`, "0");
					// All Tools assume the query option
					// The long strings are annoying but they are also necessary
					attrs.add(`repeating_tool_${tRowID}_toolattr`, "QUERY");
					attrs.add(`repeating_tool_${tRowID}_toolbonus`, "?{Attribute?|Strength,@{strength_mod}|Dexterity,@{dexterity_mod}|Constitution,@{constitution_mod}|Intelligence,@{intelligence_mod}|Wisdom,@{wisdom_mod}|Charisma,@{charisma_mod}}+0+@{pb}");
					attrs.add(`repeating_tool_${tRowID}_toolroll`, "@{wtype}&{template:simple} {{rname=@{toolname}}} {{mod=@{toolbonus}}} {{r1=[[@{d20}+@{toolbonus}[Mods]@{pbd_safe}]]}} {{always=1}} {{r2=[[@{d20}+@{toolbonus}[Mods]@{pbd_safe}]]}} {{global=@{global_skill_mod}}} @{charname_output}");
					attrs.add(`repeating_tool_${tRowID}_toolattr_base`, "?{Attribute?|Strength,@{strength_mod}|Dexterity,@{dexterity_mod}|Constitution,@{constitution_mod}|Intelligence,@{intelligence_mod}|Wisdom,@{wisdom_mod}|Charisma,@{charisma_mod}}");
					attrs.add(`repeating_tool_${tRowID}_toolbonus_display`, "?");
				});
			} else if (d20plus.sheet === "shaped") {
				attrs.addOrUpdate("background", bg.name);
				attrs.add(`repeating_trait_${fRowId}_name`, `${feature.name} (${bg.name})`);
				if (feature.text) {
					attrs.add(`repeating_trait_${fRowId}_content`, feature.text);
					attrs.add(`repeating_trait_${fRowId}_content_toggle`, "1");
				}

				skills.map(s => s.toUpperCase().replace(/ /g, "")).forEach(s => {
					const rowId = attrs.findOrGenerateRepeatingRowId("repeating_skill_$0_storage_name", s);
					attrs.addOrUpdate(`repeating_skill_${rowId}_proficiency`, "proficient");
				});
			} else {
				console.warn(`Background import is not supported for ${d20plus.sheet} character sheet`);
			}

			attrs.notifySheetWorkers();
		}

		function importRace (character, data) {
			const renderer = new Renderer();
			renderer.setBaseUrl(BASE_SITE_URL);

			const race = data.Vetoolscontent;

			race.entries.filter(it => typeof it !== "string").forEach(e => {
				const renderStack = [];
				renderer.recursiveRender({entries: e.entries}, renderStack);
				e.text = d20plus.importer.getCleanText(renderStack.join(""));
			});

			const attrs = new CharacterAttributesProxy(character);

			if (d20plus.sheet === "ogl") {
				attrs.addOrUpdate(`race`, race.name);
				attrs.addOrUpdate(`race_display`, race.name);
				attrs.addOrUpdate(`speed`, Parser.getSpeedString(race));

				race.entries.filter(it => it.text).forEach(e => {
					const fRowId = d20plus.ut.generateRowId();
					attrs.add(`repeating_traits_${fRowId}_name`, e.name);
					attrs.add(`repeating_traits_${fRowId}_source`, "Race");
					attrs.add(`repeating_traits_${fRowId}_source_type`, race.name);
					attrs.add(`repeating_traits_${fRowId}_description`, e.text);
					attrs.add(`repeating_traits_${fRowId}_options-flag`, "0");
				});

				if (race.languageProficiencies && race.languageProficiencies.length) {
					// FIXME this discards information
					const profs = race.languageProficiencies[0];
					const asText = Object.keys(profs).filter(it => it !== "choose").map(it => it === "anyStandard" ? "any" : it).map(it => it.toTitleCase()).join(", ");

					const lRowId = d20plus.ut.generateRowId();
					attrs.add(`repeating_proficiencies_${lRowId}_name`, asText);
					attrs.add(`repeating_proficiencies_${lRowId}_options-flag`, "0");
				}
			} else if (d20plus.sheet === "shaped") {
				attrs.addOrUpdate("race", race.name);
				attrs.addOrUpdate("size", (race.size || [SZ_VARIES]).map(sz => Parser.sizeAbvToFull(sz)).join("/").toUpperCase());
				attrs.addOrUpdate("speed_string", Parser.getSpeedString(race));

				if (race.speed instanceof Object) {
					for (const locomotion of ["walk", "burrow", "climb", "fly", "swim"]) {
						if (race.speed[locomotion]) {
							const attrName = locomotion === "walk" ? "speed" : `speed_${locomotion}`;
							if (locomotion !== "walk") {
								attrs.addOrUpdate("other_speeds", "1");
							}
							// note: this doesn't cover hover
							attrs.addOrUpdate(attrName, race.speed[locomotion]);
						}
					}
				} else {
					attrs.addOrUpdate("speed", race.speed);
				}

				// really there seems to be only darkvision for PCs
				for (const vision of ["darkvision", "blindsight", "tremorsense", "truesight"]) {
					if (race[vision]) {
						attrs.addOrUpdate(vision, race[vision]);
					}
				}

				race.entries.filter(it => it.text).forEach(e => {
					const fRowId = d20plus.ut.generateRowId();
					attrs.add(`repeating_racialtrait_${fRowId}_name`, e.name);
					attrs.add(`repeating_racialtrait_${fRowId}_content`, e.text);
					attrs.add(`repeating_racialtrait_${fRowId}_content_toggle`, "1");
				});

				const fRowId = d20plus.ut.generateRowId();
				attrs.add(`repeating_modifier_${fRowId}_name`, race.name);
				attrs.add(`repeating_modifier_${fRowId}_ability_score_toggle`, "1");
				(race.ability || []).forEach(raceAbility => {
					Object.keys(raceAbility).filter(it => it !== "choose").forEach(abilityAbv => {
						const value = raceAbility[abilityAbv];
						const ability = Parser.attAbvToFull(abilityAbv).toLowerCase();
						attrs.add(`repeating_modifier_${fRowId}_${ability}_score_modifier`, value);
					});
				});
			} else {
				console.warn(`Race import is not supported for ${d20plus.sheet} character sheet`);
			}

			attrs.notifySheetWorkers();
		}

		function importOptionalFeature (character, data) {
			const optionalFeature = data.Vetoolscontent;
			const renderer = new Renderer();
			renderer.setBaseUrl(BASE_SITE_URL);
			const rendered = renderer.render({entries: optionalFeature.entries});
			const optionalFeatureText = d20plus.importer.getCleanText(rendered);

			const attrs = new CharacterAttributesProxy(character);
			const fRowId = d20plus.ut.generateRowId();

			if (d20plus.sheet == "ogl") {
				attrs.add(`repeating_traits_${fRowId}_name`, optionalFeature.name);
				attrs.add(`repeating_traits_${fRowId}_source`, Parser.optFeatureTypeToFull(optionalFeature.featureType));
				attrs.add(`repeating_traits_${fRowId}_source_type`, optionalFeature.name);
				attrs.add(`repeating_traits_${fRowId}_description`, optionalFeatureText);
				attrs.add(`repeating_traits_${fRowId}_options-flag`, "0");
			} else if (d20plus.sheet == "shaped") {
				attrs.add(`repeating_classfeature_${fRowId}_name`, optionalFeature.name);
				attrs.add(`repeating_classfeature_${fRowId}_content`, optionalFeatureText);
				attrs.add(`repeating_classfeature_${fRowId}_content_toggle`, "1");
			} else {
				console.warn(`Optional feature (invocation, maneuver, or metamagic) import is not supported for ${d20plus.sheet} character sheet`);
			}

			attrs.notifySheetWorkers();
		}

		function importClass (character, data) {
			let levels = d20plus.ut.getNumberRange("What levels?", 1, 20);
			if (!levels) return;

			const maxLevel = Math.max(...levels);

			const clss = data.Vetoolscontent;
			const renderer = Renderer.get().setBaseUrl(BASE_SITE_URL);
			const shapedSheetPreFilledFeaturesByClass = {
				"Artificer": [
					"Magic Item Analysis",
					"Tool Expertise",
					"Wondrous Invention",
					"Infuse Magic",
					"Superior Attunement",
					"Mechanical Servant",
					"Soul of Artifice",
				],
				"Barbarian": [
					"Rage",
					"Unarmored Defense",
					"Reckless Attack",
					"Danger Sense",
					"Extra Attack",
					"Fast Movement",
					"Feral Instinct",
					"Brutal Critical",
					"Relentless Rage",
					"Persistent Rage",
					"Indomitable Might",
					"Primal Champion",
				],
				"Bard": [
					"Bardic Inspiration",
					"Jack of All Trades",
					"Song of Rest",
					"Expertise",
					"Countercharm",
					"Magical Secrets",
					"Superior Inspiration",
				],
				"Cleric": [
					"Channel Divinity",
					"Turn Undead",
					"Divine Intervention",
				],
				"Druid": [
					"Druidic",
					"Wild Shape",
					"Timeless Body",
					"Beast Spells",
					"Archdruid",
				],
				"Fighter": [
					"Fighting Style",
					"Second Wind",
					"Action Surge",
					"Extra Attack",
					"Indomitable",
				],
				"Monk": [
					"Unarmored Defense",
					"Martial Arts",
					"Ki",
					"Flurry of Blows",
					"Patient Defense",
					"Step of the Wind",
					"Unarmored Movement",
					"Deflect Missiles",
					"Slow Fall",
					"Extra Attack",
					"Stunning Strike",
					"Ki-Empowered Strikes",
					"Evasion",
					"Stillness of Mind",
					"Purity of Body",
					"Tongue of the Sun and Moon",
					"Diamond Soul",
					"Timeless Body",
					"Empty Body",
					"Perfect Soul",
				],
				"Paladin": [
					"Divine Sense",
					"Lay on Hands",
					"Fighting Style",
					"Divine Smite",
					"Divine Health",
					"Channel Divinity",
					"Extra Attack",
					"Aura of Protection",
					"Aura of Courage",
					"Improved Divine Smite",
					"Cleansing Touch",
				],
				"Ranger": [
					"Favored Enemy",
					"Natural Explorer",
					"Fighting Style",
					"Primeval Awareness",
					"Land’s Stride",
					"Hide in Plain Sight",
					"Vanish",
					"Feral Senses",
					"Foe Slayer",
				],
				"Ranger (Revised)": [ // "Ranger UA (2016)"
					"Favored Enemy",
					"Natural Explorer",
					"Fighting Style",
					"Primeval Awareness",
					"Greater Favored Enemy",
					"Fleet of Foot",
					"Hide in Plain Sight",
					"Vanish",
					"Feral Senses",
					"Foe Slayer",
				],
				"Rogue": [
					"Expertise",
					"Sneak Attack",
					"Thieves' Cant",
					"Cunning Action",
					"Uncanny Dodge",
					"Evasion",
					"Reliable Talent",
					"Blindsense",
					"Slippery Mind",
					"Elusive",
					"Stroke of Luck",
				],
				"Sorcerer": [
					"Sorcery Points",
					"Flexible Casting",
					"Metamagic",
					"Sorcerous Restoration",
				],
				"Warlock": [
					"Eldritch Invocations",
					"Pact Boon",
					"Mystic Arcanum",
					"Eldritch Master",
				],
				"Wizard": [
					"Arcane Recovery",
					"Spell Mastery",
					"Signature Spells",
				],
			};
			const shapedSheetPreFilledFeatures = shapedSheetPreFilledFeaturesByClass[clss.name] || [];

			const attrs = new CharacterAttributesProxy(character);

			importClassGeneral(attrs, clss, maxLevel);

			for (let i = 0; i < maxLevel; i++) {
				const level = i + 1;
				if (!levels.has(level)) continue;

				const lvlFeatureList = clss.classFeatures[i];
				for (let j = 0; j < lvlFeatureList.length; j++) {
					const feature = lvlFeatureList[j];
					// don't add "you gain a subclass feature" or ASI's
					if (!feature.gainSubclassFeature && feature.name !== "Ability Score Improvement") {
						const renderStack = [];
						renderer.recursiveRender({entries: feature.entries}, renderStack);
						feature.text = d20plus.importer.getCleanText(renderStack.join(""));
						importClassFeature(attrs, clss, level, feature);
					}
				}
			}

			function importClassGeneral (attrs, clss, maxLevel) {
				if (d20plus.sheet === "ogl") {
					setTimeout(() => {
						attrs.addOrUpdate("pb", d20plus.getProfBonusFromLevel(Number(maxLevel)));
						attrs.addOrUpdate("class", clss.name);
						attrs.addOrUpdate("level", maxLevel);
						attrs.addOrUpdate("base_level", String(maxLevel));
					}, 500);
				} else if (d20plus.sheet === "shaped") {
					const isSupportedClass = clss.source === "PHB" || ["Artificer", "Ranger (Revised)"].includes(clss.name);
					let className = "CUSTOM";
					if (isSupportedClass) {
						className = clss.name.toUpperCase();
						if (clss.name === "Ranger (Revised)")
							className = "RANGERUA";
					}

					const fRowId = attrs.findOrGenerateRepeatingRowId("repeating_class_$0_name", className);
					attrs.addOrUpdate(`repeating_class_${fRowId}_name`, className);
					attrs.addOrUpdate(`repeating_class_${fRowId}_level`, maxLevel);
					if (!isSupportedClass) {
						attrs.addOrUpdate(`repeating_class_${fRowId}_hd`, `d${clss.hd.faces}`);
						attrs.addOrUpdate(`repeating_class_${fRowId}_custom_class_toggle`, "1");
						attrs.addOrUpdate(`repeating_class_${fRowId}_custom_name`, clss.name);
					}

					if (!isSupportedClass && clss.name === "Mystic") {
						const classResourcesForLevel = clss.classTableGroups[0].rows[maxLevel - 1];
						const [talentsKnown, disciplinesKnown, psiPoints, psiLimit] = classResourcesForLevel;

						attrs.addOrUpdate("spell_points_name", "PSI");
						attrs.addOrUpdate("show_spells", "1");
						attrs.addOrUpdate("spell_points_toggle", "1");
						attrs.addOrUpdate("spell_ability", "INTELLIGENCE");
						attrs.addOrUpdate("spell_points_limit", psiLimit);
						attrs.addOrUpdate("spell_points", psiPoints, psiPoints);
						// talentsKnown, disciplinesKnown;	// unused

						for (let i = 1; i <= 7; i++) {
							attrs.addOrUpdate(`spell_level_${i}_cost`, i);
						}
						for (let i = 0; i <= psiLimit; i++) {
							attrs.addOrUpdate(`spell_level_filter_${i}`, "1");
						}
					}

					attrs.notifySheetWorkers();
				} else {
					console.warn(`Class import is not supported for ${d20plus.sheet} character sheet`);
				}
			}

			function importClassFeature (attrs, clss, level, feature) {
				if (d20plus.sheet == "ogl") {
					const fRowId = d20plus.ut.generateRowId();
					attrs.add(`repeating_traits_${fRowId}_name`, feature.name);
					attrs.add(`repeating_traits_${fRowId}_source`, "Class");
					attrs.add(`repeating_traits_${fRowId}_source_type`, `${clss.name} ${level}`);
					attrs.add(`repeating_traits_${fRowId}_description`, feature.text);
					attrs.add(`repeating_traits_${fRowId}_options-flag`, "0");
				} else if (d20plus.sheet == "shaped") {
					if (shapedSheetPreFilledFeatures.includes(feature.name))
						return;

					const fRowId = d20plus.ut.generateRowId();
					attrs.add(`repeating_classfeature_${fRowId}_name`, `${feature.name} (${clss.name} ${level})`);
					attrs.add(`repeating_classfeature_${fRowId}_content`, feature.text);
					attrs.add(`repeating_classfeature_${fRowId}_content_toggle`, "1");
				}

				attrs.notifySheetWorkers();
			}
		}

		function importSubclass (character, data) {
			if (d20plus.sheet != "ogl" && d20plus.sheet != "shaped") {
				console.warn(`Subclass import is not supported for ${d20plus.sheet} character sheet`);
				return;
			}

			const attrs = new CharacterAttributesProxy(character);
			const sc = data.Vetoolscontent;

			const levels = d20plus.ut.getNumberRange("What levels?", 1, 20);
			if (!levels || !levels.size) return;

			const renderer = new Renderer();
			renderer.setBaseUrl(BASE_SITE_URL);
			let firstFeatures = true;
			for (let i = 0; i < sc.subclassFeatures.length; i++) {
				const lvlFeatureList = sc.subclassFeatures[i];
				for (let j = 0; j < lvlFeatureList.length; j++) {
					const featureCpy = JSON.parse(JSON.stringify(lvlFeatureList[j]));
					let feature = lvlFeatureList[j];

					if (!levels.has(feature.level)) continue;

					try {
						while (!feature.name || (feature[0] && !feature[0].name)) {
							if (feature.entries && feature.entries.name) {
								feature = feature.entries;
								continue;
							} else if (feature.entries[0] && feature.entries[0].name) {
								feature = feature.entries[0];
								continue;
							} else {
								feature = feature.entries;
							}

							if (!feature) {
								// in case something goes wrong, reset break the loop
								feature = featureCpy;
								break;
							}
						}
					} catch (e) {
						console.error("Failed to find feature");
						// in case something goes _really_ wrong, reset
						feature = featureCpy;
					}

					// for the first batch of subclass features, try to split them up
					if (firstFeatures && feature.name && feature.entries) {
						const subFeatures = [];
						const baseFeatures = feature.entries.filter(f => {
							if (f.name && f.type === "entries") {
								subFeatures.push(f);
								return false;
							} else return true;
						});
						importSubclassFeature(attrs, sc, feature.level,
								{name: feature.name, type: feature.type, entries: baseFeatures});
						subFeatures.forEach(sf => {
							importSubclassFeature(attrs, sc, feature.level, sf);
						})
					} else {
						importSubclassFeature(attrs, sc, feature.level, feature);
					}

					firstFeatures = false;
				}
			}

			function importSubclassFeature (attrs, sc, level, feature) {
				const renderStack = [];
				renderer.recursiveRender({entries: feature.entries}, renderStack);
				feature.text = d20plus.importer.getCleanText(renderStack.join(""));

				const fRowId = d20plus.ut.generateRowId();

				if (d20plus.sheet == "ogl") {
					attrs.add(`repeating_traits_${fRowId}_name`, feature.name);
					attrs.add(`repeating_traits_${fRowId}_source`, "Class");
					attrs.add(`repeating_traits_${fRowId}_source_type`, `${sc.className} (${sc.name} ${level})`);
					attrs.add(`repeating_traits_${fRowId}_description`, feature.text);
					attrs.add(`repeating_traits_${fRowId}_options-flag`, "0");
				} else if (d20plus.sheet == "shaped") {
					attrs.add(`repeating_classfeature_${fRowId}_name`, `${feature.name} (${sc.name} ${level})`);
					attrs.add(`repeating_classfeature_${fRowId}_content`, feature.text);
					attrs.add(`repeating_classfeature_${fRowId}_content_toggle`, "1");
				}

				attrs.notifySheetWorkers();
			}
		}

		function importPsionicAbility (character, data) {
			const renderer = new Renderer();
			renderer.setBaseUrl(BASE_SITE_URL);

			const attrs = new CharacterAttributesProxy(character);
			data = data.Vetoolscontent;
			if (!data) {
				alert("Missing data. Please re-import Psionics.");
				return;
			}

			function getCostStr (cost) {
				return cost.min === cost.max ? cost.min : `${cost.min}-${cost.max}`;
			}

			function getCleanText (entries) {
				if (typeof entries == "string") {
					return d20plus.importer.getCleanText(renderer.render(entries));
				} else {
					const renderStack = [];
					renderer.recursiveRender({entries: entries}, renderStack, {depth: 2});
					return d20plus.importer.getCleanText(renderStack.join(""));
				}
			}

			if (d20plus.sheet == "ogl") {
				const makeSpellTrait = function (level, rowId, propName, content) {
					const attrName = `repeating_spell-${level}_${rowId}_${propName}`;
					attrs.add(attrName, content);
				}

				// disable all components
				const noComponents = function (level, rowId, hasM) {
					makeSpellTrait(level, rowId, "spellcomp_v", 0);
					makeSpellTrait(level, rowId, "spellcomp_s", 0);
					if (!hasM) {
						makeSpellTrait(level, rowId, "spellcomp_m", 0);
					}
					makeSpellTrait(level, rowId, "options-flag", 0);
				}

				if (data.type === "D") {
					const rowId = d20plus.ut.generateRowId();

					// make focus
					const focusLevel = "cantrip";
					makeSpellTrait(focusLevel, rowId, "spelllevel", "cantrip");
					makeSpellTrait(focusLevel, rowId, "spellname", `${data.name} Focus`);
					makeSpellTrait(focusLevel, rowId, "spelldescription", getCleanText(data.focus));
					makeSpellTrait(focusLevel, rowId, "spellcastingtime", "1 bonus action");
					noComponents(focusLevel, rowId);

					data.modes.forEach(m => {
						if (m.submodes) {
							m.submodes.forEach(sm => {
								const rowId = d20plus.ut.generateRowId();
								const smLevel = sm.cost.min;
								makeSpellTrait(smLevel, rowId, "spelllevel", smLevel);
								makeSpellTrait(smLevel, rowId, "spellname", `${m.name} (${sm.name})`);
								makeSpellTrait(smLevel, rowId, "spelldescription", getCleanText(sm.entries));
								makeSpellTrait(smLevel, rowId, "spellcomp_materials", `${getCostStr(sm.cost)} psi points`);
								noComponents(smLevel, rowId, true);
							});
						} else {
							const rowId = d20plus.ut.generateRowId();
							const mLevel = m.cost.min;
							makeSpellTrait(mLevel, rowId, "spelllevel", mLevel);
							makeSpellTrait(mLevel, rowId, "spellname", `${m.name}`);
							makeSpellTrait(mLevel, rowId, "spelldescription", `Psionic Discipline mode\n\n${getCleanText(m.entries)}`);
							makeSpellTrait(mLevel, rowId, "spellcomp_materials", `${getCostStr(m.cost)} psi points`);
							if (m.concentration) {
								makeSpellTrait(mLevel, rowId, "spellduration", `${m.concentration.duration} ${m.concentration.unit}`);
								makeSpellTrait(mLevel, rowId, "spellconcentration", "Yes");
							}
							noComponents(mLevel, rowId, true);
						}
					});
				} else {
					const rowId = d20plus.ut.generateRowId();
					const level = "cantrip";
					makeSpellTrait(level, rowId, "spelllevel", "cantrip");
					makeSpellTrait(level, rowId, "spellname", data.name);
					makeSpellTrait(level, rowId, "spelldescription", `Psionic Talent\n\n${getCleanText(Renderer.psionic.getBodyText(data, renderer))}`);
					noComponents(level, rowId, false);
				}
			} else if (d20plus.sheet == "shaped") {
				const makeSpellTrait = function (level, rowId, propName, content) {
					const attrName = `repeating_spell${level}_${rowId}_${propName}`;
					attrs.add(attrName, content);
				}

				const shapedSpellLevel = function (level) {
					return level ? `${Parser.getOrdinalForm(String(level))}_LEVEL`.toUpperCase() : "CANTRIP";
				}

				const shapedConcentration = function (conc) {
					const CONC_ABV_TO_FULL = {
						rnd: "round",
						min: "minute",
						hr: "hour",
					};
					return `CONCENTRATION_UP_TO_${conc.duration}_${CONC_ABV_TO_FULL[conc.unit]}${conc.duration > 1 ? "S" : ""}`.toUpperCase();
				}

				const inferCastingTime = function (content) {
					if (content.search(/\b(as an action)\b/i) >= 0) {
						return "1_ACTION";
					} else if (content.search(/\b(as a bonus action)\b/i) >= 0) {
						return "1_BONUS_ACTION";
					} else if (content.search(/\b(as a reaction)\b/i) >= 0) {
						return "1_REACTION";
					}
					return "1_ACTION";
				}

				const inferDuration = function (content) {
					let duration, unit, match;
					if ((match = content.match(/\b(?:for the next|for 1) (round|minute|hour)\b/i))) {
						[duration, unit] = [1, match[1]];
					} else if ((match = content.match(/\b(?:for|for the next) (\d+) (minutes|hours|days)\b/i))) {
						[duration, unit] = [match[1], match[2]];
					}

					return (duration && unit) ? `${duration}_${unit}`.toUpperCase() : `INSTANTANEOUS`;
				}

				if (data.type === "D") {
					const typeStr = `**Psionic Discipline:** ${data.name}\n**Psionic Order:** ${data.order}\n`;
					const rowId = d20plus.ut.generateRowId();

					// make focus
					const focusLevel = 0;
					makeSpellTrait(focusLevel, rowId, "spell_level", shapedSpellLevel(focusLevel));
					makeSpellTrait(focusLevel, rowId, "name", `${data.name} Focus`);
					makeSpellTrait(focusLevel, rowId, "content", `${typeStr}\n${getCleanText(data.focus)}`);
					makeSpellTrait(focusLevel, rowId, "content_toggle", "1");
					makeSpellTrait(focusLevel, rowId, "casting_time", "1_BONUS_ACTION");
					makeSpellTrait(focusLevel, rowId, "components", "COMPONENTS_M");
					makeSpellTrait(focusLevel, rowId, "duration", "SPECIAL");

					data.modes.forEach(m => {
						const modeContent = `${typeStr}\n${getCleanText(m.entries)}`;

						if (m.submodes) {
							m.submodes.forEach(sm => {
								const rowId = d20plus.ut.generateRowId();
								const smLevel = sm.cost.min;
								const costStr = getCostStr(sm.cost);
								const content = `${modeContent}\n${getCleanText(sm.entries)}`;
								makeSpellTrait(smLevel, rowId, "spell_level", shapedSpellLevel(smLevel));
								makeSpellTrait(smLevel, rowId, "name", `${m.name} (${sm.name})` + (sm.cost.min < sm.cost.max ? ` (${costStr} psi)` : ""));
								makeSpellTrait(smLevel, rowId, "content", content);
								makeSpellTrait(smLevel, rowId, "content_toggle", "1");
								makeSpellTrait(smLevel, rowId, "casting_time", inferCastingTime(content));
								makeSpellTrait(smLevel, rowId, "materials", `${costStr} psi points`);
								makeSpellTrait(smLevel, rowId, "components", "COMPONENTS_M");
								makeSpellTrait(smLevel, rowId, "duration", inferDuration(content));
							});
						} else {
							const rowId = d20plus.ut.generateRowId();
							const mLevel = m.cost.min;
							const costStr = getCostStr(m.cost);
							makeSpellTrait(mLevel, rowId, "spell_level", shapedSpellLevel(mLevel));
							makeSpellTrait(mLevel, rowId, "name", m.name + (m.cost.min < m.cost.max ? ` (${costStr} psi)` : ""));
							makeSpellTrait(mLevel, rowId, "content", modeContent);
							makeSpellTrait(mLevel, rowId, "content_toggle", "1");
							makeSpellTrait(mLevel, rowId, "casting_time", inferCastingTime(modeContent));
							makeSpellTrait(mLevel, rowId, "materials", `${costStr} psi points`);
							makeSpellTrait(mLevel, rowId, "components", "COMPONENTS_M");
							if (m.concentration) {
								makeSpellTrait(mLevel, rowId, "duration", shapedConcentration(m.concentration));
								makeSpellTrait(mLevel, rowId, "concentration", "Yes");
							} else {
								makeSpellTrait(mLevel, rowId, "duration", inferDuration(modeContent));
							}
						}
					});
				} else {
					const typeStr = `**Psionic Talent**\n`;
					const talentContent = `${typeStr}\n${getCleanText(Renderer.psionic.getBodyText(data, renderer))}`;
					const rowId = d20plus.ut.generateRowId();
					const level = 0;
					makeSpellTrait(level, rowId, "spell_level", shapedSpellLevel(level));
					makeSpellTrait(level, rowId, "name", data.name);
					makeSpellTrait(level, rowId, "content", talentContent);
					makeSpellTrait(level, rowId, "content_toggle", "1");
					makeSpellTrait(level, rowId, "casting_time", inferCastingTime(talentContent));
					makeSpellTrait(level, rowId, "components", "COMPONENTS_M");
					makeSpellTrait(level, rowId, "duration", inferDuration(talentContent));
				}
			} else {
				console.warn(`Psionic ability import is not supported for ${d20plus.sheet} character sheet`);
			}

			attrs.notifySheetWorkers();
		}

		function importItem (character, data, event) {
			if (d20plus.sheet == "ogl") {
				if (data.data._versatile) {
					setTimeout(() => {
						const rowId = d20plus.ut.generateRowId();

						function makeItemTrait (key, val) {
							const toSave = character.model.attribs.create({
								name: `repeating_attack_${rowId}_${key}`,
								current: val
							}).save();
							toSave.save();
						}

						const attr = (data.data["Item Type"] || "").includes("Melee") ? "strength" : "dexterity";
						const attrTag = `@{${attr}_mod}`;

						const proficiencyBonus = character.model.attribs.toJSON().find(it => it.name.includes("pb"));
						const attrToFind = character.model.attribs.toJSON().find(it => it.name === attr);
						const attrBonus = attrToFind ? Parser.getAbilityModNumber(Number(attrToFind.current)) : 0;

						// This links the item to the attack, and vice-versa.
						// Unfortunately, it doesn't work,
						//   because Roll20 thinks items<->attacks is a 1-to-1 relationship.
						/*
						let lastItemId = null;
						try {
							const items = character.model.attribs.toJSON().filter(it => it.name.includes("repeating_inventory"));
							const lastItem = items[items.length - 1];
							lastItemId = lastItem.name.replace(/repeating_inventory_/, "").split("_")[0];

							// link the inventory item to this attack
							const toSave = character.model.attribs.create({
								name: `repeating_inventory_${lastItemId}_itemattackid`,
								current: rowId
							});
							toSave.save();
						} catch (ex) {
							console.error("Failed to get last item ID");
							console.error(ex);
						}

						if (lastItemId) {
							makeItemTrait("itemid", lastItemId);
						}
						*/

						makeItemTrait("options-flag", "0");
						makeItemTrait("atkname", data.name);
						makeItemTrait("dmgbase", data.data._versatile);
						makeItemTrait("dmgtype", data.data["Damage Type"]);
						makeItemTrait("atkattr_base", attrTag);
						makeItemTrait("dmgattr", attrTag);
						makeItemTrait("rollbase_dmg", `@{wtype}&{template:dmg} {{rname=@{atkname}}} @{atkflag} {{range=@{atkrange}}} @{dmgflag} {{dmg1=[[${data.data._versatile}+${attrBonus}]]}} {{dmg1type=${data.data["Damage Type"]} }} @{dmg2flag} {{dmg2=[[0]]}} {{dmg2type=}} @{saveflag} {{desc=@{atk_desc}}} @{hldmg} {{spelllevel=@{spelllevel}}} {{innate=@{spell_innate}}} {{globaldamage=[[0]]}} {{globaldamagetype=@{global_damage_mod_type}}} @{charname_output}`);
						makeItemTrait("rollbase_crit", `@{wtype}&{template:dmg} {{crit=1}} {{rname=@{atkname}}} @{atkflag} {{range=@{atkrange}}} @{dmgflag} {{dmg1=[[${data.data._versatile}+${attrBonus}]]}} {{dmg1type=${data.data["Damage Type"]} }} @{dmg2flag} {{dmg2=[[0]]}} {{dmg2type=}} {{crit1=[[${data.data._versatile}]]}} {{crit2=[[0]]}} @{saveflag} {{desc=@{atk_desc}}} @{hldmg}  {{spelllevel=@{spelllevel}}} {{innate=@{spell_innate}}} {{globaldamage=[[0]]}} {{globaldamagecrit=[[0]]}} {{globaldamagetype=@{global_damage_mod_type}}} @{charname_output}`);
						if (proficiencyBonus) {
							makeItemTrait("atkbonus", `+${Number(proficiencyBonus.current) + attrBonus}`);
						}
						makeItemTrait("atkdmgtype", `${data.data._versatile}${attrBonus > 0 ? `+${attrBonus}` : attrBonus < 0 ? attrBonus : ""} ${data.data["Damage Type"]}`);
						makeItemTrait("rollbase", "@{wtype}&{template:atk} {{mod=@{atkbonus}}} {{rname=[@{atkname}](~repeating_attack_attack_dmg)}} {{rnamec=[@{atkname}](~repeating_attack_attack_crit)}} {{r1=[[@{d20}cs>@{atkcritrange} + 2[PROF]]]}} @{rtype}cs>@{atkcritrange} + 2[PROF]]]}} {{range=@{atkrange}}} {{desc=@{atk_desc}}} {{spelllevel=@{spelllevel}}} {{innate=@{spell_innate}}} {{globalattack=@{global_attack_mod}}} ammo=@{ammo} @{charname_output}");
					}, 350); // defer this, so we can hopefully pull item ID
				}

				// for packs, etc
				if (data._subItems) {
					const queue = [];
					data._subItems.forEach(si => {
						function makeProp (rowId, propName, content) {
							character.model.attribs.create({
								"name": `repeating_inventory_${rowId}_${propName}`,
								"current": content
							}).save();
						}

						if (si.count) {
							const rowId = d20plus.ut.generateRowId();
							const siD = typeof si.subItem === "string" ? JSON.parse(si.subItem) : si.subItem;

							makeProp(rowId, "itemname", siD.name);
							const w = (siD.data || {}).Weight;
							if (w) makeProp(rowId, "itemweight", w);
							makeProp(rowId, "itemcontent", Object.entries(siD.data).map(([k, v]) => `${k}: ${v}`).join(", "));
							makeProp(rowId, "itemcount", String(si.count));

						} else {
							queue.push(si.subItem);
						}
					});

					const interval = d20plus.cfg.get("import", "importIntervalHandout") || d20plus.cfg.getDefault("import", "importIntervalHandout");
					queue.map(it => typeof it === "string" ? JSON.parse(it) : it).forEach((item, ix) => {
						setTimeout(() => {
							d20plus.importer.doFakeDrop(event, character, item, null);
						}, (ix + 1) * interval);
					});

					return;
				}
			}

			// Fallback to native drag-n-drop
			d20plus.importer.doFakeDrop(event, character, data, null);
		}

		function importData (character, data, event) {
			// TODO remove feature import workarounds below when roll20 and sheets supports their drag-n-drop properly
			if (data.data.Category === "Feats") {
				importFeat(character, data);
			} else if (data.data.Category === "Backgrounds") {
				importBackground(character, data);
			} else if (data.data.Category === "Races") {
				importRace(character, data);
			} else if (data.data.Category === "Optional Features") {
				importOptionalFeature(character, data);
			} else if (data.data.Category === "Classes") {
				importClass(character, data);
			} else if (data.data.Category === "Subclasses") {
				importSubclass(character, data);
			} else if (data.data.Category === "Psionics") {
				importPsionicAbility(character, data);
			} else if (data.data.Category === "Items") {
				importItem(character, data, event);
			} else {
				d20plus.importer.doFakeDrop(event, character, data, null);
			}
		}

		d20.Campaign.characters.models.each(function (v, i) {
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
										bookName: COMPENDIUM_BOOK_NAME,
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
		});
	};

	d20plus.getProfBonusFromLevel = function (level) {
		if (level < 5) return "2";
		if (level < 9) return "3";
		if (level < 13) return "4";
		if (level < 17) return "5";
		return "6";
	};

	// Import dialog showing names of monsters failed to import
	d20plus.addImportError = function (name) {
		var $span = $("#import-errors");
		if ($span.text() == "0") {
			$span.text(name);
		} else {
			$span.text($span.text() + ", " + name);
		}
	};

	// Get NPC size from chr
	d20plus.getSizeString = function (chr) {
		const result = Parser.sizeAbvToFull(chr);
		return result ? result : "(Unknown Size)";
	};

	// Create editable HP variable and autocalculate + or -
	d20plus.hpAllowEdit = function () {
		$("#initiativewindow").on(window.mousedowntype, ".hp.editable", function () {
			if ($(this).find("input").length > 0) return void $(this).find("input").focus();
			var val = $.trim($(this).text());
			const $span = $(this);
			$span.html(`<input type='text' value='${val}'/>`);
			const $ipt = $(this).find("input");
			$ipt[0].focus();
		});
		$("#initiativewindow").on("keydown", ".hp.editable", function (event) {
			if (event.which == 13) {
				const $span = $(this);
				const $ipt = $span.find("input");
				if (!$ipt.length) return;

				var el, token, id, char, hp,
					val = $.trim($ipt.val());

				// roll20 token modification supports plus/minus for a single integer; mimic this
				const m = /^((\d+)?([+-]))?(\d+)$/.exec(val);
				if (m) {
					let op = null;
					if (m[3]) {
						op = m[3] === "+" ? "ADD" : "SUB";
					}
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
					if (!char.attribs || npc && npc.get("current") == "1") {
						const hpBar = d20plus.getCfgHpBarNumber();
						if (hpBar) {
							total;
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
							total;
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
							total;
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
				content: `<span style="color: red;">5etoolsR20: no character sheet selected! Exiting...</span>`
			}));
			throw new Error("No character sheet selected!");
		}
		if (d20.journal.customSheets.layouthtml.indexOf("shaped_d20") > 0) d20plus.sheet = "shaped";
		if (d20.journal.customSheets.layouthtml.indexOf("DnD5e_Character_Sheet") > 0) d20plus.sheet = "community";
		d20plus.ut.log("Switched Character Sheet Template to " + d20plus.sheet);
	};

	// Return Initiative Tracker template with formulas
	d20plus.initErrorHandler = null;
	d20plus.setTurnOrderTemplate = function () {
		if (!d20plus.turnOrderCachedFunction) {
			d20plus.turnOrderCachedFunction = d20.Campaign.initiativewindow.rebuildInitiativeList;
			d20plus.turnOrderCachedTemplate = $("#tmpl_initiativecharacter").clone();
		}

		d20.Campaign.initiativewindow.rebuildInitiativeList = function () {
			var html = d20plus.initiativeTemplate;
			var columnsAdded = [];
			$(".tracker-header-extra-columns").empty();

			const cols = [
				d20plus.cfg.get("interface", "trackerCol1"),
				d20plus.cfg.get("interface", "trackerCol2"),
				d20plus.cfg.get("interface", "trackerCol3")
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
				</span>`
			];
			cols.forEach((c, i) => {
				switch (c) {
					case "HP": {
						const hpBar = d20plus.getCfgHpBarNumber();
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
			const startTime = (new Date).getTime();

			var results = d20plus.turnOrderCachedFunction.apply(this, []);
			setTimeout(function () {
				$(".initmacrobutton").unbind("click");
				$(".initmacrobutton").bind("click", function () {
					console.log("Macro button clicked");
					tokenid = $(this).parent().parent().data("tokenid");
					var token, char;
					var page = d20.Campaign.activePage();
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
				if (((new Date).getTime() - startTime) < 250) {
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

	d20plus.psionics._groupOptions = ["Alphabetical", "Order", "Source"];
	d20plus.psionics._listCols = ["name", "order", "source"];
	d20plus.psionics._listItemBuilder = (it) => `
		<span class="name col-6">${it.name}</span>
		<span class="order col-4">ORD[${it.order || "None"}]</span>
		<span title="${Parser.sourceJsonToFull(it.source)}" class="source col-2">SRC[${Parser.sourceJsonToAbv(it.source)}]</span>`;
	d20plus.psionics._listIndexConverter = (p) => {
		return {
			name: p.name.toLowerCase(),
			order: (p.order || "none").toLowerCase(),
			source: Parser.sourceJsonToAbv(p.source).toLowerCase()
		};
	};
// Import Psionics button was clicked
	d20plus.psionics.button = function (forcePlayer) {
		const playerMode = forcePlayer || !window.is_gm;
		const url = playerMode ? $("#import-psionics-url-player").val() : $("#import-psionics-url").val();
		if (url && url.trim()) {
			const handoutBuilder = playerMode ? d20plus.psionics.playerImportBuilder : d20plus.psionics.handoutBuilder;

			DataUtil.loadJSON(url).then((data) => {
				d20plus.importer.addBrewMeta(data._meta);
				d20plus.importer.showImportList(
					"psionic",
					data.psionic,
					handoutBuilder,
					{
						groupOptions: d20plus.psionics._groupOptions,
						forcePlayer,
						listItemBuilder: d20plus.psionics._listItemBuilder,
						listIndex: d20plus.psionics._listCols,
						listIndexConverter: d20plus.psionics._listIndexConverter
					}
				);
			});
		}
	};

	d20plus.psionics.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo, options) {
		// make dir
		const folder = d20plus.journal.makeDirTree(`Psionics`, folderName);
		const path = ["Psionics", ...folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
		d20.Campaign.handouts.create({
			name: name,
			tags: d20plus.importer.getTagString([
				Parser.psiTypeToFull(data.type),
				data.order || "orderless",
				Parser.sourceJsonToFull(data.source)
				], "psionic")
		}, {
			success: function (handout) {
				if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_PSIONICS](data)] = {name: data.name, source: data.source, type: "handout", roll20Id: handout.id};

				const [noteContents, gmNotes] = d20plus.psionics._getHandoutData(data);

				handout.updateBlobs({notes: noteContents, gmnotes: gmNotes});
				handout.save({notes: (new Date).getTime(), inplayerjournals: inJournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			}
		});
	};

	d20plus.psionics.playerImportBuilder = function (data) {
		const [notecontents, gmnotes] = d20plus.psionics._getHandoutData(data);

		const importId = d20plus.ut.generateRowId();
		d20plus.importer.storePlayerImport(importId, JSON.parse(gmnotes));
		d20plus.importer.makePlayerDraggable(importId, data.name);
	};

	d20plus.psionics._getHandoutData = function (data) {
		function renderTalent () {
			const renderStack = [];
			renderer.recursiveRender(({entries: data.entries, type: "entries"}), renderStack);
			return renderStack.join(" ");
		}

		const renderer = new Renderer();
		renderer.setBaseUrl(BASE_SITE_URL);
		const r20json = {
			"name": data.name,
			"Vetoolscontent": data,
			"data": {
				"Category": "Psionics"
			}
		};
		const gmNotes = JSON.stringify(r20json);

		const baseNoteContents = `
			<h3>${data.name}</h3>
			<p><em>${data.type === "D" ? `${data.order} ${Parser.psiTypeToFull(data.type)}` : `${Parser.psiTypeToFull(data.type)}`}</em></p>
			${Renderer.psionic.getBodyText(data, renderer)}
			`;

		const noteContents = `${baseNoteContents}<br><del class="hidden">${gmNotes}</del>`;

		return [noteContents, gmNotes];
	};

// Import Races button was clicked
	d20plus.races.button = function (forcePlayer) {
		const playerMode = forcePlayer || !window.is_gm;
		const url = playerMode ? $("#import-races-url-player").val() : $("#import-races-url").val();
		if (url && url.trim()) {
			const handoutBuilder = playerMode ? d20plus.races.playerImportBuilder : d20plus.races.handoutBuilder;

			DataUtil.loadJSON(url).then(async (data) => {
				const toImport = MiscUtil.copy(data.race);
				if (data.subrace){
					const allraces = await DataUtil.loadJSON(RACE_DATA_URL);
					toImport.push(...Renderer.race.adoptSubraces(allraces.race, data.subrace, false))
				}
				d20plus.importer.addBrewMeta(data._meta);
				d20plus.importer.showImportList(
					"race",
					Renderer.race.mergeSubraces(toImport),
					handoutBuilder,
					{
						forcePlayer
					}
				);
			});
		}
	};

	d20plus.races.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo, options) {
		// make dir
		const folder = d20plus.journal.makeDirTree(`Races`, folderName);
		const path = ["Races", ...folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
		d20.Campaign.handouts.create({
			name: name,
			tags: d20plus.importer.getTagString([
				(data.size || [SZ_VARIES]).map(sz => Parser.sizeAbvToFull(sz)).join("/"),
				Parser.sourceJsonToFull(data.source)
			], "race")
		}, {
			success: function (handout) {
				if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_RACES](data)] = {name: data.name, source: data.source, type: "handout", roll20Id: handout.id};

				const [noteContents, gmNotes] = d20plus.races._getHandoutData(data);

				handout.updateBlobs({notes: noteContents, gmnotes: gmNotes});
				handout.save({notes: (new Date).getTime(), inplayerjournals: inJournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			}
		});
	};

	d20plus.races.playerImportBuilder = function (data) {
		const [notecontents, gmnotes] = d20plus.races._getHandoutData(data);

		const importId = d20plus.ut.generateRowId();
		d20plus.importer.storePlayerImport(importId, JSON.parse(gmnotes));
		d20plus.importer.makePlayerDraggable(importId, data.name);
	};

	d20plus.races._getHandoutData = function (data) {
		const renderer = new Renderer();
		renderer.setBaseUrl(BASE_SITE_URL);

		const renderStack = [];
		const ability = Renderer.getAbilityData(data.ability);
		renderStack.push(`
		<h3>${data.name}</h3>
		<p>
			<strong>Ability Scores:</strong> ${ability.asText}<br>
			<strong>Size:</strong> ${(data.size || [SZ_VARIES]).map(sz => Parser.sizeAbvToFull(sz)).join("/")}<br>
			<strong>Speed:</strong> ${Parser.getSpeedString(data)}<br>
		</p>
	`);
		renderer.recursiveRender({entries: data.entries}, renderStack, {depth: 1});
		const rendered = renderStack.join("");

		const r20json = {
			"name": data.name,
			"Vetoolscontent": data,
			"data": {
				"Category": "Races"
			}
		};
		const gmNotes = JSON.stringify(r20json);
		const noteContents = `${rendered}\n\n<del class="hidden">${gmNotes}</del>`;

		return [noteContents, gmNotes];
	};


	d20plus.optionalfeatures.button = function (forcePlayer) {
		const playerMode = forcePlayer || !window.is_gm;
		const url = playerMode ? $("#import-optionalfeatures-url-player").val() : $("#import-optionalfeatures-url").val();
		if (url && url.trim()) {
			const handoutBuilder = playerMode ? d20plus.optionalfeatures.playerImportBuilder : d20plus.optionalfeatures.handoutBuilder;

			DataUtil.loadJSON(url).then((data) => {
				d20plus.importer.addBrewMeta(data._meta);
				d20plus.importer.showImportList(
					"optionalfeature",
					data.optionalfeature,
					handoutBuilder,
					{
						forcePlayer
					}
				);
			});
		}
	};

	d20plus.optionalfeatures.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo, options) {
		// make dir
		const folder = d20plus.journal.makeDirTree(`Optional Features`, folderName);
		const path = ["Optional Features", ...folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
		d20.Campaign.handouts.create({
			name: name,
			tags: d20plus.importer.getTagString([
				Parser.sourceJsonToFull(data.source)
			], "optionalfeature")
		}, {
			success: function (handout) {
				if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_OPT_FEATURES](data)] = {name: data.name, source: data.source, type: "handout", roll20Id: handout.id};

				const [noteContents, gmNotes] = d20plus.optionalfeatures._getHandoutData(data);

				handout.updateBlobs({notes: noteContents, gmnotes: gmNotes});
				handout.save({notes: (new Date).getTime(), inplayerjournals: inJournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			}
		});
	};

	d20plus.optionalfeatures.playerImportBuilder = function (data) {
		const [notecontents, gmnotes] = d20plus.optionalfeatures._getHandoutData(data);

		const importId = d20plus.ut.generateRowId();
		d20plus.importer.storePlayerImport(importId, JSON.parse(gmnotes));
		d20plus.importer.makePlayerDraggable(importId, data.name);
	};

	d20plus.optionalfeatures._getHandoutData = function (data) {
		const renderer = new Renderer();
		renderer.setBaseUrl(BASE_SITE_URL);

		const renderStack = [];

		renderer.recursiveRender({entries: data.entries}, renderStack, {depth: 1});

		const rendered = renderStack.join("");
		const prereqs = Renderer.utils.getPrerequisiteText(data.prerequisites);

		const r20json = {
			"name": data.name,
			"Vetoolscontent": data,
			"data": {
				"Category": "Optional Features"
			}
		};
		const gmNotes = JSON.stringify(r20json);
		const noteContents = `${prereqs ? `<p><i>Prerequisite: ${prereqs}.</i></p>` : ""}${rendered}\n\n<del class="hidden">${gmNotes}</del>`;

		return [noteContents, gmNotes];
	};

	// Import Adventures button was clicked
	d20plus.adventures.button = function () {
		const url = $("#import-adventures-url").val();
		if (url !== null) d20plus.adventures.load(url);
	};

	// Fetch adventure data from file
	d20plus.adventures.load = function (url) {
		$("a.ui-tabs-anchor[href='#journal']").trigger("click");
		DataUtil.loadJSON(url)
			.then(data => {

				function isPart (e) {
					return typeof e === "string" || typeof e === "object" && (e.type !== "entries");
				}

				// open progress window
				$("#d20plus-import").dialog("open");
				$("#import-remaining").text("Initialising...");

				// FIXME(homebrew) this always selects the first item in a list of homebrew adventures
				// FIXME(5etools) this selects the source based on the select dropdown, which can be wrong
				// get metadata
				const adMeta = data.adventure
					? data.adventure[0] :
					adventureMetadata.adventure.find(a => a.id.toLowerCase() === $("#import-adventures-url").data("id").toLowerCase());

				const addQueue = [];
				const sections = JSON.parse(JSON.stringify(data.adventureData ? data.adventureData[0].data : data.data));
				const adDir = `${Parser.sourceJsonToFull(adMeta.id)}`;
				sections.forEach((s, i) => {
					if (i >= adMeta.contents.length) return;

					const chapterDir = [adDir, adMeta.contents[i].name];

					const introEntries = [];
					if (s.entries && s.entries.length && isPart(s.entries[0])) {
						while (isPart(s.entries[0])) {
							introEntries.push(s.entries[0]);
							s.entries.shift();
						}
					}
					addQueue.push({
						dir: chapterDir,
						type: "entries",
						name: s.name,
						entries: introEntries,
					});

					// compact entries into layers
					front = null;
					let tempStack = [];
					let textIndex = 1;
					while ((front = s.entries.shift())) {
						if (isPart(front)) {
							tempStack.push(front);
						} else {
							if (tempStack.length) {
								addQueue.push({
									dir: chapterDir,
									type: "entries",
									name: `Text ${textIndex++}`,
									entries: tempStack
								});
								tempStack = [];
							}
							front.dir = chapterDir;
							addQueue.push(front);
						}
					}
				});

				const renderer = new Renderer();
				renderer.setBaseUrl(BASE_SITE_URL);

				const $stsName = $("#import-name");
				const $stsRemain = $("#import-remaining");
				const interval = d20plus.cfg.get("import", "importIntervalHandout") || d20plus.cfg.getDefault("import", "importIntervalHandout");

				////////////////////////////////////////////////////////////////////////////////////////////////////////
				Renderer.get().setBaseUrl(BASE_SITE_URL);
				// pre-import tags
				const tags = {};
				renderer.doExportTags(tags);
				addQueue.forEach(entry => {
					renderer.recursiveRender(entry, []);
				});

				// storage for returned handout/character IDs
				const RETURNED_IDS = {};

				// monsters
				const preMonsters = Object.keys(tags)
					.filter(k => tags[k].page === "bestiary.html")
					.map(k => tags[k]);
				if (confirm("Import creatures from this adventure?")) doPreImport(preMonsters, showMonsterImport);
				else doItemImport();

				function showMonsterImport (toImport) {
					d20plus.ut.log(`Displaying monster import list for [${adMeta.name}]`);
					d20plus.importer.showImportList(
						"monster",
						toImport.filter(it => it),
						d20plus.monsters.handoutBuilder,
						{
							groupOptions: d20plus.monsters._groupOptions,
							saveIdsTo: RETURNED_IDS,
							callback: doItemImport,
							listItemBuilder: d20plus.monsters._listItemBuilder,
							listIndex: d20plus.monsters._listCols,
							listIndexConverter: d20plus.monsters._listIndexConverter
						}
					);
				}

				// items
				function doItemImport () {
					const preItems = Object.keys(tags)
						.filter(k => tags[k].page === "items.html")
						.map(k => tags[k]);
					if (confirm("Import items from this adventure?")) doPreImport(preItems, showItemImport);
					else doMainImport();
				}

				function showItemImport (toImport) {
					d20plus.ut.log(`Displaying item import list for [${adMeta.name}]`);
					d20plus.importer.showImportList(
						"item",
						toImport.filter(it => it),
						d20plus.items.handoutBuilder,
						{
							groupOptions: d20plus.items._groupOptions,
							saveIdsTo: RETURNED_IDS,
							callback: doMainImport,
							listItemBuilder: d20plus.items._listItemBuilder,
							listIndex: d20plus.items._listCols,
							listIndexConverter: d20plus.items._listIndexConverter
						}
					);
				}

				function doPreImport (asTags, callback) {
					const tmp = [];
					let cachedCount = asTags.length;
					// FIXME crappy inefficient conversion to promise-based version; requires cleanup
					asTags.forEach(async it => {
						try {
							await Renderer.hover.pCacheAndGet(it.page, it.source, it.hash);
							tmp.push(Renderer.hover.getFromCache(it.page, it.source, it.hash));
							cachedCount--;
							if (cachedCount <= 0) callback(tmp);
						} catch (x) {
							console.log(x);
							cachedCount--;
							if (cachedCount <= 0) callback(tmp);
						}
					});
				}
				////////////////////////////////////////////////////////////////////////////////////////////////////////
				function doMainImport () {
					// pass in any created handouts/characters to use for links in the renderer
					renderer.setRoll20Ids(RETURNED_IDS);

					let cancelWorker = false;
					const $btnCancel = $(`#importcancel`);
					$btnCancel.off("click");
					$btnCancel.on("click", () => {
						cancelWorker = true;
					});

					let remaining = addQueue.length;

					d20plus.ut.log(`Running import of [${adMeta.name}] with ${interval} ms delay between each handout create`);
					let lastId = null;
					let lastName = null;

					const worker = setInterval(() => {
						if (!addQueue.length || cancelWorker) {
							clearInterval(worker);
							$stsName.text("DONE!");
							$stsRemain.text("0");
							d20plus.ut.log(`Finished import of [${adMeta.name}]`);
							renderer.resetRoll20Ids();
							return;
						}

						// pull items out the queue in LIFO order, for journal ordering (last created will be at the top)
						const entry = addQueue.pop();
						entry.name = entry.name || "(Unknown)";
						entry.name = d20plus.importer.getCleanText(renderer.render(entry.name));
						$stsName.text(entry.name);
						$stsRemain.text(remaining--);
						const folder = d20plus.journal.makeDirTree(entry.dir);

						d20.Campaign.handouts.create({
							name: entry.name
						}, {
							success: function (handout) {
								const renderStack = [];
								renderer.recursiveRender(entry, renderStack);
								if (lastId && lastName) renderStack.push(`<br><p>Next handout: <a href="http://journal.roll20.net/handout/${lastId}">${lastName}</a></p>`);
								const rendered = renderStack.join("");

								lastId = handout.id;
								lastName = entry.name;
								handout.updateBlobs({notes: rendered});
								handout.save({notes: (new Date).getTime(), inplayerjournals: ""});
								d20.journal.addItemToFolderStructure(handout.id, folder.id);
							}
						});
					}, interval);
				}
			});
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
<p>
WARNING: Importing huge numbers of character sheets slows the game down. We recommend you import them as needed.<br>
The "Import Monsters From All Sources" button presents a list containing monsters from official sources only.<br>
To import from third-party sources, either individually select one available in the list or enter a custom URL, and "Import Monsters."
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
			r: "flex-shrink: 0;"
		},
		{
			s: "#initiativewindow ul li span.initiative,#initiativewindow ul li span.tracker-col,#initiativewindow ul li span.initmacro",
			r: "font-size: 25px;font-weight: bold;text-align: right;float: right;padding: 2px 5px;width: 10%;min-height: 20px;display: block;"
		},
		{
			s: "#initiativewindow ul li span.editable input",
			r: "width: 100%; box-sizing: border-box;height: 100%;"
		},
		{
			s: "#initiativewindow div.header",
			r: "height: 30px;"
		},
		{
			s: "#initiativewindow div.header span",
			r: "cursor: default;font-size: 15px;font-weight: bold;text-align: right;float: right;width: 10%;min-height: 20px;padding: 5px;"
		},
		{
			s: ".ui-dialog-buttonpane span.difficulty",
			r: "display: inline-block;padding: 5px 4px 6px;margin: .5em .4em .5em 0;font-size: 18px;"
		},
		{
			s: ".ui-dialog-buttonpane.buttonpane-absolute-position",
			r: "position: absolute;bottom: 0;box-sizing: border-box;width: 100%;"
		},
		{
			s: ".ui-dialog.dialog-collapsed .ui-dialog-buttonpane",
			r: "position: initial;"
		},
		{
			s: ".token .cr,.header .cr",
			r: "display: none!important;"
		},
		{
			s: "li.handout.compendium-item .namecontainer",
			r: "box-shadow: inset 0px 0px 25px 2px rgb(195, 239, 184);"
		},
		{
			s: ".bind-drop-locations:active",
			r: "box-shadow: inset 0px 0px 25px 2px rgb(195, 239, 184);"
		},
		{
			s: "del.userscript-hidden",
			r: "display: none;"
		},
		{
			s: ".importer-section",
			r: "display: none;"
		},
		{
			s: ".userscript-rd__h",
			r: "font-weight: bold;"
		},
		{
			s: ".userscript-rd__h--0",
			r: "font-weight: bold; font-size: 1.5em;"
		},
		{
			s: ".userscript-rd__h--2",
			r: "font-weight: bold; font-size: 1.3em;"
		},
		{
			s: ".userscript-rd__h--3, .userscript-rd__h--4",
			r: "font-style: italic"
		},
		{
			s: ".userscript-rd__b-inset--readaloud",
			r: "background: #cbd6c688 !important"
		},
		// "No character sheet" message
		{
			s: ".ve-nosheet__body",
			r: "overflow: hidden !important;"
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
				font-family: monospace;`
		},
		{
			s: ".ve-nosheet__title",
			r: "font-size: 72px;"
		},
		{
			s: ".ve-nosheet__btn-close",
			r: `position: absolute;
				top: 8px;
				right: 8px;
				font-size: 16px;`
		},
	]);

	d20plus.tool.tools = d20plus.tool.tools.concat([
		{
			name: "Shapeshifter Token Builder",
			desc: "Build a rollable table and related token to represent a shapeshifting creature.",
			html: `
				<div id="d20plus-shapeshiftbuild" title="Better20 - Shapeshifter Token Builder">
					<div id="shapeshiftbuild-list">
						<input type="search" class="search" placeholder="Search creatures...">
						<input type="search" class="filter" placeholder="Filter...">
						<span title="Filter format example: 'cr:1/4; cr:1/2; type:beast; source:MM'" style="cursor: help;">[?]</span>
						<div class="list" style="transform: translateZ(0); max-height: 490px; overflow-y: auto; overflow-x: hidden;"><i>Loading...</i></div>
					</div>
				<br>
				<input id="shapeshift-name" placeholder="Table name">
				<button class="btn">Create Table</button>
				</div>
				`,
			dialogFn: () => {
				$("#d20plus-shapeshiftbuild").dialog({
					autoOpen: false,
					resizable: true,
					width: 800,
					height: 650,
				});
			},
			openFn: async () => {
				const $win = $("#d20plus-shapeshiftbuild");
				$win.dialog("open");

				const toLoad = Object.keys(monsterDataUrls).map(src => d20plus.monsters.formMonsterUrl(monsterDataUrls[src]));

				const $fltr = $win.find(`.filter`);
				$fltr.off("keydown").off("keyup");
				$win.find(`button`).off("click");

				const $lst = $win.find(`.list`);
				let tokenList;

				const dataStack = (await Promise.all(toLoad.map(async url => await DataUtil.loadJSON(url)))).flat();

				$lst.empty();
				let toShow = [];

				const seen = {};
				await Promise.all(dataStack.map(async d => {
					const toAdd = d.monster.filter(m => {
						const out = !(seen[m.source] && seen[m.source].has(m.name));
						if (!seen[m.source]) seen[m.source] = new Set();
						seen[m.source].add(m.name);
						return out;
					});

					toShow = toShow.concat(toAdd);
				}));

				toShow = toShow.sort((a, b) => SortUtil.ascSort(a.name, b.name));

				let tmp = "";
				toShow.forEach((m, i)  => {
					m.__pType = Parser.monTypeToFullObj(m.type).asText;

					tmp += `
								<label class="import-cb-label" data-listid="${i}">
									<input type="checkbox">
									<span class="name col-4">${m.name}</span>
									<span class="type col-4">TYP[${m.__pType.uppercaseFirst()}]</span>
									<span class="cr col-2">${m.cr === undefined ? "CR[Unknown]" : `CR[${(m.cr.cr || m.cr)}]`}</span>
									<span title="${Parser.sourceJsonToFull(m.source)}" class="source">SRC[${Parser.sourceJsonToAbv(m.source)}]</span>
								</label>
							`;
				});
				$lst.html(tmp);
				tmp = null;

				tokenList = new List("shapeshiftbuild-list", {
					valueNames: ["name", "type", "cr", "source"]
				});

				d20plus.importer.addListFilter($fltr, toShow, tokenList, d20plus.monsters._listIndexConverter);

				$win.find(`button`).on("click", () => {
					function getSizeInTiles (size) {
						switch (size) {
							case SZ_TINY:
								return 0.5;
							case SZ_SMALL:
							case SZ_MEDIUM:
								return 1;
							case SZ_LARGE:
								return 2;
							case SZ_HUGE:
								return 3;
							case SZ_GARGANTUAN:
								return 4;
							case SZ_COLOSSAL:
								return 5;
						}
					}

					console.log("Assembling creature list");
					if (tokenList) {
						$("a.ui-tabs-anchor[href='#deckstables']").trigger("click");

						const sel = tokenList.items
							.filter(it => $(it.elm).find(`input`).prop("checked"))
							.map(it => toShow[$(it.elm).attr("data-listid")]);

						const id = d20.Campaign.rollabletables.create().id;
						const table = d20.Campaign.rollabletables.get(id);
						table.set("name", $(`#shapeshift-name`).val().trim() || "Shapeshifter");
						table.save();
						sel.forEach(m => {
							const item = table.tableitems.create();
							item.set("name", m.name);
							// encode size info into the URL, which will get baked into the token
							const avatar = m.tokenUrl || `${IMG_URL}${Parser.sourceJsonToAbv(m.source)}/${m.name.replace(/"/g, "")}.png?roll20_token_size=${getSizeInTiles(m.size)}`;
							item.set("avatar", avatar);
							item.set("token_size", getSizeInTiles(m.size));
							item.save();
						});
						table.save();
						d20.rollabletables.refreshTablesList();
						alert("Created table!")
					}
				});
			}
		},
		{
			name: "Pauper's Character Vault",
			desc: "Dump characters to JSON, or import dumped characters.",
			html: `
				<div id="d20plus-paupervault" title="Better20 - Pauper's Character Vault">
				<p>
					This experimental tool allows you to download characters as JSON, to later upload to other games.
				</p>
				<select name="sel_char" style="margin-bottom: 0;"></select> <button class="btn download">Download</button>
				<hr>
				<button class="btn upload">Upload</button><input accept=".json" type="file" style="position: absolute; left: -9999px;"> (Previously Downloaded files only)
				<br>
				<select name="sel_player" class="mt-2"></select>
				</div>
				`,
			dialogFn: () => {
				$("#d20plus-paupervault").dialog({
					autoOpen: false,
					resizable: true,
					width: 400,
					height: 300,
				});
			},
			openFn: () => {
				const $win = $("#d20plus-paupervault");
				$win.dialog("open");

				const $selChar = $win.find(`select[name="sel_char"]`).empty();

				$selChar.append(d20.Campaign.characters.toJSON().sort((a, b) => SortUtil.ascSort(a.name, b.name)).map(c => {
					return `<option value="${c.id}">${c.name || `(Unnamed; ID ${c.id})`}</option>`
				}).join(""));

				const $btnDl = $win.find(`.download`);
				$btnDl.off("click");
				$btnDl.on("click", () => {
					const id = $selChar.val();
					const rawChar = d20.Campaign.characters.get(id);
					const char = rawChar.toJSON();
					char.attribs = rawChar.attribs.toJSON();
					const out = {
						char,
						blobs: {}
					};
					blobCount = 3;
					const onBlobsReady = () => d20plus.ut.saveAsJson(char.name.replace(/[^0-9A-Za-z -_()[\]{}]/, "_"), out);

					const handleBlob = (asKey, data) => {
						out.blobs[asKey] = data;
						blobCount--;
						if (blobCount === 0) onBlobsReady();
					};

					rawChar._getLatestBlob("bio", (data) => handleBlob("bio", data));
					rawChar._getLatestBlob("gmnotes", (data) => handleBlob("gmnotes", data));
					rawChar._getLatestBlob("defaulttoken", (data) => handleBlob("defaulttoken", data));
				});

				const $selPlayer = $win.find(`select[name="sel_player"]`).empty().append(`<option value="">Assign to...</option>`);
				$selPlayer[0].selectedIndex = 0;
				d20.Campaign.players.toJSON()
					.sort((a, b) => SortUtil.ascSortLower(a.displayname, b.displayname))
					.forEach(pl => $(`<option/>`).text(pl.displayname).val(pl.id).appendTo($selPlayer));

				const $btnUl = $win.find(`.upload`);
				$btnUl.off("click");
				$btnUl.on("click", () => {
					const $iptFile = $win.find(`input[type="file"]`);

					const input = $iptFile[0];

					const reader = new FileReader();
					reader.onload = () => {
						$("a.ui-tabs-anchor[href='#journal']").trigger("click");

						try {
							const text = reader.result;
							const json = JSON.parse(text);

							if (!json.char) {
								window.alert("Failed to import character! See the log for details.");
								console.error(`No "char" attribute found in parsed JSON!`);
								return;
							}
							const char = json.char;

							const assignTo = d20plus.ut.get$SelValue($selPlayer);
							if (assignTo) {
								char.inplayerjournals = assignTo;
								char.controlledby = assignTo
							}

							const newId = d20plus.ut.generateRowId();
							d20.Campaign.characters.create(
								{
									...char,
									id: newId
								},
								{
									success: function (character) {
										try {
											character.attribs.reset();
											if (!char.attribs) {
												window.alert(`Warning: Uploaded character had no "attribs" attribute. The character sheet will contain no data.`);
												return;
											}
											const toSave = char.attribs.map(a => character.attribs.push(a));
											toSave.forEach(s => s.syncedSave());

											const blobs = json.blobs;
											if (blobs) {
												character.updateBlobs({
													bio: blobs.bio || "",
													gmnotes: blobs.gmnotes || "",
													defaulttoken: blobs.defaulttoken || ""
												});
											}
											alert("Done!")
										} catch (e) {
											window.alert("Failed to import character! See the log for details.");
											console.error(e);
										}
									}
								}
							);
						} catch (e) {
							console.error(e);
							window.alert("Failed to load file! See the log for details.")
						}
					};
					input.onchange = function () {
						reader.readAsText(input.files[0]);
					};

					$iptFile.click();
				});
			}
		},
		{
			name: "Wild Shape Builder",
			desc: "Build a character sheet to represent a character in Wild Shape.",
			html: `
				<div id="d20plus-wildformbuild" title="Better20 - Wild Shape Character Builder">
					<div id="wildformbuild-list">
						<input type="search" class="search" placeholder="Search creatures...">
						<input type="search" class="filter" placeholder="Filter...">
						<span title="Filter format example: 'cr:1/4; cr:1/2; type:beast; source:MM'" style="cursor: help;">[?]</span>
						<div class="list" style="transform: translateZ(0); max-height: 490px; overflow-y: auto; overflow-x: hidden;"><i>Loading...</i></div>
					</div>
				<br>
				<select id="wildform-character">
					<option value="" disabled selected>Select Character</option>
				</select>
				<button class="btn">Create Character Sheets</button>
				</div>
				`,
			dialogFn: () => {
				$("#d20plus-wildformbuild").dialog({
					autoOpen: false,
					resizable: true,
					width: 800,
					height: 650,
				});
			},
			openFn: async () => {
				const $win = $("#d20plus-wildformbuild");
				$win.dialog("open");

				const $selChar = $(`#wildform-character`);
				$selChar.empty();
				$selChar.append(`<option value="" disabled>Select Character</option>`);
				const allChars = d20.Campaign.characters.toJSON().map(it => {
					const out = {id: it.id, name: it.name || ""};
					const npc = d20.Campaign.characters.get(it.id).attribs.toJSON().find(it => it.name === "npc");
					out.npc = !!(npc && npc.current && Number(npc.current));
					return out;
				});
				let hasNpc = false;
				allChars.sort((a, b) => a.npc - b.npc || SortUtil.ascSort(a.name.toLowerCase(), b.name.toLowerCase()))
					.forEach(it => {
						if (it.npc && !hasNpc) {
							$selChar.append(`<option value="" disabled>--NPCs--</option>`);
							hasNpc = true;
						}
						$selChar.append(`<option value="${it.id}">${it.name}</option>`)
					});


				const $fltr = $win.find(`.filter`);
				$fltr.off("keydown").off("keyup");
				$win.find(`button`).off("click");

				const $lst = $win.find(`.list`);

				let tokenList;

				const toLoad = Object.keys(monsterDataUrls).map(src => d20plus.monsters.formMonsterUrl(monsterDataUrls[src]));

				const dataStack = (await Promise.all(toLoad.map(async url => DataUtil.loadJSON(url)))).flat();

				$lst.empty();
				let toShow = [];

				const seen = {};
				await Promise.all(dataStack.map(async d => {
					const toAdd = d.monster.filter(m => {
						const out = !(seen[m.source] && seen[m.source].has(m.name));
						if (!seen[m.source]) seen[m.source] = new Set();
						seen[m.source].add(m.name);
						return out;
					});

					toShow = toShow.concat(toAdd);
				}));

				toShow = toShow.sort((a, b) => SortUtil.ascSort(a.name, b.name));

				let tmp = "";
				toShow.forEach((m, i)  => {
					m.__pType = Parser.monTypeToFullObj(m.type).asText;

					tmp += `
								<label class="import-cb-label" data-listid="${i}">
								<input type="checkbox">
								<span class="name col-4">${m.name}</span>
								<span class="type col-4">TYP[${m.__pType.uppercaseFirst()}]</span>
								<span class="cr col-2">${m.cr === undefined ? "CR[Unknown]" : `CR[${(m.cr.cr || m.cr)}]`}</span>
								<span title="${Parser.sourceJsonToFull(m.source)}" class="source">SRC[${Parser.sourceJsonToAbv(m.source)}]</span>
								</label>
								`;
				});
				$lst.html(tmp);
				tmp = null;

				tokenList = new List("wildformbuild-list", {
					valueNames: ["name", "type", "cr", "source"]
				});

				d20plus.importer.addListFilter($fltr, toShow, tokenList, d20plus.monsters._listIndexConverter);

				$win.find(`button`).on("click", () => {
					const allSel = tokenList.items
						.filter(it => $(it.elm).find(`input`).prop("checked"))
						.map(it => toShow[$(it.elm).attr("data-listid")]);

					const character = $selChar.val();
					if (!character) return alert("No character selected!");

					const d20Character = d20.Campaign.characters.get(character);
					if (!d20Character) return alert("Failed to get character data!");

					const getAttrib = (name) => d20Character.attribs.toJSON().find(x => x.name === name);

					allSel.filter(it => it).forEach(sel => {
						sel = $.extend(true, {}, sel);

						sel.wis = (d20Character.attribs.toJSON().find(x => x.name === "wisdom")|| {}).current || 10;
						sel.int = (d20Character.attribs.toJSON().find(x => x.name === "intelligence")|| {}).current || 10;
						sel.cha = (d20Character.attribs.toJSON().find(x => x.name === "charisma")|| {}).current || 10;

						const attribsSkills = {
							acrobatics_bonus: "acrobatics",
							animal_handling_bonus: "animal_handling",
							arcana_bonus: "arcana",
							athletics_bonus: "athletics",
							deception_bonus: "deception",
							history_bonus: "history",
							insight_bonus: "insight",
							intimidation_bonus: "intimidation",
							investigation_bonus: "investigation",
							medicine_bonus: "medicine",
							nature_bonus: "nature",
							perception_bonus: "perception",
							performance_bonus: "performance",
							persuasion_bonus: "persuasion",
							religion_bonus: "religion",
							slight_of_hand_bonus: "slight_of_hand",
							stealth_bonus: "stealth",
						};
						const attribsSaves = {
							npc_int_save: "int",
							npc_wis_save: "wis",
							npc_cha_save: "cha"
						};
						sel.skill = sel.skill || {};
						sel.save = sel.save || {};

						for (const a in attribsSkills) {
							const characterValue = getAttrib(a);
							if (characterValue) {
								sel.skill[attribsSkills[a]] = Math.max(sel.skill[attribsSkills[a]] || 0, characterValue.current);
							}
						}

						for (const a in attribsSaves) {
							const characterValue = getAttrib(a);
							if (characterValue) {
								sel.save[attribsSkills[a]] = Math.max(sel.save[attribsSkills[a]] || 0, characterValue.current);
							}
						}

						(() => {
							const attr = d20plus.sheet === "ogl" ? "passive_wisdom" : d20plus.sheet === "shaped" ? "perception" : "";
							if (!attr) return;
							const charAttr = getAttrib(attr);
							if (!charAttr) return;
							const passivePer = Number(charAttr.current || 0) + (d20plus.sheet === "shaped" ? 10 : 0);
							sel.passive = Math.max(passivePer, sel.passive);
						})();

						const doBuild = (result) => {
							const options = {
								charFunction: (character) => {
									character._getLatestBlob("defaulttoken", y => {
										if (y) {
											const token = JSON.parse(y);
											token.name = `${sel.name} (${d20Character.attributes.name})`;
											token.showplayers_aura1 = true;
											token.showplayers_aura2 = true;
											token.showplayers_bar1 = true;
											token.showplayers_bar2 = true;
											token.showplayers_bar3 = true;
											token.showplayers_name = true;
											token.bar3_max = result.total;
											token.bar3_value = result.total;
											character.updateBlobs({defaulttoken: JSON.stringify(token)});
											character.save({defaulttoken: (new Date()).getTime()});
										}
									});

									$("a.ui-tabs-anchor[href='#journal']").trigger("click");
								},
								charOptions: {
									inplayerjournals: d20Character.attributes.inplayerjournals,
									controlledby: d20Character.attributes.controlledby
								}
							};

							d20plus.monsters.handoutBuilder(sel, true, false, `Wild Forms - ${d20Character.attributes.name}`, {}, options);
						};

						if (sel.hp.formula) d20plus.ut.randomRoll(sel.hp.formula, result => doBuild(result));
						else doBuild({total: 0});
					});
				});

			}
		}
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
		return "@{selected|wtype} &{template:npcaction} {{name=@{selected|npc_name}}} {{rname=@{selected|repeating_npctrait_$" + index + "_name}}} {{description=@{selected|repeating_npctrait_$" + index + "_desc} }}";
	};

	d20plus.actionMacroAction = function (index) {
		return "%{selected|repeating_npcaction_$" + index + "_npc_action}";
	};

	d20plus.actionMacroReaction = "@{selected|wtype} &{template:npcaction} {{name=@{selected|npc_name}}} {{rname=@{selected|repeating_npcreaction_$0_name}}} {{description=@{selected|repeating_npcreaction_$0_desc} }} ";

	d20plus.actionMacroLegendary = function (tokenactiontext) {
		return "@{selected|wtype} @{selected|wtype}&{template:npcaction} {{name=@{selected|npc_name}}} {{rname=Legendary Actions}} {{description=The @{selected|npc_name} can take @{selected|npc_legendary_actions} legendary actions, choosing from the options below. Only one legendary option can be used at a time and only at the end of another creature's turn. The @{selected|npc_name} regains spent legendary actions at the start of its turn.\n\r" + tokenactiontext + "}} ";
	}
};

SCRIPT_EXTENSIONS.push(betteR205etoolsMain);
