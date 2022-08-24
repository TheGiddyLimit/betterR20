function baseToolModule () {
	d20plus.tool.tools.push({
		toolId: "MODULES",
		name: "Module Importer/Exporter",
		desc: "Import full games (modules), or import/export custom games",
		html: `
				<div id="d20plus-module-importer" title="Better20 - Module Importer/Exporter">
				<p style="margin-bottom: 4px;"><b style="font-size: 110%;">Exporter: </b> <button class="btn" name="export">Export Game to File</button> <i>The exported file can later be used with the "Upload File" option, below.</i></p>
				<hr style="margin: 4px;">
				<p style="margin-bottom: 4px;">
					<b style="font-size: 110%;">Importer:</b>
					<button class="btn readme" style="float: right;">Help/README</button>
					<div style="clear: both;"></div>
				</p>
				<div style="border-bottom: 1px solid #ccc; margin-bottom: 3px; padding-bottom: 3px;">
					<button class="btn" name="load-Vetools">Load from 5etools</button>
					<button class="btn" name="load-dmsguild">Load from R20 Repo</button>
					<button class="btn" name="load-file">Upload File</button>
				</div>
				<div>
					<div name="data-loading-message"></div>
					<select name="data-type" disabled style="margin-bottom: 0;">
						<option value="characters">Characters</option>
						<option value="decks">Decks</option>
						<option value="handouts">Handouts</option>
						<option value="playlists">Jukebox Playlists</option>
						<option value="tracks">Jukebox Tracks</option>
						<option value="maps">Maps</option>
						<option value="rolltables">Rollable Tables</option>
					</select>
					<button class="btn" name="view-select-entries">View/Select Entries</button>
					<br>
					<button class="btn" name="select-all-entries">Select Everything</button>
					<div name="selection-summary" style="margin-top: 5px;"></div>
				</div>
				<hr>
				<p><button class="btn" style="float: right;" name="import">Import Selected</button></p>
				</div>

				<div id="d20plus-module-importer-list" title="Select Entries">
					<div id="module-importer-list">
						<input type="search" class="search" placeholder="Search..." disabled>
						<div class="list" style="transform: translateZ(0); max-height: 650px; overflow-y: auto; overflow-x: hidden; margin-bottom: 10px;">
						<i>Load a file to view the contents here</i>
						</div>
					</div>
					<div>
						<label class="ib"><input type="checkbox" class="select-all"> Select All</label>
						<button class="btn" style="float: right;" name="confirm-selection">Confirm Selection</button>
					</div>
				</div>

				<div id="d20plus-module-importer-progress" title="Import Progress">
					<h3 class="name"></h3>
					<span class="remaining"></span>
					<p>Errors: <span class="errors">0</span> <span class="error-names"></span></p>
					<p><button class="btn cancel">Cancel</button></p>
				</div>

				<div id="d20plus-module-importer-help" title="Readme">
					<p>First, either load a module from 5etools, or upload one from a file. Then, choose the category you wish to import, and "View/Select Entries." Once you've selected everything you wish to import from the module, hit "Import Selected." This ensures entries are imported in the correct order.</p>
					<p><b>Note:</b> The script-wide configurable "rest time" options affect how quickly each category of entries is imported (tables and decks use the "Handout" rest time).</p>
					<p><b>Note:</b> Configuration options (aside from "rest time" as detailed above) <i>do not</i> affect the module importer. It effectively "clones" the content as-exported from the original module, including any whisper/advantage/etc settings.</p>
				</div>

				<div id="d20plus-module-importer-5etools" title="Select Module">
					<div id="module-importer-list-5etools">
						<input type="search" class="search" placeholder="Search modules...">
						<div>
							<div style="display: inline-block; width: 13px; height: 1px;"></div>
							<div class="col-5 col">Name</div>
							<div class="col-1 col" style="text-align: center;">Version</div>
							<div class="col-2 col" style="text-align: center;">Last Modified</div>
							<div class="col-1 col" style="text-align: center;">Size</div>
							<div class="col-2 col" style="text-align: center;">Source</div>
						</div>
						<div class="list" style="transform: translateZ(0); max-height: 480px; overflow-y: auto; overflow-x: hidden; margin-bottom: 10px;">
						<i>Loading...</i>
						</div>
					</div>
					<p><button class="btn load">Load Module Data</button></p>
				</div>

				<div id="d20plus-module-importer-select-exports-p1" title="Select Categories to Export">
					<div>
						<label>Characters <input type="checkbox" class="float-right" name="cb-characters"></label>
						<label>Decks <input type="checkbox" class="float-right" name="cb-decks"></label>
						<label>Handouts <input type="checkbox" class="float-right" name="cb-handouts"></label>
						<label>Jukebox Playlists <input type="checkbox" class="float-right" name="cb-playlists"></label>
						<label>Jukebox Tracks <input type="checkbox" class="float-right" name="cb-tracks"></label>
						<label>Maps <input type="checkbox" class="float-right" name="cb-maps"></label>
						<label>Rollable Tables <input type="checkbox" class="float-right" name="cb-rolltables"></label>
					</div>
					<div class="clear" style="width: 100%; border-bottom: #ccc solid 1px;"></div>
					<p style="margin-top: 5px;"><label>Select All <input type="checkbox" class="float-right" name="cb-all"></label></p>
					<p><button class="btn">Export</button></p>
				</div>
				`,
		dialogFn: () => {
			$("#d20plus-module-importer").dialog({
				autoOpen: false,
				resizable: true,
				width: 750,
				height: 360,
			});
			$(`#d20plus-module-importer-progress`).dialog({
				autoOpen: false,
				resizable: false,
			});
			$("#d20plus-module-importer-5etools").dialog({
				autoOpen: false,
				resizable: true,
				width: 800,
				height: 600,
			});
			$("#d20plus-module-importer-help").dialog({
				autoOpen: false,
				resizable: true,
				width: 600,
				height: 400,
			});
			$("#d20plus-module-importer-select-exports-p1").dialog({
				autoOpen: false,
				resizable: true,
				width: 400,
				height: 275,
			});
			$("#d20plus-module-importer-list").dialog({
				autoOpen: false,
				resizable: true,
				width: 600,
				height: 800,
			});
		},
		openFn: () => {
			const DISPLAY_NAMES = {
				maps: "Maps",
				rolltables: "Rollable Tables",
				decks: "Decks",
				handouts: "Handouts",
				playlists: "Jukebox Playlists",
				tracks: "Jukebox Tracks",
				characters: "Characters",
			};

			const $win = $("#d20plus-module-importer");
			$win.dialog("open");

			const $winProgress = $(`#d20plus-module-importer-progress`);
			const $btnCancel = $winProgress.find(".cancel").off("click");

			const $win5etools = $(`#d20plus-module-importer-5etools`);

			const $winHelp = $(`#d20plus-module-importer-help`);
			const $btnHelp = $win.find(`.readme`).off("click").click(() => $winHelp.dialog("open"));

			const $winList = $(`#d20plus-module-importer-list`);
			const $wrpLst = $(`#module-importer-list`);
			const $lst = $winList.find(`.list`).empty();
			const $cbAll = $winList.find(`.select-all`).off("click").prop("disabled", true);
			const $iptSearch = $winList.find(`.search`).prop("disabled", true);
			const $btnConfirmSel = $winList.find(`[name="confirm-selection"]`).off("click");

			const $wrpSummary = $win.find(`[name="selection-summary"]`);
			const $wrpDataLoadingMessage = $win.find(`[name="data-loading-message"]`);

			const $btnImport = $win.find(`[name="import"]`).off("click").prop("disabled", true);
			const $btnViewCat = $win.find(`[name="view-select-entries"]`).off("click").prop("disabled", true);
			const $btnSelAllContent = $win.find(`[name="select-all-entries"]`).off("click").prop("disabled", true);

			const $selDataType = $win.find(`[name="data-type"]`).prop("disabled", true);
			let lastDataType = $selDataType.val();
			let genericFolder;
			let lastLoadedData = null;

			const getFreshSelected = () => ({
				characters: [],
				decks: [],
				handouts: [],
				maps: [],
				playlists: [],
				tracks: [],
				rolltables: [],
			});

			let selected = getFreshSelected();

			function handleLoadedData (data) {
				lastLoadedData = data;
				selected = getFreshSelected();
				$selDataType.prop("disabled", false);

				function updateSummary () {
					$wrpSummary.text(Object.entries(selected).filter(([prop, ents]) => ents && ents.length).map(([prop, ents]) => `${DISPLAY_NAMES[prop]}: ${ents.length} selected`).join("; "));
				}

				$btnViewCat.prop("disabled", false);
				$btnViewCat.off("click").click(() => {
					$winList.dialog("open");
					$iptSearch.prop("disabled", false);

					let prop = "";
					switch (lastDataType) {
						case "rolltables":
						case "decks":
						case "playlists":
						case "tracks":
						case "maps": {
							prop = lastDataType;
							break;
						}
						case "handouts": {
							prop = "handouts";
							genericFolder = d20plus.journal.makeDirTree(`Handouts`);
							break;
						}
						case "characters": {
							prop = "characters";
							genericFolder = d20plus.journal.makeDirTree(`Characters`);
							break;
						}
						default: throw new Error(`Unhandled data type: ${lastDataType}`);
					}

					const moduleData = data[prop] || [];
					moduleData.sort((a, b) => SortUtil.ascSortLower(
						(a.attributes && a.attributes.name) || a.name || a.title || "",
						(b.attributes && a.attributes.name) || a.name || b.title || "",
					));

					$lst.empty();
					moduleData.forEach((m, i) => {
						const img = lastDataType === "maps" ? m.attributes.thumbnail
							: (lastDataType === "characters" || lastDataType === "handouts" || lastDataType === "decks") ? m.attributes.avatar : "";

						$lst.append(`
									<label class="import-cb-label ${img ? `import-cb-label--img` : ""}" data-listid="${i}">
										<input type="checkbox">
										${img && img.trim() ? `<img class="import-label__img" src="${img}">` : ""}
										<span class="name col-9 readable">${(m.attributes && m.attributes.name) || m.name || m.title || ""}</span>
									</label>
								`);
					});

					const entryList = new List("module-importer-list", {
						valueNames: ["name"],
					});

					$cbAll.prop("disabled", false).off("click").click(() => {
						entryList.items.forEach(it => {
							$(it.elm).find(`input[type="checkbox"]`).prop("checked", $cbAll.prop("checked"));
						});
					});

					$btnConfirmSel.off("click").click(() => {
						const sel = entryList.items
							.filter(it => $(it.elm).find(`input`).prop("checked"))
							.map(it => moduleData[$(it.elm).attr("data-listid")]);

						$cbAll.prop("checked", false);
						$winList.dialog("close");
						selected[prop] = sel;
						updateSummary();
					});
				});

				$btnSelAllContent.prop("disabled", false);
				$btnSelAllContent.off("click").click(() => {
					Object.keys(selected).forEach(k => {
						selected[k] = data[k];
						updateSummary();
					});
				});

				$btnImport.prop("disabled", false).off("click").click(() => {
					const totalSelected = Object.values(selected).map(it => it ? it.length : 0).reduce((a, b) => a + b, 0);
					if (!totalSelected) return alert("No entries selected!");

					const $name = $winProgress.find(`.name`);
					const $remain = $winProgress.find(`.remaining`).text(`${totalSelected} remaining...`);
					const $errCount = $winProgress.find(`.errors`);
					const $errReasons = $winProgress.find(`.error-names`);
					let errCount = 0;

					$winProgress.dialog("open");

					const journal = data.journal ? MiscUtil.copy(data.journal).reverse() : null;

					let queue = [];
					let jukebox = {};
					Object.entries(selected).filter(([k, v]) => v && v.length).forEach(([prop, ents]) => {
						if (prop === "playlists") return jukebox.playlists = (jukebox.playlists || []).concat(ents);
						else if (prop === "tracks") return jukebox.tracks = (jukebox.tracks || []).concat(ents);

						ents = MiscUtil.copy(ents);

						// if importing journal items, make sure they get put back in the right order
						if (journal && (prop === "characters" || prop === "handouts")) {
							const nuQueue = [];

							journal.forEach(jIt => {
								const qIx = ents.findIndex(qIt => qIt.attributes.id === jIt.id);
								if (~qIx) nuQueue.push(ents.splice(qIx, 1)[0]);
							});
							ents.forEach(qIt => nuQueue.push(qIt)); // add anything that wasn't in the journal to the end of the queue
							ents = nuQueue;
						}

						const toAdd = ents.map(entry => ({entry, prop}));
						// do maps first
						if (prop === "maps") queue = toAdd.concat(queue);
						else queue = queue.concat(toAdd);
					});

					// reset the tool
					selected = getFreshSelected();
					$wrpSummary.text("");

					let isCancelled = false;
					let lastTimeout = null;
					$btnCancel.off("click").click(() => {
						isCancelled = true;
						if (lastTimeout != null) {
							clearTimeout(lastTimeout);
							doImport();
						}
					});
					const mapTimeout = d20plus.cfg.get("import", "importIntervalMap") || d20plus.cfg.getDefault("import", "importIntervalMap");
					const charTimeout = d20plus.cfg.get("import", "importIntervalCharacter") || d20plus.cfg.getDefault("import", "importIntervalCharacter");
					const handoutTimeout = d20plus.cfg.get("import", "importIntervalHandout") || d20plus.cfg.getDefault("import", "importIntervalHandout");
					const timeouts = {
						characters: charTimeout,
						decks: handoutTimeout,
						handouts: handoutTimeout,
						playlists: 0,
						tracks: 0,
						maps: mapTimeout,
						rolltables: handoutTimeout,
					};

					const addToJournal = (originalId, itId) => {
						let handled = false;
						if (journal) {
							const found = journal.find(it => it.id === originalId);
							if (found) {
								const rawPath = found.path;
								const cleanPath = rawPath.slice(1); // paths start with "Root"
								const folder = d20plus.journal.makeDirTree(...cleanPath);
								d20.journal.addItemToFolderStructure(itId, folder.id);
								handled = true;
							}
						}

						if (!handled) d20.journal.addItemToFolderStructure(itId, genericFolder.id);
					};

					const doImport = () => {
						if (isCancelled) {
							$name.text("Import cancelled.");
							$remain.text(`Cancelled with ${queue.length} remaining.`);
						} else if (queue.length && !isCancelled) {
							$remain.text(`${queue.length} remaining...`);
							const {entry, prop} = queue.shift();
							const timeout = timeouts[prop];
							const name = entry.attributes.name;
							try {
								$name.text(`Importing ${name}`);

								switch (prop) {
									case "maps": {
										const map = d20.Campaign.pages.create(entry.attributes);
										entry.graphics.forEach(it => map.thegraphics.create(it));
										entry.paths.forEach(it => map.thepaths.create(it));
										entry.text.forEach(it => map.thetexts.create(it));
										map.save();
										break;
									}
									case "rolltables": {
										const table = d20.Campaign.rollabletables.create(entry.attributes);
										table.tableitems.reset();
										const toSave = entry.tableitems.map(it => table.tableitems.push(it));
										toSave.forEach(s => s.save());
										table.save();
										break;
									}
									case "decks": {
										const deck = d20.Campaign.decks.create(entry.attributes);
										deck.cards.reset();
										const toSave = entry.cards.map(it => deck.cards.push(it));
										toSave.forEach(s => s.save());
										deck.save();
										break;
									}
									case "handouts": {
										d20.Campaign.handouts.create(entry.attributes,
											{
												success: function (handout) {
													handout.updateBlobs({
														notes: entry.blobNotes,
														gmnotes: entry.blobGmNotes,
													});

													addToJournal(entry.attributes.id, handout.id);
												},
											},
										);
										break;
									}
									case "characters": {
										d20.Campaign.characters.create(entry.attributes,
											{
												success: function (character) {
													character.attribs.reset();
													const toSave = entry.attribs.map(a => character.attribs.push(a));
													toSave.forEach(s => s.syncedSave());

													character.abilities.reset();
													if (entry.abilities) entry.abilities.map(a => character.abilities.push(a)).forEach(s => s.save());

													character.updateBlobs({
														bio: entry.blobBio,
														gmnotes: entry.blobGmNotes,
														defaulttoken: entry.blobDefaultToken,
													});

													addToJournal(entry.attributes.id, character.id);
												},
											},
										);
										break;
									}
									default: throw new Error(`Unhandled data type: ${prop}`);
								}
							} catch (e) {
								// eslint-disable-next-line no-console
								console.error(e);

								errCount++;
								$errCount.text(errCount);
								const prevReasons = $errReasons.text().trim();
								$errReasons.append(`${prevReasons.length ? ", " : ""}${name}: "${e.message}"`)
							}

							// queue up the next import
							lastTimeout = setTimeout(doImport, timeout);
						} else {
							$name.text("Import complete!");
							$remain.text(`${queue.length} remaining.`);
						}
					};

					if (Object.keys(jukebox).length) d20plus.jukebox.importWrappedData(jukebox);
					doImport();
				});
			}

			$selDataType.off("change").on("change", () => {
				lastDataType = $selDataType.val();
			});

			const $btnLoadVetools = $win.find(`[name="load-Vetools"]`);
			$btnLoadVetools.off("click").click(() => {
				$win5etools.dialog("open");
				const $btnLoad = $win5etools.find(`.load`).off("click");

				DataUtil.loadJSON(`${DATA_URL_MODULES}/roll20-module-index.json`).then(data => {
					const $lst = $win5etools.find(`.list`);
					const modules = data.map.sort((a, b) => SortUtil.ascSortLower(a.name, b.name));
					let tmp = "";
					modules.forEach((t, i) => {
						tmp += `
								<label class="import-cb-label" data-listid="${i}">
									<input type="radio" name="map-5etools">
									<span class="name col-5 readable">${t.name}</span>
									<span class="version col-1 readable" style="text-align: center;">${t.version || ""}</span>
									<span class="lat-modified col-2 readable" style="text-align: center;">${t.dateLastModified ? DatetimeUtil.getDateStr({date: new Date(t.dateLastModified * 1000), isShort: true}) : ""}</span>
									<span class="size col-1 readable" style="text-align: right;">${d20plus.ut.getReadableFileSizeString(t.size)}</span>
									<span title="${Parser.sourceJsonToFull(t.id)}" class="source readable" style="text-align: right;">SRC[${Parser.sourceJsonToAbv(t.id)}]</span>
								</label>
							`;
					});
					$lst.html(tmp);
					tmp = null;

					const list5etools = new List("module-importer-list-5etools", {
						valueNames: ["name"],
					});

					$btnLoad.on("click", () => {
						const sel = list5etools.items
							.filter(it => $(it.elm).find(`input`).prop("checked"))
							.map(it => modules[$(it.elm).attr("data-listid")])[0];

						$win5etools.dialog("close");
						$win.dialog("open");
						$wrpDataLoadingMessage.html("<i>Loading...</i>");
						DataUtil.loadJSON(`${DATA_URL_MODULES}/roll20-module-${sel.id.toLowerCase()}.json`)
							.then(moduleFile => {
								$wrpDataLoadingMessage.html("");
								return handleLoadedData(moduleFile);
							})
							.catch(e => {
								$wrpDataLoadingMessage.html("");
								// eslint-disable-next-line no-console
								console.error(e);
								alert(`Failed to load data! See the console for more information.`);
							});
					});
				}).catch(e => {
					// eslint-disable-next-line no-console
					console.error(e);
					alert(`Failed to load data! See the console for more information.`);
				});
			});

			// For content loaded from the R20 repo
			const $btnLoadDmsguild = $win.find(`[name="load-dmsguild"]`);
			$btnLoadDmsguild.off("click").click(() => {
				$win5etools.dialog("open");
				const $btnLoad = $win5etools.find(`.load`).off("click");
				// url for the repo
				const urlbase = "https://raw.githubusercontent.com/DMsGuild201/Roll20_resources/master/Module/";

				DataUtil.loadJSON(`${urlbase}index.json`).then(data => {
					const $lst = $win5etools.find(`.list`);
					const modules = data.map.sort((a, b) => SortUtil.ascSortLower(a.name, b.name));
					let tmp = "";
					// Display each module in the selector
					modules.forEach((t, i) => {
						tmp += `
								<label class="import-cb-label" data-listid="${i}">
									<input type="radio" name="map-5etools">
									<span class="name col-5 readable">${t.name}</span>
									<span class="version col-1 readable" style="text-align: center;">${t.version || ""}</span>
									<span class="lat-modified col-2 readable" style="text-align: center;">${t.dateLastModified ? DatetimeUtil.getDateStr({date: new Date(t.dateLastModified * 1000), isShort: true}) : ""}</span>
									<span class="size col-1 readable" style="text-align: right;">${t.size ? d20plus.ut.getReadableFileSizeString(t.size) : ""}</span>
									<span title="${Parser.sourceJsonToFull(t.id)}" class="source readable" style="text-align: right;">SRC[${Parser.sourceJsonToAbv(t.id)}]</span>
								</label>
							`;
					});
					$lst.html(tmp);
					tmp = null;

					const list5etools = new List("module-importer-list-5etools", {
						valueNames: ["name"],
					});

					$btnLoad.on("click", () => {
						const sel = list5etools.items
							.filter(it => $(it.elm).find(`input`).prop("checked"))
							.map(it => modules[$(it.elm).attr("data-listid")])[0];

						$win5etools.dialog("close");
						$win.dialog("open");
						$wrpDataLoadingMessage.html("<i>Loading...</i>");
						// Load the chosen module
						DataUtil.loadJSON(`${urlbase}${sel.filename}`)
							.then(moduleFile => {
								$wrpDataLoadingMessage.html("");
								return handleLoadedData(moduleFile);
							})
							.catch(e => {
								$wrpDataLoadingMessage.html("");
								// eslint-disable-next-line no-console
								console.error(e);
								alert(`Failed to load data! See the console for more information.`);
							});
					});
				}).catch(e => {
					// eslint-disable-next-line no-console
					console.error(e);
					alert(`Failed to load data! See the console for more information.`);
				});
			});

			// Load from file
			const $btnLoadFile = $win.find(`[name="load-file"]`);
			$btnLoadFile.off("click").click(async () => {
				const data = await DataUtil.pUserUpload();
				// Due to the new util functon, need to account for data being an array
				data.jsons.forEach(d => handleLoadedData(d));
			});

			const $winExportP1 = $("#d20plus-module-importer-select-exports-p1");
			const $cbAllExport = $winExportP1.find(`[name="cb-all"]`);

			const $btnExport = $win.find(`[name="export"]`);
			$btnExport.off("click").click(() => {
				const CATS = [
					"characters",
					"decks",
					"handouts",
					"playlists",
					"tracks",
					"maps",
					"rolltables",
				];

				$winExportP1.dialog("open");

				$cbAllExport.off("change").on("change", () => {
					CATS.forEach(cat => $winExportP1.find(`input[name="cb-${cat}"]`).prop("checked", $cbAllExport.prop("checked")))
				});

				$winExportP1.find("button").off("click").click(async () => {
					const isCatSelected = (name) => $winExportP1.find(`input[name="cb-${name}"]`).prop("checked");

					const catsToExport = new Set(CATS.filter(it => isCatSelected(it)));

					// eslint-disable-next-line no-console
					console.log("Exporting journal...");
					const journal = d20plus.journal.getExportableJournal();

					let maps;
					if (catsToExport.has("maps")) {
						// eslint-disable-next-line no-console
						console.log("Exporting maps..."); // shoutouts to Stormy
						maps = await Promise.all(d20.Campaign.pages.models.map(async map => {
							const getOut = () => {
								return {
									attributes: map.attributes,
									graphics: (map.thegraphics || []).map(g => g.attributes),
									text: (map.thetexts || []).map(t => t.attributes),
									paths: (map.thepaths || []).map(p => p.attributes),
								};
							};

							if (map.get("archived")) {
								map.set({archived: false});
								await d20plus.ut.promiseDelay(d20plus.cfg.getOrDefault("import", "importIntervalHandout") * 2);
								const out = getOut();
								map.set({archived: true});
								return out;
							} else {
								return getOut();
							}
						}));
					}

					let rolltables;
					if (catsToExport.has("rolltables")) {
						// eslint-disable-next-line no-console
						console.log("Exporting rolltables...");
						rolltables = d20.Campaign.rollabletables.models.map(rolltable => ({
							attributes: rolltable.attributes,
							tableitems: (rolltable.tableitems.models || []).map(tableitem => tableitem.attributes),
						}));
					}

					let decks;
					if (catsToExport.has("decks")) {
						// eslint-disable-next-line no-console
						console.log("Exporting decks...");
						decks = d20.Campaign.decks.models.map(deck => {
							if (deck.name && deck.name.toLowerCase() === "playing cards") return;
							return {
								attributes: deck.attributes,
								cards: (deck.cards.models || []).map(card => card.attributes),
							};
						}).filter(it => it);
					}

					let playlists;
					if (catsToExport.has("playlists")) {
						// eslint-disable-next-line no-console
						console.log("Exporting jukebox playlists...");
						playlists = d20plus.jukebox.getExportablePlaylists();
					}

					let tracks;
					if (catsToExport.has("tracks")) {
						// eslint-disable-next-line no-console
						console.log("Exporting jukebox tracks...");
						tracks = d20plus.jukebox.getExportableTracks();
					}

					let blobCount = 0;
					let onBlobsReady = null;
					let anyBlobs = false;

					const handleBlob = (addTo, asKey, data) => {
						addTo[asKey] = data;
						blobCount--;
						if (onBlobsReady && blobCount === 0) onBlobsReady();
					};

					let characters;
					if (catsToExport.has("characters")) {
						anyBlobs = true;
						// eslint-disable-next-line no-console
						console.log("Exporting characters...");
						characters = d20.Campaign.characters.models.map(character => {
							const out = {
								attributes: character.attributes,
								attribs: character.attribs,
							};
							const abilities = (character.abilities || {models: []}).models.map(ability => ability.attributes);
							if (abilities && abilities.length) out.abilities = abilities;
							blobCount += 3;
							character._getLatestBlob("bio", (data) => handleBlob(out, "blobBio", data));
							character._getLatestBlob("gmnotes", (data) => handleBlob(out, "blobGmNotes", data));
							character._getLatestBlob("defaulttoken", (data) => handleBlob(out, "blobDefaultToken", data));
							return out;
						});
					}

					let handouts;
					if (catsToExport.has("handouts")) {
						anyBlobs = true;
						// eslint-disable-next-line no-console
						console.log("Exporting handouts...");
						handouts = d20.Campaign.handouts.models.map(handout => {
							if (handout.attributes.name === ART_HANDOUT || handout.attributes.name === CONFIG_HANDOUT) return;

							const out = {
								attributes: handout.attributes,
							};
							blobCount += 2;
							handout._getLatestBlob("notes", (data) => handleBlob(out, "blobNotes", data));
							handout._getLatestBlob("gmnotes", (data) => handleBlob(out, "blobGmNotes", data));
							return out;
						}).filter(it => it);
					}

					// eslint-disable-next-line no-console
					if (anyBlobs) console.log("Waiting for blobs...");
					onBlobsReady = () => {
						// eslint-disable-next-line no-console
						if (anyBlobs) console.log("Blobs are ready!");

						// eslint-disable-next-line no-console
						console.log("Preparing payload");

						const payload = {
							schema_version: 1, // version number from r20es
						};
						if (maps) payload.maps = maps;
						if (rolltables) payload.rolltables = rolltables;
						if (decks) payload.decks = decks;
						if (journal) payload.journal = journal;
						if (handouts) payload.handouts = handouts;
						if (characters) payload.characters = characters;
						if (playlists) payload.playlists = playlists;
						if (tracks) payload.tracks = tracks;

						const filename = document.title.replace(/\|\s*Roll20$/i, "").trim().replace(/[^-\w]/g, "_");
						const data = JSON.stringify(payload, null, "\t");

						// eslint-disable-next-line no-console
						console.log("Saving");
						const blob = new Blob([data], {type: "application/json"});
						d20plus.ut.saveAs(blob, `${filename}.json`);
					};
					if (!anyBlobs || blobCount === 0) onBlobsReady();
				});

				// TODO
				/*
				macro
				 */
			});
		},
	})
}

SCRIPT_EXTENSIONS.push(baseToolModule);
