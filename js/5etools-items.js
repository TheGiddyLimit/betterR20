function d20plusItems () {
	d20plus.items = {};

	d20plus.items._groupOptions = ["Type", "Rarity", "Alphabetical", "Source"];
	d20plus.items._listCols = ["name", "type", "rarity", "source"];
	d20plus.items._listItemBuilder = (it) => {
		if (!it._isEnhanced) Renderer.item.enhanceItem(it);

		return `
		<span class="name col-3" title="name">${it.name}</span>
		<span class="type col-5" title="type">${it._typeListText.map(t => `TYP[${t.trim()}]`).join(", ")}</span>
		<span class="rarity col-2" title="rarity">RAR[${it.rarity}]</span>
		<span title="source [Full source name is ${Parser.sourceJsonToFull(it.source)}]" class="source col-2">SRC[${Parser.sourceJsonToAbv(it.source)}]</span>`;
	};
	d20plus.items._listIndexConverter = (it) => {
		if (!it._isEnhanced) Renderer.item.enhanceItem(it);
		return {
			name: it.name.toLowerCase(),
			type: it._typeListText.map(t => t.toLowerCase()),
			rarity: it.rarity.toLowerCase(),
			source: Parser.sourceJsonToAbv(it.source).toLowerCase()
		};
	};
	// Import Items button was clicked
	d20plus.items.button = async function (forcePlayer) {
		await Renderer.item.populatePropertyAndTypeReference();

		const playerMode = forcePlayer || !window.is_gm;
		const url = playerMode ? $("#import-items-url-player").val() : $("#import-items-url").val();
		if (url && url.trim()) {
			const handoutBuilder = playerMode ? d20plus.items.playerImportBuilder : d20plus.items.handoutBuilder;

			if (url.trim() === `${DATA_URL}items.json`) {
				Renderer.item.pBuildList(
					{
						fnCallback: itemList => {
							const packNames = new Set([`burglar's pack`, `diplomat's pack`, `dungeoneer's pack`, `entertainer's pack`, `explorer's pack`, `priest's pack`, `scholar's pack`, `monster hunter's pack`]);

							const packs = itemList.filter(it => packNames.has(it.name.toLowerCase()));
							packs.forEach(p => {
								if (!p._r20SubItemData) {
									const contents = p.entries.find(it => it.type === "list").items;

									const out = [];
									contents.forEach(line => {
										if (line.includes("@item")) {
											const [pre, tag, item] = line.split(/({@item)/g);
											const tagItem = `${tag}${item}`;

											let [n, src] = item.split("}")[0].trim().split("|");
											if (!src) src = "dmg";

											n = n.toLowerCase();
											src = src.toLowerCase();


											const subItem = itemList.find(it => n === it.name.toLowerCase() && src === it.source.toLowerCase());

											let count = 1;
											pre.replace(/\d+/g, (m) => count = Number(m));

											out.push({
												type: "item",
												count,
												data: subItem
											})
										} else {
											out.push({
												type: "misc",
												data: {
													name: line.toTitleCase(),
													data: {
														Category: "Items",
														"Item Type": "Adventuring Gear"
													}
												}
											})
										}
									});

									p._r20SubItemData = out;
								}
							});

							d20plus.importer.showImportList(
								"item",
								itemList,
								handoutBuilder,
								{
									groupOptions: d20plus.items._groupOptions,
									forcePlayer,
									listItemBuilder: d20plus.items._listItemBuilder,
									listIndex: d20plus.items._listCols,
									listIndexConverter: d20plus.items._listIndexConverter
								}
							);
						},
						urls: {
							items: `${DATA_URL}items.json`,
							baseitems: `${DATA_URL}items-base.json`,
							magicvariants: `${DATA_URL}magicvariants.json`
						},
						isAddGroups: true,
					});
			} else {
				// for non-standard URLs, do a generic import
				DataUtil.loadJSON(url).then((data) => {
					(data.itemProperty || []).forEach(p => Renderer.item._addProperty(p));
					(data.itemType || []).forEach(t => Renderer.item._addType(t));
					d20plus.importer.addBrewMeta(data._meta);
					d20plus.importer.showImportList(
						"item",
						data.item,
						handoutBuilder,
						{
							groupOptions: d20plus.items._groupOptions,
							forcePlayer,
							listItemBuilder: d20plus.items._listItemBuilder,
							listIndex: d20plus.items._listCols,
							listIndexConverter: d20plus.items._listIndexConverter
						}
					);
				});
			}
		}
	};

	// Import individual items
	d20plus.items.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo, options) {
		// make dir
		const folder = d20plus.journal.makeDirTree(`Items`, folderName);
		const path = ["Items", ...folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;

		if (!data._isEnhanced) Renderer.item.enhanceItem(data); // for homebrew items

		// build item handout
		d20.Campaign.handouts.create({
			name: name,
			tags: d20plus.importer.getTagString([
				`rarity ${data.rarity}`,
				...data._typeListText,
				Parser.sourceJsonToFull(data.source)
			], "item")
		}, {
			success: function (handout) {
				if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS](data)] = {name: data.name, source: data.source, type: "handout", roll20Id: handout.id};

				const [notecontents, gmnotes] = d20plus.items._getHandoutData(data);

				handout.updateBlobs({notes: notecontents, gmnotes: gmnotes});
				handout.save({
					notes: (new Date).getTime(),
					inplayerjournals: inJournals
				});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			}
		});
	};

	d20plus.items.playerImportBuilder = function (data) {
		const [notecontents, gmnotes] = d20plus.items._getHandoutData(data);

		const importId = d20plus.ut.generateRowId();
		d20plus.importer.storePlayerImport(importId, JSON.parse(gmnotes));
		d20plus.importer.makePlayerDraggable(importId, data.name);
	};

	d20plus.items._getHandoutData = function (data) {
		function removeDiceTags (str) {
			return str ? Renderer.stripTags(str) : str;
		}

		var notecontents = "";
		const roll20Data = {
			name: data.name,
			data: {
				Category: "Items"
			}
		};

		const [damage, damageType, propertiesTxt] = Renderer.item.getDamageAndPropertiesText(data);
		const typeRarityAttunement = Renderer.item.getTypeRarityAndAttunementText(data);

		var type = data.type;
		if (data.type) {
			roll20Data.data["Item Type"] = d20plus.items.parseType(data.type);
		} else if (data._typeListText) {
			roll20Data.data["Item Type"] = data._typeListText.join(", ");
		}

		const cleanDmg1 = removeDiceTags(data.dmg1);
		const cleanDmg2 = removeDiceTags(data.dmg2);

		var armorclass = "";
		if (type === "S") armorclass = "+" + data.ac;
		if (type === "LA") armorclass = data.ac + " + Dex";
		if (type === "MA") armorclass = data.ac + " + Dex (max 2)";
		if (type === "HA") armorclass = data.ac;
		var properties = "";
		if (data.property) {
			var propertieslist = data.property;
			for (var i = 0; i < propertieslist.length; i++) {
				var a = d20plus.items.parseProperty(propertieslist[i]);
				var b = propertieslist[i];
				if (b === "V") {
					a = a + " (" + cleanDmg2 + ")";
					roll20Data.data["Alternate Damage"] = cleanDmg2;
					roll20Data.data["Alternate Damage Type"] = Parser.dmgTypeToFull(data.dmgType);
				}
				if (b === "T" || b === "A") a = a + " (" + data.range + "ft.)";
				if (b === "RLD") a = a + " (" + data.reload + " shots)";
				if (i > 0) a = ", " + a;
				properties += a;
			}
		}
		notecontents += `<p><h3>${data.name}</h3></p>
		<p><em>${typeRarityAttunement.join(", ")}</em></p>
		<p><strong>Value/Weight:</strong> ${[Parser.itemValueToFull(data), Parser.itemWeightToFull(data)].filter(Boolean).join(", ")}</p>
		<p><strong>Details: </strong>${[damage, damageType, propertiesTxt].filter(Boolean).join(" ")}</p>
		`;

		if (propertiesTxt) roll20Data.data.Properties = properties;
		if (armorclass) roll20Data.data.AC = String(data.ac);
		if (data.weight) roll20Data.data.Weight = String(data.weight);

		const textString = Renderer.item.getRenderedEntries(data);
		if (textString) {
			notecontents += `<hr>`;
			notecontents += textString;

			roll20Data.content = d20plus.importer.getCleanText(textString);
			roll20Data.htmlcontent = roll20Data.content;
		}

		if (data.range) {
			roll20Data.data.Range = data.range;
		}
		if (data.dmg1 && data.dmgType) {
			roll20Data.data.Damage = cleanDmg1;
			roll20Data.data["Damage Type"] = Parser.dmgTypeToFull(data.dmgType);
		}
		if (data.stealth) {
			roll20Data.data.Stealth = "Disadvantage";
		}
		// roll20Data.data.Duration = "1 Minute"; // used by e.g. poison; not show in sheet
		// roll20Data.data.Save = "Constitution"; // used by e.g. poison, ball bearings; not shown in sheet
		// roll20Data.data.Target = "Each creature in a 10-foot square centered on a point within range"; // used by e.g. ball bearings; not shown in sheet
		// roll20Data.data["Item Rarity"] = "Wondrous"; // used by Iron Bands of Binding... and nothing else?; not shown in sheet
		if (data.reqAttune === true) {
			roll20Data.data["Requires Attunement"] = "Yes";
		} else {
			roll20Data.data["Requires Attunement"] = "No";
		}

		// load modifiers (e.g. "+1 Armor"); this is a comma-separated string
		const r20metaname = data.name.includes("+") ? data.name.slice(3) + " " + data.name.slice(0,2) : data.name;
		const itemMeta = (itemMetadata.item || []).find(it => it.name === r20metaname && it.source === data.source);
		if (itemMeta) roll20Data.data.Modifiers = itemMeta.Modifiers;

		if (data._r20SubItemData) {
			roll20Data._subItems = data._r20SubItemData.map(subItem => {
				if (subItem.type === "item") {
					const [subNote, subGm] = d20plus.items._getHandoutData(subItem.data);
					return {subItem: subGm, count: subItem.count};
				} else {
					return {subItem: subItem.data};
				}
			});
		}

		const gmnotes = JSON.stringify(roll20Data);

		return [notecontents, gmnotes];
	};

	d20plus.items.parseType = function (type) {
		const result = Renderer.item.getItemTypeName(type);
		return result ? result : "n/a";
	};

	d20plus.items.parseDamageType = function (damagetype) {
		const result = Parser.dmgTypeToFull(damagetype);
		return result ? result : false;
	};

	d20plus.items.parseProperty = function (property) {
		if (Renderer.item.propertyMap[property]) return Renderer.item.propertyMap[property].name;
		return "n/a";
	};
}

SCRIPT_EXTENSIONS.push(d20plusItems);
