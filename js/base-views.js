function baseViews () {
	d20plus.views = {};

	d20plus.views._lastSettingsPageId = null;

	d20plus.views._initSettingsButton = () => {
		$(`body`).on("click", ".Ve-btn-views", function () {
			// close the parent page settings + hide the page overlay
			const $this = $(this);
			$this.closest(`[role="dialog"]`).find(`.ui-dialog-buttonpane button:contains("Save")`).click();
			const $barPage = $(`#page-toolbar`);
			if (!$barPage.hasClass("closed")) {
				$barPage.find(`.handle`).click()
			}

			function doShowDialog (page) {
				const mutExclusiveHelp = "Check this, if enabling this or PREVIOUS view should disable another one of them";
				const $dialog = $(`
					<div title="Views Configuration">
						<div class="alert alert-info" role="alert">
							<p>Views are states of objects on your map. Each view can store items as tokens, paths & images.
							Items are assigned via Context menu (only works with bR20 Reorganized context menus).
							Then you can easily hide or show stored items, no matter their type or layer, using controls at the bottom of Selected layer dropdown.
							This may be useful to store and quickly switch between different states of your location - day/night, rooftops/interiors etc.</p>
						</div>
						<label class="split wth__row">
							<span>Enable view management for this map</span>
							<div class="grid_switch"><label class="switch">
								<input class="gridenabled feature_enabled" name="viewsEnable" type="checkbox">
								<span class="slider round"></span>
							</label></div>
						</label>
						<div class="pagedetails__header w-100">
							<h3 class="page_title text-capitalize">Default view</h3>
						</div>
						<label class="split wth__row">
							<span>Custom name</span>
							<input name="views0Name" placeholder="Default">
						</label>
						<div class="pagedetails__header w-100">
							<h3 class="page_title text-capitalize">View 1</h3>
						</div>
						<div class="split">
							<label class="half">
								<span>Enable view 1</span>
								<input type="checkbox" name="views1Enable">
							</label>
							<label class="half">
								<span class="help" title="${mutExclusiveHelp}">Mutually exclusive with previous</span>
								<input type="checkbox" name="views1Exclusive">
							</label>
						</div>
						<label class="split wth__row">
							<span>Custom name</span>
							<input name="views1Name" placeholder="View 1">
						</label>
						<div class="pagedetails__header w-100">
							<h3 class="page_title text-capitalize">View 2</h3>
						</div>
						<div class="split">
							<label class="half">
								<span>Enable view 2</span>
								<input type="checkbox" name="views2Enable">
							</label>
							<label class="half">
								<span class="help" title="${mutExclusiveHelp}">Mutually exclusive with previous</span>
								<input type="checkbox" name="views2Exclusive">
							</label>
						</div>
						<label class="split wth__row">
							<span>Custom name</span>
							<input name="views2Name" placeholder="View 2">
						</label>
						<div class="pagedetails__header w-100">
							<h3 class="page_title text-capitalize">View 3</h3>
						</div>
						<div class="split">
							<label class="half">
								<span>Enable view 3</span>
								<input type="checkbox" name="views3Enable">
							</label>
							<label class="half">
								<span class="help" title="${mutExclusiveHelp}">Mutually exclusive with previous</span>
								<input type="checkbox" name="views3Exclusive">
							</label>
						</div>
						<label class="split wth__row">
							<span>Custom name</span>
							<input name="views3Name" placeholder="View 3">
						</label>
					</div>
				`).appendTo($("body"));

				const handleProp = (propName) => $dialog.find(`[name="${propName}"]`).each((i, e) => {
					const $e = $(e);
					if ($e.is(":checkbox")) {
						$e.prop("checked", !!page.get(`bR20cfg_${propName}`));
					} else {
						$e.val(page.get(`bR20cfg_${propName}`));
					}
				});
				const props = [
					"viewsEnable",
					"views0Name",
					"views1Enable",
					"views1Exclusive",
					"views1Name",
					"views2Enable",
					"views2Exclusive",
					"views2Name",
					"views3Enable",
					"views3Exclusive",
					"views3Name",
				];
				props.forEach(handleProp);

				function doSaveValues () {
					props.forEach(propName => {
						page.set(`bR20cfg_${propName}`, (() => {
							const $e = $dialog.find(`[name="${propName}"]`);
							if ($e.is(":checkbox")) {
								return !!$e.prop("checked");
							} else {
								return $e.val();
							}
						})())
					});
					page.save();
				}

				$dialog.dialog({
					width: 500,
					dialogClass: "no-close",
					buttons: [
						{
							text: "OK",
							click: function () {
								$(this).dialog("close");
								$dialog.remove();
								doSaveValues();
							},
						},
						{
							text: "Apply",
							click: function () {
								doSaveValues();
							},
						},
						{
							text: "Cancel",
							click: function () {
								$(this).dialog("close");
								$dialog.remove();
							},
						},
					],
				});
			}

			if (d20plus.views._lastSettingsPageId) {
				const page = d20.Campaign.pages.get(d20plus.views._lastSettingsPageId);
				if (page) {
					doShowDialog(page);
				} else d20plus.ut.error(`No page found with ID "${d20plus.views._lastSettingsPageId}"`);
			} else d20plus.ut.error(`No page settings button was clicked?!`);
		}).on("mousedown", ".chooseablepage .js__settings-page", function () {
			const $this = $(this);
			d20plus.views._lastSettingsPageId = $this.closest(`[data-pageid]`).data("pageid");
		});
	};

	d20plus.views._initMenuActions = () => {
		$(`body`).on("click", ".chooseViews > li", function () {
			const page = d20.Campaign.activePage();
			const items = $(".chooseViews > li")
			const id = items.index(this);
			const startgroupindex = (() => { for (let i = id; i >= 0; i--) { if (!page.get(`bR20cfg_views${i}Exclusive`)) return i; } })();
			const endgroupindex = (() => { for (let i = id + 1; i <= 5; i++) { if (!page.get(`bR20cfg_views${i}Exclusive`)) return i - 1; } })();
			if (page.get(`bR20cfg_views${id}Off`)) {
				d20plus.views.changeViewState(id, true);
				for (let i = startgroupindex; i <= endgroupindex; i++) {
					if (i !== id) d20plus.views.changeViewState(i, false);
				}
			} else {
				d20plus.views.changeViewState(id, false);
			}
		});
	}

	d20plus.views._initViewsCss = () => {
		d20plus.ut.dynamicStyles("viewsSelect").html(`
			.ui-dialog label.half {display: inline-block; margin-bottom: 6px;}
			.ui-dialog label.half span {margin-right: 20px;}
			#floatingtoolbar ul.chooseViews li {border-width: 1px;border-style: solid; border-color: var(--dark-surface1);}
			#floatingtoolbar ul.chooseViews:empty {display:none;}
			#floatingtoolbar ul.chooseViews li {height: 19px; border-radius: 12px;}
			#floatingtoolbar ul.chooseViews li.fst {border-bottom-left-radius: 0px; border-bottom-right-radius: 0px; border-bottom-width: 0px;}
			#floatingtoolbar ul.chooseViews li.lst {border-top-left-radius: 0px; border-top-right-radius: 0px; border-top-width: 0px;}
			#floatingtoolbar ul.chooseViews li.mst {border-radius: 0px; border-top: 0px; border-bottom: 0px;}
			#floatingtoolbar ul.chooseViews .pictos {padding: 0 3px 0 3px;}
			#floatingtoolbar ul.chooseViews .view_toggle {padding: 4px 8px 3px 4px; margin-right: 8px; border-right: 1px solid; border-color: inherit;}
			#floatingtoolbar ul.chooseViews li.off .view_toggle .pictos {color: #fff0;}
		`);
	}

	d20plus.views._initLayerMenu = () => {
		d20plus.views.layerMenu = $(`<ul class="chooseViews"></ul>`).appendTo($("#editinglayer .submenu"));
	}

	d20plus.views.populateMenu = () => {
		const page = d20.Campaign.activePage();
		if (!page) return;
		let menuhtml = "";
		if (page.get("bR20cfg_viewsEnable")) {
			for (let id = 0; id <= 4; id++) {
				if (!id || page.get(`bR20cfg_views${id}Enable`)) {
					const viewname = page.get(`bR20cfg_views${id}Name`) || (id ? `View ${id}` : `Default view`);
					const viewicon = page.get(`bR20cfg_views${id}Icon`) || "P";
					const viewexcl = page.get(`bR20cfg_views${id}Exclusive`) ? (page.get(`bR20cfg_views${id + 1}Exclusive`) ? "mst" : "lst") : page.get(`bR20cfg_views${id + 1}Exclusive`) ? "fst" : "";
					const viewactive = page.get(`bR20cfg_views${id}Off`) ? "off" : "";
					menuhtml += `<li class="${[viewexcl, viewactive].join(" ")}">
						<span class="view_toggle"><span class="pictos">E</span></span>
						<span class="pictos">${viewicon}</span>
						${viewname}
					</li>`;
				}
			}
		}
		d20plus.views.layerMenu.html(menuhtml);
	}

	d20plus.views.changeViewState = (id, state) => {
		const page = d20.Campaign.activePage();
		const menuItem = $(".chooseViews > li").get(id);
		if (state) {
			$(menuItem).removeClass("off");
			page.set(`bR20cfg_views${id}Off`, false);
			d20plus.engine.objectsHideUnhide(`bR20_view${id}`, true, `off${id}`, true);
		} else {
			$(menuItem).addClass("off");
			page.set(`bR20cfg_views${id}Off`, true);
			d20plus.engine.objectsHideUnhide(`bR20_view${id}`, true, `off${id}`, false);
		}
		page.save();
		$(`#editinglayer .choose${window.currentEditingLayer}`).click();
	}

	d20plus.views.checkPageSettings = () => {
		if (!d20.Campaign.activePage() || !d20.Campaign.activePage().get) {
			setTimeout(d20plus.views.checkPageSettings, 50);
		} else {
			d20plus.views.populateMenu();
		}
	}

	d20plus.views.addViews = () => {
		if (window.is_gm) {
			d20plus.views._initSettingsButton();
			d20plus.views._initViewsCss();
			d20plus.views._initLayerMenu();
			d20plus.views._initMenuActions();
			document.addEventListener("VePageChange", d20plus.views.checkPageSettings);
			d20plus.views.checkPageSettings();
		}
	}
}

SCRIPT_EXTENSIONS.push(baseViews);