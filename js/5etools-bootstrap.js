const betteR205etools = function () {
	// Page fully loaded and visible
	d20plus.Init = async function () {
		const scriptName = `betteR20-5etools v${d20plus.version}`;
		try {
			d20plus.ut.log("Init (v" + d20plus.version + ")");
			d20plus.ut.showLoadingMessage(scriptName);

			d20plus.ut.checkVersion("5etools");
			d20plus.settingsHtmlHeader = `<hr><h3>betteR20-5etools v${d20plus.version}</h3>`;

			d20plus.template.swapTemplates();

			d20plus.ut.addAllCss();
			if (window.is_gm) {
				d20plus.ut.log("Is GM");
				d20plus.engine.enhancePageSelector();
			} else d20plus.ut.log("Not GM. Some functionality will be unavailable.");

			d20plus.setSheet();
			await d20plus.js.pAddScripts();
			await d20plus.qpi.pInitMockApi();
			await d20plus.js.pAddApiScripts();

			JqueryUtil.initEnhancements();
			await loadHomebrewMetadata();

			await d20plus.pAddJson();
			await monkeyPatch5etoolsCode();

			if (window.is_gm) await d20plus.cfg.pLoadConfig();
			else await d20plus.cfg.pLoadPlayerConfig();

			if (window.is_gm) await d20plus.art.pLoadArt();

			d20plus.bindDropLocations();
			d20plus.ui.addHtmlHeader();
			d20plus.addCustomHTML();
			d20plus.ui.addHtmlFooter();
			d20plus.engine.enhanceMarkdown();
			d20plus.engine.addProFeatures();
			d20plus.art.initArtFromUrlButtons();
			if (window.is_gm) {
				d20plus.journal.addJournalCommands();
				d20plus.engine.addSelectedTokenCommands();
				d20plus.art.addCustomArtSearch();
				d20plus.engine.addTokenHover();
				d20plus.engine.enhanceTransmogrifier();
				d20plus.engine.removeLinkConfirmation();
				d20plus.artBrowse.initRepoBrowser();
				d20plus.ui.addQuickUiGm();
				d20plus.anim.animatorTool.init();
				// Better20 jukebox tab
				d20plus.remoteLibre.init();
				d20plus.jukeboxWidget.init();
			}
			d20.Campaign.pages.each(d20plus.bindGraphics);
			d20.Campaign.activePage().collection.on("add", d20plus.bindGraphics);
			d20plus.engine.addSelectedTokenCommands();
			d20plus.engine.enhanceStatusEffects();
			d20plus.engine.enhanceMouseDown();
			d20plus.engine.enhanceMouseMove();
			d20plus.engine.addLineCutterTool();
			d20plus.engine.enhancePathWidths();
			d20plus.ut.disable3dDice();
			d20plus.engine.addLayers();
			d20plus.weather.addWeather();
			d20plus.engine.repairPrototypeMethods();
			d20plus.engine.disableFrameRecorder();
			// d20plus.ut.fixSidebarLayout();
			d20plus.chat.enhanceChat();

			// apply config
			if (window.is_gm) {
				d20plus.cfg.baseHandleConfigChange();
				d20plus.handleConfigChange();
			} else {
				d20plus.cfg.startPlayerConfigHandler();
			}

			d20plus.ut.log("All systems operational");
			d20plus.ut.chatTag(`betteR20-5etools v${d20plus.version}`);
		} catch (e) {
			console.error(e);
			alert(`${scriptName} failed to initialise! See the logs (CTRL-SHIFT-J) for more information.`)
		}
	};

	async function loadHomebrewMetadata () {
		d20plus.ut.log("Loading homebrew metadata");
		try {
			brewIndex = await DataUtil.brew.pLoadPropIndex();
		} catch (e) {
			d20plus.ut.error(`Failed to load homebrew index!`);
		}
	}

	async function monkeyPatch5etoolsCode () {
		IS_VTT = true; // global variable from 5etools' utils.js
		BrewUtil._buildSourceCache = function () {
			// no-op when building source cache; we'll handle this elsewhere
			BrewUtil._sourceCache = BrewUtil._sourceCache || {};
		};
		// dummy values
		BrewUtil.homebrew = {};
		BrewUtil.homebrewMeta = {sources: []};

		Renderer.get().setBaseUrl(BASE_SITE_URL);
	}
};

SCRIPT_EXTENSIONS.push(betteR205etools);
