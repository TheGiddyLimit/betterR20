const d20plusTemplate = function () {
	d20plus.template5e = {};

	d20plus.template5e._populateDropdown = function (dropdownId, inputFieldId, baseUrl, srcUrlObject, defaultSel, brewProps) {
		const defaultUrl = defaultSel ? d20plus.formSrcUrl(baseUrl, srcUrlObject[defaultSel]) : "";
		$(inputFieldId).val(defaultUrl);
		const dropdown = $(dropdownId);
		$.each(Object.keys(srcUrlObject), function (i, src) {
			dropdown.append($("<option>", {
				value: d20plus.formSrcUrl(baseUrl, srcUrlObject[src]),
				text: brewProps.includes("class") ? src.uppercaseFirst() : Parser.sourceJsonToFullCompactPrefix(src),
			}));
		});
		dropdown.append($("<option>", {
			value: "",
			text: "Custom",
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
						name: path.split("/").slice(1).join("/"),
					});
				});
		});
		dataList.sort((a, b) => SortUtil.ascSortLower(a.name, b.name)).forEach(it => {
			dropdown.append($("<option>", {
				value: `${it.download_url}${d20plus.ut.getAntiCacheSuffix()}`,
				text: `Homebrew: ${it.name.trim().replace(/\.json$/i, "")}`,
			}));
		});

		dropdown.val(defaultUrl);
		dropdown.change(function () {
			$(inputFieldId).val(this.value);
		});
	}

	d20plus.template5e._populateBasicDropdown = function (dropdownId, inputFieldId, defaultSel, brewProps, addForPlayers) {
		function doPopulate (dropdownId, inputFieldId) {
			const $sel = $(dropdownId);
			const existingItems = !!$sel.find(`option`).length;
			if (defaultSel) {
				$(inputFieldId).val(defaultSel);
				$sel.append($("<option>", {
					value: defaultSel,
					text: "Official Sources",
				}));
			}
			if (!existingItems) {
				$sel.append($("<option>", {
					value: "",
					text: "Custom",
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
							name: path.split("/").slice(1).join("/"),
						});
					});
			});
			dataList.sort((a, b) => SortUtil.ascSortLower(a.name, b.name)).forEach(it => {
				$sel.append($("<option>", {
					value: `${it.download_url}${d20plus.ut.getAntiCacheSuffix()}`,
					text: `Homebrew: ${it.name.trim().replace(/\.json$/i, "")}`,
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

	d20plus.template5e._populateAdventuresDropdown = function () {
		const defaultAdvUrl = d20plus.formSrcUrl(ADVENTURE_DATA_DIR, "adventure-lmop.json");
		const $iptUrl = $("#import-adventures-url");
		$iptUrl.val(defaultAdvUrl);
		$iptUrl.data("id", "lmop");
		const $sel = $("#button-adventures-select");
		adventureMetadata.adventure.forEach(a => {
			$sel.append($("<option>", {
				value: d20plus.formSrcUrl(ADVENTURE_DATA_DIR, `adventure-${a.id.toLowerCase()}.json|${a.id}`),
				text: a.name,
			}));
		});
		$sel.append($("<option>", {
			value: "",
			text: "Custom",
		}));
		$sel.val(defaultAdvUrl);
		$sel.change(() => {
			const [url, id] = $sel.val().split("|");
			$($iptUrl).val(url);
			$iptUrl.data("id", id);
		});
	}

	d20plus.template5e.addCustomHTML = function () {
		// Object to get data urls because they get set after the categories object is created
		const dataUrls = {
			"spell": spellDataUrls,
			"monster": monsterDataUrls,
			"class": classDataUrls,
		}

		const $body = $("body");

		if (window.is_gm) {
			const $wrpSettings = $(`#betteR20-settings`);

			$wrpSettings.append(d20plus.template5e.settingsHtmlImportHeader);
			$wrpSettings.append(d20plus.template5e.settingsHtmlSelector());
			const $ptAdventures = $(d20plus.template5e.settingsHtmlPtAdventures);
			$wrpSettings.append($ptAdventures);

			IMPORT_CATEGORIES.forEach(ic => {
				$wrpSettings.append(d20plus.template5e.getSettingsHTML(ic));
			})
			$ptAdventures.find(`.Vetools-module-tool-open`).click(() => d20plus.tool.get("MODULES").openFn());
			$wrpSettings.append(d20plus.template5e.settingsHtmlPtImportFooter);

			$("#bind-drop-locations").on(window.mousedowntype, d20plus.bindDropLocations);
			$("#initiativewindow .characterlist").before(d20plus.template5e.initiativeHeaders);

			d20plus.setTurnOrderTemplate();
			d20.Campaign.initiativewindow.rebuildInitiativeList();
			d20plus.hpAllowEdit();
			d20.Campaign.initiativewindow.model.on("change:turnorder", function () {
				d20plus.updateDifficulty();
			});
			d20plus.updateDifficulty();

			d20plus.template5e._populateAdventuresDropdown();

			// Bind buttons for GM import
			IMPORT_CATEGORIES.forEach(ic => {
				$(`a#import-${ic.plural}-load`).on(window.mousedowntype, () => d20plus[ic.plural].button());
				if (ic.allImport) $(`a#import-${ic.plural}-load-all`).on(window.mousedowntype, () => d20plus[ic.plural].buttonAll());
				if (ic.fileImport) $(`a#import-${ic.plural}-load-file`).on(window.mousedowntype, () => d20plus[ic.plural].buttonFile());
			})
			$("select#import-mode-select").on("change", () => d20plus.importer.importModeSwitch());
		} else {
			// player-only HTML if required
		}

		$body.append(d20plus.template5e.playerImportHtml);
		const $winPlayer = $("#d20plus-playerimport");
		const $appTo = $winPlayer.find(`.append-target`);

		// Add HTML for items in the player menu
		$appTo.append(d20plus.template5e.settingsHtmlSelectorPlayer());
		IMPORT_CATEGORIES.filter(ic => ic.playerImport).forEach(ic => {
			$appTo.append(d20plus.template5e.getSettingsHTMLPlayer(ic));
		});

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
		// Bind buttons for player import
		$("select#import-mode-select-player").on("change", () => d20plus.importer.importModeSwitch());
		IMPORT_CATEGORIES.filter(ic => ic.playerImport).forEach(ic => {
			$(`a#import-${ic.plural}-load-player`).on(window.mousedowntype, () => d20plus[ic.plural].button(true));
			if (ic.allImport) $(`a#import-${ic.plural}-load-all-player`).on(window.mousedowntype, () => d20plus[ic.plural].buttonAll(true));
			if (ic.fileImport) $(`a#import-${ic.plural}-load-file-player`).on(window.mousedowntype, () => d20plus[ic.plural].buttonFile(true));
		});

		$body.append(d20plus.template5e.importDialogHtml);
		$body.append(d20plus.template5e.importListHTML);
		$body.append(d20plus.template5e.importListPropsHTML);
		$body.append(d20plus.template5e.importFilterList);
		$("#d20plus-import").dialog({
			autoOpen: false,
			resizable: false,
		});
		$("#d20plus-importlist").dialog({
			autoOpen: false,
			resizable: true,
			width: 1000,
			height: 700,
		});
		$("#d20plus-import-props").dialog({
			autoOpen: false,
			resizable: true,
			width: 300,
			height: 600,
		});
		$("#d20plus-import-filter-list").dialog({
			autoOpen: false,
			resizable: true,
			width: 640,
			height: 540,
		});

		// add class subclasses to the subclasses dropdown(s)
		d20plus.template5e._populateDropdown("#button-subclasses-select", "#import-subclasses-url", CLASS_DATA_DIR, classDataUrls, "", ["class"]);
		d20plus.template5e._populateDropdown("#button-subclasses-select-player", "#import-subclasses-url-player", CLASS_DATA_DIR, classDataUrls, "", ["class"]);

		// Populate all relevant dropdowns
		IMPORT_CATEGORIES.forEach(ic => {
			if (ic.defaultSource !== undefined) {
				d20plus.template5e._populateDropdown(`#button-${ic.plural}-select`, `#import-${ic.plural}-url`,
					ic.baseUrl, dataUrls[ic.name], ic.defaultSource, [`${ic.name}`]);
				if (ic.playerImport) {
					d20plus.template5e._populateDropdown(`#button-${ic.plural}-select-player`, `#import-${ic.plural}-url-player`,
						ic.baseUrl, dataUrls[ic.name], ic.defaultSource, [`${ic.name}`]);
				}
			}
			else if (!ic.uniqueImport) {
				d20plus.template5e._populateBasicDropdown(`#button-${ic.plural}-select`, `#import-${ic.plural}-url`, ic.baseUrl, [`${ic.name}`], ic.playerImport);
			}
		})

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

	// Template for settings menu imports
	d20plus.template5e.getSettingsHTML = function (category) {
		if (category.uniqueImport) return "";

		allButton = category.allImport ? `<p><a class="btn" href="#" id="import-${category.plural}-load-all" title="Standard sources only; no third-party or UA">Import ${category.plural.toTitleCase()} From All Sources</a></p>` : "";
		fileButton = category.fileImport ? `<p><a class="btn" href="#" id="import-${category.plural}-load-file" title="5eTools JSON formats only">Import ${category.plural.toTitleCase()} From File</a></p>` : "";
		finalText = category.finalText ? `<p>${category.finalText}</p>` : "";

		return `
<div class="importer-section" data-import-group="${category.name}">
<h4>${category.titleSing || category.name.toTitleCase()} Importing</h4>
<label for="import-${category.plural}-url">${category.titleSing || category.name.toTitleCase()} Data URL:</label>
<select id="button-${category.plural}-select"><!-- populate with JS--></select>
<input type="text" id="import-${category.plural}-url">
${category.allImport ? "<p>" : ""}<a class="btn" href="#" id="import-${category.plural}-load">Import ${category.plural.toTitleCase()}</a>${category.allImport ? "</p>" : ""}
${allButton}
${fileButton}
${finalText}
</div>
`
	}

	// Template for player imports
	d20plus.template5e.getSettingsHTMLPlayer = function (category) {
		allButton = category.allImport ? `<p><a class="btn" href="#" id="import-${category.plural}-load-all-player" title="Standard sources only; no third-party or UA">Import ${category.plural.toTitleCase()} From All Sources</a></p>` : "";
		fileButton = category.fileImport ? `<p><a class="btn" href="#" id="import-${category.plural}-load-file-player" title="5eTools JSON formats only">Import ${category.plural.toTitleCase()} From File</a></p>` : "";
		finalText = category.finalText ? `<p>${category.finalText}</p>` : "";

		return `
<div class="importer-section" data-import-group="${category.name}">
<h4>${category.titleSing || category.name.toTitleCase()} Importing</h4>
<label for="import-${category.plural}-url-player">${category.titleSing || category.name.toTitleCase()} Data URL:</label>
<select id="button-${category.plural}-select-player"><!-- populate with JS--></select>
<input type="text" id="import-${category.plural}-url-player">
${category.allImport ? "<p>" : ""}<a class="btn" href="#" id="import-${category.plural}-load-player">Import ${category.plural.toTitleCase()}</a>${category.allImport ? "</p>" : ""}
${allButton}
${fileButton}
${finalText}
</div>
`;
	}

	d20plus.template5e.difficultyHtml = `<span class="difficulty" style="position: absolute; pointer-events: none"></span>`;

	d20plus.template5e.playerImportHtml = `<div id="d20plus-playerimport" title="BetteR20 - Temporary Import">
<div class="append-target">
	<!-- populate with js -->
</div>
<div class="append-list-journal" style="max-height: 400px; overflow-y: auto;">
	<!-- populate with js -->
</div>
<p><i>Player-imported items are temporary, as players can't make handouts. GMs may also use this functionality to avoid cluttering the journal. Once imported, items can be drag-dropped to character sheets.</i></p>
</div>`;

	d20plus.template5e.importListHTML = `<div id="d20plus-importlist" title="BetteR20 - Import..." style="width: 1000px;">
<p style="display: flex">
<button type="button" id="importlist-selectvis" class="btn" style="margin: 0 2px;"><span>Select Visible</span></button>
<button type="button" id="importlist-deselectvis" class="btn" style="margin: 0 2px;"><span>Deselect Visible</span></button>
<span style="width:1px;background: #bbb;height: 26px;margin: 2px;"></span>
<button type="button" id="importlist-selectall-published" class="btn" style="margin: 0 2px;"><span>Select All Published</span></button>
<span style="width:1px;background: #bbb;height: 26px;margin: 2px;"></span>
<button type="button" id="importlist-filter" class="btn" style="margin: 0 2px;"><span>Filter By List</span></button>
<button type="button" id="importlist-reset" class="btn" style="margin: 0 2px;"><span>Reset Filters</span></button>
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

	d20plus.template5e.importListPropsHTML = `<div id="d20plus-import-props" title="Choose Properties to Import">
<div class="select-props" style="max-height: 400px; overflow-y: auto; transform: translateZ(0)">
	<!-- populate with JS -->
</div>
<p>
	Warning: this feature is highly experimental, and disabling <span style="color: red;">properties which are assumed to always exist</span> is not recommended.
	<br>
	<button type="button" id="save-import-props" class="btn" role="button" aria-disabled="false">Save</button>
</p>
</div>`;

d20plus.template5e.importFilterList = `<div id="d20plus-import-filter-list" title="List Items to Filter For">
<p>
	Write down a vertical list of the items you want to filter and then <b>Filter List > Select Visible > Import</b>
	<span title="If an item is in more than one source (like those that get reprinted or appear in UAs), you will get multiple results out of the filter for it unless you indicate a source." style="cursor: help;">[!]</span>.
</p>
<p>
	You can either manually write down your list, or you can go to the corresponding page in <b>5etools > make your list > Table View > Copy CSV to Clipboard > Paste it here > Filter List</b>
	<span title="Don't worry if there is more info that is needed, it'll get discarded, as well as any failed match. Caps are optional as well." style="cursor: help;">[?]</span>.
</p>
<textarea placeholder=
'List 1 item per line. There are 3 ways of listing things (you can combine them):

Fireball
Fireball, PHB
"Fireball","PHB"

etc.
(Source is optional, as you can see in the 1st example, but it is recommended)
(the 2nd and 3rd example show the 2 ways to indicate source)'
class="table-import-textarea">
</textarea>
<button class="btn">Filter List</button>
</div>`;

	d20plus.template5e.importDialogHtml = `<div id="d20plus-import" title="Importing">
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

	d20plus.template5e.settingsHtmlImportHeader = `
<h4>Import By Category</h4>
<p><small><i>We strongly recommend the OGL sheet for importing. You can switch afterwards.</i></small></p>
`;

	d20plus.template5e.settingsHtmlSelector = function () {
		return `
<select id="import-mode-select">
<option value="none" disabled selected>Select category...</option>
${IMPORT_CATEGORIES.map(ic => `<option value="${ic.name}">${ic.titlePl || ic.plural.toTitleCase()}</option>`).join("")}
</select>
`;
	}

	d20plus.template5e.settingsHtmlSelectorPlayer = function () {
		return `
<select id="import-mode-select-player">
<option value="none" disabled selected>Select category...</option>
${IMPORT_CATEGORIES.filter(ic => ic.playerImport).map(ic => `<option value="${ic.name}">${ic.titlePl || ic.plural.toTitleCase()}</option>`).join("")}
</select>
`;
	}

	d20plus.template5e.settingsHtmlPtAdventures = `
<div class="importer-section" data-import-group="adventure">
<b style="color: red">Please note that this importer has been superceded by the Module Importer tool, found in the Tools List, or <a href="#" class="Vetools-module-tool-open" style="color: darkred; font-style: italic">by clicking here</a>.</b>
<h4>Adventure Importing</h4>
<label for="import-adventures-url">Adventure Data URL:</label>
<select id="button-adventures-select">
<!-- populate with JS-->
</select>
<input type="text" id="import-adventures-url">
<p><a class="btn" href="#" id="import-adventures-load">Import Adventure</a><p/>
<p>
</p>
</div>
`;

	d20plus.template5e.settingsHtmlPtImportFooter = `
<p><a class="btn bind-drop-locations" href="#" id="bind-drop-locations" style="margin-top: 5px;width: 100%;box-sizing: border-box;">Bind Drag-n-Drop</a></p>
<p><strong>Readme</strong></p>
<p>
You can drag-and-drop imported handouts to character sheets.<br>
If a handout is glowing green in the journal, it's draggable. This breaks when Roll20 decides to hard-refresh the journal.<br>
To restore this functionality, press the "Bind Drag-n-Drop" button.<br>
<i>Note: to drag a handout to a character sheet, you need to drag the name, and not the handout icon.</i>
</p>
`;

	d20plus.template5e.initiativeHeaders = `<div class="header init-header">
<span class="ui-button-text initmacro init-sheet-header"></span>
<span class="initiative init-init-header" alt="Initiative" title="Initiative">Init</span>
<span class="cr" alt="CR" title="CR">CR</span>
<div class="tracker-header-extra-columns"></div>
</div>`;

	d20plus.template5e.initiativeTemplate = `<script id="tmpl_initiativecharacter" type="text/html">
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
};

SCRIPT_EXTENSIONS.push(d20plusTemplate);
