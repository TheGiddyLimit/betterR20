function baseTool() {
	d20plus.tool = {};

	/**
	 * Each tool should have:
	 *  - `name` List display name.
	 *  - `desc` List display description.
	 *  - `dialogFn` Function called to initialize dialog.
	 *  - `openFn` Function called when tool is opened.
	 */
	d20plus.tool.tools = [
		{
			name: "Journal Cleaner",
			desc: "Quickly select and delete journal items, especially useful for cleaning up loose items after deleting a folder.",
			html: `
				<div id="d20plus-quickdelete" title="BetteR20 - Journal Root Cleaner">
				<p>A list of characters and handouts in the journal folder root, which allows them to be quickly deleted.</p>
				<label style="font-weight: bold">Root Only <input type="checkbox" class="cb-deep" checked></label>
				<hr>
				<p style="display: flex; justify-content: space-between"><label><input type="checkbox" title="Select all" id="deletelist-selectall"> Select All</label> <a class="btn" href="#" id="quickdelete-btn-submit">Delete Selected</a></p>
				<div id="delete-list-container">
					<input class="search" autocomplete="off" placeholder="Search list..." style="width: 100%;">
					<br><br>
					<ul class="list deletelist" style="max-height: 420px; overflow-y: scroll; display: block; margin: 0;"></ul>
				</div>
				</div>
				`,
			dialogFn: () => {
				$("#d20plus-quickdelete").dialog({
					autoOpen: false,
					resizable: true,
					width: 800,
					height: 700,
				});
			},
			openFn: () => {
				const $win = $("#d20plus-quickdelete");
				$win.dialog("open");
				const $cbDeep = $win.find(`.cb-deep`);

				const $cbAll = $("#deletelist-selectall").unbind("click");

				const $btnDel = $(`#quickdelete-btn-submit`).off("click");

				$cbDeep.off("change").on("change", () => populateList());

				populateList();

				function populateList () {
					// collect a list of all journal items
					function getAllJournalItems () {
						const out = [];

						function recurse (entry, pos, isRoot) {
							if (entry.i) {
								if (!isRoot) pos.push(entry.n);
								entry.i.forEach(nxt => recurse(nxt, pos));
								pos.pop();
							} else out.push({id: entry, path: MiscUtil.copy(pos)});
						}

						const root = {i: d20plus.ut.getJournalFolderObj()};
						recurse(root, [], true);
						return out.map(it => getItemFromId(it.id, it.path.join(" / ")));
					}

					function getRootJournalItems () {
						const rootItems = [];
						const journal = d20plus.ut.getJournalFolderObj();
						journal.forEach(it => {
							if (it.i) return; // skip folders
							rootItems.push(getItemFromId(it));
						});
						return rootItems;
					}

					function getItemFromId (itId, path = "") {
						const handout = d20.Campaign.handouts.get(itId);
						if (handout && (handout.get("name") === CONFIG_HANDOUT || handout.get("name") === ART_HANDOUT)) return null; // skip 5etools handouts
						const character = d20.Campaign.characters.get(itId);
						if (handout) return {type: "handouts", id: itId, name: handout.get("name"), path: path, archived: handout.attributes.archived};
						if (character) return {type: "characters", id: itId, name: character.get("name"), path: path, archived: character.attributes.archived};
					}

					function getJournalItems () {
						if ($cbDeep.prop("checked")) return getRootJournalItems().filter(it => it);
						else return getAllJournalItems().filter(it => it);
					}

					const journalItems = getJournalItems();

					const $delList = $win.find(`.list`);
					$delList.empty();

					journalItems.forEach((it, i) => {
						$delList.append(`
							<label class="import-cb-label" data-listid="${i}">
								<input type="checkbox">
								<span class="name readable">${it.path ? `${it.path} / ` : ""}${it.name}</span>
								${it.archived ? "<span class=\"name readable\">(archived)</span>" : ""}
							</label>
						`);
					});

					// init list library
					const delList = new List("delete-list-container", {
						valueNames: ["name"],
						listClass: "deletelist"
					});

					$cbAll.prop("checked", false);
					$cbAll.off("click").click(() => d20plus.importer._importToggleSelectAll(delList, $cbAll));

					$btnDel.off("click").on("click", () => {
						const sel = delList.items
							.filter(it => $(it.elm).find(`input`).prop("checked"))
							.map(it => journalItems[$(it.elm).attr("data-listid")]);

						if (!sel.length) {
							alert("No items selected!");
						} else if (confirm(`Are you sure you want to delete the ${sel.length} selected item${sel.length > 1 ? "s" : ""}?`)) {
							$win.dialog("close");
							$("a.ui-tabs-anchor[href='#journal']").trigger("click");
							sel.forEach(toDel => {
								d20.Campaign[toDel.type].get(toDel.id).destroy();
							});
							$("#journalfolderroot").trigger("change");
						}
					});
				}
			}
		},
		{
			name: "SVG Draw",
			desc: "Paste SVG data as text to automatically draw the paths.",
			html: `
				<div id="d20plus-svgdraw" title="Better20 - SVG Drawing Tool">
				<p>Paste SVG data as text to automatically draw any included &lt;path&gt;s. Draws to the current layer, in the top-left corner, with no scaling. Takes colour information from &quot;stroke&quot; attributes.</p>
				<p>Line width (px; default values are 1, 3, 5, 8, 14): <input name="stroke-width" placeholder="5" value="5" type="number"></p>
				<textarea rows="10" cols="100" placeholder="Paste SVG data here"></textarea>
				<br>
				<button class="btn">Draw</button>
				</div>
				`,
			dialogFn: () => {
				$("#d20plus-svgdraw").dialog({
					autoOpen: false,
					resizable: true,
					width: 800,
					height: 650,
				});
			},
			openFn: () => {
				// adapted from `d20.engine.finishCurrentPolygon`
				function addShape(path, pathStroke, strokeWidth) {
					let i = d20.engine.convertAbsolutePathStringtoFabric(path);
					i = _.extend(i, {
						strokeWidth: strokeWidth,
						fill: "transparent",
						stroke: pathStroke,
						path: JSON.parse(i.path)
					});
					d20.Campaign.activePage().addPath(i);
					d20.engine.redrawScreenNextTick();
				}

				const $win = $("#d20plus-svgdraw");
				$win.dialog("open");

				$win.find(`button`).off("click").on("click", () => {
					d20plus.ut.log("Drawing paths");
					const input = $win.find(`textarea`).val();
					const svg = $.parseXML(input);

					const toDraw = $(svg).find("path").map((i, e) => {
						const $e = $(e);
						return {stroke: $e.attr("stroke") || "black", d: $e.attr("d")}
					}).get();

					const strokeWidth = Math.max(1, Number($win.find(`input[name="stroke-width"]`).val()));

					toDraw.forEach(it => {
						addShape(it.d, it.stroke, strokeWidth)
					});
				});
			}
		},
		{
			name: "Multi-Whisper",
			desc: "Send whispers to multiple players ",
			html: `
				<div id="d20plus-whispers" title="Better20 - Multi-Whisper Tool">
				<div>
					<button class="btn toggle-dc">Show Disconnected Players</button>
					<button class="btn send-all">Send All Messages</button>
					<button class="btn clear-all">Clear All Messages</button>
				</div>
				<hr>
				<div class="messages" style="max-height: 600px; overflow-y: auto; overflow-x: hidden; transform: translateZ(0)">
					<!-- populate with JS -->
				</div>
				</div>
				`,
			dialogFn: () => {
				$("#d20plus-whispers").dialog({
					autoOpen: false,
					resizable: true,
					width: 1000,
					height: 760,
				});
			},
			openFn: () => {
				$("a.ui-tabs-anchor[href='#textchat']").trigger("click");

				const $win = $("#d20plus-whispers");
				$win.dialog("open");

				const $btnToggleDc = $win.find(`.toggle-dc`).off("click").text("Show Disconnected Players");
				const $btnSendAll = $win.find(`.send-all`).off("click");
				const $btnClearAll = $win.find(`.clear-all`).off("click");

				const $pnlMessages = $win.find(`.messages`).empty();
				const players = d20.Campaign.players.toJSON();
				players.forEach((p, i) => {
					const $btnSend = $(`<button class="btn send" style="margin-right: 5px;">Send</button>`).on("click", function () {
						const $btn = $(this);
						const $wrp = $btn.closest(`.wrp-message`);
						const toMsg = $wrp.find(`input[data-player-id]:checked`).filter(":visible").map((ii, e) => $(e).attr("data-player-id")).get();
						const content = $wrp.find(`.message`).val().trim();
						toMsg.forEach(targetId => {
							d20.textchat.doChatInput(`/w ${d20.Campaign.players.get(targetId).get("displayname").split(" ")[0]} ${content}`);

							// This only posts to local player's chat, sadly
							// d20.textchat.incoming(
							// 	false,
							// 	{
							// 		avatar: `/users/avatar/${window.currentPlayer.get("d20userid")}/30`,
							// 		who: d20.textchat.$speakingas.find("option:first-child").text(),
							// 		type: "whisper",
							// 		content: content,
							// 		playerid: window.currentPlayer.id,
							// 		id: d20plus.ut.generateRowId(),
							// 		target: targetId,
							// 		target_name: d20.Campaign.players.get(targetId).get("displayname") || ""
							// 	}
							// );
						})
					});

					const $btnClear =  $(`<button class="btn msg-clear">Clear</button>`).on("click", function () {
						$(this).closest(`.wrp-message`).find(`.message`).val("");
					});

					$pnlMessages.append($(`
							<div ${p.online || `style="display: none;"`} data-online="${p.online}" class="wrp-message">
								<div>
									${players.map((pp, ii) => `<label style="margin-right: 10px; ${pp.online || ` display: none;`}" data-online="${pp.online}" class="display-inline-block">${pp.displayname} <input data-player-id="${pp.id}" type="checkbox" ${i === ii ? `checked="true"` : ""}></label>`).join("")}
								</div>
								<textarea style="display: block; width: 95%;" placeholder="Enter whisper" class="message"></textarea>
							</div>						
						`).append($btnSend).append($btnClear).append(`<hr>`));
				});

				$btnToggleDc.on("click", () => {
					$btnToggleDc.text($btnToggleDc.text().startsWith("Show") ? "Hide Disconnected Players" : "Show Disconnected Players");
					$pnlMessages.find(`[data-online="false"]`).toggle();
				});

				$btnSendAll.on("click", () => {
					$pnlMessages.find(`button.send`).click();
				});

				$btnClearAll.on("click", () => $pnlMessages.find(`button.msg-clear`).click());
			}
		},
		{
			name: "Table Importer Expanded",
			desc: "Import TableExport data from an expanded list",
			html: `
				<div id="d20plus-expanded" title="Table Importer Expanded">
					<div id="table-list-expanded">
						<input type="search" class="search" placeholder="Search tables...">
						<div class="list" style="transform: translateZ(0); max-height: 490px; overflow-y: scroll; overflow-x: hidden;"><i>Loading...</i></div>
					</div>
				<br>
				<button class="btn start-import">Import</button>
				</div>
				
				<div id="d20plus-expanded-clipboard" title="Paste from Clipboard"/>
				`,
			dialogFn: () => {
				$("#d20plus-expanded").dialog({
					autoOpen: false,
					resizable: true,
					width: 650,
					height: 720,
				});
				$(`#d20plus-expanded-clipboard`).dialog({
					autoOpen: false,
					resizable: true,
					width: 640,
					height: 480,
				});
			},
			openFn: () => {
				const $win = $("#d20plus-expanded");
				$win.dialog("open");

				const $btnImport = $win.find(`.start-import`).off("click");

				const url = "https://raw.githubusercontent.com/TheGiddyLimit/TheGiddyLimit.github.io/master/data/generated/gendata-tables.json";
				DataUtil.loadJSON(url).then((data) => {
					// The function in charge of generating and saving the full table
					function createTable (t) {
						// Creates the table, with data for the full table
						const r20t = d20.Campaign.rollabletables.create({
							name: t.name.replace(/\s+/g, "-"),
							id: d20plus.ut.generateRowId()
						});

						labels = t.colLabels;
						// Gets the index of the first column labeled with a dice roll
						// For example, finds the d100 column
						const dplace = labels.findIndex(l => /d[0-9]+/.test(l));
						const tlen = labels.length;

						r20t.tableitems.reset(t.rows.map(i => {
							// Create the return value
							const out = {
								id: d20plus.ut.generateRowId(),
								name: ""
							};

							// Set the name
							for (col = 0; col < tlen; col++) {
								// Add a seperator for cases of multiple columns
								if (out.name.length > 0) {
									out.name += " | "
								}
								// Add each column to out.name
								if (col !== dplace) {
									// Get rid of ugly notation
									clean = i[col].replace(/\{@[\w\d]* (.*)\}/, "$1");
									out.name += clean;
								}
							}

							// Set the weight
							if (dplace !== -1) {
								weight = i[dplace];
								dash = weight.indexOf("–"); //Note: – is different from -

								// If the weight is a range
								if (dash !== -1) {
									// Get the two numbers in the range, subtract them, add 1
									low = parseInt(weight.substring(0, dash));
									high = parseInt(weight.substring(dash + 1));
									if (high === 0) high = 100;
									out.weight = high - low + 1;
								}
								// If the weight is a signle value
								else {
									out.weight = 1;
								}
							}
							// If the weight is unlisted
							else {
								out.weight = 1;
							}

							if (i.avatar) out.avatar = i.avatar;
							return out;
						}));
						r20t.tableitems.forEach(it => it.save());
					}


					// Official tables
					const $lst = $win.find(`.list`);
					const tables = data.table.sort((a, b) => SortUtil.ascSort(a.name, b.name));
					let tmp = "";
					tables.forEach((t, i) => {
						tmp += `
								<label class="import-cb-label" data-listid="${i}">
									<input type="checkbox">
									<span class="name col-10">${t.name}</span>
									<span title="${t.source ? Parser.sourceJsonToFull(t.source) : "Unknown Source"}" class="source">SRC[${t.source ? Parser.sourceJsonToAbv(t.source) : "UNK"}]</span>
								</label>
							`;
					});
					$lst.html(tmp);
					tmp = null;

					const tableList = new List("table-list-expanded", {
						valueNames: ["name", "source"]
					});

					$btnImport.on("click", () => {
						$("a.ui-tabs-anchor[href='#deckstables']").trigger("click");
						const sel = tableList.items
							.filter(it => $(it.elm).find(`input`).prop("checked"))
							.map(it => tables[$(it.elm).attr("data-listid")]);

						sel.forEach(t => createTable(t));
					});
				});
			}
		},
		{
			name: "Table Importer",
			desc: "Import TableExport data",
			html: `
				<div id="d20plus-tables" title="Better20 - Table Importer">
					<div>
					<button class="btn paste-clipboard">Paste from Clipboard</button> <i>Accepts <a href="https://app.roll20.net/forum/post/1144568/script-tableexport-a-script-for-exporting-and-importing-rollable-tables-between-accounts">TableExport</a> format.</i>
					</div>
					<br>
					<div id="table-list">
						<input type="search" class="search" placeholder="Search tables...">
						<div class="list" style="transform: translateZ(0); max-height: 490px; overflow-y: scroll; overflow-x: hidden;"><i>Loading...</i></div>
					</div>
				<br>
				<button class="btn start-import">Import</button>
				</div>
				
				<div id="d20plus-tables-clipboard" title="Paste from Clipboard"/>
				`,
			dialogFn: () => {
				$("#d20plus-tables").dialog({
					autoOpen: false,
					resizable: true,
					width: 650,
					height: 720,
				});
				$(`#d20plus-tables-clipboard`).dialog({
					autoOpen: false,
					resizable: true,
					width: 640,
					height: 480,
				});
			},
			openFn: () => {
				const $win = $("#d20plus-tables");
				$win.dialog("open");

				const $btnImport = $win.find(`.start-import`).off("click");
				const $btnClipboard = $win.find(`.paste-clipboard`).off("click");

				const url = `${BASE_SITE_URL}/data/roll20-tables.json`;
				DataUtil.loadJSON(url).then((data) => {
					function createTable (t) {
						const r20t = d20.Campaign.rollabletables.create({
							name: t.name.replace(/\s+/g, "-"),
							showplayers: t.isShown,
							id: d20plus.ut.generateRowId()
						});

						r20t.tableitems.reset(t.items.map(i => {
							const out = {
								id: d20plus.ut.generateRowId(),
								name: i.row
							};
							if (i.weight !== undefined) out.weight = i.weight;
							if (i.avatar) out.avatar = i.avatar;
							return out;
						}));
						r20t.tableitems.forEach(it => it.save());
					}

					// Allow pasting of custom tables
					$btnClipboard.on("click", () => {
						const $wrpClip = $(`#d20plus-tables-clipboard`);
						const $iptClip = $(`<textarea placeholder="Paste TableExport data here" style="display: block; width: 600px; height: 340px;"/>`).appendTo($wrpClip);
						const $btnCheck = $(`<button class="btn" style="margin-right: 5px;">Check if Valid</button>`).on("click", () => {
							let error = false;
							try {
								getFromPaste($iptClip.val());
							} catch (e) {
								console.error(e);
								window.alert(e.message);
								error = true;
							}
							if (!error) window.alert("Looking good!");
						}).appendTo($wrpClip);
						const $btnImport = $(`<button class="btn">Import</button>`).on("click", () => {
							$("a.ui-tabs-anchor[href='#deckstables']").trigger("click");
							const ts = getFromPaste($iptClip.val());
							ts.forEach(t => createTable(t));
							window.alert("Import complete");
						}).appendTo($wrpClip);

						$wrpClip.dialog("open");
					});

					function getFromPaste (paste) {
						const tables = [];
						let tbl = null;

						paste.split("\n").forEach(line => parseLine(line.trim()));
						parseLine(""); // ensure trailing newline
						return tables;

						function parseLine (line) {
							if (line.startsWith("!import-table-item")) {
								if (!tbl) {
									throw new Error("No !import-table statement found");
								}
								const [junk, tblName, row, weight, avatar] = line.split("--").map(it => it.trim());
								tbl.items.push({
									row,
									weight,
									avatar
								})
							} else if (line.startsWith("!import-table")) {
								if (tbl) {
									throw new Error("No blank line found between tables")
								}
								const [junk, tblName, showHide] = line.split("--").map(it => it.trim());
								tbl = {
									name: tblName,
									isShown: (showHide || "").toLowerCase() === "show"
								};
								tbl.items = [];
							} else if (line.trim()) {
								throw new Error("Non-empty line which didn't match !import-table or !import-table-item")
							} else {
								if (tbl) {
									tables.push(tbl);
									tbl = null;
								}
							}
						}
					}

					// Official tables
					const $lst = $win.find(`.list`);
					const tables = data.table.sort((a, b) => SortUtil.ascSort(a.name, b.name));
					let tmp = "";
					tables.forEach((t, i) => {
						tmp += `
								<label class="import-cb-label" data-listid="${i}">
									<input type="checkbox">
									<span class="name col-10">${t.name}</span>
									<span title="${t.source ? Parser.sourceJsonToFull(t.source) : "Unknown Source"}" class="source">SRC[${t.source ? Parser.sourceJsonToAbv(t.source) : "UNK"}]</span>
								</label>
							`;
					});
					$lst.html(tmp);
					tmp = null;

					const tableList = new List("table-list", {
						valueNames: ["name", "source"]
					});

					$btnImport.on("click", () => {
						$("a.ui-tabs-anchor[href='#deckstables']").trigger("click");
						const sel = tableList.items
							.filter(it => $(it.elm).find(`input`).prop("checked"))
							.map(it => tables[$(it.elm).attr("data-listid")]);

						sel.forEach(t => createTable(t));
					});
				});
			}
		},
		{
			name: "Token Avatar URL Fixer",
			desc: "Change the root URL for tokens en-masse.",
			html: `
				<div id="d20plus-avatar-fixer" title="Better20 - Avatar Fixer">
				<p><b>Warning:</b> this thing doesn't really work.</p>
				<p>Current URLs (view only): <select class="view-only"></select></p>
				<p><label>Replace:<br><input name="search" value="https://5etools.com/"></label></p>
				<p><label>With:<br><input name="replace" value="https://thegiddylimit.github.io/"></label></p>
				<p><button class="btn">Go!</button></p>
				</div>
				`,
			dialogFn: () => {
				$("#d20plus-avatar-fixer").dialog({
					autoOpen: false,
					resizable: true,
					width: 400,
					height: 400,
				});
			},
			openFn: () => {
				// FIXME this doesn't work, because it saves a nonsensical blob (imgsrc) instead of defaulttoken
				// see the working code in `initArtFromUrlButtons` for how this _should_ be done

				function replaceAll (str, search, replacement) {
					return str.split(search).join(replacement);
				}

				const $win = $("#d20plus-avatar-fixer");
				$win.dialog("open");

				const $selView = $win.find(`.view-only`);
				const toView = [];
				d20.Campaign.characters.toJSON().forEach(c => {
					if (c.avatar && c.avatar.trim()) {
						toView.push(c.avatar);
					}
				});
				toView.sort(SortUtil.ascSort).forEach(url => $selView.append(`<option disabled>${url}</option>`));

				const $btnGo = $win.find(`button`).off("click");
				$btnGo.on("click", () => {
					let count = 0;
					$("a.ui-tabs-anchor[href='#journal']").trigger("click");

					const search = $win.find(`[name="search"]`).val();
					const replace = $win.find(`[name="replace"]`).val();

					d20.Campaign.characters.toJSON().forEach(c => {
						const id = c.id;

						const realC = d20.Campaign.characters.get(id);

						const curr = realC.get("avatar");
						let toSave = false;
						if (curr.includes(search)) {
							count++;
							realC.set("avatar", replaceAll(curr, search, replace));
							toSave = true;
						}
						if (realC.get("defaulttoken")) {
							realC._getLatestBlob("defaulttoken", (bl) => {
								if (bl && bl.imgsrc && bl.imgsrc.includes(search)) {
									count++;
									realC.updateBlobs({imgsrc: replaceAll(bl.imgsrc, search, replace)});
									toSave = true;
								}
							});
						}
						if (toSave) {
							realC.save();
						}
					});
					window.alert(`Replaced ${count} item${count === 0 || count > 1 ? "s" : ""}.`)
				});
			}
		},
		{
			name: "Mass-Delete Pages",
			desc: "Quickly delete multiple pages.",
			html: `
				<div id="d20plus-mass-page-delete" title="Better20 - Mass-Delete Pages">
					<div id="del-pages-list">
						<div class="list" style="transform: translateZ(0); max-height: 490px; overflow-y: scroll; overflow-x: hidden; margin-bottom: 10px;"><i>Loading...</i></div>
					</div>
					<hr>
					<p><label class="ib"><input type="checkbox" class="select-all"> Select All</label> | <button class="btn btn-danger deleter">Delete</button></p>
					<p><i>This tool will delete neither your active page, nor a page active for players.</i></p>
				</div>
				`,
			dialogFn: () => {
				$("#d20plus-mass-page-delete").dialog({
					autoOpen: false,
					resizable: true,
					width: 600,
					height: 800,
				});
			},
			openFn: () => {
				function deletePage (model, pageList) {
					if ($("#page-toolbar .availablepage[data-pageid=" + model.id + "]").remove()) {
						var n = d20.Campaign.getPageIndex(model.id);
						if (model.thegraphics) {
							model.thegraphics.massdelete = true;
							model.thegraphics.backboneFirebase.reference.set(null);
						}
						if (model.thetexts) {
							model.thetexts.massdelete = true;
							model.thetexts.backboneFirebase.reference.set(null);
						}
						if (model.thepaths) {
							model.thepaths.backboneFirebase.reference.set(null);
							model.thepaths.massdelete = true;
						}
						let i = d20.Campaign.get("playerspecificpages");
						let o = false;
						_.each(i, function(e, n) {
							if (e === model.id) {
								delete i[n];
								o = true;
							}
						});
						o && d20.Campaign.save({
							playerspecificpages: i
						});
						model.destroy();
						d20.Campaign.activePageIndex > n && (d20.Campaign.activePageIndex -= 1);

						pageList.remove("page-id", model.id);
					}
				}

				const $win = $("#d20plus-mass-page-delete");
				$win.dialog("open");

				const $lst = $win.find(`.list`).empty();

				d20.Campaign.pages.models.forEach(m => {
					$lst.append(`
							<label class="import-cb-label import-cb-label--img" data-listid="${m.id}">
								<input type="checkbox">
								<img class="import-label__img" src="${m.attributes.thumbnail}">
								<span class="name col-9">${m.attributes.name}</span>
								<span style="display: none;" class="page-id">${m.id}</span>
							</label>
						`);
				});

				const pageList = new List("del-pages-list", {
					valueNames: ["name", "page-id"]
				});

				const $cbAll = $win.find(`.select-all`).off("click").click(() => {
					pageList.items.forEach(it => {
						$(it.elm).find(`input[type="checkbox"]`).prop("checked", $cbAll.prop("checked"));
					});
				});

				const $btnDel = $win.find(`.deleter`).off("click").click(() => {
					const sel = pageList.items
						.filter(it => $(it.elm).find(`input`).prop("checked"))
						.map(it => $(it.elm).attr("data-listid"))
						.map(pId => d20.Campaign.pages.models.find(it => it.id === pId))
						.filter(it => it);

					sel.forEach(m => {
						if (m.id !== d20.Campaign.get("playerpageid") && m.id !== d20.Campaign.activePage().id) {
							deletePage(m, pageList);
						}
					});
					$cbAll.prop("checked", false);
				});
			}
		},
		{
			name: "Quantum Token Entangler",
			desc: "Connect tokens between pages, linking their positions.",
			html: `
				<div id="d20plus-token-entangle" title="Better20 - Quantum Token Entangler">
					<p><i>Please note that this feature is highly experimental.
					<br>
					You can learn Token IDs by rightclicking a token -> "Advanced" -> "View Token ID."</i></p>
					<hr>
					<input id="token-entangle-id-1" placeholder="Master ID">
					Type: 
					<select id="token-entangle-type-1">
						<option value="0">Token</option>
						<option value="1">Path</option>
					</select>
					<br>
					<input id="token-entangle-id-2" placeholder="Slave ID">
					Type:  
					<select id="token-entangle-type-2">
						<option value="0">Token</option>
						<option value="1">Path</option>
					</select>
					<br>
					<button class="btn btn-default" id="token-entangle-go">Entangle</button>
					<hr>
					<input id="token-clear-entangles" placeholder="ID to Clear">
					Type:  
					<select id="token-clear-type">
						<option value="0">Token</option>
						<option value="1">Path</option>
					</select>
					<button class="btn btn-default" id="token-entangle-clear">Clear Entangles</button>
				</div>
				`,
			dialogFn: () => {
				const $win = $("#d20plus-token-entangle");

				const entangleTracker = {};
				const ALLOWED_TYPES = ["path", "image"];
				const SYNCABLE_ATTRS_IMAGE = [
					"rotation",
					"width",
					"height",
					"top",
					"left",
					"scaleX",
					"scaleY",
					"fliph",
					"flipv"
				];
				const SYNCABLE_ATTRS_PATH = [
					"rotation",
					"top",
					"left",
					"scaleX",
					"scaleY"
				];

				$win.data("VE_DO_ENTANGLE", (master) => {
					if (!ALLOWED_TYPES.includes(master.attributes.type)) return;

					// prevent double-binding
					if (entangleTracker[master.id]) return;

					const TO_SYNC = master.attributes.type === "image" ? SYNCABLE_ATTRS_IMAGE : SYNCABLE_ATTRS_PATH;

					master.on("change", (it) => {
						let anyUpdates = false;

						if (master.attributes.entangledImages && master.attributes.entangledImages.length) {
							if (TO_SYNC.filter(attr => it.changed[attr] !== undefined).length) {
								master.attributes.entangledImages = master.attributes.entangledImages.filter(id => {
									const slave = d20plus.ut.getTokenById(id);
									const SLAVE_ATTRS = slave.attributes.type === "image" ? SYNCABLE_ATTRS_IMAGE : SYNCABLE_ATTRS_PATH;
									if (slave) {
										TO_SYNC
											.filter(attr => SLAVE_ATTRS.includes(attr))
											.filter(attr => master.attributes[attr] != null)
											.forEach(attr => slave.attributes[attr] = master.attributes[attr]);
										slave.save();
										return true;
									} else {
										console.warn(`Cound not find entangled token with ID "${id}", removing...`);
										anyUpdates = true;
									}
								});

							}
						}

						if (master.attributes.entangledPaths && master.attributes.entangledPaths.length) {
							if (TO_SYNC.filter(attr => it.changed[attr] !== undefined).length) {
								master.attributes.entangledPaths = master.attributes.entangledPaths.filter(id => {
									const slave = d20plus.ut.getPathById(id);
									const SLAVE_ATTRS = slave.attributes.type === "image" ? SYNCABLE_ATTRS_IMAGE : SYNCABLE_ATTRS_PATH;
									if (slave) {
										TO_SYNC
											.filter(attr => SLAVE_ATTRS.includes(attr))
											.filter(attr => master.attributes[attr] != null)
											.forEach(attr => slave.attributes[attr] = master.attributes[attr]);
										slave.save();
										return true;
									} else {
										console.warn(`Cound not find entangled path with ID "${id}", removing...`);
										anyUpdates = true;
									}
								});
							}
						}

						if (anyUpdates) master.save();
					})
				});

				// do initial entangles
				const runInitial = () => {
					const pages = d20.Campaign.pages;
					if (pages && pages.models) {
						d20plus.ut.log("Initialisng existing entangles...");
						d20.Campaign.pages.models
							.forEach(model => {
								const PROPS = {
									thegraphics: "entangledImages",
									thepaths: "entangledPaths"
								};
								Object.keys(PROPS).forEach(prop => {
									Object.values(PROPS).forEach(attrK => {
										if (model[prop] && model[prop].models) {
											model[prop].models.filter(it => it.attributes[attrK] && it.attributes[attrK].length).forEach(it => {
												$win.data("VE_DO_ENTANGLE")(it);
											})
										}
									});
								});
							});
					} else {
						console.log("Pages uninitialised, waiting...");
						setTimeout(runInitial, 1000);
					}
				};

				runInitial();

				$win.dialog({
					autoOpen: false,
					resizable: true,
					width: 800,
					height: 400,
				});
			},
			openFn: () => {
				const ATTR_PROPS = ["entangledImages", "entangledPaths"];

				const notFound = (id, type) => alert(`${type === "image" ? "Token" : "Path"} with ID ${id} didn't exist!`);

				const $win = $("#d20plus-token-entangle");
				$win.dialog("open");

				const $ipt1 = $(`#token-entangle-id-1`);
				const $ipt2 = $(`#token-entangle-id-2`);
				const $selType1 = $(`#token-entangle-type-1`);
				const $selType2 = $(`#token-entangle-type-2`);

				const $btnGo = $(`#token-entangle-go`)
					.off("click")
					.click(() => {
						const id1 = $ipt1.val();
						const id2 = $ipt2.val();
						const checkExisting = (a, b) => {
							const _check = (p, q) => ATTR_PROPS.some(prop => p.attributes[prop] && a.attributes[prop].includes(q.id));

							if (_check(a, b)) return `"${a.id}" is already entangled to "${b.id}"!`;
							if (_check(b, a)) return `"${b.id}" is already entangled to "${a.id}"!`;
							return false;
						};

						const entity1 = $selType1.val() === "0" ? d20plus.ut.getTokenById(id1) : d20plus.ut.getPathById(id1);
						const entity2 = $selType2.val() === "0" ? d20plus.ut.getTokenById(id2) : d20plus.ut.getPathById(id2);

						if (!entity1) return notFound(id1, $selType1.val() === "0" ? "image" : "path");
						if (!entity2) return notFound(id2, $selType2.val() === "0" ? "image" : "path");

						const existing = checkExisting(entity1, entity2);
						if (existing) return alert(existing);

						const prop1 = entity2.attributes.type === "image" ? "entangledImages" : "entangledPaths";
						const prop2 = entity1.attributes.type === "image" ? "entangledImages" : "entangledPaths";

						(entity1.attributes[prop1] = entity1.attributes[prop1] || []).push(id2);
						entity1.save();
						(entity2.attributes[prop2] = entity2.attributes[prop2] || []).push(id1);
						entity2.save();

						$win.data("VE_DO_ENTANGLE")(entity1);
						$win.data("VE_DO_ENTANGLE")(entity2);
						alert("Entangled!");
					});

				const $iptClear = $(`#token-clear-entangles`);

				const $selTypeClear = $(`#token-clear-type`);

				const $btnClear = $(`#token-entangle-clear`)
					.off("click")
					.click(() => {
						const id = $iptClear.val();
						const entity = $selTypeClear.val() === "0" ? d20plus.ut.getTokenById(id) : d20plus.ut.getPathById(id);
						if (!entity) return notFound(id, $selTypeClear.val() === "0" ? "image" : "path");

						const count = (entity.attributes.entangledImages ? entity.attributes.entangledImages.length : 0) + (entity.attributes.entangledPaths ? entity.attributes.entangledPaths.length : 0);

						(entity.attributes.entangledImages || []).forEach(eId => {
							const ent = d20plus.ut.getTokenById(eId);
							if (ent && ent.attributes.entangledImages && ent.attributes.entangledImages.includes(id)) {
								ent.attributes.entangledImages.splice(ent.attributes.entangledImages.indexOf(id), 1);
								ent.save();
							}
						});

						(entity.attributes.entangledPaths || []).forEach(eId => {
							const ent = d20plus.ut.getPathById(eId);
							if (ent && ent.attributes.entangledPaths && ent.attributes.entangledPaths.includes(id)) {
								ent.attributes.entangledPaths.splice(ent.attributes.entangledPaths.indexOf(id), 1);
								ent.save();
							}
						});

						entity.attributes.entangledImages = [];
						entity.attributes.entangledPaths = [];
						entity.save();
						alert(`${count} entangle${count === 1 ? "" : "s"} cleared.`);
					});
			}
		}
	];

	d20plus.tool.get = (toolId) => {
		return d20plus.tool.tools.find(it => it.toolId === toolId);
	};

	d20plus.tool.addTools = () => {
		const $body = $(`body`);
		const $tools = $(`#d20-tools-list`);
		const $toolsList = $tools.find(`.tools-list`);
		d20plus.tool.tools.sort((a, b) => SortUtil.ascSortLower(a.name || "", b.name || "")).forEach(t => {
			$body.append(t.html); // add HTML
			try {
				t.dialogFn(); // init window
				// add tool row
				const $wrp = $(`<div class="tool-row"/>`);
				$wrp.append(`<span style="width: 20%; padding: 4px;">${t.name}</span>`);
				$wrp.append(`<span style="width: calc(60% - 8px); padding: 4px;">${t.desc}</span>`);
				$(`<a style="width: 15%;" class="btn" href="#">Open</a>`).on(mousedowntype, () => {
					t.openFn.bind(t)();
					$tools.dialog("close");
				}).appendTo($wrp);
				$toolsList.append($wrp);
			} catch (e) {
				console.error(`Failed to initialise tool "${t.name}"`);
				setTimeout(() => {
					throw e;
				}, 1);
			}
		});

		$tools.dialog({
			autoOpen: false,
			resizable: true,
			width: 800,
			height: 660,
		});
		$(`#button-view-tools`).on(mousedowntype, () => {
			$tools.dialog("open");
		});
	};
}

SCRIPT_EXTENSIONS.push(baseTool);
