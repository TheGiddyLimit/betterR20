function d20plusImporter () {
	d20plus.importer = {};

	d20plus.importer._playerImports = {};
	d20plus.importer.storePlayerImport = function (id, data) {
		d20plus.importer._playerImports[id] = data;
	};

	d20plus.importer.retrievePlayerImport = function (id) {
		return d20plus.importer._playerImports[id];
	};

	d20plus.importer.clearPlayerImport = function () {
		d20plus.importer._playerImports = {};
	};

	d20plus.importer.addBrewMeta = function (meta) {
		if (!meta) return;
		BrewUtil._sourceCache = BrewUtil._sourceCache || {};
		if (meta.sources) {
			meta.sources.forEach(src => {
				BrewUtil._sourceCache[src.json] = {abbreviation: src.abbreviation, full: src.full};
			});
		}
		const cpy = MiscUtil.copy(meta);
		delete cpy.sources;
		Object.keys(cpy).forEach(k => {
			BrewUtil.homebrewMeta[k] = BrewUtil.homebrewMeta[k] || {};
			Object.assign(BrewUtil.homebrewMeta[k], cpy[k]);
		});
	};

	d20plus.importer.pAddBrew = async function (data) {
		if (!data) return;

		const toAdd = {};
		if (data._meta) toAdd._meta = data._meta;
		BrewUtil._STORABLE
			.filter(k => data[k] != null && data[k] instanceof Array)
			.forEach(k => {
				toAdd[k] = data[k].filter(it => {
					if (it.source) return !Parser.SOURCE_JSON_TO_ABV[it.source];
					if (it.inherits) return !Parser.SOURCE_JSON_TO_ABV[it.inherits.source];
					return false;
				});
			});

		await BrewUtil.pDoHandleBrewJson(toAdd, "NO_PAGE");
	};

	d20plus.importer.getCleanText = function (str) {
		if (!str || !str.trim()) return "";

		const check = jQuery.parseHTML(str);
		if (check.length === 1 && check[0].constructor === Text) {
			return str;
		}
		const $ele = $(str);
		$ele.find("td, th").append(" | ");
		$ele.find("tr").append("\n");
		$ele.find("p, li, br").append("\n\n");
		$ele.find("li").prepend(" - ");

		return $ele.text()
			.trim()
			.replace(/\n/g, "<<N>>")
			.replace(/\s+/g, " ")
			.replace(/<<N>>(<<N>>)+/g, "\n\n")
			.replace(/<<N>>/g, "\n")
			.replace(/\n +/g, "\n");

		/* version which preserves images, and converts dice
	const IMG_TAG = "R20IMGTAG";
	let imgIndex = 0;
	const imgStack = [];
	str.replace(/(<img.*>)/, (match) => {
		imgStack.push(match);
		return ` ${IMG_TAG}_${imgIndex++} `;
	});
	const $ele = $(str);
	$ele.find("p, li, br").append("\n\n");
	let out = $ele.text();
	out = out.replace(DICE_REGEX, (match) => {
		return `[[${match}]]`;
	});
	return out.replace(/R20IMGTAG_(\d+)/, (match, g1) => {
		return imgStack[Number(g1)];
	});
	*/
	};

	// TODO do a pre-pass _before_ this, attempting to link content tags to already-imported 5etools content (by scanning thru GM notes and attempting to parse as JSON -- cache the results of this scan, as it will presumably be super-expensive (need to then invalidate or add to this cache when importing new stuff))
	// TODO pass rendered text to this, as a post-processing step
	/**
	 * Attempt to find + swap links to 5e.tools to links to handouts.
	 *
	 * @param str HTML string, usually output by the renderer.
	 */
	d20plus.importer.tryReplaceLinks = function (str) {
		const $temp = $(`<div/>`);
		$temp.append(str);
		$temp.find(`a`).filter((i, e) => {
			const href = $(e).attr("href");
			if (!href || !href.trim()) return false;
			return href.toLowerCase().startsWith(BASE_SITE_URL);
		}).each((i, e) => {
			const txt = $(e).text();
			// TODO get text, compare against existing handout/character names, and link them using this:
            //   `http://journal.roll20.net/${id.type}/${id.roll20Id}`;
		});
	};

	d20plus.importer.doFakeDrop = function (event, characterView, fakeRoll20Json, outerI) {
		const e = characterView; // AKA character.view
		const o = fakeRoll20Json;

		// The page/subheading area always undefined, since we're not coming from the compendium. Pass in some junk.
		const t = d20plus.ut.generateRowId(); // `$(i.helper[0]).attr("data-pagename")` e.g. "Spells%3AFire%20Bolt"
		const n = undefined; // `$(i.helper[0]).attr("data-subhead")` e.g. undefined

		// Clean out any lingering values
		if (e.$currentDropTarget) {
			e.$currentDropTarget.find("*[accept]").each(function() {
				$(this).val(undefined);
			});
		} else {
			console.error(`Could not find current drop target!`);
			return;
		}

		// BEGIN ROLL20 CODE
		const r = _.clone(o.data);
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
		// END ROLL20 CODE

		// reset the drag UI
		characterView.activeDrop = false;
		characterView.compendiumDragOver()
	};

	// caller should run `$iptFilter.off("keydown").off("keyup");` before calling this
	d20plus.importer.addListFilter = function ($iptFilter, dataList, listObj, listIndexConverter) {
		$iptFilter.val("");
		const TYPE_TIMEOUT_MS = 100;
		let typeTimer;
		$iptFilter.on("keyup", () => {
			clearTimeout(typeTimer);
			typeTimer = setTimeout(() => {
				const exps = $iptFilter.val().split(";");
				const filters = exps.map(it => it.trim())
					.filter(it => it)
					.map(it => it.toLowerCase().split(":"))
					.filter(it => it.length === 2)
					.map(it => ({field: it[0], value: it[1]}));
				const grouped = [];
				filters.forEach(f => {
					const existing = grouped.find(it => it.field === f.field);
					if (existing) existing.values.push(f.value);
					else grouped.push({field: f.field, values: [f.value]})
				});

				listObj.filter((item) => {
					const it = dataList[$(item.elm).attr("data-listid")];
					it._filterVs = it._filterVs || listIndexConverter(it);
					return !grouped.find(f => {
						if (it._filterVs[f.field]) {
							if (it._filterVs[f.field] instanceof Array) {
								return !(it._filterVs[f.field].find(v => f.values.includes(v)));
							} else {
								return !f.values.includes(it._filterVs[f.field])
							}
						}
						return false;
					});
				});
			}, TYPE_TIMEOUT_MS);
		});
		$iptFilter.on("keydown", () => {
			clearTimeout(typeTimer);
		});
	};

	d20plus.importer.getSetAvatarImage = async function (character, avatar, portraitUrl) {
		var tokensize = 1;
		if (character.size === "L") tokensize = 2;
		if (character.size === "H") tokensize = 3;
		if (character.size === "G") tokensize = 4;
		var lightradius = null;
		if (character.senses && character.senses.toLowerCase().match(/(darkvision|blindsight|tremorsense|truesight)/)) lightradius = Math.max(...character.senses.match(/\d+/g));
		var lightmin = 0;
		if (character.senses && character.senses.toLowerCase().match(/(blindsight|tremorsense|truesight)/)) lightmin = lightradius;
		const nameSuffix = d20plus.cfg.get("import", "namesuffix");
		var defaulttoken = {
			represents: character.id,
			name: `${character.name}${nameSuffix ? ` ${nameSuffix}` : ""}`,
			imgsrc: avatar,
			width: 70 * tokensize,
			height: 70 * tokensize,
			compact_bar: d20plus.cfg.getOrDefault("token", "isCompactBars") ? "compact" : "standard"
		};
		if (!d20plus.cfg.get("import", "skipSenses")) {
			defaulttoken.light_hassight = true;
			if (lightradius != null) {
				defaulttoken.light_radius = `${lightradius}`;
				defaulttoken.light_dimradius = `${lightmin}`;
			}
		}
		const barLocation = d20plus.cfg.getOrDefault("token", "barLocation");
		switch (barLocation) {
			case "Above": defaulttoken.bar_location = "above"; break;
			case "Top Overlapping": defaulttoken.bar_location = "overlap_top"; break;
			case "Bottom Overlapping": defaulttoken.bar_location = "overlap_bottom"; break;
			case "Below": defaulttoken.bar_location = "below"; break;
		}

		// ensure any portrait URL exists
		let outPortraitUrl = portraitUrl || avatar;
		if (portraitUrl) {
			await new Promise(resolve => {
				$.ajax({
					url: portraitUrl,
					type: 'HEAD',
					error: function () {
						d20plus.ut.error(`Could not access portrait URL "${portraitUrl}"`);
						outPortraitUrl = avatar;
						resolve()
					},
					success: () => resolve()
				});
			});
		}

		character.attributes.avatar = outPortraitUrl;
		character.updateBlobs({avatar: outPortraitUrl, defaulttoken: JSON.stringify(defaulttoken)});
		character.save({defaulttoken: (new Date()).getTime()});
	};

	d20plus.importer._baseAddAction = function (character, baseAction, name, actionText, prefix, index, expand) {
		if (d20plus.cfg.getOrDefault("import", "tokenactions") && expand) {
			character.abilities.create({
				name: prefix + index + ": " + name,
				istokenaction: true,
				action: d20plus.actionMacroAction(baseAction, index)
			}).save();
		}

		const newRowId = d20plus.ut.generateRowId();
		let actionDesc = actionText; // required for later reduction of information dump.

		function handleAttack () {
			const rollBase = d20plus.importer.rollbase(); // macro

			let attackType = "";
			let attackType2 = "";
			if (actionText.indexOf(" Weapon Attack:") > -1) {
				attackType = actionText.split(" Weapon Attack:")[0];
				attackType2 = " Weapon Attack:";
			} else if (actionText.indexOf(" Spell Attack:") > -1) {
				attackType = actionText.split(" Spell Attack:")[0];
				attackType2 = " Spell Attack:";
			}
			let attackRange = "";
			let rangeType = "";
			if (attackType.indexOf("Melee") > -1) {
				attackRange = (actionText.match(/reach (.*?),/) || ["", ""])[1];
				rangeType = "Reach";
			} else {
				attackRange = (actionText.match(/range (.*?),/) || ["", ""])[1];
				rangeType = "Range";
			}
			const toHit = (actionText.match(/\+(.*?) to hit/) || ["", ""])[1];
			let damage = "";
			let damageType = "";
			let damage2 = "";
			let damageType2 = "";
			let onHit = "";
			let damageRegex = /\d+ \((\d+d\d+\s?(?:\+|-)?\s?\d*)\) (\S+ )?damage/g;
			let damageSearches = damageRegex.exec(actionText);
			if (damageSearches) {
				onHit = damageSearches[0];
				damage = damageSearches[1];
				damageType = (damageSearches[2] != null) ? damageSearches[2].trim() : "";
				damageSearches = damageRegex.exec(actionText);
				if (damageSearches) {
					onHit += " plus " + damageSearches[0];
					damage2 = damageSearches[1];
					damageType2 = (damageSearches[2] != null) ? damageSearches[2].trim() : "";
				}
			}
			onHit = onHit.trim();
			const attackTarget = ((actionText.match(/\.,(?!.*\.,)(.*)\. Hit:/) || ["", ""])[1] || "").trim();
			// Cut the information dump in the description
			const atkDescSimpleRegex = /Hit: \d+ \((\d+d\d+\s?(?:\+|-)?\s?\d*)\) (\S+ )?damage\.([\s\S]*)/gm;
			const atkDescComplexRegex = /(Hit:[\s\S]*)/g;
			// is it a simple attack (just 1 damage type)?
			const match_simple_atk = atkDescSimpleRegex.exec(actionText);
			if (match_simple_atk != null) {
				//if yes, then only display special effects, if any
				actionDesc = match_simple_atk[3].trim();
			} else {
				//if not, simply cut everything before "Hit:" so there are no details lost.
				const matchCompleteAtk = atkDescComplexRegex.exec(actionText);
				if (matchCompleteAtk != null) actionDesc = matchCompleteAtk[1].trim();
			}
			const toHitRange = "+" + toHit + ", " + rangeType + " " + attackRange + ", " + attackTarget + ".";
			const damageFlags = `{{damage=1}} {{dmg1flag=1}}${damage2 ? ` {{dmg2flag=1}}` : ""}`;
			character.attribs.create({name: baseAction + "_" + newRowId + "_name", current: name}).save();
			character.attribs.create({name: baseAction + "_" + newRowId + "_attack_flag", current: "on"}).save();
			character.attribs.create({name: baseAction + "_" + newRowId + "_npc_options-flag", current: "0"}).save();
			character.attribs.create({name: baseAction + "_" + newRowId + "_attack_display_flag", current: "{{attack=1}}"}).save();
			character.attribs.create({name: baseAction + "_" + newRowId + "_attack_options", current: "{{attack=1}}"}).save();
			character.attribs.create({name: baseAction + "_" + newRowId + "_attack_tohit", current: toHit}).save();
			character.attribs.create({name: baseAction + "_" + newRowId + "_attack_damage", current: damage}).save();
			// TODO this might not be necessary on Shaped sheets?
			const critDamage = (damage || "").trim().replace(/[-+]\s*\d+$/, "").trim(); // replace any trailing modifiers e.g. "+5"
			character.attribs.create({name: baseAction + "_" + newRowId + "_attack_crit", current: critDamage}).save();
			character.attribs.create({name: baseAction + "_" + newRowId + "_attack_damagetype", current: damageType}).save();
			if (damage2) {
				character.attribs.create({name: baseAction + "_" + newRowId + "_attack_damage2", current: damage2}).save();
				character.attribs.create({name: baseAction + "_" + newRowId + "_attack_crit2", current: damage2}).save();
				character.attribs.create({name: baseAction + "_" + newRowId + "_attack_damagetype2", current: damageType2}).save();
			}
			character.attribs.create({name: baseAction + "_" + newRowId + "_name_display", current: name}).save();
			character.attribs.create({name: baseAction + "_" + newRowId + "_rollbase", current: rollBase}).save();
			character.attribs.create({name: baseAction + "_" + newRowId + "_attack_type", current: attackType}).save();
			character.attribs.create({name: baseAction + "_" + newRowId + "_attack_type_display", current: attackType + attackType2}).save();
			character.attribs.create({name: baseAction + "_" + newRowId + "_attack_tohitrange", current: toHitRange}).save();
			character.attribs.create({name: baseAction + "_" + newRowId + "_attack_range", current: attackRange}).save();
			character.attribs.create({name: baseAction + "_" + newRowId + "_attack_target", current: attackTarget}).save();
			character.attribs.create({name: baseAction + "_" + newRowId + "_damage_flag", current: damageFlags}).save();
			character.attribs.create({name: baseAction + "_" + newRowId + "_attack_onhit", current: onHit}).save();

			const descriptionFlag = Math.max(Math.ceil(actionText.length / 57), 1);
			character.attribs.create({name: baseAction + "_" + newRowId + "_description", current: actionDesc}).save();
			character.attribs.create({name: baseAction + "_" + newRowId + "_description_flag", current: descriptionFlag}).save();

			// hidden = a single space
			const descVisFlag = d20plus.cfg.getOrDefault("import", "hideActionDescs") ? " " : "@{description}";
			character.attribs.create({name: `${baseAction}_${newRowId}_show_desc`, current: descVisFlag}).save();
		}

		function handleOtherAction () {
			const rollBase = d20plus.importer.rollbase(false); // macro
			character.attribs.create({name: baseAction + "_" + newRowId + "_name", current: name}).save();
			character.attribs.create({name: baseAction + "_" + newRowId + "_npc_options-flag", current: "0"}).save();
			character.attribs.create({name: baseAction + "_" + newRowId + "_description", current: actionDesc}).save();
			character.attribs.create({name: baseAction + "_" + newRowId + "_attack_tohitrange", current: "+0"}).save();
			character.attribs.create({name: baseAction + "_" + newRowId + "_attack_onhit", current: ""}).save();
			character.attribs.create({name: baseAction + "_" + newRowId + "_damage_flag", current: ""}).save();
			character.attribs.create({name: baseAction + "_" + newRowId + "_attack_crit", current: ""}).save();
			character.attribs.create({name: baseAction + "_" + newRowId + "_attack_crit2", current: ""}).save();
			character.attribs.create({name: baseAction + "_" + newRowId + "_rollbase", current: rollBase}).save();
		}

		// attack parsing
		if (actionText.includes(" Attack:")) handleAttack();
		else handleOtherAction();
	};

	d20plus.importer.addAction = function (character, name, actionText, index) {
		d20plus.importer._baseAddAction(character, "repeating_npcaction", name, actionText, "", index, true);
	};

	d20plus.importer.addBonusAction = function (character, name, actionText, index) {
		d20plus.importer._baseAddAction(character, "repeating_npcbonusaction", name, actionText, "Bonus", index, true);
	};

	d20plus.importer.addLegendaryAction = function (character, name, actionText, index) {
		const expand = d20plus.cfg.getOrDefault("import", "tokenactionsExpanded");
		d20plus.importer._baseAddAction(character, "repeating_npcaction-l", name, actionText, "Legendary", index, expand);
	};

	d20plus.importer.addMythicAction = function (character, name, actionText, index) {
		const expand = d20plus.cfg.getOrDefault("import", "tokenactionsExpanded");
		d20plus.importer._baseAddAction(character, "repeating_npcaction-m", name, actionText, "Mythic", index, expand);
	};

	d20plus.importer.findAttrId = function (character, attrName) {
		const found = character.attribs.toJSON().find(a => a.name === attrName);
		return found ? found.id : undefined;
	};

	d20plus.importer.findOrGenerateRepeatingRowId = function (character, namePattern, current) {
		const [namePrefix, nameSuffix] = namePattern.split(/\$\d?/);
		const attr = character.attribs.toJSON()
			.find(a => a.name.startsWith(namePrefix) && a.name.endsWith(nameSuffix) && a.current == current);
		return attr ?
			attr.name.replace(RegExp(`^${namePrefix}(.*)${nameSuffix}$`), "$1") :
			d20plus.ut.generateRowId();
	}

	d20plus.importer.addOrUpdateAttr = function (character, attrName, value) {
		const id = d20plus.importer.findAttrId(character, attrName);
		if (id) {
			const it = character.attribs.get(id).set("current", value);
			it.save();
		} else {
			const it = character.attribs.create({
				"name": attrName,
				"current": value
			});
			it.save();
		}
	};

	d20plus.importer.makePlayerDraggable = function (importId, name) {
		const $appTo = $(`#d20plus-playerimport`).find(`.Vetools-player-imported`);
		const $li = $(`
		<li class="journalitem dd-item handout ui-draggable compendium-item Vetools-draggable player-imported" data-playerimportid="${importId}">
			<div class="dd-handle dd-sortablehandle">Drag</div>
			<div class="dd-content">
				<div class="token"><img src="/images/handout.png" draggable="false"></div>
				<div class="name">
					<div class="namecontainer">${name}</div>
				</div>
			</div>
		</li>
	`);
		d20plus.importer.bindFakeCompendiumDraggable($li);
		$appTo.prepend($li);
	};

	d20plus.importer.bindFakeCompendiumDraggable = function ($ele) {
		$ele.draggable({
			// region BEGIN ROLL20 CODE
			revert: !0,
			distance: 10,
			revertDuration: 0,
			helper: "clone",
			appendTo: "body",
			scroll: !1,
			iframeFix: !0,
			start() {
				$(".characterdialog iframe").css("pointer-events", "none"),
					$(".characterdialog .charsheet-compendium-drop-target").show()
			},
			drag(e) {
				let t, i = 0;
				const n = [];
				$(".characterdialog[data-characterid]").each((e,o)=>{
						const r = d20.Campaign.characters.get($(o).data("characterid"));
						if (r && r.view.dragOver) {
							const e = parseInt(r.view.$el.parent().css("z-index"));
							n.push(r),
							e > i && (t = r.id,
								i = e)
						}
					}
				);
				n.forEach(i=>{
						if (i.id === t) {
							const t = i.view.$el.offset();
							i.view.compendiumDragOver(e.pageX - t.left, e.pageY - t.top),
								i.view.activeDrop = !0
						} else
							i.view.activeDrop = !1,
								i.view.compendiumDragOver()
					}
				)
			},
			stop() {
				$(".characterdialog iframe").css("pointer-events", "auto"),
					$(".characterdialog .charsheet-compendium-drop-target").hide()
			},
			// endregion END ROLL20 CODE
		});
	};

	d20plus.importer.getTagString = function (data, prefix) {
		return JSON.stringify(data.filter(it => it).map(d => `${prefix}-${Parser.stringToSlug(d.toString())}`).concat([prefix]));
	};

	// from OGL sheet, Aug 2018
	d20plus.importer.rollbase = (isAttack = true) => {
		const dtype = d20plus.importer.getDesiredDamageType();
		if (dtype === "full") {
			return `@{wtype}&{template:npcaction} ${isAttack ? `{{attack=1}}` : ""} @{damage_flag} @{npc_name_flag} {{rname=@{name}}} {{r1=[[@{d20}+(@{attack_tohit}+0)]]}} @{rtype}+(@{attack_tohit}+0)]]}} {{dmg1=[[@{attack_damage}+0]]}} {{dmg1type=@{attack_damagetype}}} {{dmg2=[[@{attack_damage2}+0]]}} {{dmg2type=@{attack_damagetype2}}} {{crit1=[[@{attack_crit}+0]]}} {{crit2=[[@{attack_crit2}+0]]}} {{description=@{show_desc}}} @{charname_output}`;
		} else {
			return `@{wtype}&{template:npcatk} ${isAttack ? `{{attack=1}}` : ""} @{damage_flag} @{npc_name_flag} {{rname=[@{name}](~repeating_npcaction_npc_dmg)}} {{rnamec=[@{name}](~repeating_npcaction_npc_crit)}} {{type=[Attack](~repeating_npcaction_npc_dmg)}} {{typec=[Attack](~repeating_npcaction_npc_crit)}} {{r1=[[@{d20}+(@{attack_tohit}+0)]]}} @{rtype}+(@{attack_tohit}+0)]]}} {{description=@{show_desc}}} @{charname_output}`;
		}

	};

	d20plus.importer.getDesiredRollType = function () {
		// rtype
		const toggle = "@{advantagetoggle}";
		const never = "{{normal=1}} {{r2=[[0d20";
		const always = "{{always=1}} {{r2=[[@{d20}";
		const query = "{{query=1}} ?{Advantage?|Normal Roll,&#123&#123normal=1&#125&#125 &#123&#123r2=[[0d20|Advantage,&#123&#123advantage=1&#125&#125 &#123&#123r2=[[@{d20}|Disadvantage,&#123&#123disadvantage=1&#125&#125 &#123&#123r2=[[@{d20}}";
		const desired = d20plus.cfg.get("import", "advantagemode");
		if (desired) {
			switch (desired) {
				case "Toggle (Default Advantage)":
				case "Toggle":
				case "Toggle (Default Disadvantage)":
					return toggle;
				case "Always":
					return always;
				case "Query":
					return query;
				case "Never":
					return never;
			}
		} else {
			return toggle;
		}
	};

	d20plus.importer.getDesiredAdvantageToggle = function () {
		// advantagetoggle
		const advantage = "{{query=1}} {{advantage=1}} {{r2=[[@{d20}";
		const disadvantage = "{{query=1}} {{disadvantage=1}} {{r2=[[@{d20}";
		const desired = d20plus.cfg.get("import", "advantagemode");
		const neither = "";
		if (desired) {
			switch (desired) {
				case "Toggle (Default Advantage)":
					return advantage;
				case "Toggle (Default Disadvantage)":
					return desired;
				case "Toggle":
				case "Always":
				case "Query":
				case "Never":
					return neither;
			}
		} else {
			return neither;
		}
	};

	d20plus.importer.getDesiredWhisperType = function () {
		// wtype
		const toggle = "@{whispertoggle}";
		const never = " ";
		const always = "/w gm ";
		const query = "?{Whisper?|Public Roll,|Whisper Roll,/w gm }";
		const desired = d20plus.cfg.get("import", "whispermode");
		if (desired) {
			switch (desired) {
				case "Toggle (Default GM)":
				case "Toggle (Default Public)":
					return toggle;
				case "Always":
					return always;
				case "Query":
					return query;
				case "Never":
					return never;
			}
		} else {
			return toggle;
		}
	};

	d20plus.importer.getDesiredWhisperToggle = function () {
		// whispertoggle
		const gm = "/w gm ";
		const pblic = " ";
		const desired = d20plus.cfg.get("import", "whispermode");
		if (desired) {
			switch (desired) {
				case "Toggle (Default GM)":
					return gm;
				case "Toggle (Default Public)":
					return pblic;
				case "Always":
					return "";
				case "Query":
					return "";
				case "Never":
					return "";
			}
		} else {
			return gm;
		}
	};

	d20plus.importer.getDesiredDamageType = function () {
		// dtype
		const on = "full";
		const off = "pick";
		const desired = d20plus.cfg.get("import", "damagemode");
		if (desired) {
			switch (desired) {
				case "Auto Roll":
					return on;
				case "Don't Auto Roll":
					return off;
			}
		} else {
			return on;
		}
	};

	d20plus.importer.importModeSwitch = function () {
		d20plus.importer.clearPlayerImport();
		const $winPlayer = $(`#d20plus-playerimport`).find(`.append-list-journal`).empty();

		$(`.importer-section`).hide();
		const toShow = $(`#import-mode-select`).val();
		$(`#betteR20-settings`).find(`.importer-section[data-import-group="${toShow}"]`).show();
		const toShowPlayer = $(`#import-mode-select-player`).val();
		$(`#d20plus-playerimport`).find(`.importer-section[data-import-group="${toShowPlayer}"]`).show();
	};

	d20plus.importer.showImportList = async function (dataType, dataArray, handoutBuilder, options) {
		if (!options) options = {};
		/*
		options = {
			groupOptions: ["Source", "CR", "Alphabetical", "Type"],
			forcePlayer: true,
			callback: () => console.log("hello world"),
			saveIdsTo: {}, // object to receive IDs of created handouts/creatures
			// these three generally used together
			listItemBuilder: (it) => `<span class="name col-8">${it.name}</span><span title="${Parser.sourceJsonToFull(it.source)}" class="source col-4">${it.cr ? `(CR ${it.cr.cr || it.cr}) ` : ""}(${Parser.sourceJsonToAbv(it.source)})</span>`,
			listIndex: ["name", "source"],
			listIndexConverter: (mon) => {
				name: mon.name.toLowerCase(),
				source: Parser.sourceJsonToAbv(m.source).toLowerCase() // everything is assumed to be lowercase
			},
			nextStep: (doImport, originalImportQueue) {
				const modifiedImportQueue = originalImportQueue.map(it => JSON.stringify(JSON.parse(it));
				doImport(modifiedImportQueue);
			},
			builderOptions: {
				(...passed to handoutBuilder depending on requirements...)
			}
		}
		 */
		$("a.ui-tabs-anchor[href='#journal']").trigger("click");

		if (!window.is_gm || options.forcePlayer) {
			d20plus.importer.clearPlayerImport();
			const $winPlayer = $(`#d20plus-playerimport`);
			const $appPlayer = $winPlayer.find(`.append-list-journal`);
			$appPlayer.empty();
			$appPlayer.append(`<ol class="dd-list Vetools-player-imported" style="max-width: 95%;"/>`);
		}

		// sort data
		dataArray.sort((a, b) => SortUtil.ascSort(a.name, b.name));

		// collect available properties
		const propSet = {}; // represent this as an object instead of a set, to maintain some semblance of ordering
		dataArray.map(it => Object.keys(it)).forEach(keys => keys.forEach(k => propSet[k] = true));

		// build checkbox list
		const $list = $("#import-list .list");
		$list.html("");
		dataArray.forEach((it, i) => {
			if (it.noDisplay) return;

			const inner = options.listItemBuilder
				? options.listItemBuilder(it)
				:  `<span class="name col-10">${it.name}</span><span class="source" title="${Parser.sourceJsonToFull(it.source)}">${Parser.sourceJsonToAbv(it.source)}</span>`;

			$list.append(`
			<label class="import-cb-label" data-listid="${i}">
				<input type="checkbox">
				${inner}
			</label>
		`);
		});

		// init list library
		const importList = new List("import-list", {
			valueNames: options.listIndex || ["name"]
		});

		// reset the UI and add handlers
		$(`#import-list > .search`).val("");
		importList.search("");
		$("#import-options label").hide();
		$("#import-overwrite").parent().show();
		$("#import-showplayers").parent().show();
		$("#organize-by").parent().show();
		$("#d20plus-importlist").dialog("open");

		$("#d20plus-importlist button").unbind("click");

		$("#importlist-selectvis").bind("click", () => {
			d20plus.importer._importSelectVisible(importList);
		});
		$("#importlist-deselectvis").bind("click", () => {
			d20plus.importer._importDeselectVisible(importList);
		});

		$("#importlist-selectall-published").bind("click", () => {
			d20plus.importer._importSelectPublished(importList);
		});

		if (options.listIndexConverter) {
			const $iptFilter = $(`#import-list-filter`).show();
			$(`#import-list-filter-help`).show();
			$iptFilter.off("keydown").off("keyup");
			d20plus.importer.addListFilter($iptFilter, dataArray, importList, options.listIndexConverter);
		} else {
			$(`#import-list-filter`).hide();
			$(`#import-list-filter-help`).hide();
		}

		const excludedProps = new Set();
		const $winProps = $("#d20plus-import-props");
		$winProps.find(`button`).bind("click", () => {
			excludedProps.clear();
			$winProps.find(`.prop-row`).each((i, ele) => {
				if (!$(ele).find(`input`).prop("checked")) excludedProps.add($(ele).find(`span`).text());
			});
		});
		const $btnProps = $(`#save-import-props`);
		$btnProps.bind("click", () => {
			$winProps.dialog("close");
		});
		const $props = $winProps.find(`.select-props`);
		$props.empty();
		$(`#import-open-props`).bind("click", () => {
			Object.keys(propSet).forEach(p => {
				const req = REQUIRED_PROPS[dataType] && REQUIRED_PROPS[dataType].includes(p);
				$props.append(`
					<label style="display: block; ${req ? "color: red;" : ""}" class="prop-row">
						<input type="checkbox" checked="true">
						<span>${p}</span>
					</label>
				`)
			});
			$winProps.dialog("open");
		});

		const $selGroupBy = $(`#organize-by`);
		$selGroupBy.html("");
		options.groupOptions = (options.groupOptions || ["Alphabetical", "Source"]).concat(["None"]);
		options.groupOptions.forEach(g => {
			$selGroupBy.append(`<option value="${g}">${g}</option>`);
		});
		const storageKeyGroupBy = `Veconfig-importer-groupby-${dataType}`;
		$selGroupBy.on("change", () => {
			StorageUtil.pSet(storageKeyGroupBy, $selGroupBy.val())
		})
		try {
			const savedSelection = await StorageUtil.pGet(storageKeyGroupBy);
			if (savedSelection) {
				$selGroupBy.val(savedSelection);
			}
		} catch (e) {
			console.error("Failed to set group from saved!");
		}

		const $cbShowPlayers = $("#import-showplayers");
		$cbShowPlayers.prop("checked", dataType !== "monster");

		const $btnImport = $("#d20plus-importlist button#importstart");
		$btnImport.text(options.nextStep ? "Next" : "Import");
		$btnImport.bind("click", function () {
			$("#d20plus-importlist").dialog("close");
			const overwrite = $("#import-overwrite").prop("checked");
			const inJournals = $cbShowPlayers.prop("checked") ? "all" : "";
			const groupBy = $(`#organize-by`).val();

			// build list of items to process
			const importQueue = [];
			importList.items.forEach((e) => {
				if ($(e.elm).find("input").prop("checked")) {
					const dataIndex = parseInt($(e.elm).data("listid"));
					const it = dataArray[dataIndex];
					importQueue.push(it);
				}
			});

			if (!importQueue.length) return;

			const doImport = (importQueue) => {
				const $stsName = $("#import-name");
				const $stsRemain = $("#import-remaining");
				const $title = $stsName.parent().parent().find("span.ui-dialog-title");
				$title.text("Importing");

				let remaining = importQueue.length;

				let interval;
				if (dataType === "monster" || dataType === "object") {
					interval = d20plus.cfg.get("import", "importIntervalCharacter") || d20plus.cfg.getDefault("import", "importIntervalCharacter");
				} else {
					interval = d20plus.cfg.get("import", "importIntervalHandout") || d20plus.cfg.getDefault("import", "importIntervalHandout");
				}

				let cancelWorker = false;
				const $btnCancel = $(`#importcancel`);

				$btnCancel.off();
				$btnCancel.on("click", () => {
					cancelWorker = true;
					handleWorkerComplete();
				});

				const $remainingText = $("#import-remaining-text");
				$btnCancel.removeClass("btn-success");
				$btnCancel.text("Cancel");

				$remainingText.text("remaining");

				// start worker to process list
				$("#d20plus-import").dialog("open");

				// run one immediately
				let worker;
				workerFn();
				worker = setInterval(() => {
					workerFn();
				}, interval);

				function workerFn() {
					if (!importQueue.length) {
						handleWorkerComplete();
						return;
					}
					if (cancelWorker) {
						return;
					}

					// pull items out the queue in LIFO order, for journal ordering (last created will be at the top)
					let it = importQueue.pop();
					it.name = it.name || "(Unknown)";

					$stsName.text(it.name);
					$stsRemain.text(remaining--);

					if (excludedProps.size) {
						it = JSON.parse(JSON.stringify(it));
						[...excludedProps].forEach(k => delete it[k]);
					}

					if (!window.is_gm || options.forcePlayer) {
						handoutBuilder(it, undefined, undefined, undefined, undefined, options.builderOptions);
					} else {
						const folderName = groupBy === "None" ? "" : d20plus.importer._getHandoutPath(dataType, it, groupBy);
						const builderOptions = Object.assign({}, options.builderOptions || {});
						if (dataType === "spell" && groupBy === "Spell Points") builderOptions.isSpellPoints = true;
						handoutBuilder(it, overwrite, inJournals, folderName, options.saveIdsTo, builderOptions);
					}
				}

				function handleWorkerComplete() {
					if (worker) clearInterval(worker);

					if (cancelWorker) {
						$title.text("Import cancelled");
						$stsName.text("");
						if (~$stsRemain.text().indexOf("(cancelled)")) $stsRemain.text(`${$stsRemain.text()} (cancelled)`);
						d20plus.ut.log(`Import cancelled`);
						setTimeout(() => {
							d20plus.bindDropLocations();
						}, 250);
					} else {
						$title.text("Import complete");
						$stsName.text("");
						$btnCancel.addClass("btn-success");
						$btnCancel.prop("title", "");

						$stsRemain.text("0");
						d20plus.ut.log(`Import complete`);
						setTimeout(() => {
							d20plus.bindDropLocations();
						}, 250);
						if (options.callback) options.callback();
					}

					$btnCancel.off();
					$btnCancel.on("click", () => $btnCancel.closest('.ui-dialog-content').dialog('close'));

					$btnCancel.first().text("OK");
					$remainingText.empty();
					$stsRemain.empty();
				}
			};

			if (options.nextStep) {
				if (importQueue.length) {
					options.nextStep(doImport, importQueue)
				}
			} else {
				doImport(importQueue);
			}
		});
	};

	d20plus.importer._getHandoutPath = function (dataType, it, groupBy) {
		switch (dataType) {
			case "monster": {
				let folderName;
				switch (groupBy) {
					case "Source":
						folderName = Parser.sourceJsonToFull(it.source);
						break;
					case "CR":
						folderName = it.cr ? (it.cr.cr || it.cr) : "Unknown";
						break;
					case "Alphabetical":
						folderName = it.name[0].uppercaseFirst();
						break;
					case "Type (with tags)":
						folderName = Parser.monTypeToFullObj(it.type).asText.uppercaseFirst();
						break;
					case "CR → Type":
						folderName = [it.cr ? (it.cr.cr || it.cr) : "Unknown", Parser.monTypeToFullObj(it.type).type.uppercaseFirst()];
						break;
					case "Type":
					default:
						folderName = Parser.monTypeToFullObj(it.type).type.uppercaseFirst();
						break;
				}
				return folderName;
			}
			case "spell": {
				let folderName;
				switch (groupBy) {
					case "Source":
						folderName = Parser.sourceJsonToFull(it.source);
						break;
					case "Alphabetical":
						folderName = it.name[0].uppercaseFirst();
						break;
					case "Spell Points":
						folderName = `${d20plus.spells.spLevelToSpellPoints(it.level)} spell points`;
						break;
					case "Level":
					default:
						folderName = `${Parser.spLevelToFull(it.level)}${it.level ? " level" : ""}`;
						break;
				}
				return folderName;
			}
			case "item": {
				let folderName;
				switch (groupBy) {
					case "Source":
						folderName = Parser.sourceJsonToFull(it.source);
						break;
					case "Rarity":
						folderName = it.rarity;
						break;
					case "Alphabetical":
						folderName = it.name[0].uppercaseFirst();
						break;
					case "Type":
					default:
						if (it.type) {
							folderName = Renderer.item.getItemTypeName(it.type);
						} else if (it._typeListText) {
							folderName = it._typeListText.join(", ");
						} else {
							folderName = "Unknown";
						}
						break;
				}
				return folderName;
			}
			case "psionic": {
				let folderName;
				switch (groupBy) {
					case "Source":
						folderName = Parser.sourceJsonToFull(it.source);
						break;
					case "Order":
						folderName = Parser.psiOrderToFull(it.order);
						break;
					case "Alphabetical":
					default:
						folderName = it.name[0].uppercaseFirst();
						break;
				}
				return folderName;
			}
			case "feat": {
				let folderName;
				switch (groupBy) {
					case "Source":
						folderName = Parser.sourceJsonToFull(it.source);
						break;
					case "Alphabetical":
					default:
						folderName = it.name[0].uppercaseFirst();
						break;
				}
				return folderName;
			}
			case "object": {
				let folderName;
				switch (groupBy) {
					case "Source":
						folderName = Parser.sourceJsonToFull(it.source);
						break;
					case "Alphabetical":
					default:
						folderName = it.name[0].uppercaseFirst();
						break;
				}
				return folderName;
			}
			case "class": {
				let folderName;
				switch (groupBy) {
					case "Source":
						folderName = Parser.sourceJsonToFull(it.source);
						break;
					case "Alphabetical":
					default:
						folderName = it.name[0].uppercaseFirst();
						break;
				}
				return folderName;
			}
			case "subclass": {
				let folderName;
				switch (groupBy) {
					case "Source":
						folderName = Parser.sourceJsonToFull(it.source);
						break;
					case "Alphabetical":
						folderName = it.name[0].uppercaseFirst();
						break;
					case "Class":
					default:
						folderName = it.className;
				}
				return folderName;
			}
			case "background": {
				let folderName;
				switch (groupBy) {
					case "Source":
						folderName = Parser.sourceJsonToFull(it.source);
						break;
					case "Alphabetical":
					default:
						folderName = it.name[0].uppercaseFirst();
						break;
				}
				return folderName;
			}
			case "optionalfeature": {
				let folderName;
				switch (groupBy) {
					case "Source":
						folderName = Parser.sourceJsonToFull(it.source);
						break;
					case "Alphabetical":
					default:
						folderName = it.name[0].uppercaseFirst();
						break;
				}
				return folderName;
			}
			case "race": {
				let folderName;
				switch (groupBy) {
					case "Source":
						folderName = Parser.sourceJsonToFull(it.source);
						break;
					case "Alphabetical":
					default:
						folderName = it.name[0].uppercaseFirst();
						break;
				}
				return folderName;
			}
			default:
				throw new Error(`Unknown import type '${dataType}'`);
		}
	};

	d20plus.importer._checkHandleDuplicate = function (path, overwrite) {
		const dupe = d20plus.journal.checkFileExistsByPath(path);
		if (dupe && !overwrite) return false;
		else if (dupe) d20plus.journal.removeFileByPath(path);
		return true;
	};

	d20plus.importer._importToggleSelectAll = function (importList, selectAllCb) {
		const $sa = $(selectAllCb);
		const val = $sa.prop("checked");
		importList.items.forEach(i => Array.prototype.forEach.call(i.elm.children, (e) => {
			if (e.tagName === "INPUT") {
				$(e).prop("checked", val);
			}
		}));
	};

	d20plus.importer._importSelectAll = function (importList) {
		importList.items.forEach(i => Array.prototype.forEach.call(i.elm.children, (e) => {
			if (e.tagName === "INPUT") {
				$(e).prop("checked", true);
			}
		}));
	};

	d20plus.importer._importSelectVisible = function (importList) {
		importList.visibleItems.forEach(i => Array.prototype.forEach.call(i.elm.children, (e) => {
			if (e.tagName === "INPUT") {
				$(e).prop("checked", true);
			}
		}));
	};

	d20plus.importer._importDeselectAll = function (importList) {
		importList.items.forEach(i => Array.prototype.forEach.call(i.elm.children, (e) => {
			if (e.tagName === "INPUT") {
				$(e).prop("checked", false);
			}
		}));
	};

	d20plus.importer._importDeselectVisible = function (importList) {
		importList.visibleItems.forEach(i => Array.prototype.forEach.call(i.elm.children, (e) => {
			if (e.tagName === "INPUT") {
				$(e).prop("checked", false);
			}
		}));
	};

	d20plus.importer._importSelectPublished = function (importList) {
		function setSelection (i, setTo) {
			Array.prototype.forEach.call(i.elm.children, (e) => {
				if (e.tagName === "INPUT") {
					$(e).prop("checked", setTo);
				}
			})
		}

		importList.items.forEach(i => {
			if (SourceUtil.isNonstandardSource(i.values().source)) {
				setSelection(i, false);
			} else {
				setSelection(i, true);
			}
		});
	};
}

SCRIPT_EXTENSIONS.push(d20plusImporter);
