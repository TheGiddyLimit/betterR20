function d20plusBackgrounds () {
	d20plus.backgrounds = {};

	d20plus.backgrounds.button = function (forcePlayer) {
		const playerMode = forcePlayer || !window.is_gm;
		const url = playerMode ? $("#import-backgrounds-url-player").val() : $("#import-backgrounds-url").val();
		if (url && url.trim()) {
			const handoutBuilder = playerMode ? d20plus.backgrounds.playerImportBuilder : d20plus.backgrounds.handoutBuilder;

			DataUtil.loadJSON(url).then((data) => {
				d20plus.importer.addBrewMeta(data._meta);
				d20plus.importer.showImportList(
					"background",
					data.background,
					handoutBuilder,
					{
						forcePlayer,
					},
				);
			});
		}
	};

	d20plus.backgrounds.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo, options) {
		// make dir
		const folder = d20plus.journal.makeDirTree(`Backgrounds`, folderName);
		const path = ["Backgrounds", ...folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
		d20.Campaign.handouts.create({
			name: name,
			tags: d20plus.importer.getTagString([
				Parser.sourceJsonToFull(data.source),
			], "background"),
		}, {
			success: function (handout) {
				if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BACKGROUNDS](data)] = {name: data.name, source: data.source, type: "handout", roll20Id: handout.id};

				const [noteContents, gmNotes] = d20plus.backgrounds._getHandoutData(data);

				handout.updateBlobs({notes: noteContents, gmnotes: gmNotes});
				handout.save({notes: (new Date()).getTime(), inplayerjournals: inJournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			},
		});
	};

	d20plus.backgrounds.playerImportBuilder = function (data) {
		const [notecontents, gmnotes] = d20plus.backgrounds._getHandoutData(data);

		const importId = d20plus.ut.generateRowId();
		d20plus.importer.storePlayerImport(importId, JSON.parse(gmnotes));
		d20plus.importer.makePlayerDraggable(importId, data.name);
	};

	d20plus.backgrounds._getHandoutData = function (data) {
		const renderer = new Renderer();
		renderer.setBaseUrl(BASE_SITE_URL);

		const renderStack = [];

		renderer.recursiveRender({entries: data.entries}, renderStack, {depth: 1});

		const rendered = renderStack.join("");

		const r20json = {
			"name": data.name,
			"Vetoolscontent": data,
			"data": {
				"Category": "Backgrounds",
			},
		};
		const gmNotes = JSON.stringify(r20json);
		const noteContents = `${rendered}\n\n<del class="hidden">${gmNotes}</del>`;

		return [noteContents, gmNotes];
	};

	// The popup menu for choosing traits, ideals, bonds and flaws
	// Needs to be its own thing due to having a choose randomly button
	d20plus.backgrounds.traitMenu = async function (ptrait, ideal, bond, flaw) {
		// Arguments to send
		const ptraitargs = {
			countMin: 1,
			countMax: 2,
			random: true,
			totallyRandom: true,
			skip: true
		}
		const args = {
			countMin: 1,
			countMax: 1,
			random: true,
			skip: true
		}

		// Call the menus, allowing for null sets
		const pt = await d20plus.ui.chooseCheckboxList(ptrait, "Personality Trait", ptraitargs);
		const id = !ideal ? null : await d20plus.ui.chooseRadioList(ideal, "Ideal", args);
		const bd = !bond ? null : await d20plus.ui.chooseRadioList(bond, "Bond", args);
		const fl = !flaw ? null : await d20plus.ui.chooseRadioList(flaw, "Flaw", args);

		// Return
		return {
			"personalityTraits": pt,
			"ideals": id,
			"bonds": bd,
			"flaws": fl,
		}
	};

	d20plus.backgrounds.importBackground = async function (character, data) {
		const bg = data.Vetoolscontent;

		const renderer = new Renderer();
		renderer.setBaseUrl(BASE_SITE_URL);
		const featureSet = [
			"Cultural Chameleon",
			"Dust Digger",
			"Favored Event",
			"Specialty",
			"Contacts",
			"How Do I Fit In?",
			"Favorite Schemes",
			"Faceless Persona",
			"Why Are You Here?",
			"Fey Mark",
			"Feywild Visitor",
			"Fishing Tale",
			"Harrowing Event",
			"Role",
			"Path to Mystery",
			"Hardship Endured",
			"Variant Noble (Knight)",
			"A Flair for the Dramatic",
			"Life at Sea",
			"Claim to Fame",
			"Carnival Companion"
		];
		let features = [];
		bg.entries.forEach(e => {
			let feature = {};
			if (e.name && e.name.includes("Feature:")) {
				feature = JSON.parse(JSON.stringify(e));
				feature.name = feature.name.replace("Feature:", "").trim();
			} else if (e.name && (
					e.name.includes("Guild Spells") || // covers all GGR backgrounds
					e.name.includes("Origins")         // Criminal, Folk Hero, Hermit, Outlander, etc
					)) {
				feature = JSON.parse(JSON.stringify(e));
			} else if (e.name && featureSet.includes(e.name)) {
				feature = JSON.parse(JSON.stringify(e));
			} else return;

			const renderStack = [];
			renderer.recursiveRender({entries: feature.entries}, renderStack);
			feature.text = renderStack.length ? d20plus.importer.getCleanText(renderStack.join("")) : "";
			features.push(feature);
		});

		// Add skills

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
								reject(new Error(`User cancelled the prompt`));
							},
						},
						{
							text: "OK",
							click: function () {
								const selected = $rdOpt.filter((i, e) => $(e).prop("checked"))
									.map((i, e) => $(e).data("ix")).get()[0];
								$(this).dialog("close");
								$dialog.remove();
								resolve(selected);
							},
						},
					],
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
				const chosenSkills = await d20plus.ui.chooseCheckboxList(
					sansExisting,
					"Choose Skills",
					{
						count,
						displayFormatter: it => it.toTitleCase(),
						messageCountIncomplete: `Please select ${count} skill${count === 1 ? "" : "s"}`,
					},
				);
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
								reject(new Error(`User cancelled the prompt`));
							},
						},
						{
							text: "OK",
							click: function () {
								const selected = $rdOpt.filter((i, e) => $(e).prop("checked"))
									.map((i, e) => $(e).data("ix")).get()[0];
								$(this).dialog("close");
								$dialog.remove();
								resolve(selected);
							},
						},
					],
				})
			});
		}

		async function handleProfs (profs, profType) {
			// Handle the language options, let user choose if needed
			// Handles most edge cases I think
			const ret = []
			for (const [key, value] of Object.entries(profs)) {
				// Loop must be in this form -- Thanks for figuring this out Giddy
				if (key === "choose") {
					// If choice is needed, call popup function
					let numChoice = 1;
					if (value.count) numChoice = value.count;
					const choice = await d20plus.ui.chooseCheckboxList(
						value.from,
						`Choose ${profType}`,
						{
							count: numChoice,
							displayFormatter: it => it.toTitleCase(),
							messageCountIncomplete: `Please select ${numChoice} language${numChoice === 1 ? "" : "s"}`,
						},
					);
					choice.forEach(c => ret.push(c));
				} else if (key === "anyStandard") {
					// If any language is available, add any
					for (let i = 0; i < value; i++) ret.push("any");
				} else if (value) {
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
			} else if (bg.languageProficiencies.length > 0) {
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
			} else if (bg.toolProficiencies.length > 0) {
				// Most common case
				backgroundTools = await handleProfs(bg.toolProficiencies[0], "Tools");
			}
		}

		// Import items
		async function importItemsAndGetGold (itemlist) {
			const allitemList = await Renderer.item.pBuildList();
			let containedGold = 0;

			const x = Object.values(itemlist).map(function (item) {
				// Returns a standardized object from a very unstandardized object
				// Get the important variables
				let iname = "";
				if (typeof item !== "object") {
					iname = item;
				} else if ("item" in item) {
					iname = item.item;
				} else if ("special" in item) {
					iname = item.special;
				} else if ("equipclean" in item) {
					iname = item.equipclean;
				}

				if (item.containsValue) containedGold += item.containsValue / 100;

				// Make the input object
				const pareseditem = {"name": iname.split("|")[0].toTitleCase()};
				const it = allitemList.find(pareseditem) || pareseditem;
				// Create item data in the format importItem likes,
				//   then call the importItem function usually used to import items
				return JSON.parse(d20plus.items._getHandoutData(it)[1])
			});

			const y = x.map(it => ({subItem: JSON.stringify(it), count: 1}));

			const allItems = {
				name: "All Items",
				_subItems: [...y],
				data: {},
			};

			d20plus.items.importItem(character, allItems, null);

			return containedGold;
		}

		async function chooseItemsFromBackground (itemChoices) {
			return new Promise((resolve, reject) => {
				// Deal with the equipmenttype case specifically
				let equiptmp = null;
				Object.entries(itemChoices).forEach(([key, value]) => {
					if (value[0]?.equipmentType) {
						switch (value[0].equipmentType) {
							case "setGaming":
								equiptmp = "Gaming Set";
								break;
							case "instrumentMusical":
								equiptmp = "Instrument";
								break;
							case "toolArtisan":
								equiptmp = "Artisan's Tools";
								break;
						}
						value[0].equipclean = equiptmp;
					}
				});

				// Make the menu
				const $dialog = $(`
						<div title="Items Import">
							<label class="flex">
								<span>Which item would you like to import?</span>
								 <select title="Note: this does not include homebrew. For homebrew subclasses, use the dedicated subclass importer." style="width: 250px;">
							   ${Object.entries(itemChoices).map(([key, value]) => `<option value="${key}">${(value[0].item || value[0].special || value[0].equipclean || value[0]).split("|")[0].toTitleCase()}</option>`)}
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
								const selected = $selStrat.val();
								$(this).dialog("close");
								$dialog.remove();
								resolve(selected);
							},
						},
					],
				})
			});
		}

		let startingGold = 0;

		if (bg.startingEquipment) {
			for (const equip of bg.startingEquipment) {
				// Loop because there can be any number of objects and in any order
				if (equip._) {
					// The _ property means will always be imported
					startingGold += await importItemsAndGetGold(equip._);
				} else {
					// Otherwise there is a choice of what to import
					const itemchoicefrombackgorund = await chooseItemsFromBackground(equip);
					startingGold += await importItemsAndGetGold(equip[itemchoicefrombackgorund]);
				}
			}
		}

		// Choose and import personallity traits/ideals/bonds/flaws.
		let traits = null;
		let ptrait = null; // Personallity trait
		let ideal = null;
		let bond = null;
		let flaw = null;
		const matchCharacteristics = [
			"Suggested Characteristics", // Most backgrounds
			"Horror Characteristics"     // 'Haunted One' and 'Investigator'
		];
		// Get the JSON for all the tables
		if (bg.entries) {
			for (const ent of bg.entries) {
				if (ent.name && matchCharacteristics.includes(ent.name)) {
					traits = ent;
				} else if (ent.entries) {
					for (const entItem of ent.entries) {
						// look for embedded characteristics
						if (entItem.name && entItem.name === "Suggested Characteristics") {
							traits = entItem;
						// look for embedded trinkets, and move to features
						} else if (entItem.name && entItem.name.includes("Trinket")) {
							const renderStack = [];
							renderer.recursiveRender({entries: entItem.entries}, renderStack);
							entItem.text = renderStack.length ? d20plus.importer.getCleanText(renderStack.join("")) : "";
							features.push(entItem);
						}
					}
				}
			}
		}

		// Fill the rows
		if (traits !== null && traits.entries?.length) {
			for (let i = 0; i < traits.entries.length; i++) {
				const ent = traits.entries[i];
				// This seems to be the best way to parse the information with some room for errors
				// It seems like the schema is based on on the website, which is why colLabels is where the identifier is
				if (ent.colLabels && ent.colLabels.length === 2 && ent.rows) {

					/**
					 * Clean up the formatting and reference syntaxes to get clean text.
					 *
					 * @param entry entry to clean up
					 * @return cleaned text
					 */
					const _cleanText = function (entry) {
						let cleanedText = "";
						let closeIndex = 0;
						while (true) {
							const firstIndex = entry.indexOf("{@", closeIndex);
							if (firstIndex === -1) {
								// grab whatever is left in the entry
								cleanedText += entry.substring(closeIndex);
								break;
							}
							cleanedText += entry.substring(closeIndex, firstIndex);
							const spaceIndex = entry.indexOf(" ", firstIndex);
							if (spaceIndex === -1) {
								// parse error, just grab the rest and bail
								cleanedText += entry.substring(firstIndex);
								break;
							}
							closeIndex = entry.indexOf("}", spaceIndex);
							if (closeIndex === -1) {
								// parse error, just grab the rest and bail
								cleanedText += entry.substring(firstIndex);
								break;
							}
							// look for any reference syntax between the space and the closure
							const pipeIndex = entry.substring(spaceIndex + 1, closeIndex).indexOf("|");
							if (pipeIndex === -1) {
								// no reference, copy one past space up to closure
								cleanedText += entry.substring(spaceIndex + 1, closeIndex);
							} else {
								// got a reference, copy one past space for number of characters up to pipe
								// note that pipeIndex is zero-based
								cleanedText += entry.substr(spaceIndex + 1, pipeIndex);
							}
							closeIndex++;
						}
						return cleanedText;
					};

					switch (ent.colLabels[1]) {
						case "Personality Trait":
							ptrait = ent.rows.map(r => _cleanText(r[1]));
							break;
						case "Ideal":
							ideal = ent.rows.map(r => _cleanText(r[1]));
							break;
						case "Bond":
							bond = ent.rows.map(r => _cleanText(r[1]));
							break;
						case "Flaw":
							flaw = ent.rows.map(r => _cleanText(r[1]));
							break;
					}
				}
			}
		}

		if (ptrait != null) {
			traits = await d20plus.backgrounds.traitMenu(ptrait, ideal, bond, flaw);
		}

		// Update Sheet
		const attrs = new d20plus.importer.CharacterAttributesProxy(character);

		if (d20plus.sheet === "ogl") {
			attrs.addOrUpdate("background", bg.name);
			attrs.addOrUpdate("gp", startingGold);

			for (const feature of features) {
				const fRowId = d20plus.ut.generateRowId();
				attrs.add(`repeating_traits_${fRowId}_name`, feature.name);
				attrs.add(`repeating_traits_${fRowId}_source`, "Background");
				attrs.add(`repeating_traits_${fRowId}_source_type`, bg.name);
				attrs.add(`repeating_traits_${fRowId}_options-flag`, "0");
				if (feature.text) {
					attrs.add(`repeating_traits_${fRowId}_description`, feature.text);
				}
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

			// Add flavor traits
			const {personalityTraits, ideals, bonds, flaws} = traits || {}; // Got some help from Giddy with this one
			// Only add the trait if the trait exists
			if (personalityTraits?.length === 1) attrs.addOrUpdate(`personality_traits`, personalityTraits[0]);
			if (personalityTraits?.length === 2) attrs.addOrUpdate(`personality_traits`, `${personalityTraits[0]}\n${personalityTraits[1]}`);
			if (ideals?.length === 1) attrs.addOrUpdate(`ideals`, ideals[0]);
			if (bonds?.length === 1) attrs.addOrUpdate(`bonds`, bonds[0]);
			if (flaws?.length === 1) attrs.addOrUpdate(`flaws`, flaws[0]);
		} else if (d20plus.sheet === "shaped") {
			attrs.addOrUpdate("background", bg.name);
			for (const feature of features) {
				const fRowId = d20plus.ut.generateRowId();
				attrs.add(`repeating_trait_${fRowId}_name`, `${feature.name} (${bg.name})`);
				if (feature.text) {
					attrs.add(`repeating_trait_${fRowId}_content`, feature.text);
					attrs.add(`repeating_trait_${fRowId}_content_toggle`, "1");
				}
			}

			skills.map(s => s.toUpperCase().replace(/ /g, "")).forEach(s => {
				const rowId = attrs.findOrGenerateRepeatingRowId("repeating_skill_$0_storage_name", s);
				attrs.addOrUpdate(`repeating_skill_${rowId}_proficiency`, "proficient");
			});
		} else {
			// eslint-disable-next-line no-console
			console.warn(`Background import is not supported for ${d20plus.sheet} character sheet`);
		}

		attrs.notifySheetWorkers();
	};
}

SCRIPT_EXTENSIONS.push(d20plusBackgrounds);
