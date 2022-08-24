function d20plusClass () {
	d20plus.classes = {};
	d20plus.subclasses = {};

	d20plus.classes._pLoadMergedClassJON = async function () {
		let data = await DataUtil.class.loadJSON();
		data = MiscUtil.copy(data);
		d20plus.classes._doAttachChildSubclasses(data);
		return data;
	};

	d20plus.classes._doAttachChildSubclasses = function (data) {
		data.class = data.class || [];
		data.subclass = data.subclass || [];

		for (let i = 0; i < data.subclass.length; ++i) {
			// Attach subclasses to parent classes
			const cls = data.class.find(it => it.name === data.subclass[i].className && it.source === data.subclass[i].classSource);
			if (!cls) continue;
			(cls.subclasses = cls.subclasses || []).push(data.subclass[i]);
		}
	};

	// Import Classes button was clicked
	d20plus.classes.button = function (forcePlayer) {
		const playerMode = forcePlayer || !window.is_gm;
		const url = playerMode ? $("#import-classes-url-player").val() : $("#import-classes-url").val();
		if (url && url.trim()) {
			const handoutBuilder = playerMode ? d20plus.classes.playerImportBuilder : d20plus.classes.handoutBuilder;
			const officialClassUrls = Object.values(classDataUrls).map(v => d20plus.formSrcUrl(CLASS_DATA_DIR, v));

			DataUtil.loadJSON(url).then(async (data) => {
				d20plus.importer.addBrewMeta(data._meta);
				await BrewUtil2.pAddBrewFromMemory(data);

				if (!data.class) return;

				data = MiscUtil.copy(data);
				data.class = data.class || [];
				for (let i = 0; i < data.class.length; ++i) {
					data.class[i] = await DataUtil.class.pGetDereferencedClassData(data.class[i]);
				}

				if (data.subclass) {
					for (let i = 0; i < data.subclass.length; ++i) {
						data.subclass[i] = await DataUtil.class.pGetDereferencedSubclassData(data.subclass[i]);
					}
				}

				d20plus.classes._doAttachChildSubclasses(data);

				d20plus.importer.showImportList(
					"class",
					data.class,
					handoutBuilder,
					{
						forcePlayer,
						builderOptions: {
							isHomebrew: !officialClassUrls.includes(url),
						},
					},
				);
			});
		}
	};

	// Import All Classes button was clicked
	d20plus.classes.buttonAll = function (forcePlayer) {
		const handoutBuilder = !forcePlayer && window.is_gm ? d20plus.classes.handoutBuilder : d20plus.classes.playerImportBuilder;

		d20plus.classes._pLoadMergedClassJON()
			.then(data => {
				d20plus.importer.showImportList(
					"class",
					data.class,
					handoutBuilder,
					{
						forcePlayer,
						builderOptions: {
							isHomebrew: false,
						},
					},
				);
			});
	};

	d20plus.classes.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo, options) {
		options = options || {};

		// make dir
		const folder = d20plus.journal.makeDirTree(`Classes`, folderName);
		const path = ["Classes", ...folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
		d20.Campaign.handouts.create({
			name: name,
			tags: d20plus.importer.getTagString([
				Parser.sourceJsonToFull(data.source),
			], "class"),
		}, {
			success: function (handout) {
				if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](data)] = {name: data.name, source: data.source, type: "handout", roll20Id: handout.id};

				const [noteContents, gmNotes] = d20plus.classes._getHandoutData(data);

				handout.updateBlobs({notes: noteContents, gmnotes: gmNotes});
				handout.save({notes: (new Date()).getTime(), inplayerjournals: inJournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			},
		});

		d20plus.classes._handleSubclasses(data, overwrite, inJournals, folderName, false, options);
	};

	d20plus.classes._handleSubclasses = async function (data, overwrite, inJournals, outerFolderName, forcePlayer, options) {
		async function chooseSubclassImportStrategy (isUnofficialBaseClass) {
			return new Promise((resolve, reject) => {
				const $dialog = $(`
						<div title="Subclass Import">
							<label class="flex">
								<span>Import ${data.name} ${data.source ? `(${Parser.sourceJsonToAbv(data.source)}) ` : ""}subclasses?</span>
								 <select title="Note: this does not include homebrew. For homebrew subclasses, use the dedicated subclass importer." style="width: 250px;">
								 	${isUnofficialBaseClass ? "" : `<option value="1">Official/Published (excludes UA/etc)</option>`}
								 	<option value="2">All</option>
								 	<option value="3">None</option>
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
								reject(new Error(`User cancelled the prompt`));
							},
						},
						{
							text: "OK",
							click: function () {
								const selected = Number($selStrat.val());
								$(this).dialog("close");
								$dialog.remove();
								if (isNaN(selected)) reject(new Error(`Value was not a number!`));
								resolve(selected);
							},
						},
					],
				})
			});
		}

		const playerMode = forcePlayer || !window.is_gm;
		// import subclasses
		if (data.subclasses) {
			const importStrategy = await chooseSubclassImportStrategy(options.isHomebrew || (data.source && SourceUtil.isNonstandardSource(data.source)));
			if (importStrategy === 3) return;

			data.subclasses.forEach(sc => {
				if (importStrategy === 1 && SourceUtil.isNonstandardSource(sc.source)) return;

				sc.className = data.name;
				sc.classSource = sc.classSource || data.source;
				if (playerMode) {
					d20plus.subclasses.playerImportBuilder(sc, data);
				} else {
					const folderName = d20plus.importer._getHandoutPath("subclass", sc, "Class");
					const path = [folderName];
					if (outerFolderName) path.push(sc.source || data.source); // if it wasn't None, group by source
					d20plus.subclasses.handoutBuilder(sc, overwrite, inJournals, path, {}, {}, data);
				}
			});
		}
	};

	d20plus.classes.playerImportBuilder = function (data, _1, _2, _3, _4, options) {
		options = options || {};

		const [notecontents, gmnotes] = d20plus.classes._getHandoutData(data);

		const importId = d20plus.ut.generateRowId();
		d20plus.importer.storePlayerImport(importId, JSON.parse(gmnotes));
		d20plus.importer.makePlayerDraggable(importId, data.name);

		d20plus.classes._handleSubclasses(data, false, false, null, true, options);
	};

	d20plus.classes._getHandoutData = function (data) {
		const renderer = new Renderer();
		renderer.setBaseUrl(BASE_SITE_URL);

		const renderStack = [];
		// make a copy of the data to modify
		const curClass = JSON.parse(JSON.stringify(data));
		// render the class text
		for (let i = 0; i < 20; i++) {
			const lvlFeatureList = curClass.classFeatures[i];
			for (let j = 0; j < lvlFeatureList.length; j++) {
				const feature = lvlFeatureList[j];
				renderer.recursiveRender(feature, renderStack);
			}
		}
		const rendered = renderStack.join("");

		const r20json = {
			"name": data.name,
			"Vetoolscontent": data,
			"data": {
				"Category": "Classes",
			},
		};
		const gmNotes = JSON.stringify(r20json);
		const noteContents = `${rendered}\n\n<del class="hidden">${gmNotes}</del>`;

		return [noteContents, gmNotes];
	};

	d20plus.classes.getProfBonusFromLevel = function (level) {
		if (level < 5) return "2";
		if (level < 9) return "3";
		if (level < 13) return "4";
		if (level < 17) return "5";
		return "6";
	};

	d20plus.classes.importClass = async function (character, data) {
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

		const attrs = new d20plus.importer.CharacterAttributesProxy(character);

		importClassGeneral(attrs, clss, maxLevel);

		let featureSourceBlacklist = await d20plus.ui.chooseCheckboxList(
			[SRC_TCE, SRC_UACFV],
			"Choose Variant/Optional Feature Sources to Exclude",
			{
				note: "Choosing to exclude a source will prevent its features from being added to your sheet.",
				displayFormatter: it => Parser.sourceJsonToFull(it),
			},
		);

		for (let i = 0; i < maxLevel; i++) {
			const level = i + 1;
			if (!levels.has(level)) continue;

			const lvlFeatureList = clss.classFeatures[i];
			for (let j = 0; j < lvlFeatureList.length; j++) {
				const feature = lvlFeatureList[j];
				// don't add "you gain a subclass feature" or ASI's
				if (
					!feature.gainSubclassFeature
					&& feature.name !== "Ability Score Improvement"
					&& (!feature.isClassFeatureVariant || !featureSourceBlacklist.includes(feature.source))
				) {
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
					attrs.addOrUpdate("pb", d20plus.classes.getProfBonusFromLevel(Number(maxLevel)));
					attrs.addOrUpdate("class", clss.name);
					attrs.addOrUpdate("level", maxLevel);
					attrs.addOrUpdate("base_level", String(maxLevel));
				}, 500);
			} else if (d20plus.sheet === "shaped") {
				const isSupportedClass = clss.source === "PHB" || ["Artificer", "Ranger (Revised)"].includes(clss.name);
				let className = "CUSTOM";
				if (isSupportedClass) {
					className = clss.name.toUpperCase();
					if (clss.name === "Ranger (Revised)") { className = "RANGERUA"; }
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
				// eslint-disable-next-line no-console
				console.warn(`Class import is not supported for ${d20plus.sheet} character sheet`);
			}
		}

		function importClassFeature (attrs, clss, level, feature) {
			if (d20plus.sheet === "ogl") {
				const fRowId = d20plus.ut.generateRowId();
				attrs.add(`repeating_traits_${fRowId}_name`, feature.name);
				attrs.add(`repeating_traits_${fRowId}_source`, "Class");
				attrs.add(`repeating_traits_${fRowId}_source_type`, `${clss.name} ${level}`);
				attrs.add(`repeating_traits_${fRowId}_description`, feature.text);
				attrs.add(`repeating_traits_${fRowId}_options-flag`, "0");
			} else if (d20plus.sheet === "shaped") {
				if (shapedSheetPreFilledFeatures.includes(feature.name)) { return; }

				const fRowId = d20plus.ut.generateRowId();
				attrs.add(`repeating_classfeature_${fRowId}_name`, `${feature.name} (${clss.name} ${level})`);
				attrs.add(`repeating_classfeature_${fRowId}_content`, feature.text);
				attrs.add(`repeating_classfeature_${fRowId}_content_toggle`, "1");
			}

			attrs.notifySheetWorkers();
		}
	};

	/// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	d20plus.subclasses._groupOptions = ["Class", "Alphabetical", "Source"];
	d20plus.subclasses._listCols = ["name", "class", "source"];
	d20plus.subclasses._listItemBuilder = (it) => `
		<span class="name col-6">${it.name}</span>
		<span class="class col-4">CLS[${it.className}]</span>
		<span title="${Parser.sourceJsonToFull(it.source)}" class="source col-2">SRC[${Parser.sourceJsonToAbv(it.source)}]</span>`;
	d20plus.subclasses._listIndexConverter = (sc) => {
		return {
			name: sc.name.toLowerCase(),
			class: sc.className.toLowerCase(),
			source: Parser.sourceJsonToAbv(sc.source).toLowerCase(),
		};
	};
	// Import Subclasses button was clicked
	d20plus.subclasses.button = function (forcePlayer) {
		const playerMode = forcePlayer || !window.is_gm;
		const url = playerMode ? $("#import-subclasses-url-player").val() : $("#import-subclasses-url").val();
		if (url && url.trim()) {
			const handoutBuilder = playerMode ? d20plus.subclasses.playerImportBuilder : d20plus.subclasses.handoutBuilder;

			DataUtil.loadJSON(url).then(async (data) => {
				d20plus.importer.addBrewMeta(data._meta);
				await BrewUtil2.pAddBrewFromMemory(data);

				data = MiscUtil.copy(data);
				for (let i = 0; i < (data.class || []).length; ++i) {
					data.class[i] = await DataUtil.class.pGetDereferencedClassData(data.class[i]);
				}
				for (let i = 0; i < (data.subclass || []).length; ++i) {
					data.subclass[i] = await DataUtil.class.pGetDereferencedSubclassData(data.subclass[i]);
				}

				// merge in any subclasses contained in class data
				const allData = MiscUtil.copy(data.subclass || []);
				(data.class || []).map(c => {
					if (c.subclasses) {
						// make a copy without subclasses to prevent circular references
						const cpy = MiscUtil.copy(c);
						delete cpy.subclasses;
						c.subclasses.forEach(sc => {
							sc.className = c.name;
							sc.source = sc.source || c.source;
							sc._baseClass = cpy;
						});
						return c.subclasses;
					} else return false;
				}).filter(Boolean).forEach(sc => allData.push(sc));

				d20plus.importer.showImportList(
					"subclass",
					allData.flat(),
					handoutBuilder,
					{
						groupOptions: d20plus.subclasses._groupOptions,
						forcePlayer,
						listItemBuilder: d20plus.subclasses._listItemBuilder,
						listIndex: d20plus.subclasses._listCols,
						listIndexConverter: d20plus.subclasses._listIndexConverter,
					},
				);
			});
		}
	};

	/**
	 * @param subclass
	 * @param baseClass Will be defined if importing as part of a class, undefined otherwise.
	 */
	d20plus.subclasses._preloadClass = function (subclass, baseClass) {
		if (!subclass.className) return Promise.resolve();

		if (baseClass || subclass._baseClass) {
			return Promise.resolve();
		} else {
			d20plus.ut.log("Preloading class...");
			return d20plus.classes._pLoadMergedClassJON().then((data) => {
				const clazz = data.class.find(it => it.name.toLowerCase() === subclass.className.toLowerCase() && it.source.toLowerCase() === (subclass.classSource || SRC_PHB).toLowerCase());
				if (!clazz) {
					throw new Error(`Could not find class for subclass ${subclass.name}::${subclass.source} with class ${subclass.className}::${subclass.classSource || SRC_PHB}`);
				}
			});
		}
	};

	/**
	 * @param data
	 * @param overwrite
	 * @param inJournals
	 * @param folderName
	 * @param saveIdsTo
	 * @param options
	 * @param baseClass Will be defined if importing as part of a class, undefined otherwise.
	 */
	d20plus.subclasses.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo, options, baseClass) {
		// make dir
		const folder = d20plus.journal.makeDirTree(`Subclasses`, folderName);
		const path = ["Sublasses", ...folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		d20plus.subclasses._preloadClass(data, baseClass).then(() => {
			const name = `${data.shortName} (${data.className})`;
			d20.Campaign.handouts.create({
				name: name,
				tags: d20plus.importer.getTagString([
					data.className,
					Parser.sourceJsonToFull(data.source),
				], "subclass"),
			}, {
				success: function (handout) {
					if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](data)] = {name: data.name, source: data.source, type: "handout", roll20Id: handout.id};

					const [noteContents, gmNotes] = d20plus.subclasses._getHandoutData(data);

					handout.updateBlobs({notes: noteContents, gmnotes: gmNotes});
					handout.save({notes: (new Date()).getTime(), inplayerjournals: inJournals});
					d20.journal.addItemToFolderStructure(handout.id, folder.id);
				},
			});
		});
	};

	/**
	 * @param data
	 * @param baseClass Will be defined if importing as part of a class, undefined otherwise.
	 */
	d20plus.subclasses.playerImportBuilder = function (data, baseClass) {
		d20plus.subclasses._preloadClass(data, baseClass).then(() => {
			const [notecontents, gmnotes] = d20plus.subclasses._getHandoutData(data);

			const importId = d20plus.ut.generateRowId();
			d20plus.importer.storePlayerImport(importId, JSON.parse(gmnotes));
			const name = `${data.className ? `${data.className} \u2014 ` : ""}${data.name}`;
			d20plus.importer.makePlayerDraggable(importId, name);
		});
	};

	d20plus.subclasses._getHandoutData = function (data) {
		const renderer = new Renderer();
		renderer.setBaseUrl(BASE_SITE_URL);

		const renderStack = [];

		data.subclassFeatures.forEach(lvl => {
			lvl.forEach(f => {
				renderer.recursiveRender(f, renderStack);
			});
		});

		const rendered = renderStack.join("");

		const r20json = {
			"name": data.name,
			"Vetoolscontent": data,
			"data": {
				"Category": "Subclasses",
			},
		};
		const gmNotes = JSON.stringify(r20json);
		const noteContents = `${rendered}\n\n<del class="hidden">${gmNotes}</del>`;

		return [noteContents, gmNotes];
	};

	d20plus.subclasses.importSubclass = function (character, data) {
		if (d20plus.sheet !== "ogl" && d20plus.sheet !== "shaped") {
			// eslint-disable-next-line no-console
			console.warn(`Subclass import is not supported for ${d20plus.sheet} character sheet`);
			return;
		}

		const attrs = new d20plus.importer.CharacterAttributesProxy(character);
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
					// eslint-disable-next-line no-console
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

			if (d20plus.sheet === "ogl") {
				attrs.add(`repeating_traits_${fRowId}_name`, feature.name);
				attrs.add(`repeating_traits_${fRowId}_source`, "Class");
				attrs.add(`repeating_traits_${fRowId}_source_type`, `${sc.className} (${sc.name} ${level})`);
				attrs.add(`repeating_traits_${fRowId}_description`, feature.text);
				attrs.add(`repeating_traits_${fRowId}_options-flag`, "0");
			} else if (d20plus.sheet === "shaped") {
				attrs.add(`repeating_classfeature_${fRowId}_name`, `${feature.name} (${sc.name} ${level})`);
				attrs.add(`repeating_classfeature_${fRowId}_content`, feature.text);
				attrs.add(`repeating_classfeature_${fRowId}_content_toggle`, "1");
			}

			attrs.notifySheetWorkers();
		}
	};
}

SCRIPT_EXTENSIONS.push(d20plusClass);
