function d20plusObjects () {
	d20plus.objects = {};

	// Import Object button was clicked
	d20plus.objects.button = function () {
		const url = $("#import-objects-url").val();
		if (url && url.trim()) {
			DataUtil.loadJSON(url).then((data) => {
				d20plus.importer.addBrewMeta(data._meta);
				d20plus.importer.showImportList(
					"object",
					data.object,
					d20plus.objects.handoutBuilder,
				);
			});
		}
	};

	d20plus.objects.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo, options) {
		// make dir
		const folder = d20plus.journal.makeDirTree(`Objects`, folderName);
		const path = ["Objects", ...folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
		const source = data.source;
		d20.Campaign.characters.create(
			{
				name: name,
				tags: d20plus.importer.getTagString([
					Parser.sizeAbvToFull(data.size),
					Parser.sourceJsonToFull(data.source),
				], "object"),
			},
			{
				success: function (character) {
					if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_OBJECTS](data)] = {name: data.name, source: data.source, type: "character", roll20Id: character.id};

					try {
						const avatar = data.tokenUrl || `${IMG_URL}objects/tokens/${source}/${name}.png`;
						character.size = data.size;
						character.name = name;
						character.senses = data.senses ? data.senses instanceof Array ? data.senses.join(", ") : data.senses : null;
						character.hp = data.hp;
						$.ajax({
							url: avatar,
							type: "HEAD",
							error: function () {
								d20plus.importer.getSetAvatarImage(character, `${IMG_URL}blank.png`);
							},
							success: function () {
								d20plus.importer.getSetAvatarImage(character, avatar);
							},
						});
						
						const size = Parser.sizeAbvToFull(data.size);
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
							current: d20plus.importer.getDesiredAdvantageToggle(),
						});
						character.attribs.create({
							name: "whispertoggle",
							current: d20plus.importer.getDesiredWhisperToggle(),
						});
						character.attribs.create({name: "dtype", current: d20plus.importer.getDesiredDamageType()});
						character.attribs.create({name: "npc_name", current: name});
						character.attribs.create({name: "npc_size", current: size});
						character.attribs.create({name: "type", current: data.type});
						character.attribs.create({name: "npc_type", current: `${size} ${data.type}`});
						character.attribs.create({name: "npc_ac", current: data.ac});
						character.attribs.create({name: "npc_actype", current: ""});
						character.attribs.create({name: "npc_hpbase", current: data.hp});
						character.attribs.create({name: "npc_hpformula", current: data.hp ? `${data.hp}d1` : ""});

						character.attribs.create({name: "npc_immunities", current: data.immune ? data.immune : ""});
						character.attribs.create({name: "damage_immunities", current: data.immune ? data.immune : ""});

						// Should only be one entry for objects
						if (data.entries != null) {
							character.attribs.create({name: "repeating_npctrait_0_name", current: name});
							character.attribs.create({name: "repeating_npctrait_0_desc", current: data.entries});
							if (d20plus.cfg.getOrDefault("import", "tokenactionsTraits")) {
								character.abilities.create({
									name: `Information: ${name}`,
									istokenaction: true,
									action: d20plus.actionMacroTrait(0),
								});
							}
						}

						const renderer = new Renderer();
						renderer.setBaseUrl(BASE_SITE_URL);
						if (data.actionEntries) {
							data.actionEntries.forEach((e, i) => {
								const renderStack = [];
								renderer.recursiveRender({entries: e.entries}, renderStack, {depth: 2});
								const actionText = d20plus.importer.getCleanText(renderStack.join(""));
								d20plus.importer.addAction(character, d20plus.importer.getCleanText(renderer.render(e.name)), actionText, i);
							});
						}

						character.view.updateSheetValues();

						if (data.entries) {
							const bio = renderer.render({type: "entries", entries: data.entries});

							setTimeout(() => {
								const fluffAs = d20plus.cfg.get("import", "importFluffAs") || d20plus.cfg.getDefault("import", "importFluffAs");
								let k = fluffAs === "Bio" ? "bio" : "gmnotes";
								character.updateBlobs({
									[k]: Markdown.parse(bio),
								});
								character.save({
									[k]: (new Date()).getTime(),
								});
							}, 500);
						}
					} catch (e) {
						d20plus.ut.log(`Error loading [${name}]`);
						d20plus.monsters.addImportError(name);
						// eslint-disable-next-line no-console
						console.log(data, e);
					}
					d20.journal.addItemToFolderStructure(character.id, folder.id);
				},
			});
	};
}

SCRIPT_EXTENSIONS.push(d20plusObjects);
