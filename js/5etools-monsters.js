function d20plusMonsters () {
	d20plus.monsters = {
		TAG_SPELL_OPEN: "#VE_MARK_SPELL_OPEN#",
		TAG_SPELL_CLOSE: "#VE_MARK_SPELL_CLOSE#",
	};

	d20plus.monsters._groupOptions = ["Type", "Type (with tags)", "CR", "CR → Type", "Alphabetical", "Source"];
	d20plus.monsters._listCols = ["name", "type", "cr", "source"];
	d20plus.monsters._listItemBuilder = (it) => `
		<span class="name col-4" title="name">${it.name}</span>
		<span class="type col-4" title="type">TYP[${Parser.monTypeToFullObj(it.type).asText.uppercaseFirst()}]</span>
		<span class="cr col-2" title="cr">${it.cr === undefined ? "CR[Unknown]" : `CR[${(it.cr.cr || it.cr)}]`}</span>
		<span title="source [Full source name is ${Parser.sourceJsonToFull(it.source)}]" class="source">SRC[${Parser.sourceJsonToAbv(it.source)}]</span>`;
	d20plus.monsters._listIndexConverter = (m) => {
		m.__pType = m.__pType || Parser.monTypeToFullObj(m.type).type; // only filter using primary type
		return {
			name: m.name.toLowerCase(),
			type: m.__pType.toLowerCase(),
			cr: m.cr === undefined ? "unknown" : (m.cr.cr || m.cr).toLowerCase(),
			source: Parser.sourceJsonToAbv(m.source).toLowerCase()
		};
	};
	d20plus.monsters._doScale = (doImport, origImportQueue) => {
		const _template = `
			<div id="d20plus-monster-import-cr-scale" title="Scale CRs">
				<div id="monster-import-cr-scale-list">
					<input type="search" class="search" placeholder="Search creatures...">
					<input type="search" class="filter" placeholder="Filter...">
					<span title="Filter format example: 'cr:1/4; cr:1/2; type:beast; source:MM'" style="cursor: help;">[?]</span>

					<div style="margin-top: 10px;">
						<span class="col-3 ib"><b>Name</b></span>
						<span class="col-1 ib"><b>Source</b></span>
						<span class="col-2 ib"><b>CR</b></span>
						<span class="col-2 ib"><b>Rename To</b></span>
						<span class="col-3 ib"><b>Scale CR</b></span>
					</div>
					<div class="list" style="transform: translateZ(0); max-height: 490px; overflow-y: auto; overflow-x: hidden;"><i>Loading...</i></div>
				</div>
			<br>
			<button class="btn">Import</button>
			</div>
		`;
		if (!$(`#d20plus-monster-import-cr-scale`).length) {
			$(`body`).append(_template);
			$("#d20plus-monster-import-cr-scale").dialog({
				autoOpen: false,
				resizable: true,
				width: 800,
				height: 700,
			});
		}
		const $win = $("#d20plus-monster-import-cr-scale");
		$win.dialog("open");

		const $fltr = $win.find(`.filter`);
		$fltr.off("keydown").off("keyup");
		$win.find(`button`).off("click");

		const $lst = $win.find(`.list`);
		$lst.empty();

		let temp = "";
		origImportQueue.forEach((m, i) => {
			temp += `
				<div>
					<span class="name col-3 ib">${m.name}</span>
					<span title="${Parser.sourceJsonToFull(m.source)}" class="src col-1 ib">SRC[${Parser.sourceJsonToAbv(m.source)}]</span>
					<span class="cr col-2 ib">${m.cr === undefined ? "CR[Unknown]" : `CR[${(m.cr.cr || m.cr)}]`}</span>
					<span class="col-2 ib"><input class="target-rename" style="max-width: calc(100% - 18px);" placeholder="Rename To..."></span>
					<span class="col-2 ib"><input class="target-cr" placeholder="Adjusted CR (optional; 0-30)"></span>
					<span class="index" style="display: none;">${i}</span>
				</div>
			`;
		});
		$lst.append(temp);

		list = new List("monster-import-cr-scale-list", {
			valueNames: ["name", "src"]
		});

		d20plus.importer.addListFilter($fltr, origImportQueue, list, d20plus.monsters._listIndexConverter);

		const $btn = $win.find(`.btn`);
		$btn.click(() => {
			const queueCopy = JSON.parse(JSON.stringify(origImportQueue));

			const applyRename = (mon, newName) => {
				const applyTo = (prop) => {
					mon[prop] && mon[prop].forEach(it => {
						if (it.entries) it.entries = JSON.parse(JSON.stringify(it.entries).replace(new RegExp(mon.name, "gi"), newName));
						if (it.headerEntries) it.headerEntries = JSON.parse(JSON.stringify(it.headerEntries).replace(new RegExp(mon.name, "gi"), newName));
					})
				};

				applyTo("action");
				applyTo("reaction");
				applyTo("trait");
				applyTo("legendary");
				applyTo("variant");

				mon._displayName = newName;
			};

			let failed = false;
			const promises = [];
			for (const it of list.items) {
				const $ele = $(it.elm);
				const ix = Number($ele.find(`.index`).text());
				const m = origImportQueue[ix];
				const origCr = m.cr ? (m.cr.cr || m.cr) : "Unknown";
				const $iptCr = $ele.find(`.target-cr`);
				const rename = ($ele.find(`.target-rename`).val() || "").trim();
				const crValRaw = $iptCr.val();
				let crVal = crValRaw;
				if (crVal && crVal.trim()) {
					crVal = crVal.replace(/\s+/g, "").toLowerCase();
					const mt = /(1\/[248]|\d+)/.exec(crVal);
					if (mt) {
						const asNum = Parser.crToNumber(mt[0]);
						if (asNum < 0 || asNum > 30) {
							alert(`Invalid CR: ${crValRaw} for creature ${m.name} from ${Parser.sourceJsonToAbv(m.source)} (should be between 0 and 30)`);
							failed = true;
							break;
						} else if (asNum !== Parser.crToNumber(origCr)) {
							promises.push(ScaleCreature.scale(m, asNum).then(scaled => {
								queueCopy[ix] = scaled;
								if (rename) applyRename(queueCopy[ix], rename);
								return Promise.resolve();
							}));
						} else {
							if (rename) applyRename(queueCopy[ix], rename);
							console.log(`Skipping scaling creature ${m.name} from ${Parser.sourceJsonToAbv(m.source)} -- old CR matched new CR`)
						}
					} else {
						alert(`Invalid CR: ${crValRaw} for creature ${m.name} from ${Parser.sourceJsonToAbv(m.source)}`);
						failed = true;
						break;
					}
				} else {
					if (rename) applyRename(queueCopy[ix], rename);
				}
			}

			if (!failed) {
				const pVals = Object.values(promises);
				Promise.all(promises).then(results => {
					doImport(queueCopy);
				});
			}
		});
	};
	// Import Monsters button was clicked
	d20plus.monsters.button = function () {
		const url = $("#import-monster-url").val();
		if (url && url.trim()) {
			DataUtil.loadJSON(url).then(async data => {
				const doShowList = () => {
					d20plus.importer.addBrewMeta(data._meta);
					d20plus.importer.showImportList(
						"monster",
						data.monster,
						d20plus.monsters.handoutBuilder,
						{
							groupOptions: d20plus.monsters._groupOptions,
							listItemBuilder: d20plus.monsters._listItemBuilder,
							listIndex: d20plus.monsters._listCols,
							listIndexConverter: d20plus.monsters._listIndexConverter,
							nextStep: d20plus.monsters._doScale
						}
					);
				};

				doShowList();
			});
		}
	};

	// Import All Monsters button was clicked
	d20plus.monsters.buttonAll = async function () {
		const filterUnofficial = !d20plus.cfg.getOrDefault("import", "allSourcesIncludeUnofficial");

		const toLoad = Object.keys(monsterDataUrls)
			.filter(src => !(SourceUtil.isNonstandardSource(src) && filterUnofficial))
			.map(src => d20plus.monsters.formMonsterUrl(monsterDataUrls[src]));

		if (d20plus.cfg.getOrDefault("import", "allSourcesIncludeHomebrew")) {
			monsterBrewDataUrls.forEach(it => toLoad.push(it.url));
		}

		if (toLoad.length) {
			const dataStack = (await Promise.all(toLoad.map(async url => DataUtil.loadJSON(url)))).flat();

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

			d20plus.importer.showImportList(
				"monster",
				toShow,
				d20plus.monsters.handoutBuilder,
				{
					groupOptions: d20plus.monsters._groupOptions,
					listItemBuilder: d20plus.monsters._listItemBuilder,
					listIndex: d20plus.monsters._listCols,
					listIndexConverter: d20plus.monsters._listIndexConverter,
					nextStep: d20plus.monsters._doScale
				}
			);
		}
	};

	d20plus.monsters.formMonsterUrl = function (fileName) {
		return d20plus.formSrcUrl(MONSTER_DATA_DIR, fileName);
	};

	// Create monster character from js data object
	d20plus.monsters.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo, options) {
		const doBuild = () => {
			if (!options) options = {};
			if (inJournals && typeof inJournals === "string") {
				options.charOptions = options.charOptions || {};
				options.charOptions.inplayerjournals = inJournals;
			}

			// make dir
			const folder = d20plus.journal.makeDirTree(`Monsters`, folderName);
			const path = ["Monsters", ...folderName, data._displayName || data.name];

			// handle duplicates/overwrites
			if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

			const name = data.name;
			const pType = Parser.monTypeToFullObj(data.type);

			const renderer = new Renderer();
			renderer.setBaseUrl(BASE_SITE_URL);

			let fluff;
			if (data.fluff) fluff = data.fluff;
			else if (monsterFluffData[data.source]) {
				fluff = (monsterFluffData[data.source].monsterFluff || [])
					.find(it => it.name === data.name && it.source === data.source)
			}

			let renderFluff = null;
			if (fluff) {
				const depth = fluff.type === "section" ? -1 : 2;
				if (fluff.type !== "section") renderer.setFirstSection(false);
				renderFluff = renderer.render({type: fluff.type, entries: fluff.entries || []}, depth);
			}

			d20.Campaign.characters.create(
				{
					name: data._displayName || data.name,
					tags: d20plus.importer.getTagString([
						pType.type,
						...pType.tags,
						`cr ${(data.cr ? (data.cr.cr || data.cr) : "").replace(/\//g, " over ")}` || "unknown cr",
						Parser.sourceJsonToFull(data.source),
						Parser.sizeAbvToFull(data.size),
						...(data.environment || []),
						data.isNPC ? "npc" : undefined
					], "creature"),
					...options.charOptions
				},
				{
					success: function (character) {
						if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY](data)] = {name: data.name, source: data.source, type: "character", roll20Id: character.id};
						/* OGL Sheet */
						try {
							const type = Parser.monTypeToFullObj(data.type).asText;
							const source = Parser.sourceJsonToAbv(data.source);
							const avatar = data.tokenUrl || `${IMG_URL}${source}/${name.replace(/"/g, "")}.png`;
							character.size = data.size;
							character.name = data._displayName || data.name;
							character.senses = data.senses ? data.senses instanceof Array ? data.senses.join(", ") : data.senses : null;
							character.hp = data.hp.average || 0;
							const firstFluffImage = d20plus.cfg.getOrDefault("import", "importCharAvatar") === "Portrait (where available)" && fluff && fluff.images ? (() => {
								const firstImage = fluff.images[0] || {};
								return (firstImage.href || {}).type === "internal" ? `${BASE_SITE_URL}/img/${firstImage.href.path}` : (firstImage.href || {}).url;
							})() : null;
							$.ajax({
								url: avatar,
								type: 'HEAD',
								error: function () {
									d20plus.importer.getSetAvatarImage(character, `${IMG_URL}blank.png`, firstFluffImage);
								},
								success: function () {
									d20plus.importer.getSetAvatarImage(character, `${avatar}${d20plus.ut.getAntiCacheSuffix()}`, firstFluffImage);
								}
							});
							const parsedAc = typeof data.ac === "string" ? data.ac : $(`<div>${Parser.acToFull(data.ac)}</div>`).text();
							var ac = parsedAc.match(/^\d+/);
							var actype = /\(([^)]+)\)/.exec(parsedAc);
							var hp = data.hp.average ?? "";
							var hpformula = data.hp.formula;
							var passive = data.passive != null ? data.passive : "";
							var passiveStr = passive !== "" ? "passive Perception " + passive : "";
							var senses = data.senses ? data.senses instanceof Array ? data.senses.join(", ") : data.senses : "";
							var sensesStr = senses !== "" ? senses + ", " + passiveStr : passiveStr;
							var size = d20plus.getSizeString(data.size || "");
							var alignment = data.alignment ? Parser.alignmentListToFull(data.alignment).toLowerCase() : "(Unknown Alignment)";
							var cr = data.cr ? (data.cr.cr || data.cr) : "";
							var xp = Parser.crToXpNumber(cr) || 0;
							character.attribs.create({name: "npc", current: 1});
							character.attribs.create({name: "npc_toggle", current: 1});
							character.attribs.create({name: "npc_options-flag", current: 0});
							// region disable charachtermancer
							character.attribs.create({name: "mancer_confirm_flag", current: ""});
							character.attribs.create({name: "mancer_cancel", current: "on"});
							character.attribs.create({name: "l1mancer_status", current: "completed"});
							// endregion
							character.attribs.create({name: "wtype", current: d20plus.importer.getDesiredWhisperType()});
							character.attribs.create({name: "rtype", current: d20plus.importer.getDesiredRollType()});
							character.attribs.create({
								name: "advantagetoggle",
								current: d20plus.importer.getDesiredAdvantageToggle()
							});
							character.attribs.create({
								name: "whispertoggle",
								current: d20plus.importer.getDesiredWhisperToggle()
							});
							character.attribs.create({name: "dtype", current: d20plus.importer.getDesiredDamageType()});
							character.attribs.create({name: "npc_name", current: data._displayName || data.name});
							character.attribs.create({name: "npc_size", current: size});
							character.attribs.create({name: "type", current: type});
							character.attribs.create({name: "npc_type", current: size + " " + type + ", " + alignment});
							character.attribs.create({name: "npc_alignment", current: alignment});
							character.attribs.create({name: "npc_ac", current: ac != null ? ac[0] : ""});
							character.attribs.create({name: "npc_actype", current: actype != null ? actype[1] || "" : ""});
							character.attribs.create({name: "hp", current: hp, max: hp});
							character.attribs.create({name: "npc_hpbase", current: hp, max: hp});
							character.attribs.create({name: "npc_hpformula", current: hpformula != null ? hpformula || "" : ""});

							const hpModId = d20plus.ut.generateRowId();
							character.attribs.create({name: `repeating_hpmod_${hpModId}_source`, current: "CON"});
							character.attribs.create({name: `repeating_hpmod_${hpModId}_mod`, current: Parser.getAbilityModNumber(data.con)});

							const parsedSpeed = Parser.getSpeedString(data);
							data.npc_speed = parsedSpeed;
							if (d20plus.sheet === "shaped") {
								data.npc_speed = data.npc_speed.toLowerCase();
								var match = data.npc_speed.match(/^\s*(\d+)\s?(ft\.?|m\.?)/);
								if (match && match[1]) {
									data.speed = match[1] + ' ' + match[2];
									character.attribs.create({name: "speed", current: match[1] + ' ' + match[2]});
								}
								data.npc_speed = parsedSpeed;
								var regex = /(burrow|climb|fly|swim)\s+(\d+)\s?(ft\.?|m\.?)/g;
								var speeds = void 0;
								while ((speeds = regex.exec(data.npc_speed)) !== null) character.attribs.create({
									name: "speed_" + speeds[1],
									current: speeds[2] + ' ' + speeds[3]
								});
								if (data.npc_speed && data.npc_speed.includes('hover')) character.attribs.create({
									name: "speed_fly_hover",
									current: 1
								});
								data.npc_speed = '';
							}

							function calcMod (score) {
								return Math.floor((Number(score) - 10) / 2);
							}

							character.attribs.create({name: "npc_speed", current: parsedSpeed != null ? parsedSpeed : ""});

							character.attribs.create({name: "strength", current: data.str});
							character.attribs.create({name: "strength_base", current: `${data.str}`});
							character.attribs.create({name: "strength_mod", current: calcMod(data.str)});
							character.attribs.create({name: "npc_str_negative", current: calcMod(data.str) < 0 ? 1 : 0});
							character.attribs.create({name: "strength_flag", current: 0});

							character.attribs.create({name: "dexterity", current: data.dex});
							character.attribs.create({name: "dexterity_base", current: `${data.dex}`});
							character.attribs.create({name: "dexterity_mod", current: calcMod(data.dex)});
							character.attribs.create({name: "npc_dex_negative", current: calcMod(data.dex) < 0 ? 1 : 0});
							character.attribs.create({name: "dexterity_flag", current: 0});

							character.attribs.create({name: "constitution", current: data.con});
							character.attribs.create({name: "constitution_base", current: `${data.con}`});
							character.attribs.create({name: "constitution_mod", current: calcMod(data.con)});
							character.attribs.create({name: "npc_con_negative", current: calcMod(data.con) < 0 ? 1 : 0});
							character.attribs.create({name: "constitution_flag", current: 0});

							character.attribs.create({name: "intelligence", current: data.int});
							character.attribs.create({name: "intelligence_base", current: `${data.int}`});
							character.attribs.create({name: "intelligence_mod", current: calcMod(data.int)});
							character.attribs.create({name: "npc_int_negative", current: calcMod(data.int) < 0 ? 1 : 0});
							character.attribs.create({name: "intelligence_flag", current: 0});

							character.attribs.create({name: "wisdom", current: data.wis});
							character.attribs.create({name: "wisdom_base", current: `${data.wis}`});
							character.attribs.create({name: "wisdom_mod", current: calcMod(data.wis)});
							character.attribs.create({name: "npc_wis_negative", current: calcMod(data.wis) < 0 ? 1 : 0});
							character.attribs.create({name: "wisdom_flag", current: 0});

							character.attribs.create({name: "charisma", current: data.cha});
							character.attribs.create({name: "charisma_base", current: `${data.cha}`});
							character.attribs.create({name: "charisma_mod", current: calcMod(data.cha)});
							character.attribs.create({name: "npc_cha_negative", current: calcMod(data.cha) < 0 ? 1 : 0});
							character.attribs.create({name: "charisma_flag", current: 0});

							character.attribs.create({name: "initiative_bonus", current: calcMod(data.dex)});

							character.attribs.create({name: "passive", current: passive});
							character.attribs.create({
								name: "npc_languages",
								current: data.languages != null ? data.languages instanceof Array ? data.languages.join(", ") : data.languages : ""
							});
							const moCn = cr.cr || cr;
							character.attribs.create({name: "npc_challenge", current: moCn});

							// set a rough character level for spellcasting calculations
							const pb = Parser.crToPb(moCn);
							character.attribs.create({name: "pb", current: pb});
							const charLevel = pb === 2 ? 1 : pb === 3 ? 5 : cr === 4 ? 11 : cr === 6 ? 17 : cr > 6 ? 20 : 1;
							character.attribs.create({name: "level", current: charLevel}).save();

							character.attribs.create({name: "npc_xp", current: xp});
							character.attribs.create({
								name: "npc_vulnerabilities",
								current: data.vulnerable != null ? d20plus.importer.getCleanText(Parser.getFullImmRes(data.vulnerable)) : ""
							});
							character.attribs.create({
								name: "damage_vulnerabilities",
								current: data.vulnerable != null ? d20plus.importer.getCleanText(Parser.getFullImmRes(data.vulnerable)) : ""
							});
							character.attribs.create({
								name: "npc_resistances",
								current: data.resist != null ? d20plus.importer.getCleanText(Parser.getFullImmRes(data.resist)) : ""
							});
							character.attribs.create({
								name: "damage_resistances",
								current: data.resist != null ? d20plus.importer.getCleanText(Parser.getFullImmRes(data.resist)) : ""
							});
							character.attribs.create({name: "npc_immunities", current: data.immune != null ? d20plus.importer.getCleanText(Parser.getFullImmRes(data.immune)) : ""});
							character.attribs.create({
								name: "damage_immunities",
								current: data.immune != null ? d20plus.importer.getCleanText(Parser.getFullImmRes(data.immune)) : ""
							});
							character.attribs.create({
								name: "npc_condition_immunities",
								current: data.conditionImmune != null ? d20plus.importer.getCleanText(Parser.getFullCondImm(data.conditionImmune)) : ""
							});
							character.attribs.create({
								name: "damage_condition_immunities",
								current: data.conditionImmune != null ? d20plus.importer.getCleanText(Parser.getFullCondImm(data.conditionImmune)) : ""
							});
							character.attribs.create({name: "npc_senses", current: sensesStr});
							if (d20plus.cfg.getOrDefault("import", "dexTiebreaker")) {
								character.attribs.create({
									name: "init_tiebreaker",
									current: "@{dexterity}/100"
								});
							}

							// add Tokenaction Macros
							if (d20plus.cfg.getOrDefault("import", "tokenactionsSkills")) {
								if (d20plus.sheet === "shaped") {

								} else {
									character.abilities.create({
										name: "Skill-Check",
										istokenaction: true,
										action: d20plus.actionMacroSkillCheck
									});
								}
							}
							if (d20plus.cfg.getOrDefault("import", "tokenactionsPerception")) {
								if (d20plus.sheet === "shaped") {

								} else {
									character.abilities.create({
										name: "Perception",
										istokenaction: true,
										action: d20plus.actionMacroPerception
									});
								}
							}
							if (d20plus.cfg.getOrDefault("import", "tokenactionsSaves")) {
								if (d20plus.sheet === "shaped") {
									character.abilities.create({
										name: "Saving Throws",
										istokenaction: true,
										action: `%{${character.id}|shaped_saving_throw_query}`
									});
								} else {
									character.abilities.create({
										name: "Saves",
										istokenaction: true,
										action: d20plus.actionMacroSaves
									});
								}
							}
							if (d20plus.cfg.getOrDefault("import", "tokenactionsInitiative")) {
								if (d20plus.sheet === "shaped") {
									character.abilities.create({
										name: "Init",
										istokenaction: true,
										action: `%{${character.id}|shaped_initiative}`
									});
								} else {
									character.abilities.create({
										name: "Init",
										istokenaction: true,
										action: d20plus.actionMacroInit
									});
								}
							}
							if (d20plus.cfg.getOrDefault("import", "tokenactionsChecks")) {
								if (d20plus.sheet === "shaped") {
									character.abilities.create({
										name: "Ability Checks",
										istokenaction: true,
										action: `%{${character.id}|shaped_ability_checks_query}`
									});
								} else {
									character.abilities.create({
										name: "Ability-Check",
										istokenaction: true,
										action: d20plus.actionMacroAbilityCheck
									});
								}
							}
							if (d20plus.cfg.getOrDefault("import", "tokenactionsOther")) {
								if (d20plus.sheet === "shaped") {

								} else {
									character.abilities.create({
										name: "DR/Immunities",
										istokenaction: true,
										action: d20plus.actionMacroDrImmunities
									});
									character.abilities.create({
										name: "Stats",
										istokenaction: true,
										action: d20plus.actionMacroStats
									});
								}
							}

							if (data.save != null) {
								character.attribs.create({name: "npc_saving_flag", current: "1337"}); // value doesn't matter
								Object.keys(data.save).forEach(k => {
									character.attribs.create({
										name: "npc_" + k + "_save_flag",
										current: Number(data.save[k]) != 0 ? 1 : 0
									});
									// save the values in case someone wants to edit them later
									character.attribs.create({
										name: "npc_" + k + "_save_base",
										current: Number(data.save[k])
									});
									character.attribs.create({
										name: "npc_" + k + "_save",
										current: Number(data.save[k])
									});
								});
							}
							if (data.skill != null) {
								const skills = data.skill;
								const skillsString = Object.keys(skills).map(function (k) {
									return k.uppercaseFirst() + ' ' + skills[k];
								}).join(', ');
								character.attribs.create({name: "npc_skills_flag", current: "1337"}); // value doesn't matter
								// character.attribs.create({name: "npc_skills", current: skillsString}); // no longer used

								// Shaped Sheet currently doesn't correctly load NPC Skills
								// This adds a visual representation as a Trait for reference
								if (d20plus.sheet === "shaped") {
									var newRowId = d20plus.ut.generateRowId();
									character.attribs.create({
										name: "repeating_npctrait_" + newRowId + "_name",
										current: "NPC Skills"
									});
									character.attribs.create({
										name: "repeating_npctrait_" + newRowId + "_desc",
										current: skillsString
									});
								}

								$.each(skills, function (k, v) {
									if (k !== "other") {
										const cleanSkill = $.trim(k).toLowerCase().replace(/ /g, "_");
										character.attribs.create({
											name: "npc_" + cleanSkill + "_base",
											current: String(Number(v))
										});
										character.attribs.create({
											name: "npc_" + cleanSkill,
											current: Number(v)
										});
										character.attribs.create({
											name: "npc_" + cleanSkill + "_flag",
											current: Number(v) != 0 ? 1 : 0
										});
									}
								});
							}
							if (data.spellcasting) { // Spellcasting import 2.0
								const charInterval = d20plus.cfg.get("import", "importIntervalCharacter") || d20plus.cfg.getDefault("import", "importIntervalCharacter");
								const spAbilsDelayMs = Math.max(350, Math.floor(charInterval / 5));

								// figure out the casting ability or spell DC
								let spellDc = null;
								let spellAbility = null;
								let casterLevel = null;
								let spellToHit = null;
								for (const sc of data.spellcasting) {
									if (!sc.headerEntries) continue;
									const toCheck = sc.headerEntries.join("");

									// use the first ability/DC we find, since roll20 doesn't support multiple
									const abM = /(strength|constitution|dexterity|intelligence|wisdom|charisma)/i.exec(toCheck);
									const dcM = /DC (\d+)|{@dc (\d+)}/i.exec(toCheck);
									const lvlM = /(\d+)(st|nd|rd|th).level\s+spellcaster/i.exec(toCheck);
									const spHit = /{@hit (.*?)} to hit with spell attacks/i.exec(toCheck);

									if (spellDc == null && dcM) spellDc = dcM[1] || dcM[2];
									if (casterLevel == null && lvlM) casterLevel = lvlM[1];
									if (spellAbility == null && abM) spellAbility = abM[1].toLowerCase();
									if (spellToHit == null && spHit) spellToHit = spHit[1];
								}

								function setAttrib (k, v) {
									d20plus.importer.addOrUpdateAttr(character, k, v);
								}

								function addInlineRollers (text) {
									if (!text) return text;
									return text.replace(RollerUtil.DICE_REGEX, (match) => {
										return `[[${match}]]`;
									});
								}

								// the basics
								setAttrib("npcspellcastingflag", "1");
								if (spellAbility != null) setAttrib("spellcasting_ability", `@{${spellAbility}_mod}+`); else console.warn("No spellAbility!");
								// spell_attack_mod -- never used?
								setTimeout(() => {
									if (spellToHit != null) setAttrib("spell_attack_bonus", Number(spellToHit)); else console.warn("No spellToHit!");
									if (spellDc != null) setAttrib("spell_save_dc", Number(spellDc)); else console.warn("No spellDc!");
									if (casterLevel != null) {
										setAttrib("caster_level", casterLevel);
										setAttrib("level", Number(casterLevel));
									} else console.warn("No casterLevel!");
								}, spAbilsDelayMs);

								// spell slots
								for (let i = 1; i <= 9; ++i) {
									const slots = data.spellcasting
										.map(it => ((it.spells || {})[i] || {}).slots)
										.filter(it => it)
										.reduce((a, b) => Math.max(a, b), 0);

									// delay this, otherwise they all come out as 0
									setTimeout(() => {
										setAttrib(`lvl${i}_slots_total`, slots);
									}, spAbilsDelayMs);
								}

								//this is just for 12 monsters in the whole bestiary that actually have this property and break the importer.
								//I do not think that it is very important but i can be wrong.
								for (let spc of data.spellcasting){
									delete spc.displayAs;
								}

								// add the spellcasting text
								const newRowId = d20plus.ut.generateRowId();
								const spellTrait = Renderer.monster.getSpellcastingRenderedTraits(renderer, data).map(it => it.rendered).filter(it => it).join("");
								const cleanDescription = d20plus.importer.getCleanText(spellTrait);
								setAttrib(`repeating_npctrait_${newRowId}_name`, "Spellcasting");
								setAttrib(`repeating_npctrait_${newRowId}_desc`, cleanDescription);

								// begin building a spells macro
								const $temp = $(spellTrait);
								$temp.find("a").each((i, e) => {
									const $wrp = $(`<div>${d20plus.monsters.TAG_SPELL_OPEN}</div>`);
									$wrp.append(e.outerHTML);
									$wrp.append(d20plus.monsters.TAG_SPELL_CLOSE);
									$(e).replaceWith($wrp)
								});
								const tokenActionStack = [d20plus.importer.getCleanText($temp[0].outerHTML)];

								// collect all the spells
								const allSpells = [];
								data.spellcasting.forEach(sc => {
									const toAdd = ["constant", "will", "rest", "daily", "weekly"];
									toAdd.forEach(k => {
										if (sc[k]) {
											Object.values(sc[k]).forEach(spOrSpArr => {
												if (spOrSpArr instanceof Array) {
													Array.prototype.push.apply(allSpells, spOrSpArr);
												} else {
													allSpells.push(spOrSpArr);
												}
											});
										}
									});

									if (sc.spells) {
										Object.keys(sc.spells).forEach(lvl => {
											if (sc.spells[lvl].spells) {
												Array.prototype.push.apply(allSpells, sc.spells[lvl].spells);
											}
										});
									}
								});

								// add spells to the sheet //////////////////
								const toAdd = [];
								allSpells.forEach(sp => {
									const tagSplit = Renderer.splitByTags(sp);
									tagSplit.forEach(s => {
										if (!s || !s.trim()) return;
										if (s.startsWith("{@")) {
											const [tag, text] = Renderer.splitFirstSpace(s.slice(1, -1));
											if (tag === "@spell") {
												toAdd.push(text);
											}
										}
									});
								});

								const addMacroIndex = toAdd.length - 1;
								// wait a bit, then start adding spells
								setTimeout(() => {
									toAdd.forEach((text, i) => {
										let [name, source] = text.split("|");
										if (!source) source = "PHB";
										const rawUrl = spellDataUrls[Object.keys(spellDataUrls).find(src => source.toLowerCase() === src.toLowerCase())];
										const url = d20plus.spells.formSpellUrl(rawUrl);
										// the JSON gets cached by the script, so this is fine
										DataUtil.loadJSON(url).then((data) => {
											const spell = data.spell.find(spell => spell.name.toLowerCase() === name.toLowerCase());

											const [notecontents, gmnotes] = d20plus.spells._getHandoutData(spell);

											addSpell3(JSON.parse(gmnotes), spell, i, addMacroIndex);
										});
									});
								}, spAbilsDelayMs);

								function addSpell3 (data, VeSp, index, addMacroIndex) {
									console.log("Adding spell: ", data.name);
									// prepare data
									data.content = addInlineRollers(data.content);
									const DESC_KEY = "data-description";
									data.data[DESC_KEY] = addInlineRollers(data.data[DESC_KEY]);
									const HL_KEY = "Higher Spell Slot Desc";
									if (data.data[HL_KEY]) data.data[HL_KEY] = addInlineRollers(data.data[HL_KEY]);

									// populate spell data
									// source: https://github.com/Roll20/roll20-character-sheets/blob/master/5th%20Edition%20OGL%20by%20Roll20/5th%20Edition%20OGL%20by%20Roll20.html

									// custom code
									function setAttrs (attrs, callbacks) {
										Object.entries(attrs).forEach(([a, v]) => {
											character.attribs.create({name: a, current: v}).save();
										});
										if (callbacks) callbacks.forEach(cb => cb());
									}

									// custom code
									function getAttrs (attrs) {
										const all = character.attribs.toJSON();
										const out = {};
										attrs.forEach(k => {
											const found = all.find(it => it.name === k)
											if (found) out[k] = found.current;
										})
										return out;
									}

									// largely stolen from `update_attack_from_spell`
									function update_attack_from_spell (lvl, spellid, attackid, newattack) {
										const v = getAttrs(["repeating_spell-" + lvl + "_" + spellid + "_spellname",
											"repeating_spell-" + lvl + "_" + spellid + "_spellrange",
											"repeating_spell-" + lvl + "_" + spellid + "_spelltarget",
											"repeating_spell-" + lvl + "_" + spellid + "_spellattack",
											"repeating_spell-" + lvl + "_" + spellid + "_spellcritrange",
											"repeating_spell-" + lvl + "_" + spellid + "_spelldamage",
											"repeating_spell-" + lvl + "_" + spellid + "_spellcustcrit",
											"repeating_spell-" + lvl + "_" + spellid + "_spelldamage2",
											"repeating_spell-" + lvl + "_" + spellid + "_spellcustcrit2",
											"repeating_spell-" + lvl + "_" + spellid + "_spelldamagetype",
											"repeating_spell-" + lvl + "_" + spellid + "_spelldamagetype2",
											"repeating_spell-" + lvl + "_" + spellid + "_spellhealing",
											"repeating_spell-" + lvl + "_" + spellid + "_spelldmgmod",
											"repeating_spell-" + lvl + "_" + spellid + "_spellsave",
											"repeating_spell-" + lvl + "_" + spellid + "_spellsavesuccess",
											"repeating_spell-" + lvl + "_" + spellid + "_spellhldie",
											"repeating_spell-" + lvl + "_" + spellid + "_spellhldietype",
											"repeating_spell-" + lvl + "_" + spellid + "_spellhlbonus",
											"repeating_spell-" + lvl + "_" + spellid + "_spelllevel",
											"repeating_spell-" + lvl + "_" + spellid + "_includedesc",
											"repeating_spell-" + lvl + "_" + spellid + "_spelldescription",
											"repeating_spell-" + lvl + "_" + spellid + "_spellathigherlevels",
											"repeating_spell-" + lvl + "_" + spellid + "_spell_damage_progression",
											"repeating_spell-" + lvl + "_" + spellid + "_innate",
											"repeating_spell-" + lvl + "_" + spellid + "_spell_ability",
											"spellcasting_ability"]);

										var update = {};
										var description = "";
										var spellAbility = v["repeating_spell-" + lvl + "_" + spellid + "_spell_ability"] != "spell" ? v["repeating_spell-" + lvl + "_" + spellid + "_spell_ability"].slice(0, -1) : "spell";
										update["repeating_attack_" + attackid + "_atkattr_base"] = spellAbility;

										if(newattack) {
											update["repeating_attack_" + attackid + "_options-flag"] = "0";
											update["repeating_attack_" + attackid + "_spellid"] = spellid;
											update["repeating_attack_" + attackid + "_spelllevel"] = lvl;
										}

										if(v["repeating_spell-" + lvl + "_" + spellid + "_spell_ability"] == "spell") {
											update["repeating_attack_" + attackid + "_savedc"] = "(@{spell_save_dc})";
										} else if (v["repeating_spell-" + lvl + "_" + spellid + "_spell_ability"]) {
											update["repeating_attack_" + attackid + "_savedc"] = "(" + spellAbility + "+8+@{spell_dc_mod}+@{pb})";
										}

										if(v["repeating_spell-" + lvl + "_" + spellid + "_spellname"] && v["repeating_spell-" + lvl + "_" + spellid + "_spellname"] != "") {
											update["repeating_attack_" + attackid + "_atkname"] = v["repeating_spell-" + lvl + "_" + spellid + "_spellname"];
										}
										if(!v["repeating_spell-" + lvl + "_" + spellid + "_spellattack"] || v["repeating_spell-" + lvl + "_" + spellid + "_spellattack"] === "None") {
											update["repeating_attack_" + attackid + "_atkflag"] = "0";
										}
										else {
											update["repeating_attack_" + attackid + "_atkflag"] = "{{attack=1}}";
											description = description + v["repeating_spell-" + lvl + "_" + spellid + "_spellattack"] + " Spell Attack. ";
										}

										if(v["repeating_spell-" + lvl + "_" + spellid + "_spellcritrange"]) {
											update["repeating_attack_" + attackid + "_atkcritrange"] = v["repeating_spell-" + lvl + "_" + spellid + "_spellcritrange"];
										}

										if(v["repeating_spell-" + lvl + "_" + spellid + "_spelldamage"] && v["repeating_spell-" + lvl + "_" + spellid + "_spelldamage"] != "") {
											update["repeating_attack_" + attackid + "_dmgflag"] = "{{damage=1}} {{dmg1flag=1}}";
											if(v["repeating_spell-" + lvl + "_" + spellid + "_spell_damage_progression"] && v["repeating_spell-" + lvl + "_" + spellid + "_spell_damage_progression"] === "Cantrip Dice") {
												update["repeating_attack_" + attackid + "_dmgbase"] = "[[round((@{level} + 1) / 6 + 0.5)]]" + v["repeating_spell-" + lvl + "_" + spellid + "_spelldamage"].substring(1);
											}
											else {
												update["repeating_attack_" + attackid + "_dmgbase"] = v["repeating_spell-" + lvl + "_" + spellid + "_spelldamage"];
												update["repeating_attack_" + attackid + "_dmgcustcrit"] = v["repeating_spell-" + lvl + "_" + spellid + "_spellcustcrit"] || "";
											}
										}
										else {
											update["repeating_attack_" + attackid + "_dmgflag"] = "0"
										}
										if(v["repeating_spell-" + lvl + "_" + spellid + "_spelldmgmod"] && v["repeating_spell-" + lvl + "_" + spellid + "_spelldmgmod"] === "Yes") {
											update["repeating_attack_" + attackid + "_dmgattr"] = spellAbility;
										}
										else {
											update["repeating_attack_" + attackid + "_dmgattr"] = "0";
										}
										if(v["repeating_spell-" + lvl + "_" + spellid + "_spelldamagetype"]) {
											update["repeating_attack_" + attackid + "_dmgtype"] = v["repeating_spell-" + lvl + "_" + spellid + "_spelldamagetype"];
										}
										else {
											update["repeating_attack_" + attackid + "_dmgtype"] = "";
										}
										if(v["repeating_spell-" + lvl + "_" + spellid + "_spelldamage2"]) {
											update["repeating_attack_" + attackid + "_dmg2base"] = v["repeating_spell-" + lvl + "_" + spellid + "_spelldamage2"];
											update["repeating_attack_" + attackid + "_dmg2attr"] = 0;
											update["repeating_attack_" + attackid + "_dmg2flag"] = "{{damage=1}} {{dmg2flag=1}}";
											update["repeating_attack_" + attackid + "_dmg2custcrit"] = v["repeating_spell-" + lvl + "_" + spellid + "_spellcustcrit2"] || "";
										}
										else {
											update["repeating_attack_" + attackid + "_dmg2base"] = "";
											update["repeating_attack_" + attackid + "_dmg2attr"] = 0;
											update["repeating_attack_" + attackid + "_dmg2flag"] = "0";
										}
										if(v["repeating_spell-" + lvl + "_" + spellid + "_spelldamagetype2"]) {
											update["repeating_attack_" + attackid + "_dmg2type"] = v["repeating_spell-" + lvl + "_" + spellid + "_spelldamagetype2"];
										}
										else {
											update["repeating_attack_" + attackid + "_dmg2type"] = "";
										}
										if(v["repeating_spell-" + lvl + "_" + spellid + "_spellrange"]) {
											update["repeating_attack_" + attackid + "_atkrange"] = v["repeating_spell-" + lvl + "_" + spellid + "_spellrange"];
										}
										else {
											update["repeating_attack_" + attackid + "_atkrange"] = "";
										}
										if(v["repeating_spell-" + lvl + "_" + spellid + "_spellrange"]) {
											update["repeating_attack_" + attackid + "_atkrange"] = v["repeating_spell-" + lvl + "_" + spellid + "_spellrange"];
										}
										else {
											update["repeating_attack_" + attackid + "_atkrange"] = "";
										}
										if(v["repeating_spell-" + lvl + "_" + spellid + "_spellsave"]) {
											update["repeating_attack_" + attackid + "_saveflag"] = "{{save=1}} {{saveattr=@{saveattr}}} {{savedesc=@{saveeffect}}} {{savedc=[[[[@{savedc}]][SAVE]]]}}";
											update["repeating_attack_" + attackid + "_saveattr"] = v["repeating_spell-" + lvl + "_" + spellid + "_spellsave"];
										}
										else {
											update["repeating_attack_" + attackid + "_saveflag"] = "0";
										}
										if(v["repeating_spell-" + lvl + "_" + spellid + "_spellsavesuccess"]) {
											update["repeating_attack_" + attackid + "_saveeffect"] = v["repeating_spell-" + lvl + "_" + spellid + "_spellsavesuccess"];
										}
										else {
											update["repeating_attack_" + attackid + "_saveeffect"] = "";
										}
										if(v["repeating_spell-" + lvl + "_" + spellid + "_spellhldie"] && v["repeating_spell-" + lvl + "_" + spellid + "_spellhldie"] != "" && v["repeating_spell-" + lvl + "_" + spellid + "_spellhldietype"] && v["repeating_spell-" + lvl + "_" + spellid + "_spellhldietype"] != "") {
											var bonus = "";
											var spelllevel = v["repeating_spell-" + lvl + "_" + spellid + "_spelllevel"];
											var query = "?{Cast at what level?";
											for(i = 0; i < 10-spelllevel; i++) {
												query = query + "|Level " + (parseInt(i, 10) + parseInt(spelllevel, 10)) + "," + i;
											}
											query = query + "}";
											if(v["repeating_spell-" + lvl + "_" + spellid + "_spellhlbonus"] && v["repeating_spell-" + lvl + "_" + spellid + "_spellhlbonus"] != "") {
												bonus = "+(" + v["repeating_spell-" + lvl + "_" + spellid + "_spellhlbonus"] + "*" + query + ")";
											}
											update["repeating_attack_" + attackid + "_hldmg"] = "{{hldmg=[[(" + v["repeating_spell-" + lvl + "_" + spellid + "_spellhldie"] + "*" + query + ")" + v["repeating_spell-" + lvl + "_" + spellid + "_spellhldietype"] + bonus + "]]}}";
										}
										else {
											update["repeating_attack_" + attackid + "_hldmg"] = "";
										}
										if(v["repeating_spell-" + lvl + "_" + spellid + "_spellhealing"] && v["repeating_spell-" + lvl + "_" + spellid + "_spellhealing"] != "") {
											if(!v["repeating_spell-" + lvl + "_" + spellid + "_spelldamage"] || v["repeating_spell-" + lvl + "_" + spellid + "_spelldamage"] === "") {
												update["repeating_attack_" + attackid + "_dmgbase"] = v["repeating_spell-" + lvl + "_" + spellid + "_spellhealing"];
												update["repeating_attack_" + attackid + "_dmgflag"] = "{{damage=1}} {{dmg1flag=1}}";
												update["repeating_attack_" + attackid + "_dmgtype"] = "Healing";
											}
											else if(!v["repeating_spell-" + lvl + "_" + spellid + "_spelldamage2"] || v["repeating_spell-" + lvl + "_" + spellid + "_spelldamage2"] === "") {
												update["repeating_attack_" + attackid + "_dmg2base"] = v["repeating_spell-" + lvl + "_" + spellid + "_spellhealing"];
												update["repeating_attack_" + attackid + "_dmg2flag"] = "{{damage=1}} {{dmg2flag=1}}";
												update["repeating_attack_" + attackid + "_dmg2type"] = "Healing";
											}
										}
										if(v["repeating_spell-" + lvl + "_" + spellid + "_innate"]) {
											update["repeating_attack_" + attackid + "_spell_innate"] = v["repeating_spell-" + lvl + "_" + spellid + "_innate"];
										}
										else {
											update["repeating_attack_" + attackid + "_spell_innate"] = "";
										}
										if(v["repeating_spell-" + lvl + "_" + spellid + "_spelltarget"]) {
											description = description + v["repeating_spell-" + lvl + "_" + spellid + "_spelltarget"] + ". ";
										}
										if(v["repeating_spell-" + lvl + "_" + spellid + "_includedesc"] && v["repeating_spell-" + lvl + "_" + spellid + "_includedesc"] === "on") {
											description = v["repeating_spell-" + lvl + "_" + spellid + "_spelldescription"];
											if(v["repeating_spell-" + lvl + "_" + spellid + "_spellathigherlevels"] && v["repeating_spell-" + lvl + "_" + spellid + "_spellathigherlevels"] != "") {
												description = description + "\n\nAt Higher Levels: " + v["repeating_spell-" + lvl + "_" + spellid + "_spellathigherlevels"];
											}
										}
										else if(v["repeating_spell-" + lvl + "_" + spellid + "_includedesc"] && v["repeating_spell-" + lvl + "_" + spellid + "_includedesc"] === "off") {
											description = "";
										}
										update["repeating_attack_" + attackid + "_atk_desc"] = description;

										// TODO are these necessary?
										// var callback = function() {update_attacks(attackid, "spell")};
										// setAttrs(update, {silent: true}, callback);
										setAttrs(update);
									}

									// largely stolen from `create_attack_from_spell`
									function create_attack_from_spell (lvl, spellid, character_id) {
										var update = {};
										var newrowid = d20plus.ut.generateRowId();
										update["repeating_spell-" + lvl + "_" + spellid + "_spellattackid"] = newrowid;
										update["repeating_spell-" + lvl + "_" + spellid + "_rollcontent"] = "%{" + character_id + "|repeating_attack_" + newrowid + "_attack}";
										setAttrs(update, update_attack_from_spell(lvl, spellid, newrowid, true));
									}

									// largely stolen from `processDrop`
									function processDrop (page) {
										const update = {};
										const callbacks = [];
										const id = d20plus.ut.generateRowId();

										/* eslint-disable block-spacing, no-extra-semi */
										var lvl = page.data["Level"] && page.data["Level"] > 0 ? page.data["Level"] : "cantrip";
										update["repeating_spell-" + lvl + "_" + id + "_spelllevel"] = lvl;
										if(page.data["spellcasting_ability"]) {
											update["repeating_spell-" + lvl + "_" + id + "_spell_ability"] = page.data["spellcasting_ability"];
										} else {
											update["repeating_spell-" + lvl + "_" + id + "_spell_ability"] = "spell";
										}
										if(page.name) {update["repeating_spell-" + lvl + "_" + id + "_spellname"] = page.name};
										if(page.data["Ritual"]) {update["repeating_spell-" + lvl + "_" + id + "_spellritual"] = "{{ritual=1}}"};
										if(page.data["School"]) {update["repeating_spell-" + lvl + "_" + id + "_spellschool"] = page.data["School"].toLowerCase()};
										if(page.data["Casting Time"]) {update["repeating_spell-" + lvl + "_" + id + "_spellcastingtime"] = page.data["Casting Time"]};
										if(page.data["Range"]) {update["repeating_spell-" + lvl + "_" + id + "_spellrange"] = page.data["Range"]};
										if(page.data["Target"]) {update["repeating_spell-" + lvl + "_" + id + "_spelltarget"] = page.data["Target"]};
										if(page.data["Components"]) {
											if(page.data["Components"].toLowerCase().indexOf("v") === -1) {update["repeating_spell-" + lvl + "_" + id + "_spellcomp_v"] = "0"};
											if(page.data["Components"].toLowerCase().indexOf("s") === -1) {update["repeating_spell-" + lvl + "_" + id + "_spellcomp_s"] = "0"};
											if(page.data["Components"].toLowerCase().indexOf("m") === -1) {update["repeating_spell-" + lvl + "_" + id + "_spellcomp_m"] = "0"};
										};
										if(page.data["Material"]) {update["repeating_spell-" + lvl + "_" + id + "_spellcomp_materials"] = page.data["Material"]};
										if(page.data["Concentration"]) {update["repeating_spell-" + lvl + "_" + id + "_spellconcentration"] = "{{concentration=1}}"};
										if(page.data["Duration"]) {update["repeating_spell-" + lvl + "_" + id + "_spellduration"] = page.data["Duration"]};
										if(page.data["Damage"] || page.data["Healing"]) {
											update["repeating_spell-" + lvl + "_" + id + "_spelloutput"] = "ATTACK";
											callbacks.push( function() {create_attack_from_spell(lvl, id, character.id);} );
										}
										else if(page.data["Higher Spell Slot Desc"] && page.data["Higher Spell Slot Desc"] != "") {
											var spelllevel = "?{Cast at what level?";
											for(i = 0; i < 10-lvl; i++) {
												spelllevel = spelllevel + "|Level " + (parseInt(i, 10) + parseInt(lvl, 10)) + "," + (parseInt(i, 10) + parseInt(lvl, 10));
											}
											spelllevel = spelllevel + "}";
											update["repeating_spell-" + lvl + "_" + id + "_rollcontent"] = "@{wtype}&{template:spell} {{level=@{spellschool} " + spelllevel + "}} {{name=@{spellname}}} {{castingtime=@{spellcastingtime}}} {{range=@{spellrange}}} {{target=@{spelltarget}}} @{spellcomp_v} @{spellcomp_s} @{spellcomp_m} {{material=@{spellcomp_materials}}} {{duration=@{spellduration}}} {{description=@{spelldescription}}} {{athigherlevels=@{spellathigherlevels}}} @{spellritual} {{innate=@{innate}}} @{spellconcentration} @{charname_output}";
										};
										if(page.data["Spell Attack"]) {update["repeating_spell-" + lvl + "_" + id + "_spellattack"] = page.data["Spell Attack"]};
										if(page.data["Crit Range"]) {update["repeating_spell-" + lvl + "_" + id + "_spellcritrange"] = page.data["Crit Range"]};
										if(page.data["Damage"]) {update["repeating_spell-" + lvl + "_" + id + "_spelldamage"] = page.data["Damage"]};
										if(page.data["Crit"]) {update["repeating_spell-" + lvl + "_" + id + "_spellcustcrit"] = page.data["Crit"]};
										if(page.data["Damage Type"]) {update["repeating_spell-" + lvl + "_" + id + "_spelldamagetype"] = page.data["Damage Type"]};
										if(page.data["Secondary Damage"]) {update["repeating_spell-" + lvl + "_" + id + "_spelldamage2"] = page.data["Secondary Damage"]};
										if(page.data["Secondary Crit"]) {update["repeating_spell-" + lvl + "_" + id + "_spellcustcrit2"] = page.data["Secondary Crit"]};
										if(page.data["Secondary Damage Type"]) {update["repeating_spell-" + lvl + "_" + id + "_spelldamagetype2"] = page.data["Secondary Damage Type"]};
										if(page.data["Healing"]) {update["repeating_spell-" + lvl + "_" + id + "_spellhealing"] = page.data["Healing"];};
										if(page.data["Add Casting Modifier"]) {update["repeating_spell-" + lvl + "_" + id + "_spelldmgmod"] = page.data["Add Casting Modifier"]};
										if(page.data["Save"]) {update["repeating_spell-" + lvl + "_" + id + "_spellsave"] = page.data["Save"]};
										if(page.data["Save Success"]) {update["repeating_spell-" + lvl + "_" + id + "_spellsavesuccess"] = page.data["Save Success"]};
										if(page.data["Higher Spell Slot Dice"]) {update["repeating_spell-" + lvl + "_" + id + "_spellhldie"] = page.data["Higher Spell Slot Dice"]};
										if(page.data["Higher Spell Slot Die"]) {update["repeating_spell-" + lvl + "_" + id + "_spellhldietype"] = page.data["Higher Spell Slot Die"]};
										if(page.data["Higher Spell Slot Bonus"]) {update["repeating_spell-" + lvl + "_" + id + "_spellhlbonus"] = page.data["Higher Spell Slot Bonus"]};
										if(page.data["Higher Spell Slot Desc"]) {update["repeating_spell-" + lvl + "_" + id + "_spellathigherlevels"] = page.data["Higher Spell Slot Desc"]};
										if(page.data["data-Cantrip Scaling"] && lvl == "cantrip") {update["repeating_spell-" + lvl + "_" + id + "_spell_damage_progression"] = "Cantrip " + page.data["data-Cantrip Scaling"].charAt(0).toUpperCase() + page.data["data-Cantrip Scaling"].slice(1);};
										if(page.data["data-description"]) { update["repeating_spell-" + lvl + "_" + id + "_spelldescription"] = page.data["data-description"]};
										update["repeating_spell-" + lvl + "_" + id + "_options-flag"] = "0";

										// custom writing:
										setAttrs(update, callbacks);
										/* eslint-enable block-spacing, no-extra-semi */
									}

									processDrop(data);

									// on final item, add macro
									if (index === addMacroIndex) {
										if (d20plus.cfg.getOrDefault("import", "tokenactionsSpells")) {
											if (d20plus.sheet === "shaped") {
												character.abilities.create({
													name: "Spells",
													istokenaction: true,
													action: `%{${character.id}|shaped_spells}`
												}).save();
											} else {
												// collect name and identifier for all the character's spells
												const macroSpells = character.attribs.toJSON()
													.filter(it => it.name.startsWith("repeating_spell-") && it.name.endsWith("spellname"))
													.map(it => ({identifier: it.name.replace(/_spellname$/, "_spell"), name: it.current}));

												// build tokenaction
												const ixToReplaceIn = tokenActionStack.length - 1;
												let toReplaceIn = tokenActionStack.last();

												macroSpells.forEach(mSp => {
													let didReplace = false;
													toReplaceIn = toReplaceIn.replace(new RegExp(`${d20plus.monsters.TAG_SPELL_OPEN}\\s*${mSp.name}\\s*${d20plus.monsters.TAG_SPELL_CLOSE}`, "gi"), () => {
														didReplace = true;
														return `[${mSp.name}](~selected|${mSp.identifier})`
													});

													if (!didReplace) {
														tokenActionStack.push(`[${mSp.name}](~selected|${mSp.identifier})`)
													}
												});

												// clean e.g.
												/*
												Cantrips:

												[...text...]
												 */
												// to
												/*
												Cantrips:
												[...text...]
												 */
												toReplaceIn = toReplaceIn.replace(/: *\n\n+/gi, ":\n");

												// clean any excess tags
												toReplaceIn = toReplaceIn
													.replace(new RegExp(d20plus.monsters.TAG_SPELL_OPEN, "gi"), "")
													.replace(new RegExp(d20plus.monsters.TAG_SPELL_CLOSE, "gi"), "");

												tokenActionStack[ixToReplaceIn] = toReplaceIn;

												character.abilities.create({
													name: "Spells",
													istokenaction: true,
													action: `/w gm @{selected|wtype}&{template:npcaction} {{name=@{selected|npc_name}}} {{rname=Spellcasting}} {{description=${tokenActionStack.join("")}}}`
												}).save();
											}
										}
									}
								}
							}
							if (data.trait) {
								$.each(data.trait, function (i, v) {
									var newRowId = d20plus.ut.generateRowId();
									character.attribs.create({
										name: "repeating_npctrait_" + newRowId + "_name",
										current: d20plus.importer.getCleanText(renderer.render(v.name))
									});

									if (d20plus.cfg.getOrDefault("import", "tokenactionsTraits")) {
										const offsetIndex = data.spellcasting ? 1 + i : i;
										character.abilities.create({
											name: "Trait" + offsetIndex + ": " + v.name,
											istokenaction: true,
											action: d20plus.actionMacroTrait(offsetIndex)
										});
									}

									var text = d20plus.importer.getCleanText(renderer.render({entries: v.entries}, 1));
									character.attribs.create({name: "repeating_npctrait_" + newRowId + "_desc", current: text});
								});
							}
							if (data.action) {
								let offset = 0;

								$.each(data.action, function (i, action) {
									const name = d20plus.importer.getCleanText(renderer.render(action.name));
									const text = d20plus.importer.getCleanText(renderer.render({entries: action.entries}, 1)).replace(/^\s*Hit:\s*/, "");

									// special cases for specific creatures
									if (data.name === "Hellfire Engine" && data.source === SRC_MTF && name === "Hellfire Weapons") {
										const baseActionEnts = action.entries.filter(it => typeof it === "string");
										baseActionEnts[0] = "The hellfire engine uses one of the options listed below.";
										const baseAction = renderer.render({entries: baseActionEnts}, 1);
										d20plus.importer.addAction(character, name, d20plus.importer.getCleanText(baseAction), i + offset);
										offset++;

										action.entries.find(it => it.type === "list").items.forEach(item => {
											const itemName = d20plus.importer.getCleanText(renderer.render(item.name));
											d20plus.importer.addAction(character, itemName, d20plus.importer.getCleanText(renderer.render({entries: [item.entry]})), i + offset);
											offset++;
										});

										offset++;
									} else if (/\bEye Rays?\b/i.test(name || "")) {
										const [base, ...others] = action.entries;

										const baseAction = renderer.render({entries: [base]}, 1);
										d20plus.importer.addAction(character, name, d20plus.importer.getCleanText(baseAction), i + offset);
										offset++;

										const packedOthers = [];
										const items = others[0].items;
										items.forEach(it => {
											const partName = /^\d+\.\s*[^.]+/.exec(it.name);
											packedOthers.push({
												name: partName,
												text: it.entry ? `${it.entry}` : it.entries.map(it => `${it}`).join("\n")
											});
										});

										packedOthers.forEach(it => {
											const actionName = d20plus.importer.getCleanText(renderer.render(it.name));
											const cleanText = d20plus.importer.getCleanText(renderer.render(it.text));
											d20plus.importer.addAction(character, actionName, cleanText, i + offset);
											offset++;
										});
									} else {
										d20plus.importer.addAction(character, name, text, i + offset);
									}
								});
							}
							if (data.bonus) {
								character.attribs.create({name: "bonusaction_flag", current: 1});
								character.attribs.create({name: "npcbonusactionsflag", current: 1});

								$.each(data.bonus, function (i, bonus) {
									const name = d20plus.importer.getCleanText(renderer.render(bonus.name));
									const text = d20plus.importer.getCleanText(renderer.render({entries: bonus.entries}, 1)).replace(/^\s*Hit:\s*/, "");

									d20plus.importer.addBonusAction(character, name, text, i);
								});
							}
							if (data.reaction) {
								character.attribs.create({name: "reaction_flag", current: 1});
								character.attribs.create({name: "npcreactionsflag", current: 1});

								if (d20plus.cfg.getOrDefault("import", "tokenactions") && d20plus.sheet === "shaped") {
									character.abilities.create({
										name: "Reactions",
										istokenaction: true,
										action: `%{${character.id}|shaped_reactions}`
									});
								}

								$.each(data.reaction, function (i, v) {
									var newRowId = d20plus.ut.generateRowId();
									let text = "";
									character.attribs.create({
										name: "repeating_npcreaction_" + newRowId + "_name",
										current: d20plus.importer.getCleanText(renderer.render(v.name))
									});

									if (d20plus.cfg.getOrDefault("import", "tokenactions") && d20plus.sheet !== "shaped") {
										character.abilities.create({
											name: "Reaction: " + v.name,
											istokenaction: true,
											action: d20plus.actionMacroReaction(i)
										});
									}

									text = d20plus.importer.getCleanText(renderer.render({entries: v.entries}, 1));
									character.attribs.create({
										name: "repeating_npcreaction_" + newRowId + "_desc",
										current: text
									});
									character.attribs.create({
										name: "repeating_npcreaction_" + newRowId + "_description",
										current: text
									});
								});
							}
							if (data.legendary) {
								character.attribs.create({name: "legendary_flag", current: "1"});
								let legendaryActions = data.legendaryActions || 3;
								character.attribs.create({name: "npc_legendary_actions", current: legendaryActions.toString()});

								if (d20plus.cfg.getOrDefault("import", "tokenactions") && d20plus.sheet === "shaped") {
									character.abilities.create({
										name: "Legendary Actions",
										istokenaction: true,
										action: `%{${character.id}|shaped_legendaryactions}`
									});
								}

								let tokenactiontext = "";
								$.each(data.legendary, function (i, action) {
									const name = d20plus.importer.getCleanText(renderer.render(action.name));
									const text = d20plus.importer.getCleanText(renderer.render({entries: action.entries}, 1)).replace(/^\s*Hit:\s*/, "");

									d20plus.importer.addLegendaryAction(character, name, text, i);

									if (d20plus.cfg.getOrDefault("import", "tokenactions") && !d20plus.cfg.getOrDefault("import", "tokenactionsExpanded") && d20plus.sheet !== "shaped") {
										tokenactiontext += "[" + name + "](~selected|repeating_npcaction-l_$" + i + "_npc_action)\n\r";
									}
								});

								if (d20plus.cfg.getOrDefault("import", "tokenactions") && !d20plus.cfg.getOrDefault("import", "tokenactionsExpanded") && d20plus.sheet !== "shaped") {
									character.abilities.create({
										name: "Legendary Actions",
										istokenaction: true,
										action: d20plus.actionMacroLegendary(tokenactiontext)
									});
								}
							}
							if (data.mythic) {
								character.attribs.create({name: "npc_mythic_actions", current: "1"});
								character.attribs.create({name: "npc_mythic_actions_desc", current: data.mythicHeader[0]});

								let tokenactiontext = "";
								$.each(data.mythic, function (i, action) {
									const name = d20plus.importer.getCleanText(renderer.render(action.name));
									const text = d20plus.importer.getCleanText(renderer.render({entries: action.entries}, 1)).replace(/^\s*Hit:\s*/, "");

									d20plus.importer.addMythicAction(character, name, text, i);

									if (d20plus.cfg.getOrDefault("import", "tokenactions") && !d20plus.cfg.getOrDefault("import", "tokenactionsExpanded") && d20plus.sheet !== "shaped") {
										tokenactiontext += "[" + name + "](~selected|repeating_npcaction-m_$" + i + "_npc_action)\n\r";
									}
								});

								if (d20plus.cfg.getOrDefault("import", "tokenactions") && !d20plus.cfg.getOrDefault("import", "tokenactionsExpanded") && d20plus.sheet !== "shaped") {
									character.abilities.create({
										name: "Mythic Actions",
										istokenaction: true,
										action: d20plus.actionMacroMythic(tokenactiontext)
									});
								}
							}

							// set show/hide NPC names in rolls
							if (d20plus.cfg.has("import", "showNpcNames") && !d20plus.cfg.get("import", "showNpcNames")) {
								character.attribs.create({name: "npc_name_flag", current: 0});
							}

							if (d20plus.cfg.getOrDefault("import", "tokenactions") && d20plus.sheet === "shaped") {
								character.abilities.create({
									name: "Actions",
									istokenaction: true,
									action: `%{${character.id}|shaped_actions}`
								});

								// TODO lair action creation is unimplemented
								/*
								character.abilities.create({
									name: "Lair Actions",
									istokenaction: true,
									action: `%{${character.id}|shaped_lairactions}`
								});
								*/
							}

							character.view.updateSheetValues();

							if (renderFluff) {
								setTimeout(() => {
									const fluffAs = d20plus.cfg.get("import", "importFluffAs") || d20plus.cfg.getDefault("import", "importFluffAs");
									let k = fluffAs === "Bio"? "bio" : "gmnotes";
									character.updateBlobs({
										[k]: Markdown.parse(renderFluff)
									});
									character.save({
										[k]: (new Date).getTime()
									});
								}, 500);
							}
						} catch (e) {
							d20plus.ut.log("Error loading [" + name + "]");
							d20plus.addImportError(name);
							console.log(data);
							console.log(e);
						}
						/* end OGL Sheet */
						d20.journal.addItemToFolderStructure(character.id, folder.id);

						if (options.charFunction) {
							options.charFunction(character);
						}
					}
				});
		};

		// pre-load fluff
		const src = data.source;
		if (src && monsterFluffDataUrls[src]) {
			const fluffUrl = d20plus.monsters.formMonsterUrl(monsterFluffDataUrls[src]);
			DataUtil.loadJSON(fluffUrl).then((data) => {
				monsterFluffData[src] = data;
			}).catch(e => {
				console.error(e);
				monsterFluffData[src] = {monster: []};
			}).then(doBuild);
		} else {
			doBuild();
		}
	};
}

SCRIPT_EXTENSIONS.push(d20plusMonsters);
