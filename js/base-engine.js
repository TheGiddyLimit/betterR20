function d20plusEngine () {
	d20plus.engine = {};

	d20plus.engine.addProFeatures = () => {
		d20plus.ut.log("Add Pro features");

		d20plus.setMode = d20plus.mod.setMode;
		window.setMode = d20plus.mod.setMode;

		// rebind buttons with new setMode
		const $drawTools = $("#drawingtools");
		const $rect = $drawTools.find(".chooserect");
		const $path = $drawTools.find(".choosepath");
		const $poly = $drawTools.find(".choosepolygon");
		$drawTools.unbind(clicktype).bind(clicktype, function () {
			$(this).hasClass("rect") ? setMode("rect") : $(this).hasClass("text") ? setMode("text") : $(this).hasClass("path") ? setMode("path") : $(this).hasClass("drawselect") ? setMode("drawselect") : $(this).hasClass("polygon") && setMode("polygon")
		});
		$rect.unbind(clicktype).bind(clicktype, () => {
			setMode("rect");
			return false;
		});
		$path.unbind(clicktype).bind(clicktype, () => {
			setMode("path");
			return false;
		});
		$poly.unbind(clicktype).bind(clicktype, () => {
			setMode("polygon");
			return false;
		});
		$("#rect").unbind(clicktype).bind(clicktype, () => setMode("rect"));
		$("#path").unbind(clicktype).bind(clicktype, () => setMode("path"));

		if (!$(`#fxtools`).length) {
			const $fxMode = $(`<li id="fxtools"/>`).append(`<span class="pictos">e</span>`);
			$fxMode.on("click", () => {
				d20plus.setMode("fxtools");
			});
			$(`#drawingtools`).after($fxMode);
		}

		if (window.is_gm) {
			// add lighting layer tool
			if (!$(`#editinglayer .choosewalls`).length) {
				$(`#editinglayer .choosegmlayer`).after(`<li class="choosewalls"><span class="pictostwo">r</span> Dynamic Lighting</li>`);
			}

			// ensure tokens have editable sight
			$("#tmpl_tokeneditor").replaceWith(d20plus.templates.templateTokenEditor);
			// show dynamic lighting/etc page settings
			$("#tmpl_pagesettings").replaceWith(d20plus.templates.templatePageSettings);
			$("#page-toolbar").on("mousedown", ".js__settings-page", function () {
				var e = d20.Campaign.pages.get($(this).parents(".availablepage").attr("data-pageid"));
				e.view._template = $.jqotec("#tmpl_pagesettings");
			});
		}
	};

	d20plus.engine._removeStatusEffectEntries = () => {
		$(`#5etools-status-css`).html("");
		Object.keys(d20.token_editor.statusmarkers).filter(k => k.startsWith("5etools_")).forEach(k => delete d20.token_editor.statusmarkers[k]);
	};

	d20plus.engine.enhanceStatusEffects = () => {
		d20plus.ut.log("Enhance status effects");
		$(`head`).append(`<style id="5etools-status-css"/>`);

		d20plus.mod.overwriteStatusEffects();

		d20.engine.canvas.off("object:added");
		d20.engine.canvas.on("object:added", d20plus.mod.overwriteStatusEffects);

		// the holy trinity
		// d20.engine.canvas.on("object:removed", () => console.log("added"));
		// d20.engine.canvas.on("object:removed", () => console.log("removed"));
		// d20.engine.canvas.on("object:modified", () => console.log("modified"));

		$(document).off("mouseenter", ".markermenu");
		$(document).on("mouseenter", ".markermenu", d20plus.mod.mouseEnterMarkerMenu)
	};

	d20plus.engine.enhancePageSelector = () => {
		d20plus.ut.log("Enhancing page selector");

		var updatePageOrder = function () {
			d20plus.ut.log("Saving page order...");
			var pos = 0;
			$("#page-toolbar .pages .chooseablepage").each(function () {
				var page = d20.Campaign.pages.get($(this).attr("data-pageid"));
				page && page.save({
					placement: pos
				});
				pos++;
			});
			d20.pagetoolbar.noReload = false;
			d20.pagetoolbar.refreshPageListing();
		};

		function overwriteDraggables () {
			// make them draggable on both axes
			$("#page-toolbar .pages").sortable("destroy");
			$("#page-toolbar .pages").sortable({
				items: "> .chooseablepage",
				start: function () {
					d20.pagetoolbar.noReload = true;
				},
				stop: function () {
					updatePageOrder()
				},
				distance: 15
			}).addTouch();
			$("#page-toolbar .playerbookmark").draggable("destroy");
			$("#page-toolbar .playerbookmark").draggable({
				revert: "invalid",
				appendTo: "#page-toolbar",
				helper: "original"
			}).addTouch();
			$("#page-toolbar .playerspecificbookmark").draggable("destroy");
			$("#page-toolbar .playerspecificbookmark").draggable({
				revert: "invalid",
				appendTo: "#page-toolbar",
				helper: "original"
			}).addTouch();
		}

		overwriteDraggables();
		$(`#page-toolbar`).css("top", "calc(-90vh + 40px)");

		const originalFn = d20.pagetoolbar.refreshPageListing;
		// original function is debounced at 100ms, so debounce this at 110ms and hope for the best
		const debouncedOverwrite = _.debounce(() => {
			overwriteDraggables();
			// fire an event for other parts of the script to listen for
			const pageChangeEvt = new Event(`VePageChange`);
			d20plus.ut.log("Firing page-change event");
			document.dispatchEvent(pageChangeEvt);
		}, 110);
		d20.pagetoolbar.refreshPageListing = () => {
			originalFn();
			debouncedOverwrite();
		}
	};

	d20plus.engine.initQuickSearch = ($iptSearch, $outSearch) => {
		$iptSearch.on("keyup", () => {
			const searchVal = ($iptSearch.val() || "").trim();
			$outSearch.empty();
			if (searchVal.length <= 2) return; // ignore 2 characters or less, for performance reasons
			const found = $(`#journal .content`).find(`li[data-itemid]`).filter((i, ele) => {
				const $ele = $(ele);
				return $ele.find(`.name`).text().trim().toLowerCase().includes(searchVal.toLowerCase());
			});
			if (found.length) {
				$outSearch.append(`<p><b>Search results:</b></p>`);
				const $outList = $(`<ol class="dd-list Vetools-search-results"/>`);
				$outSearch.append($outList);
				found.clone().addClass("Vetools-draggable").appendTo($outList);
				$outSearch.append(`<hr>`);
				$(`.Vetools-search-results .Vetools-draggable`).draggable({
					revert: true,
					distance: 10,
					revertDuration: 0,
					helper: "clone",
					handle: ".namecontainer",
					appendTo: "body",
					scroll: true,
					start: function () {
						$("#journalfolderroot").addClass("externaldrag")
					},
					stop: function () {
						$("#journalfolderroot").removeClass("externaldrag")
					}
				});
			}
		});
	};

	d20plus.engine.addSelectedTokenCommands = () => {
		d20plus.ut.log("Add token rightclick commands");
		$("#tmpl_actions_menu").replaceWith(d20plus.template_actionsMenu);

		const getTokenWhisperPart = () => d20plus.cfg.getOrDefault("token", "massRollWhisperName") ? "/w gm Rolling for @{selected|token_name}...\n" : "";

		Mousetrap.bind("b b", function () { // back on layer
			const n = d20plus.engine._getSelectedToMove();
			d20plus.engine.backwardOneLayer(n);
			return false;
		});

		Mousetrap.bind("b f", function () { // forward one layer
			const n = d20plus.engine._getSelectedToMove();
			d20plus.engine.forwardOneLayer(n);
			return false;
		});

		/**
		 * @param token A token.
		 * @return {number} 0 for unknown, 1 for NPC, 2 for PC.
		 */
		function getTokenType (token) {
			if (token && token.model && token.model.toJSON && token.model.toJSON().represents) {
				const charIdMaybe = token.model.toJSON().represents;
				if (!charIdMaybe) return 0; //
				const charMaybe = d20.Campaign.characters.get(charIdMaybe);
				if (charMaybe) {
					const atbs = charMaybe.attribs.toJSON();
					const npcAtbMaybe = atbs.find(it => it.name === "npc");

					if (npcAtbMaybe && npcAtbMaybe.current == 1) {
						return 1;
					} else {
						return 2;
					}
				} else return 0;
			} else return 0;
		}

		const lastContextSelection = {
			lastAnimUid: null,
			lastSceneUid: null,
		};

		// BEGIN ROLL20 CODE
		var e, t = !1, n = [];
		var i = function() {
			t && (t.remove(),
				t = !1),
			e && clearTimeout(e)
		};
		var r = function (r) {
			var o, a;
			r.changedTouches && r.changedTouches.length > 0 ? (o = r.changedTouches[0].pageX,
				a = r.changedTouches[0].pageY) : (o = r.pageX,
				a = r.pageY),
				i(),
				n = [];
			for (var s = [], l = d20.engine.selected(), c = 0; c < l.length; c++)
				n.push(l[c]),
					s.push(l[c].type);
			if (s = _.uniq(s),
			n.length > 0)
				if (1 == s.length) {
					var u = n[0];
					t = $("image" == u.type && 0 == u.model.get("isdrawing") ? $("#tmpl_actions_menu").jqote(u.model) : $("#tmpl_actions_menu").jqote(u.model))
				} else {
					var u = n[0];
					t = $($("#tmpl_actions_menu").jqote(u.model))
				}
			else
				t = $($("#tmpl_actions_menu").jqote({}));
			if (!window.is_gm && t[0].lastElementChild.childElementCount < 1)
				return !1;
			t.appendTo("body");
			var d = t.height()
				, h = t.width()
				, p = {};
			return p.top = a > $("#editor-wrapper").height() - $("#playerzone").height() - d - 100 ? a - d + "px" : a + "px",
				p.left = o > $("#editor-wrapper").width() - h ? o + 10 - h + "px" : o + 10 + "px",
				t.css(p),
				$(".actions_menu").bind("mousedown mouseup touchstart", function(e) {
					e.stopPropagation()
				}),
				$(".actions_menu ul > li").bind("mouseover touchend", function() {
					if (e && (clearTimeout(e),
						e = !1),
					$(this).parents(".hasSub").length > 0)
						;
					else if ($(this).hasClass("hasSub")) {
						$(".actions_menu").css({
							width: "215px",
							height: "250px"
						});
						var t = this;
						_.defer(function() {
							$(".actions_menu ul.submenu").hide(),
								$(t).find("ul.submenu:hidden").show()
						})
					} else
						$(".actions_menu ul.submenu").hide()
				}),
				$(".actions_menu ul.submenu").live("mouseover", function() {
					e && (clearTimeout(e),
						e = !1)
				}),
				$(".actions_menu, .actions_menu ul.submenu").live("mouseleave", function() {
					e || (e = setTimeout(function() {
						$(".actions_menu ul.submenu").hide(),
							$(".actions_menu").css("width", "100px").css("height", "auto"),
							e = !1
					}, 500))
				}),
				$(".actions_menu li").on(clicktype, function() {
					var e = $(this).attr("data-action-type");
					if (null != e) {
						if ("copy" == e)
							d20.clipboard.doCopy(),
								i();
						else if ("paste" == e)
							d20.clipboard.doPaste(),
								i();
						else if ("delete" == e) {
							var t = d20.engine.selected();
							d20.engine.canvas.deactivateAllWithDispatch();
							for (var r = 0; r < t.length; r++)
								t[r].model.destroy();
							i()
						} else if ("undo" == e)
							d20.undo && d20.undo.doUndo(),
								i();
						else if ("tofront" == e)
							d20.engine.canvas.getActiveGroup() && d20.engine.unselect(),
								_.each(n, function(e) {
									d20.engine.canvas.bringToFront(e)
								}),
								d20.Campaign.activePage().debounced_recordZIndexes(),
								i();
						else if ("toback" == e)
							d20.engine.canvas.getActiveGroup() && d20.engine.unselect(),
								_.each(n, function(e) {
									d20.engine.canvas.sendToBack(e)
								}),
								d20.Campaign.activePage().debounced_recordZIndexes(),
								i();
						else if (-1 !== e.indexOf("tolayer_")) {
							d20.engine.unselect();
							var o = e.replace("tolayer_", "");
							_.each(n, function(e) {
								e.model.save({
									layer: o
								})
							}),
								i(),
								d20.token_editor.removeRadialMenu()
						} else if ("addturn" == e)
							_.each(n, function(e) {
								d20.Campaign.initiativewindow.addTokenToList(e.model.id)
							}),
								i(),
							d20.tutorial && d20.tutorial.active && $(document.body).trigger("addedTurn");
						else if ("group" == e) {
							var a = [];
							d20.engine.unselect(),
								_.each(n, function(e) {
									a.push(e.model.id)
								}),
								_.each(n, function(e) {
									e.model.addToGroup(a)
								}),
								i();
							var s = n[0];
							d20.engine.select(s)
						} else if ("ungroup" == e)
							d20.engine.unselect(),
								_.each(n, function(e) {
									e.model.clearGroup()
								}),
								d20.token_editor.removeRadialMenu(),
								i();
						else if ("toggledrawing" == e)
							d20.engine.unselect(),
								_.each(n, function(e) {
									e.model.set({
										isdrawing: !e.model.get("isdrawing")
									}).save()
								}),
								i(),
								d20.token_editor.removeRadialMenu();
						else if ("toggleflipv" == e)
							d20.engine.unselect(),
								_.each(n, function(e) {
									e.model.set({
										flipv: !e.model.get("flipv")
									}).save()
								}),
								i(),
								d20.token_editor.removeRadialMenu();
						else if ("togglefliph" == e)
							d20.engine.unselect(),
								_.each(n, function(e) {
									e.model.set({
										fliph: !e.model.get("fliph")
									}).save()
								}),
								i(),
								d20.token_editor.removeRadialMenu();
						else if ("takecard" == e)
							d20.engine.canvas.getActiveGroup() && d20.engine.unselect(),
								_.each(n, function(e) {
									var t = d20.decks.cardByID(e.model.get("cardid"));
									if (e.model.get("isdrawing") === !1)
										var n = {
											bar1_value: e.model.get("bar1_value"),
											bar1_max: e.model.get("bar1_max"),
											bar2_value: e.model.get("bar2_value"),
											bar2_max: e.model.get("bar2_max"),
											bar3_value: e.model.get("bar3_value"),
											bar3_max: e.model.get("bar3_max")
										};
									d20.Campaign.hands.addCardToHandForPlayer(t, window.currentPlayer, n ? n : void 0),
										_.defer(function() {
											e.model.destroy()
										})
								}),
								d20.engine.unselect(),
								i();
						else if ("flipcard" == e)
							d20.engine.canvas.getActiveGroup() && d20.engine.unselect(),
								_.each(n, function(e) {
									var t = e.model.get("sides").split("|")
										, n = e.model.get("currentSide")
										, i = n + 1;
									i > t.length - 1 && (i = 0),
										e.model.set({
											currentSide: i,
											imgsrc: unescape(t[i])
										}).save()
								}),
								i();
						else if ("setdimensions" == e) {
							var l = n[0]
								, c = $($("#tmpl_setdimensions").jqote()).dialog({
								title: "Set Dimensions",
								width: 325,
								height: 225,
								buttons: {
									Set: function() {
										var e, t;
										"pixels" == c.find(".dimtype").val() ? (e = parseInt(c.find("input.width").val(), 10),
											t = parseInt(c.find("input.height").val(), 10)) : (e = parseFloat(c.find("input.width").val()) * window.dpi,
											t = parseFloat(c.find("input.height").val()) * window.dpi),
											l.model.save({
												width: e,
												height: t
											}),
											c.off("change"),
											c.dialog("destroy").remove()
									},
									Cancel: function() {
										c.off("change"),
											c.dialog("destroy").remove()
									}
								},
								beforeClose: function() {
									c.off("change"),
										c.dialog("destroy").remove()
								}
							});
							c.on("change", ".dimtype", function() {
								"pixels" == $(this).val() ? (c.find("input.width").val(Math.round(l.get("width"))),
									c.find("input.height").val(Math.round(l.get("height")))) : (c.find("input.width").val(l.get("width") / window.dpi),
									c.find("input.height").val(l.get("height") / window.dpi))
							}),
								c.find(".dimtype").trigger("change"),
								i()
						} else if ("aligntogrid" == e)
							if (0 === d20.Campaign.activePage().get("snapping_increment")) {
								i();
								var u = $($("#tmpl_grid-disabled").jqote(h)).dialog({
									title: "Grid Off",
									buttons: {
										Ok: function() {
											u.off("change"),
												u.dialog("destroy").remove()
										}
									},
									beforeClose: function() {
										u.off("change"),
											u.dialog("destroy").remove()
									}
								})
							} else
								d20.engine.gridaligner.target = n[0],
									d20plus.setMode("gridalign"),
									i();
						else if ("side_random" == e) {
							d20.engine.canvas.getActiveGroup() && d20.engine.unselect();
							var d = [];
							_.each(n, function(e) {
								if (e.model && "" != e.model.get("sides")) {
									var t = e.model.get("sides").split("|")
										, n = t.length
										, i = d20.textchat.diceengine.random(n);
									// BEGIN MOD
									const imgUrl = unescape(t[i]);
									e.model.save(getRollableTokenUpdate(imgUrl, i)),
									// END MOD
										d.push(t[i])
								}
							}),
								d20.textchat.rawChatInput({
									type: "tokenroll",
									content: d.join("|")
								}),
								i()
						} else if ("side_choose" == e) {
							const e = n[0]
								, t = e.model.toJSON()
								, o = t.sides.split("|");
							let r = t.currentSide;
							const a = $($("#tmpl_chooseside").jqote()).dialog({
								title: "Choose Side",
								width: 325,
								height: 225,
								buttons: {
									Choose: function() {
										const imgUrl = unescape(o[r]);
										d20.engine.canvas.getActiveGroup() && d20.engine.unselect(),
											// BEGIN MOD
											e.model.save(getRollableTokenUpdate(imgUrl, r)),
											// END MOD
											a.off("slide"),
											a.dialog("destroy").remove()
									},
									Cancel: function() {
										a.off("slide"),
											a.dialog("destroy").remove()
									}
								},
								beforeClose: function() {
									a.off("slide"),
										a.dialog("destroy").remove()
								}
							})
								, s = a.find(".sidechoices");
							for (const e of o) {
								const t = unescape(e);
								let n = d20.utils.isVideo(t) ? `<video src="${t.replace("/med.webm", "/thumb.webm")}" muted autoplay loop />` : `<img src="${t}" />`;
								n = `<div class="sidechoice">${n}</div>`,
									s.append(n)
							}
							s.children().attr("data-selected", !1).eq(r).attr("data-selected", !0),
								a.find(".sideslider").slider({
									min: 0,
									max: o.length - 1,
									step: 1,
									value: r
								}),
								a.on("slide", function(e, t) {
									t.value != r && (r = t.value,
										a.find(".sidechoices .sidechoice").attr("data-selected", !1).eq(t.value).attr("data-selected", !0))
								}),
								i(),
								d20.token_editor.removeRadialMenu()
						}
						// BEGIN MOD
						const showRollOptions = (formula, options) => {
							const sel = d20.engine.selected();

							options = options.map(it => `<option>${it}</option>`);

							const dialog= $("<div><p style='font-size: 1.15em;'><strong>" + d20.utils.strip_tags("Select Save") + ":</strong> <select style='width: 150px; margin-left: 5px;'>" + options.join("") + "</select></p></div>");

							dialog.dialog({
								title: "Input Value",
								beforeClose: function() {
									return false;
								},
								buttons: {
									Submit: function() {
										const val = dialog.find("select").val();
										console.log(val);
										d20.engine.unselect();
										sel.forEach(it => {
											d20.engine.select(it);
											const toRoll = formula(it, val);
											d20.textchat.doChatInput(toRoll);
											d20.engine.unselect();
										});

										dialog.off();
										dialog.dialog("destroy").remove();
										d20.textchat.$textarea.focus();
									},
									Cancel: function() {
										dialog.off();
										dialog.dialog("destroy").remove();
									}
								}
							});

							i();
						};

						if ("rollsaves" === e) {
							// Mass roll: Saves
							const options = ["str", "dex", "con", "int", "wis", "cha"].map(it => Parser.attAbvToFull(it));
							if (d20plus.sheet === "ogl") {
								showRollOptions(
									(token, val) => {
										if (getTokenType(token) === 1) {
											const short = val.substring(0, 3);
											return `${getTokenWhisperPart()}@{selected|wtype}&{template:npc} @{selected|npc_name_flag} {{type=Save}} @{selected|rtype} + [[@{selected|npc_${short.toLowerCase()}_save}]][${short.toUpperCase()}]]]}} {{rname=${val} Save}} {{r1=[[1d20 + [[@{selected|npc_${short.toLowerCase()}_save}]][${short.toUpperCase()}]]]}}`;
										} else {
											return `@{selected|wtype} &{template:simple} {{charname=@{selected|token_name}}} {{always=1}} {{rname=${val} Save}} {{mod=@{selected|${val.toLowerCase()}_save_bonus}}} {{r1=[[1d20+@{selected|${val.toLowerCase()}_save_bonus}]]}} {{r2=[[1d20+@{selected|${val.toLowerCase()}_save_bonus}]]}}`;
										}
									},
									options
								);
							}
							else if (d20plus.sheet === "shaped") {
								showRollOptions(
									(token, val) => `@{selected|output_option}} &{template:5e-shaped} {{ability=1}} {{character_name=@{selected|token_name}}} {{title=${val} Save}} {{mod=@{selected|${val.toLowerCase()}_mod}}} {{roll1=[[1d20+@{selected|${val.toLowerCase()}_mod}]]}} {{roll2=[[1d20+@{selected|${val.toLowerCase()}_mod}]]}}`,
									options
								);
							}
						} else if ("rollinit" === e) {
							// Mass roll: Initiative
							const sel = d20.engine.selected();
							d20.engine.unselect();
							sel.forEach(it => {
								d20.engine.select(it);
								let toRoll = ``;
								if (d20plus.sheet === "ogl") {
									toRoll = `%{selected|Initiative}`;
								} else if (d20plus.sheet === "shaped") {
									toRoll = `@{selected|output_option} &{template:5e-shaped} {{ability=1}} {{title=INITIATIVE}} {{roll1=[[@{selected|initiative_formula}]]}}`;
								}
								d20.textchat.doChatInput(toRoll);
								d20.engine.unselect();
							});
							i();
						} else if ("rollskills" === e) {
							// TODO a "roll abilitiy check" option? NPC macro: @{selected|wtype}&{template:npc} @{selected|npc_name_flag} {{type=Check}} @{selected|rtype} + [[@{selected|strength_mod}]][STR]]]}} {{rname=Strength Check}} {{r1=[[1d20 + [[@{selected|strength_mod}]][STR]]]}}

							// Mass roll: Skills
							const options = [
								"Athletics",
								"Acrobatics",
								"Sleight of Hand",
								"Stealth",
								"Arcana",
								"History",
								"Investigation",
								"Nature",
								"Religion",
								"Animal Handling",
								"Insight",
								"Medicine",
								"Perception",
								"Survival",
								"Deception",
								"Intimidation",
								"Performance",
								"Persuasion"
							].sort();

							showRollOptions(
								(token, val) => {
									const clean = val.toLowerCase().replace(/ /g, "_");
									const abil = `${Parser.attAbvToFull(Parser.skillToAbilityAbv(val.toLowerCase())).toLowerCase()}_mod`;

									let doRoll = '';
									if (d20plus.sheet === "ogl") {
										doRoll = (atb = abil) => {
											if (getTokenType(token) === 1) {
												const slugged = val.replace(/\s/g, "_").toLowerCase();
												return `${getTokenWhisperPart()}@{selected|wtype}&{template:npc} @{selected|npc_name_flag} {{type=Skill}} @{selected|rtype} + [[@{selected|npc_${slugged}}]]]]}}; {{rname=${val}}}; {{r1=[[1d20 + [[@{selected|npc_${slugged}}]]]]}}
`
											} else {
												return `@{selected|wtype} &{template:simple} {{charname=@{selected|token_name}}} {{always=1}} {{rname=${val}}} {{mod=@{selected|${atb}}}} {{r1=[[1d20+@{selected|${atb}}]]}} {{r2=[[1d20+@{selected|${atb}}]]}}`;
											}
										}
									} else if (d20plus.sheet === "shaped"){
										doRoll = (atb = abil) => {
											return `@{selected|output_option} &{template:5e-shaped} {{ability=1}} {{character_name=@{selected|token_name}}} {{title=${val}}} {{mod=@{selected|${atb}}}} {{roll1=[[1d20+@{selected|${atb}}]]}} {{roll2=[[1d20+@{selected|${atb}}]]}}`;
										}
									}

									try {
										if (token && token.model && token.model.toJSON && token.model.toJSON().represents) {
											const charIdMaybe = token.model.toJSON().represents;
											if (!charIdMaybe) return doRoll();
											const charMaybe = d20.Campaign.characters.get(charIdMaybe);
											if (charMaybe) {
												const atbs = charMaybe.attribs.toJSON();
												const npcAtbMaybe = atbs.find(it => it.name === "npc");

												if (npcAtbMaybe && npcAtbMaybe.current == 1) {
													const npcClean = `npc_${clean}`;
													const bonusMaybe = atbs.find(it => it.name === npcClean);
													if (bonusMaybe) return doRoll(npcClean);
													else return doRoll();
												} else {
													const pcClean = `${clean}_bonus`;
													const bonusMaybe = atbs.find(it => it.name === pcClean);
													if (bonusMaybe) return doRoll(pcClean);
													else return doRoll();
												}
											} else return doRoll();
										} else return doRoll();
									} catch (x) {
										console.error(x);
										return doRoll();
									}
								},
								options
							);
						} else if ("forward-one" === e) {
							d20plus.engine.forwardOneLayer(n);
							i();
						} else if ("back-one" === e) {
							d20plus.engine.backwardOneLayer(n);
							i();
						} else if ("rollertokenresize" === e) {
							resizeToken();
							i();
						} else if ("copy-tokenid" === e) {
							const sel = d20.engine.selected();
							window.prompt("Copy to clipboard: Ctrl+C, Enter", sel[0].model.id);
							i();
						} else if ("copy-pathid" === e) {
							const sel = d20.engine.selected();
							window.prompt("Copy to clipboard: Ctrl+C, Enter", sel[0].model.id);
							i();
						} else if ("token-fly" === e) {
							const sel = d20.engine.selected().filter(it => it && it.type === "image");
							new Promise((resolve, reject) => {
								const $dialog = $(`
									<div title="Flight Height">
										<input type="number" placeholder="Flight height" name="flight">
									</div>
								`).appendTo($("body"));
								const $iptHeight = $dialog.find(`input[name="flight"]`).on("keypress", evt => {
									if (evt.which === 13) { // return
										doHandleOk();
									}
								});

								const doHandleOk = () => {
									const selected = Number($iptHeight.val());
									$dialog.dialog("close");
									if (isNaN(selected)) reject(`Value "${$iptHeight.val()}" was not a number!`);
									else resolve(selected);
								};

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
												doHandleOk();
											}
										}
									]
								});
							}).then(num => {
								const STATUS_PREFIX = `fluffy-wing@`;
								const statusString = `${num}`.split("").map(it => `${STATUS_PREFIX}${it}`).join(",");
								sel.forEach(s => {
									const existing = s.model.get("statusmarkers");
									if (existing && existing.trim()) {
										s.model.set("statusmarkers", [statusString, ...existing.split(",").filter(it => it && it && !it.startsWith(STATUS_PREFIX))].join(","));
									} else {
										s.model.set("statusmarkers", statusString);
									}
									s.model.save();
								});
							});
							i();
						} else if ("token-light" === e) {
							const SOURCES = {
								"None (Blind)": {
									bright: 0,
									dim: 0
								},
								"Torch/Light (Spell)": {
									bright: 20,
									dim: 20
								},
								"Lamp": {
									bright: 15,
									dim: 30
								},
								"Lantern, Bullseye": {
									bright: 60,
									dim: 60,
									angle: 30
								},
								"Lantern, Hooded": {
									bright: 30,
									dim: 30
								},
								"Lantern, Hooded (Dimmed)": {
									bright: 0,
									dim: 5
								},
								"Candle": {
									bright: 5,
									dim: 5
								},
								"Darkvision": {
									bright: 0,
									dim: 60,
									hidden: true
								},
								"Superior Darkvision": {
									bright: 0,
									dim: 120,
									hidden: true
								}
							};

							const sel = d20.engine.selected().filter(it => it && it.type === "image");
							new Promise((resolve, reject) => {
								const $dialog = $(`
									<div title="Light">
										<label class="flex">
											<span>Set Light Style</span>
											 <select style="width: 250px;">
												${Object.keys(SOURCES).map(it => `<option>${it}</option>`).join("")}
											</select>
										</label>
									</div>
								`).appendTo($("body"));
								const $selLight = $dialog.find(`select`);

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
												const selected = $selLight.val();
												$dialog.dialog("close");
												if (!selected) reject(`No value selected!`);
												else resolve(selected);
											}
										}
									]
								});
							}).then(key => {
								const light = SOURCES[key];

								const light_otherplayers = !light.hidden;
								// these are all stored as strings
								const dimRad = (light.dim || 0);
								const brightRad = (light.bright || 0);
								const totalRad = dimRad + brightRad;
								const light_angle = `${light.angle}` || "";
								const light_dimradius = `${totalRad - dimRad}`;
								const light_radius = `${totalRad}`;

								sel.forEach(s => {
									s.model.set("light_angle", light_angle);
									s.model.set("light_dimradius", light_dimradius);
									s.model.set("light_otherplayers", light_otherplayers);
									s.model.set("light_radius", light_radius);
									s.model.save();
								});
							});
							i();
						} else if ("unlock-tokens" === e) {
							d20plus.tool.get("UNLOCKER").openFn();
							i();
						} else if ("lock-token" === e) {
							d20.engine.selected().forEach(it => {
								if (it.model) {
									if (it.model.get("VeLocked")) {
										it.lockMovementX = false;
										it.lockMovementY = false;
										it.lockScalingX = false;
										it.lockScalingY = false;
										it.lockRotation = false;

										it.model.set("VeLocked", false);
									} else {
										it.lockMovementX = true;
										it.lockMovementY = true;
										it.lockScalingX = true;
										it.lockScalingY = true;
										it.lockRotation = true;

										it.model.set("VeLocked", true);
									}
									it.saveState();
									it.model.save();
								}
							});
							i();
						} else if ("token-animate" === e) {
							d20plus.anim.animatorTool.pSelectAnimation(lastContextSelection.lastAnimUid).then(animUid => {
								if (animUid == null) return;

								lastContextSelection.lastAnimUid = animUid;
								const selected = d20.engine.selected();
								d20.engine.unselect();
								selected.forEach(it => {
									if (it.model) {
										d20plus.anim.animator.startAnimation(it.model, animUid)
									}
								});
							});
							i();
						} else if ("util-scenes" === e) {
							d20plus.anim.animatorTool.pSelectScene(lastContextSelection.lastSceneUid).then(sceneUid => {
								if (sceneUid == null) return;

								lastContextSelection.lastSceneUid = sceneUid;
								d20plus.anim.animatorTool.doStartScene(sceneUid);
							});
							i();
						}
						// END MOD
						return !1
					}
				}),
				!1
		};
		// END ROLL20 CODE

		function getRollableTokenUpdate (imgUrl, curSide) {
			const m = /\?roll20_token_size=(.*)/.exec(imgUrl);
			const toSave = {
				currentSide: curSide,
				imgsrc: imgUrl
			};
			if (m) {
				toSave.width = 70 * Number(m[1]);
				toSave.height = 70 * Number(m[1])
			}
			return toSave;
		}

		function resizeToken () {
			const sel = d20.engine.selected();

			const options = [["Tiny", 0.5], ["Small", 1], ["Medium", 1], ["Large", 2], ["Huge", 3], ["Gargantuan", 4], ["Colossal", 5]].map(it => `<option value='${it[1]}'>${it[0]}</option>`);
			const dialog = $(`<div><p style='font-size: 1.15em;'><strong>${d20.utils.strip_tags("Select Size")}:</strong> <select style='width: 150px; margin-left: 5px;'>${options.join("")}</select></p></div>`);
			dialog.dialog({
				title: "New Size",
				beforeClose: function () {
					return false;
				},
				buttons: {
					Submit: function () {
						const size = dialog.find("select").val();
						d20.engine.unselect();
						sel.forEach(it => {
							const nxtSize = size * 70;
							const sides = it.model.get("sides");
							if (sides) {
								const ueSides = unescape(sides);
								const cur = it.model.get("currentSide");
								const split = ueSides.split("|");
								if (split[cur].includes("roll20_token_size")) {
									split[cur] = split[cur].replace(/(\?roll20_token_size=).*/, `$1${size}`);
								} else {
									split[cur] += `?roll20_token_size=${size}`;
								}
								const toSaveSides = split.map(it => escape(it)).join("|");
								const toSave = {
									sides: toSaveSides,
									width: nxtSize,
									height: nxtSize
								};
								console.log(`Updating token:`, toSave);
								it.model.save(toSave);
							} else {
								console.warn("Token had no side data!")
							}
						});
						dialog.off();
						dialog.dialog("destroy").remove();
						d20.textchat.$textarea.focus();
					},
					Cancel: function () {
						dialog.off();
						dialog.dialog("destroy").remove();
					}
				}
			});
		}

		d20.token_editor.showContextMenu = r;
		d20.token_editor.closeContextMenu = i;
		$(`#editor-wrapper`).on("click", d20.token_editor.closeContextMenu);
	};

	d20plus.engine._getSelectedToMove = () => {
		const n = [];
		for (var l = d20.engine.selected(), c = 0; c < l.length; c++)
			n.push(l[c]);
	};

	d20plus.engine.forwardOneLayer = (n) => {
		d20.engine.canvas.getActiveGroup() && d20.engine.unselect(),
			_.each(n, function (e) {
				d20.engine.canvas.bringForward(e)
			}),
			d20.Campaign.activePage().debounced_recordZIndexes()
	};

	d20plus.engine.backwardOneLayer = (n) => {
		d20.engine.canvas.getActiveGroup() && d20.engine.unselect(),
			_.each(n, function (e) {
				d20.engine.canvas.sendBackwards(e)
			}),
			d20.Campaign.activePage().debounced_recordZIndexes()
	};

	// previously "enhanceSnap"
	d20plus.engine.enhanceMouseDown = () => {
		const R = d20plus.overwrites.canvasHandlerDown

		if (FINAL_CANVAS_MOUSEDOWN_LIST.length) {
			FINAL_CANVAS_MOUSEDOWN = (FINAL_CANVAS_MOUSEDOWN_LIST.find(it => it.on === d20.engine.final_canvas) || {}).listener;
		}

		if (FINAL_CANVAS_MOUSEDOWN) {
			d20plus.ut.log("Enhancing hex snap");
			d20.engine.final_canvas.removeEventListener("mousedown", FINAL_CANVAS_MOUSEDOWN);
			d20.engine.final_canvas.addEventListener("mousedown", R);
		}

		// add sub-grid snap
		d20.engine.snapToIncrement = function(e, t) {
			t *= Number(d20plus.cfg.getOrDefault("canvas", "gridSnap"));
			return t * Math.round(e / t);
		}
	};

	d20plus.engine.enhanceMouseUp = () => { // P

	};

	// needs to be called after `enhanceMeasureTool()`
	d20plus.engine.enhanceMouseMove = () => {
		// add missing vars
		var i = d20.engine.canvas;

		// Roll20 bug (present as of 2019-5-25) workaround
		//   when box-selecting + moving tokens, the "object:moving" event throws an exception
		//   try-catch-ignore this, because it's extremely annoying
		const cachedFire = i.fire.bind(i);
		i.fire = function (namespace, opts) {
			if (namespace === "object:moving") {
				try {
					cachedFire(namespace, opts);
				} catch (e) {}
			} else {
				cachedFire(namespace, opts);
			}
		};

		const I = d20plus.overwrites.canvasHandlerMove

		if (FINAL_CANVAS_MOUSEMOVE_LIST.length) {
			FINAL_CANVAS_MOUSEMOVE = (FINAL_CANVAS_MOUSEMOVE_LIST.find(it => it.on === d20.engine.final_canvas) || {}).listener;
		}

		if (FINAL_CANVAS_MOUSEMOVE) {
			d20plus.ut.log("Enhancing mouse move");
			d20.engine.final_canvas.removeEventListener("mousemove", FINAL_CANVAS_MOUSEMOVE);
			d20.engine.final_canvas.addEventListener("mousemove", I);
		}
	};

	d20plus.engine.addLineCutterTool = () => {
		const $btnTextTool = $(`.choosetext`);

		const $btnSplitTool = $(`<li class="choosesplitter">✂️ Line Splitter</li>`).click(() => {
			d20plus.setMode("line_splitter");
		});

		$btnTextTool.after($btnSplitTool);
	};

	d20plus.engine._tokenHover = null;
	d20plus.engine._drawTokenHover = () => {
		$(`.Vetools-token-hover`).remove();
		if (!d20plus.engine._tokenHover || !d20plus.engine._tokenHover.text) return;

		const pt = d20plus.engine._tokenHover.pt;
		const txt = unescape(d20plus.engine._tokenHover.text);

		$(`body`).append(`<div class="Vetools-token-hover" style="top: ${pt.y * d20.engine.canvasZoom}px; left: ${pt.x * d20.engine.canvasZoom}px">${txt}</div>`);
	};
	d20plus.engine.addTokenHover = () => {
		// gm notes on shift-hover
		const cacheRenderLoop = d20.engine.renderLoop;
		d20.engine.renderLoop = () => {
			d20plus.engine._drawTokenHover();
			cacheRenderLoop();
		};

		// store data for the rendering function to access
		d20.engine.canvas.on("mouse:move", (data, ...others) => {
			// enable hover from GM layer -> token layer
			let hoverTarget = data.target;
			if (data.e && window.currentEditingLayer === "gmlayer") {
				const cache = window.currentEditingLayer;
				window.currentEditingLayer = "objects";
				hoverTarget = d20.engine.canvas.findTarget(data.e, null, true);
				window.currentEditingLayer = cache;
			}

			if (data.e.shiftKey && hoverTarget && hoverTarget.model) {
				d20.engine.redrawScreenNextTick();
				const gmNotes = hoverTarget.model.get("gmnotes");
				const pt = d20.engine.canvas.getPointer(data.e);
				pt.x -= d20.engine.currentCanvasOffset[0];
				pt.y -= d20.engine.currentCanvasOffset[1];
				d20plus.engine._tokenHover = {
					pt: pt,
					text: gmNotes,
					id: hoverTarget.model.id
				};
			} else {
				if (d20plus.engine._tokenHover) d20.engine.redrawScreenNextTick();
				d20plus.engine._tokenHover = null;
			}
		})
	};

	d20plus.engine.enhanceMarkdown = () => {
		const OUT_STRIKE = "<span style='text-decoration: line-through'>$1</span>";

		// BEGIN ROLL20 CODE
		window.Markdown.parse = function(e) {
			{
				var t = e
					, n = []
					, i = [];
				-1 != t.indexOf("\r\n") ? "\r\n" : -1 != t.indexOf("\n") ? "\n" : ""
			}
			return t = t.replace(/{{{([\s\S]*?)}}}/g, function(e) {
				return n.push(e.substring(3, e.length - 3)),
					"{{{}}}"
			}),
				t = t.replace(new RegExp("<pre>([\\s\\S]*?)</pre>","gi"), function(e) {
					return i.push(e.substring(5, e.length - 6)),
						"<pre></pre>"
				}),
				// BEGIN MOD
				t = t.replace(/~~(.*?)~~/g, OUT_STRIKE),
				// END MOD
				t = t.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
				t = t.replace(/\*(.*?)\*/g, "<em>$1</em>"),
				t = t.replace(/``(.*?)``/g, "<code>$1</code>"),
				t = t.replace(/\[([^\]]+)\]\(([^)]+(\.png|\.gif|\.jpg|\.jpeg))\)/g, '<a href="$2"><img src="$2" alt="$1" /></a>'),
				t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>'),
				t = t.replace(new RegExp("<pre></pre>","g"), function() {
					return "<pre>" + i.shift() + "</pre>"
				}),
				t = t.replace(/{{{}}}/g, function() {
					return n.shift()
				})
		};
		// END ROLL20 CODE

		// after a short delay, replace any old content in the chat
		setTimeout(() => {
			$(`.message`).each(function () {
				$(this).html($(this).html().replace(/~~(.*?)~~/g, OUT_STRIKE))
			})
		}, 2500);
	};

	d20plus.engine.enhancePathWidths = () => {
		const $selThicc = $(`#path_width`).css("width", "150px");
		$selThicc.append(`
				<option value="5">Custom 1 (5 px.)</option>
				<option value="5">Custom 2 (5 px.)</option>
				<option value="5">Custom 3 (5 px.)</option>
			`);
		const $iptThicc = $(`<input type="number" style="max-width: 50px;">`).hide();
		const $lblPixels = $(`<label style="display: inline-flex;"> pixels</label>`).hide();
		$selThicc.after($lblPixels).after($iptThicc);

		let $selOpt = null;
		$selThicc.on("change", () => {
			$selOpt = $selThicc.find(`option:selected`);
			const txt = $selOpt.text();
			if (txt.startsWith("Custom")) {
				const thicc = /\((.*?) px\.\)/.exec(txt)[1];
				$lblPixels.show();
				$iptThicc.show().val(Number(thicc));
			} else {
				$lblPixels.hide();
				$iptThicc.hide();
			}
		});

		$iptThicc.on("keyup", () => {
			if (!$selOpt) $selOpt = $selThicc.find(`option:selected`);
			if ($selOpt) {
				const clean = Math.round(Math.max(1, Number($iptThicc.val())));
				$selOpt.val(`${clean}`);
				$selOpt.text($selOpt.text().replace(/\(\d+ px\.\)/, `(${clean} px.)`));
				d20.engine.canvas.freeDrawingBrush.width = clean;
			}
		});
	};

	d20plus.engine.enhanceTransmogrifier = () => {
		JqueryUtil.addSelectors();

		$("#transmogrifier").on("click", () => {
			setTimeout(() => {
				const $btnAlpha = $(`#vetools-transmog-alpha`);
				if (!$btnAlpha.length) {
					const $prependTarget = $(`.ui-dialog-title:textEquals(transmogrifier)`).first().parent().parent().find(`.ui-dialog-content`);
					$(`<button id="#vetools-transmog-alpha" class="btn btn default" style="margin-bottom: 5px;">Sort Items Alphabetically</button>`).on("click", () => {
						// coped from a bookmarklet
						$('iframe').contents().find('.objects').each((c,e)=>{ let $e=$(e); $e.children().sort( (a,b)=>{ let name1=$(a).find(".name").text().toLowerCase(), name2=$(b).find(".name").text().toLowerCase(), comp = name1.localeCompare(name2); return comp; }) .each((i,c)=>$e.append(c)); });
					}).prependTo($prependTarget);
				}
			}, 35);
		})
	};

	d20plus.engine.addLayers = () => {
		d20plus.ut.log("Adding layers");

		d20plus.mod.editingLayerOnclick();
		if (window.is_gm) {
			$(`#floatingtoolbar .choosemap`).html(`<span class="pictos" style="padding: 0 3px 0 3px;">@</span> Map`);
			$(`#floatingtoolbar .choosemap`).after(`
				<li class="choosebackground">
					<span class="pictos">a</span>
					Background
				</li>
			`);
			$(`#floatingtoolbar .chooseobjects`).after(`
				<li class="chooseforeground">
					<span class="pictos">B</span>
					Foreground
				</li>
			`);
			$(`#floatingtoolbar .choosewalls`).after(`
				<li class="chooseweather">
					<span class="pictos">C</span>
					Weather Exclusions
				</li>
			`);
		}

		d20.engine.canvas._renderAll = _.bind(d20plus.mod.renderAll, d20.engine.canvas);
		d20.engine.canvas._layerIteratorGenerator = d20plus.mod.layerIteratorGenerator;
	};

	d20plus.engine.removeLinkConfirmation = function () {
		d20.utils.handleURL = d20plus.mod.handleURL;
		$(document).off("click", "a").on("click", "a", d20.utils.handleURL);
	};

	d20plus.engine.repairPrototypeMethods = function () {
		d20plus.mod.fixHexMethods();
		d20plus.mod.fixVideoMethods();
	};

	d20plus.engine.disableFrameRecorder = function () {
		if (d20.engine.frame_recorder) {
			d20.engine.frame_recorder.active = false;
			d20.engine.frame_recorder._active = false;
		}
	};
}

SCRIPT_EXTENSIONS.push(d20plusEngine);
