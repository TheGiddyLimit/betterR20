function baseMenu () {
	d20plus.menu = {};

	d20plus.menu.addSelectedTokenCommands = () => {
		d20plus.ut.log("Add token rightclick commands");
		$("#tmpl_actions_menu").replaceWith(d20plus.html.actionsMenu);

		const getTokenWhisperPart = () => d20plus.cfg.getOrDefault("token", "massRollWhisperName") ? "/w gm Rolling for @{selected|token_name}...\n" : "";

		if (typeof Mousetrap !== "undefined"){
			Mousetrap.bind("b b", function () { // back on layer
				const n = d20plus.engine.getSelectedToMove();
				d20plus.engine.backwardOneLayer(n);
				return false;
			});

			Mousetrap.bind("b f", function () { // forward one layer
				const n = d20plus.engine.getSelectedToMove();
				d20plus.engine.forwardOneLayer(n);
				return false;
			});
		}

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

					if (npcAtbMaybe && Number(npcAtbMaybe.current) === 1) {
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

		/* eslint-disable */

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

			// BEGIN MOD
			// This block is pasted from newer version of roll20 Menu code, with appropriate changes to vars etc
			const r20ping = (u,i)=>{
				var y, d;
				const {canvasZoom: r, currentCanvasOffset: n, paddingOffset: c, pings: p} = d20.engine
					, {currentPlayer: {id: C}, currentEditingLayer: b, is_gm: S} = window;
				if (C && ((d = (y = p[C]) == null ? void 0 : y.radius) != null ? d : 0) <= 20) {
					const x = Math.floor(o / r + n[0] - c[0] / r)
						, k = Math.floor(a / r + n[1] - c[1] / r)
						, D = {
						left: x,
						top: k,
						radius: -5,
						player: C,
						pageid: d20.Campaign.activePage().id,
						currentLayer: b
					};
					(S && u.shiftKey || i) && (D.scrollto = !0),
					p[C] = D,
					d20.engine.pinging = {
						downx: o,
						downy: a
					},
					d20.engine.redrawScreenNextTick(!0)
				}
			}
			;
			// END MOD
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
				$(".actions_menu li").on(clicktype, function(evt) {
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
						// BEGIN MOD
						// This block is pasted from newer version of roll20 Menu code, with appropriate changes to vars etc
						else if (e === "ping")
							r20ping(evt),
							i();
						else if (e === "focusping")
							r20ping(evt, !0),
							i();
						// END MOD
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
						// BEGIN MOD
						// This block is pasted from newer version of roll20 Menu code, with appropriate changes to vars etc
	                    else if (e === "removecard")
							d20.engine.canvas.getActiveGroup() && d20.engine.unselect(),
								_.each(n, function(e) {
									d20.decks.cardByID(e.model.get("cardid")).save({
										is_removed: !0
									}),
									_.defer(()=>{
										e.model.destroy()
									}
									),
									d20.decks.refreshRemovedPiles()
								}
								),
								i();
						// END MOD
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

		/* eslint-enable */

		function getRollableTokenUpdate (imgUrl, curSide) {
			const m = /\?roll20_token_size=(.*)/.exec(imgUrl);
			const toSave = {
				currentSide: curSide,
				imgsrc: imgUrl,
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
									height: nxtSize,
								};
								// eslint-disable-next-line no-console
								console.log(`Updating token:`, toSave);
								it.model.save(toSave);
							} else {
								// eslint-disable-next-line no-console
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
					},
				},
			});
		}

		d20.token_editor.showContextMenu = r;
		d20.token_editor.closeContextMenu = i;
		$(`#editor-wrapper`).on("click", d20.token_editor.closeContextMenu);
	};
}

SCRIPT_EXTENSIONS.push(baseMenu);
