function baseUi () {
	d20plus.ui = {};

	d20plus.ui.addHtmlHeader = () => {
		d20plus.ut.log("Add HTML");
		const $body = $("body");

		const $wrpSettings = $(`<div id="betteR20-settings"/>`);
		$("#mysettings > .content").children("hr").first().before($wrpSettings);

		$wrpSettings.append(d20plus.settingsHtmlHeader);
		$body.append(d20plus.configEditorHTML);
		if (window.is_gm) {
			$(`#imagedialog`).find(`.searchbox`).find(`.tabcontainer`).first().after(d20plus.artTabHtml);
			$(`#button-add-external-art`).on(window.mousedowntype, d20plus.art.button);

			$body.append(d20plus.addArtHTML);
			$body.append(d20plus.addArtMassAdderHTML);
			$body.append(d20plus.tool.toolsListHtml);
			$("#d20plus-artfolder").dialog({
				autoOpen: false,
				resizable: true,
				width: 1000,
				height: 800,
			});
			$("#d20plus-artmassadd").dialog({
				autoOpen: false,
				resizable: true,
				width: 800,
				height: 650,
			});
		}
		const $cfgEditor = $("#d20plus-configeditor");
		$cfgEditor.dialog({
			autoOpen: false,
			resizable: true,
			width: 800,
			height: 650,
		});
		$cfgEditor.parent().append(d20plus.configEditorButtonBarHTML);

		// shared GM/player conent
		// quick search box
		const $iptSearch = $(`<input id="player-search" class="ui-autocomplete-input" autocomplete="off" placeholder="Quick search by name...">`);
		const $wrprResults = $(`<div id="player-search-results" class="content searchbox"/>`);

		if (window.is_gm) {
			$iptSearch.css("width", "calc(100% - 5px)");
			const $addPoint = $("#journal").find("button.btn.superadd");
			$addPoint.after($wrprResults);
			$addPoint.after(`<br>`);
			$addPoint.after($iptSearch);
			$addPoint.after(`<br><br>`);
		} else {
			const $wrprControls = $(`<div class="content searchbox" id="search-wrp-controls"/>`);
			$(`#journal .content`).before($wrprControls).before($wrprResults);
			$iptSearch.css("max-width", "calc(100% - 140px)");
			$wrprControls.append($iptSearch);
		}
		d20plus.engine.initQuickSearch($iptSearch, $wrprResults);
	};

	d20plus.ui.addHtmlFooter = () => {
		const $wrpSettings = $(`#betteR20-settings`);
		$wrpSettings.append(d20plus.settingsHtmlPtFooter);

		$("#mysettings > .content a#button-edit-config").on(window.mousedowntype, d20plus.cfg.openConfigEditor);
		$("#button-manage-qpi").on(window.mousedowntype, qpi._openManager);
		d20plus.tool.addTools();
	};

	d20plus.ui.addQuickUiGm = () => {
		const $wrpBtnsMain = $(`#floatingtoolbar`);

		// add quick layer selection panel
		const $ulBtns = $(`<div id="floatinglayerbar"><ul/></div>`)
			.css({
				width: 30,
				position: "absolute",
				left: 20,
				top: $wrpBtnsMain.height() + 45,
				border: "1px solid #666",
				boxShadow: "1px 1px 3px #666",
				zIndex: 10600,
				backgroundColor: "rgba(255,255,255,0.80)"
			})
			.appendTo($(`body`)).find(`ul`);

		const handleClick = (clazz, evt) => $wrpBtnsMain.find(`.${clazz}`).trigger("click", evt);
		$(`<li title="Map" class="choosemap"><span class="pictos" style="padding: 0 3px;">@</span></li>`).appendTo($ulBtns).click((evt) => handleClick(`choosemap`, evt));
		$(`<li title="Background" class="choosebackground"><span class="pictos">a</span></li>`).appendTo($ulBtns).click((evt) => handleClick(`choosebackground`, evt));
		$(`<li title="Objects & Tokens" class="chooseobjects"><span class="pictos">b</span></li>`).appendTo($ulBtns).click((evt) => handleClick(`chooseobjects`, evt));
		$(`<li title="Foreground" class="chooseforeground"><span class="pictos">B</span></li>`).appendTo($ulBtns).click((evt) => handleClick(`chooseforeground`, evt));
		$(`<li title="GM Info Overlay" class="choosegmlayer"><span class="pictos">E</span></li>`).appendTo($ulBtns).click((evt) => handleClick(`choosegmlayer`, evt));
		$(`<li title="Dynamic Lighting" class="choosewalls"><span class="pictostwo">r</span></li>`).appendTo($ulBtns).click((evt) => handleClick(`choosewalls`, evt));
		$(`<li title="Weather Exclusions" class="chooseweather"><span class="pictos">C</span></li>`).appendTo($ulBtns).click((evt) => handleClick(`chooseweather`, evt));

		$("body").on("click", "#editinglayer li", function () {
			$("#floatinglayerbar").removeClass("map")
				.removeClass("background")
				.removeClass("objects")
				.removeClass("foreground")
				.removeClass("gmlayer")
				.removeClass("walls")
				.removeClass("weather");
			setTimeout(() => {
				$("#floatinglayerbar").addClass(window.currentEditingLayer)
			}, 1);
		});

		// add "desc sort" button to init tracker
		const $initTracker = $(`#initiativewindow`);
		const addInitSortBtn = () => {
			$(`<div class="btn" id="init-quick-sort-desc" style="margin-right: 5px;"><span class="pictos">}</span></div>`).click(() => {
				// this will throw a benign error if the settings dialog has never been opened
				$("#initiativewindow_settings .sortlist_numericdesc").click();
			}).prependTo($initTracker.parent().find(`.ui-dialog-buttonset`));
		};
		if (d20.Campaign.initiativewindow.model.attributes.initiativepage) {
			addInitSortBtn();
		} else {
			d20.Campaign.initiativewindow.model.on("change", (e) => {
				if (d20.Campaign.initiativewindow.model.attributes.initiativepage && $(`#init-quick-sort-desc`).length === 0) {
					addInitSortBtn();
					d20plus.cfg.baseHandleConfigChange();
				}
			})
		}
	};

	/**
	 * Prompt the user to choose from a list of checkboxes. By default, one checkbox can be selected, but a "count"
	 * option can be provided to allow the user to choose multiple options.
	 *
	 * @param dataArray options to choose from
	 * @param dataTitle title for the window
	 * @param message message when user does not choose correct number of choices
	 * @param displayFormatter function to format dataArray for display
	 * @param count exact number of  options the user must choose
	 * @param note add a note at the bottom of the window
	 * @return {Promise}
	 */
	d20plus.ui.chooseCheckboxList = async function (dataArray, dataTitle, message, {displayFormatter = null, count = null, note = null} = {}) {
		return new Promise((resolve, reject) => {
			const $dialog = $(`
				<div title="${dataTitle}">
					${count != null ? `<div name="remain" class="bold">Remaining: ${count}</div>` : ""}
					<div>
						${dataArray.map(it => `<label class="split"><span>${displayFormatter ? displayFormatter(it) : it}</span> <input data-choice="${it}" type="checkbox"></label>`).join("")}
					</div>
					${note ? `<br><div class="bold">${note}</div>` : ""}
				</div>
			`).appendTo($("body"));
			const $remain = $dialog.find(`[name="remain"]`);
			const $cbChoices = $dialog.find(`input[type="checkbox"]`);

			if (count != null) {
				$cbChoices.on("change", function () {
					const $e = $(this);
					let selectedCount = getSelected().length;
					if (selectedCount > count) {
						$e.prop("checked", false);
						selectedCount--;
					}
					$remain.text(`Remaining: ${count - selectedCount}`);
				});
			}

			function getSelected () {
				return $cbChoices.map((i, e) => ({choice: $(e).data("choice"), selected: $(e).prop("checked")})).get()
					.filter(it => it.selected).map(it => it.choice);
			}

			$dialog.dialog({
				dialogClass: "no-close",
				buttons: [
					{
						text: "Cancel",
						click: function () {
							$(this).dialog("close");
							$dialog.remove();
							reject(`User cancelled the prompt`);
						}
					},
					{
						text: "OK",
						click: function () {
							const selected = getSelected();
							if (selected.length === count || count == null) {
								$(this).dialog("close");
								$dialog.remove();
								resolve(selected);
							} else {
								alert(message);
							}
						}
					}
				]
			})
		});
	};
}

SCRIPT_EXTENSIONS.push(baseUi);
