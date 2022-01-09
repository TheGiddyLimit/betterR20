function tools5eConfig () {
	d20plus.cfg5e = {};

	addConfigOptions("token", {
		"_name": "Tokens",
		"_player": true,
		"bar1": {
			"name": "Bar 1 (NPC)",
			"default": "npc_hpbase",
			"_type": "_SHEET_ATTRIBUTE",
			"_player": true,
		},
		"bar1_pc": {
			"name": "Bar 1 (PC)",
			"default": "",
			"_type": "_SHEET_ATTRIBUTE_PC",
		},
		"bar1_max": {
			"name": "Set Bar 1 Max",
			"default": true,
			"_type": "boolean",
			"_player": true,
		},
		"bar1_reveal": {
			"name": "Reveal Bar 1",
			"default": false,
			"_type": "boolean",
			"_player": true,
		},
		"bar2": {
			"name": "Bar 2 (NPC)",
			"default": "npc_ac",
			"_type": "_SHEET_ATTRIBUTE",
			"_player": true,
		},
		"bar2_pc": {
			"name": "Bar 2 (PC)",
			"default": "",
			"_type": "_SHEET_ATTRIBUTE_PC",
		},
		"bar2_max": {
			"name": "Set Bar 2 Max",
			"default": false,
			"_type": "boolean",
			"_player": true,
		},
		"bar2_reveal": {
			"name": "Reveal Bar 2",
			"default": false,
			"_type": "boolean",
			"_player": true,
		},
		"bar3": {
			"name": "Bar 3 (NPC)",
			"default": "passive",
			"_type": "_SHEET_ATTRIBUTE",
			"_player": true,
		},
		"bar3_pc": {
			"name": "Bar 3 (PC)",
			"default": "",
			"_type": "_SHEET_ATTRIBUTE_PC",
		},
		"bar3_max": {
			"name": "Set Bar 3 Max",
			"default": false,
			"_type": "boolean",
			"_player": true,
		},
		"bar3_reveal": {
			"name": "Reveal Bar 3",
			"default": false,
			"_type": "boolean",
			"_player": true,
		},
		"rollHP": {
			"name": "Roll Token HP",
			"default": false,
			"_type": "boolean",
		},
		"maximiseHp": {
			"name": "Maximise Token HP",
			"default": false,
			"_type": "boolean",
		},
		"name": {
			"name": "Show Nameplate",
			"default": true,
			"_type": "boolean",
			"_player": true,
		},
		"name_reveal": {
			"name": "Reveal Nameplate",
			"default": false,
			"_type": "boolean",
			"_player": true,
		},
		"barLocation": {
			"name": "Bar Location",
			"default": "above",
			"_type": "_enum",
			"__values": [
				"Above",
				"Top Overlapping",
				"Bottom Overlapping",
				"Below",
			],
			"_player": true,
		},
		"isCompactBars": {
			"name": "Compact Bars",
			"default": false,
			"_type": "boolean",
			"_player": true,
		},
	});
	addConfigOptions("import", {
		"_name": "Import",
		"baseSiteUrl": {
			"name": "5e Tools Website (reload to apply changes)",
			"default": "https://5etools-mirror-1.github.io/",
			"_type": "String",
			"_player": true,
		},
		"allSourcesIncludeUnofficial": {
			"name": `Include Unofficial (UA/etc) Content in "Import Monsters From All Sources" List`,
			"default": false,
			"_type": "boolean",
		},
		"importIntervalHandout": {
			"name": "Rest Time between Each Handout (msec)",
			"default": 100,
			"_type": "integer",
		},
		"importIntervalCharacter": {
			"name": "Rest Time between Each Character (msec)",
			"default": 2500,
			"_type": "integer",
		},
		"importFluffAs": {
			"name": "Import Creature Fluff As...",
			"default": "Bio",
			"_type": "_enum",
			"__values": ["Bio", "GM Notes"],
		},
		"importVariants": {
			"name": "Import Creature Variants...",
			"default": true,
			"_type": "boolean",
		},
		"importCharAvatar": {
			"name": "Set Character Avatar As...",
			"default": "Portrait (where available)",
			"_type": "_enum",
			"__values": ["Portrait (where available)", "Token"],
		},
		"whispermode": {
			"name": "Sheet Whisper Mode on Import",
			"default": "Toggle (Default GM)",
			"_type": "_WHISPERMODE",
		},
		"advantagemode": {
			"name": "Sheet Advantage Mode on Import",
			"default": "Toggle (Default Advantage)",
			"_type": "_ADVANTAGEMODE",
		},
		"damagemode": {
			"name": "Sheet Auto Roll Damage Mode on Import",
			"default": "Auto Roll",
			"_type": "_DAMAGEMODE",
		},
		"hideActionDescs": {
			"name": "Hide Action Descriptions on Import",
			"default": false,
			"_type": "boolean",
		},
		"skipSenses": {
			"name": "Skip Importing Creature Senses",
			"default": false,
			"_type": "boolean",
		},
		"showNpcNames": {
			"name": "Show NPC Names in Rolls",
			"default": true,
			"_type": "boolean",
		},
		"dexTiebreaker": {
			"name": "Add DEX Tiebreaker to Initiative",
			"default": false,
			"_type": "boolean",
		},
		"tokenactions": {
			"name": "Add TokenAction Macros on Import (Actions)",
			"default": true,
			"_type": "boolean",
		},
		"tokenactionsExpanded": {
			"name": "Expand TokenAction Macros on Import (Legendary / Mythic)",
			"default": false,
			"_type": "boolean",
		},
		"tokenactionsTraits": {
			"name": "Add TokenAction Macros on Import (Traits)",
			"default": true,
			"_type": "boolean",
		},
		"tokenactionsSkills": {
			"name": "Add TokenAction Macros on Import (Skills)",
			"default": true,
			"_type": "boolean",
		},
		"tokenactionsPerception": {
			"name": "Add TokenAction Macros on Import (Perception)",
			"default": true,
			"_type": "boolean",
		},
		"tokenactionsSaves": {
			"name": "Add TokenAction Macros on Import (Saves)",
			"default": true,
			"_type": "boolean",
		},
		"tokenactionsInitiative": {
			"name": "Add TokenAction Macros on Import (Initiative)",
			"default": true,
			"_type": "boolean",
		},
		"tokenactionsChecks": {
			"name": "Add TokenAction Macros on Import (Checks)",
			"default": true,
			"_type": "boolean",
		},
		"tokenactionsOther": {
			"name": "Add TokenAction Macros on Import (Other)",
			"default": true,
			"_type": "boolean",
		},
		"tokenactionsSpells": {
			"name": "Add TokenAction Macros on Import (Spells)",
			"default": true,
			"_type": "boolean",
		},
		"namesuffix": {
			"name": "Append Text to Names on Import",
			"default": "",
			"_type": "String",
		},
	});
	addConfigOptions("interface", {
		"_name": "Interface",
		"_player": true,
		"customTracker": {
			"name": "Add Additional Info to Tracker",
			"default": true,
			"_type": "boolean",
		},
		"trackerCol1": {
			"name": "Tracker Column 1",
			"default": "HP",
			"_type": "_FORMULA",
		},
		"trackerCol2": {
			"name": "Tracker Column 2",
			"default": "AC",
			"_type": "_FORMULA",
		},
		"trackerCol3": {
			"name": "Tracker Column 3",
			"default": "PP",
			"_type": "_FORMULA",
		},
		"trackerSheetButton": {
			"name": "Add Sheet Button To Tracker",
			"default": false,
			"_type": "boolean",
		},
		"minifyTracker": {
			"name": "Shrink Initiative Tracker Text",
			"default": false,
			"_type": "boolean",
		},
		"showDifficulty": {
			"name": "Show Difficulty in Tracker",
			"default": true,
			"_type": "boolean",
		},
		"emoji": {
			"name": "Add Emoji Replacement to Chat",
			"default": true,
			"_type": "boolean",
			"_player": true,
		},
		"showCustomArtPreview": {
			"name": "Show Custom Art Previews",
			"default": true,
			"_type": "boolean",
		},
	});

	d20plus.cfg5e.updateBaseSiteUrl = () => {
		if (!!d20plus.cfg.get("import", "baseSiteUrl")) {
			BASE_SITE_URL = d20plus.cfg.get("import", "baseSiteUrl");
			if (BASE_SITE_URL.slice(-1) != '/') BASE_SITE_URL += '/';
			d20plus.ut.log(`Base Site Url updated: ${BASE_SITE_URL}`);
		} else {
			d20plus.ut.log(`Using default Base Site Url: ${BASE_SITE_URL}`);
		}

		SITE_JS_URL = `${BASE_SITE_URL}js/`;
		DATA_URL = `${BASE_SITE_URL}data/`;

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
	};

	d20plus.cfg5e.handleConfigChange = function (isSyncingPlayer) {
		if (!isSyncingPlayer) d20plus.ut.log("Applying config");
		if (window.is_gm) {
			d20plus.setInitiativeShrink(d20plus.cfg.get("interface", "minifyTracker"));
			d20.Campaign.initiativewindow.rebuildInitiativeList();
			d20plus.updateDifficulty();
			if (d20plus.art.refreshList) d20plus.art.refreshList();
		}
	};

	// get the user config'd token HP bar
	d20plus.cfg5e.getCfgHpBarNumber = function () {
		const bars = [
			d20plus.cfg.get("token", "bar1"),
			d20plus.cfg.get("token", "bar2"),
			d20plus.cfg.get("token", "bar3"),
		];
		return bars[0] === "npc_hpbase" ? 1 : bars[1] === "npc_hpbase" ? 2 : bars[2] === "npc_hpbase" ? 3 : null;
	};
}

SCRIPT_EXTENSIONS.push(tools5eConfig);
