/**
 * All the modified minified based on parts of Roll20's `app.js`
 */
function d20plusMod() {
	d20plus.mod = {};

	// modified to allow players to use the FX tool, and to keep current colour selections when switching tool
	// BEGIN ROLL20 CODE
	d20plus.mod.setMode = function (e) {
		d20plus.ut.log("Setting mode " + e);
		// BEGIN MOD
		// "text" === e || "rect" === e || "polygon" === e || "path" === e || "pan" === e || "select" === e || "targeting" === e || "measure" === e || window.is_gm || (e = "select"),
		// END MOD
		"text" == e ? $("#editor").addClass("texteditmode") : $("#editor").removeClass("texteditmode"),
			$("#floatingtoolbar li").removeClass("activebutton"),
			$("#" + e).addClass("activebutton"),
		"fog" == e.substring(0, 3) && $("#fogcontrols").addClass("activebutton"),
		"rect" == e && ($("#drawingtools").addClass("activebutton"),
			$("#drawingtools").removeClass("text path polygon line_splitter").addClass("rect")),
		"text" == e && ($("#drawingtools").addClass("activebutton"),
			$("#drawingtools").removeClass("rect path polygon line_splitter").addClass("text")),
		"path" == e && $("#drawingtools").addClass("activebutton").removeClass("text rect polygon line_splitter").addClass("path"),
			"polygon" == e ? $("#drawingtools").addClass("activebutton").removeClass("text rect path line_splitter").addClass("polygon") : d20.engine.finishCurrentPolygon(),
			// BEGIN MOD (also line_splitter added to above removeClass calls
		"line_splitter" == e && ($("#drawingtools").addClass("activebutton"),
			$("#drawingtools").removeClass("rect path polygon text").addClass("line_splitter")),
			// END MOD
		"pan" !== e && "select" !== e && d20.engine.unselect(),
			"pan" == e ? ($("#select").addClass("pan").removeClass("select").addClass("activebutton"),
				d20.token_editor.removeRadialMenu(),
				$("#editor-wrapper").addClass("panning")) : $("#editor-wrapper").removeClass("panning"),
		"select" == e && $("#select").addClass("select").removeClass("pan").addClass("activebutton"),
			$("#floatingtoolbar .mode").hide(),
		("text" == e || "select" == e) && $("#floatingtoolbar ." + e).show(),
			"gridalign" == e ? $("#gridaligninstructions").show() : "gridalign" === d20.engine.mode && $("#gridaligninstructions").hide(),
			"targeting" === e ? ($("#targetinginstructions").show(),
				$("#finalcanvas").addClass("targeting"),
				d20.engine.canvas.hoverCursor = "crosshair") : "targeting" === d20.engine.mode && ($("#targetinginstructions").hide(),
				$("#finalcanvas").removeClass("targeting"),
			d20.engine.nextTargetCallback && _.defer(function () {
				d20.engine.nextTargetCallback && d20.engine.nextTargetCallback(!1)
			}),
				d20.engine.canvas.hoverCursor = "move"),
			// BEGIN MOD
			// console.log("Switch mode to " + e),
			d20.engine.mode = e,
		"measure" !== e && window.currentPlayer && d20.engine.measurements[window.currentPlayer.id] && !d20.engine.measurements[window.currentPlayer.id].sticky && (d20.engine.announceEndMeasure({
			player: window.currentPlayer.id
		}),
			d20.engine.endMeasure()),
			d20.engine.canvas.isDrawingMode = "path" == e ? !0 : !1;
		if ("text" == e || "path" == e || "rect" == e || "polygon" == e || "fxtools" == e) {
			$("#secondary-toolbar").show();
			$("#secondary-toolbar .mode").hide();
			$("#secondary-toolbar ." + e).show();
			("path" == e || "rect" == e || "polygon" == e) && ("" === $("#path_strokecolor").val() && ($("#path_strokecolor").val("#000000").trigger("change-silent"),
				$("#path_fillcolor").val("transparent").trigger("change-silent")),
				d20.engine.canvas.freeDrawingBrush.color = $("#path_strokecolor").val(),
				d20.engine.canvas.freeDrawingBrush.fill = $("#path_fillcolor").val() || "transparent",
				$("#path_width").trigger("change")),
			"fxtools" == e && "" === $("#fxtools_color").val() && $("#fxtools_color").val("#a61c00").trigger("change-silent"),
				$("#floatingtoolbar").trigger("blur")
		} else {
			$("#secondary-toolbar").hide();
			$("#floatingtoolbar").trigger("blur");
		}
		// END MOD
	};
	// END ROLL20 CODE

	d20plus.mod.overwriteStatusEffects = function () {
		d20.engine.canvasDirty = true;
		d20.engine.canvasTopDirty = true;
		d20.engine.canvas._objects.forEach(it => {
			// avoid adding it to any objects that wouldn't have it to begin with
			if (!it.model || !it.model.view || !it.model.view.updateBackdrops) return;

			// BEGIN ROLL20 CODE
			it.model.view.updateBackdrops = function (e) {
				if (!this.nohud && ("objects" == this.model.get("layer") || "gmlayer" == this.model.get("layer")) && "image" == this.model.get("type") && this.model && this.model.collection && this.graphic) {
					// BEGIN MOD
					const scaleFact = (d20plus.cfg.get("canvas", "scaleNamesStatuses") && d20.Campaign.activePage().get("snapping_increment"))
						? d20.Campaign.activePage().get("snapping_increment")
						: 1;
					// END MOD
					var t = this.model.collection.page
						, n = e || d20.engine.canvas.getContext();
					n.save(),
					(this.graphic.get("flipX") || this.graphic.get("flipY")) && n.scale(this.graphic.get("flipX") ? -1 : 1, this.graphic.get("flipY") ? -1 : 1);
					var i = this
						, r = Math.floor(this.graphic.get("width") / 2)
						, o = Math.floor(this.graphic.get("height") / 2)
						, a = (parseFloat(t.get("scale_number")),
						this.model.get("statusmarkers").split(","));
					-1 !== a.indexOf("dead") && (n.strokeStyle = "rgba(189,13,13,0.60)",
						n.lineWidth = 10,
						n.beginPath(),
						n.moveTo(-r + 7, -o + 15),
						n.lineTo(r - 7, o - 5),
						n.moveTo(r - 7, -o + 15),
						n.lineTo(-r + 7, o - 5),
						n.closePath(),
						n.stroke()),
						n.rotate(-this.graphic.get("angle") * Math.PI / 180),
						n.strokeStyle = "rgba(0,0,0,0.65)",
						n.lineWidth = 1;
					var s = 0
						, l = i.model.get("bar1_value")
						, c = i.model.get("bar1_max");
					if ("" != c && (window.is_gm || this.model.get("showplayers_bar1") || this.model.currentPlayerControls() && this.model.get("playersedit_bar1"))) {
						var u = parseInt(l, 10) / parseInt(c, 10)
							, d = -o - 20 + 0;
						n.fillStyle = "rgba(" + d20.Campaign.tokendisplay.bar1_rgb + ",0.75)",
							n.beginPath(),
							n.rect(-r + 3, d, Math.floor((2 * r - 6) * u), 8),
							n.closePath(),
							n.fill(),
							n.beginPath(),
							n.rect(-r + 3, d, 2 * r - 6, 8),
							n.closePath(),
							n.stroke(),
							s++
					}
					var l = i.model.get("bar2_value")
						, c = i.model.get("bar2_max");
					if ("" != c && (window.is_gm || this.model.get("showplayers_bar2") || this.model.currentPlayerControls() && this.model.get("playersedit_bar2"))) {
						var u = parseInt(l, 10) / parseInt(c, 10)
							, d = -o - 20 + 12;
						n.fillStyle = "rgba(" + d20.Campaign.tokendisplay.bar2_rgb + ",0.75)",
							n.beginPath(),
							n.rect(-r + 3, d, Math.floor((2 * r - 6) * u), 8),
							n.closePath(),
							n.fill(),
							n.beginPath(),
							n.rect(-r + 3, d, 2 * r - 6, 8),
							n.closePath(),
							n.stroke(),
							s++
					}
					var l = i.model.get("bar3_value")
						, c = i.model.get("bar3_max");
					if ("" != c && (window.is_gm || this.model.get("showplayers_bar3") || this.model.currentPlayerControls() && this.model.get("playersedit_bar3"))) {
						var u = parseInt(l, 10) / parseInt(c, 10)
							, d = -o - 20 + 24;
						n.fillStyle = "rgba(" + d20.Campaign.tokendisplay.bar3_rgb + ",0.75)",
							n.beginPath(),
							n.rect(-r + 3, d, Math.floor((2 * r - 6) * u), 8),
							n.closePath(),
							n.fill(),
							n.beginPath(),
							n.rect(-r + 3, d, 2 * r - 6, 8),
							n.closePath(),
							n.stroke()
					}
					var h, p, g = 1, f = !1;
					switch (d20.Campaign.get("markers_position")) {
						case "bottom":
							h = o - 10,
								p = r;
							break;
						case "left":
							h = -o - 10,
								p = -r,
								f = !0;
							break;
						case "right":
							h = -o - 10,
								p = r - 18,
								f = !0;
							break;
						default:
							h = -o + 10,
								p = r
					}
					// BEGIN MOD
					n.strokeStyle = "white";
					n.lineWidth = 3 * scaleFact;
					const scaledFont = 14 * scaleFact;
					n.font = "bold " + scaledFont + "px Arial";
					// END MOD
					_.each(a, function (e) {
						var t = d20.token_editor.statusmarkers[e.split("@")[0]];
						if (!t)
							return !0;
						if ("dead" === e)
							return !0;
						var i = 0;
						if (g--,
						"#" === t.substring(0, 1))
							n.fillStyle = t,
								n.beginPath(),
								f ? h += 16 : p -= 16,
								n.arc(p + 8, f ? h + 4 : h, 6, 0, 2 * Math.PI, !0),
								n.closePath(),
								n.stroke(),
								n.fill(),
								i = f ? 10 : 4;
						else {
							// BEGIN MOD
							if (!d20.token_editor.statussheet_ready) return;
							const scaledWH = 21 * scaleFact;
							const scaledOffset = 22 * scaleFact;
							f ? h += scaledOffset : p -= scaledOffset;

							if (d20.engine.canvasZoom <= 1) {
								n.drawImage(d20.token_editor.statussheet_small, parseInt(t, 10), 0, 21, 21, p, h - 9, scaledWH, scaledWH);
							} else {
								n.drawImage(d20.token_editor.statussheet, parseInt(t, 10), 0, 24, 24, p, h - 9, scaledWH, scaledWH)
							}

							i = f ? 14 : 12;
							i *= scaleFact;
							// END MOD
						}
						if (-1 !== e.indexOf("@")) {
							var r = e.split("@")[1];
							// BEGIN MOD
							// bing backtick to "clear counter"
							if (r === "`") return;
							n.fillStyle = "rgb(222,31,31)";
							var o = f ? 9 : 14;
							o *= scaleFact;
							o -= (14 - (scaleFact * 14));
							n.strokeText(r + "", p + i, h + o);
							n.fillText(r + "", p + i, h + o);
							// END MOD
						}
					});
					var m = i.model.get("name");
					if ("" != m && 1 == this.model.get("showname") && (window.is_gm || this.model.get("showplayers_name") || this.model.currentPlayerControls() && this.model.get("playersedit_name"))) {
						n.textAlign = "center";
						// BEGIN MOD
						const fontSize = 14;
						var scaledFontSize = fontSize * scaleFact;
						const scaledY = 22 * scaleFact;
						const scaled6 = 6 * scaleFact;
						const scaled8 = 8 * scaleFact;
						n.font = "bold " + scaledFontSize + "px Arial";
						var v = n.measureText(m).width;

						/*
							Note(stormy): compatibility with R20ES's ScaleTokenNamesBySize module.
						 */
						if(window.r20es && window.r20es.drawNameplate) {
							window.r20es.drawNameplate(this.model, n, v, o, fontSize, m);
						} else {
							n.fillStyle = "rgba(255,255,255,0.50)";
							n.fillRect(-1 * Math.floor((v + scaled6) / 2), o + scaled8, v + scaled6, scaledFontSize + scaled6);
							n.fillStyle = "rgb(0,0,0)";
							n.fillText(m + "", 0, o + scaledY, v);
						}
						// END MOD
					}
					n.restore()
				}
			}
			// END ROLL20 CODE
		});
	};

	d20plus.mod.mouseEnterMarkerMenu = function () {
		var e = this;
		$(this).on("mouseover.statusiconhover", ".statusicon", function () {
			a = $(this).attr("data-action-type").replace("toggle_status_", "")
		}),
			$(document).on("keypress.statusnum", function (t) {
				// BEGIN MOD // TODO see if this clashes with keyboard shortcuts
				let currentcontexttarget = d20.engine.selected()[0];
				if ("dead" !== a && currentcontexttarget) {
					// END MOD
					var n = String.fromCharCode(t.which)
						,
						i = "" == currentcontexttarget.model.get("statusmarkers") ? [] : currentcontexttarget.model.get("statusmarkers").split(",")
						, r = (_.map(i, function (e) {
							return e.split("@")[0]
						}),
							!1);
					i = _.map(i, function (e) {
						return e.split("@")[0] == a ? (r = !0,
						a + "@" + n) : e
					}),
					r || ($(e).find(".statusicon[data-action-type=toggle_status_" + a + "]").addClass("active"),
						i.push(a + "@" + n)),
						currentcontexttarget.model.save({
							statusmarkers: i.join(",")
						})
				}
			})
	};

	// BEGIN ROLL20 CODE
	d20plus.mod.handleURL = function(e) {
		if (!($(this).hasClass("lightly") || $(this).parents(".note-editable").length > 0)) {
			var t = $(this).attr("href");
			if (void 0 === t)
				return !1;
			if (-1 !== t.indexOf("journal.roll20.net") || -1 !== t.indexOf("wiki.roll20.net")) {
				var n = t.split("/")[3]
					, i = t.split("/")[4]
					, o = d20.Campaign[n + "s"].get(i);
				if (o) {
					var r = o.get("inplayerjournals").split(",");
					(window.is_gm || -1 !== _.indexOf(r, "all") || window.currentPlayer && -1 !== _.indexOf(r, window.currentPlayer.id)) && o.view.showDialog()
				}
				return $("#existing" + n + "s").find("tr[data-" + n + "id=" + i + "]").trigger("click"),
					!1
			}
			var a = /(?:(?:http(?:s?):\/\/(?:app\.)?roll20(?:staging)?\.(?:net|local:5000)\/|^\/?)compendium\/)([^\/]+)\/([^\/#?]+)/i
				, s = t.match(a);
			if (s)
				return d20.utils.openCompendiumPage(s[1], s[2]),
					e.stopPropagation(),
					void e.preventDefault();
			if (-1 !== t.indexOf("javascript:"))
				return !1;
			if ("`" === t.substring(0, 1))
				return d20.textchat.doChatInput(t.substring(1)),
					!1;
			if ("!" === t.substring(0, 1))
				return d20.textchat.doChatInput(t),
					!1;
			if ("~" === t.substring(0, 1))
				return d20.textchat.doChatInput("%{" + t.substring(1, t.length) + "}"),
					!1;
			if (t !== undefined && ("external" === $(this).attr("rel") || -1 === t.indexOf("javascript:") && -1 !== t.indexOf("://"))) {
				// BEGIN MOD
				e.stopPropagation();
				e.preventDefault();
				window.open(t);
				// END MOD
			}
		}
	};
	// END ROLL20 CODE

	d20plus.mod._renderAll_middleLayers = new Set(["objects", "background", "foreground"]);
	// BEGIN ROLL20 CODE
	d20plus.mod.renderAll = function (e) {
		const t = e && e.context || this.contextContainer
			, i = this.getActiveGroup()
			, n = [d20.engine.canvasWidth / d20.engine.canvasZoom, d20.engine.canvasHeight / d20.engine.canvasZoom]
			, o = new d20.math.Rectangle(...d20.math.add(d20.engine.currentCanvasOffset, d20.math.div(n, 2)),...n,0);
		i && !window.is_gm && (i.hideResizers = !0),
			this.clipTo ? fabric.util.clipContext(this, t) : t.save();
		const r = {
			map: [],
			// BEGIN MOD
			background: [],
			// END MOD
			walls: [],
			objects: [],
			// BEGIN MOD
			foreground: [],
			// END MOD
			gmlayer: []
			// BEGIN MOD
			, weather: [],
			// END MOD
			_save_map_layer: this._save_map_layer
		};
		r[Symbol.iterator] = this._layerIteratorGenerator.bind(r, e);
		const a = e && e.tokens_to_render || this._objects;
		for (let e of a)
			if (e.model) {
				const t = e.model.get("layer");
				if (!r[t])
					continue;
				r[t].push(e)
			} else
				r[window.currentEditingLayer].push(e);

		// BEGIN MOD
		// Here we get the layers and look if there's a foreground in the current map
		let layers = d20.engine.canvas._objects.map(it => it.model?.get("layer") || window.currentEditingLayer)
		const noForegroundLayer = !layers.some(it => it === 'foreground');
		// END MOD

		for (const [n,a] of r) {
			switch (a) {
				case "lighting and fog":
					d20.engine.drawHighlights(this.contextContainer), d20.dyn_fog.render({
						main_canvas: this.contextContainer.canvas
					});
					continue;
				case "grid":
					d20.canvas_overlay.drawGrid(t);
					continue;
				case "afow":
					d20.canvas_overlay.drawAFoW(d20.engine.advfowctx, d20.engine.work_canvases.floater.context);
					continue;
				case "gmlayer":
					t.globalAlpha = d20.engine.gm_layer_opacity;
					break;
				// BEGIN MOD
				case "background":
				case "foreground":
					if (d20plus.mod._renderAll_middleLayers.has(window.currentEditingLayer) && window.currentEditingLayer !== a && window.currentEditingLayer !== "objects") {
						t.globalAlpha = .45;
						break;
					}
				// END MOD
				case "objects":
					if ("map" === window.currentEditingLayer || "walls" === window.currentEditingLayer) {
						t.globalAlpha = .45;
						break
					}
				default:
					t.globalAlpha = 1
			}
			_.chain(n).filter(n=>{
					let r;
					return i && n && i.contains(n) ? (n.renderingInGroup = i,
						n.hasControls = !1) : (n.renderingInGroup = null,
						n.hasControls = !0,
						"text" !== n.type && window.is_gm ? n.hideResizers = !1 : n.hideResizers = !0),
						e && e.invalid_rects ? (r = n.intersects([o]) && (n.needsToBeDrawn || n.intersects(e.invalid_rects)),
						!e.skip_prerender && n.renderPre && n.renderPre(t)) : (r = n.needsRender(o),
						(!e || !e.skip_prerender) && r && n.renderPre && n.renderPre(t, {
							should_update: !0
						})),
						r
				}
			).each(i=> {
				// BEGIN MOD
				let toRender = false;
				// END MOD

				const n = "image" === i.type.toLowerCase() && i.model.controlledByPlayer(window.currentPlayer.id)

				// BEGIN MOD
				// If there is a foreground layer, do not give "owned tokens with sight" special treatment;
				//   render them during the normal render flow (rather than skipping them)
				 const o = noForegroundLayer ? e && e.owned_with_sight_auras_only : false;
				// END MOD

				let r = i._model;
				r && d20.dyn_fog.ready() ? r = i._model.get("has_bright_light_vision") || i._model.get("has_low_light_vision") || i._model.get("has_night_vision") : r && (r = i._model.get("light_hassight")),
				// BEGIN MOD
				// We don't draw immediately the token. Instead, we mark it as "to render"
				o && (!o || n && r) || (toRender = true);

				if (toRender) {
					// For the token checked "to render", we draw them if
					//  - we're in a "render everything" call (i.e. no specific `tokens_to_render`), rather than a "render own tokens" call
					//  - there isn't a foreground layer for the map or
					//  - is everything but an object
					if (!e.tokens_to_render || noForegroundLayer || a !== 'objects') {
						this._draw(t, i);
					}
					i.renderingInGroup = null;
				}
				// END MOD
			})
		}
		return t.restore(),
			this
	};
	// END ROLL20 CODE

	// shoutouts to Roll20 for making me learn how `yield` works
	// BEGIN ROLL20 CODE
	d20plus.mod.layerIteratorGenerator = function*(e) {
		yield [this.map, "map"],
		this._save_map_layer && (d20.dyn_fog.setMapTexture(d20.engine.canvas.contextContainer),
			this._save_map_layer = !1);
		if (window.is_gm && "walls" === window.currentEditingLayer) yield [this.walls, "walls"];

		const grid_before_afow = e && e.grid_before_afow;
		const adv_fow_disabled = !d20.Campaign.activePage().get("adv_fow_enabled") || e && e.disable_afow;
		const grid_hide = !d20.Campaign.activePage().get("showgrid") || e && e.disable_grid;

		if (grid_before_afow && !grid_hide) yield [null, "grid"];
		if (!adv_fow_disabled) yield [null, "afow"];
		if (!grid_before_afow && !grid_hide) yield [null, "grid"];

		// BEGIN MOD
		yield [this.background, "background"];
		// END MOD

		yield [this.objects, "objects"];

		// BEGIN MOD
		yield [this.foreground, "foreground"];
		// END MOD

		if (window.is_gm) yield [this.gmlayer, "gmlayer"];

		const enable_dynamic_fog = e && e.enable_dynamic_fog;
		if (d20.dyn_fog.ready() && enable_dynamic_fog) yield [null, "lighting and fog"];

		// BEGIN MOD
		if (window.is_gm && "weather" === window.currentEditingLayer) yield [this.weather, "weather"];
		// END MOD
	};
	// END ROLL20 CODE

	// BEGIN ROLL20 CODE
	d20plus.mod.editingLayerOnclick = () => {
		$("#editinglayer").off(clicktype).on(clicktype, "li", function() {
			var e = $(this);
			$("#editinglayer").removeClass(window.currentEditingLayer);
			$("#drawingtools .choosepath").show();
			"polygon" !== d20.engine.mode && $("#drawingtools").hasClass("polygon") && $("#drawingtools").removeClass("polygon").addClass("path");

			// BEGIN MOD
			if (e.hasClass("chooseweather")) {
				window.currentEditingLayer = "weather";
				$("#drawingtools .choosepath").hide();
				"path" !== d20.engine.mode && $("#drawingtools").removeClass("path").addClass("polygon")
			} else {
				e.hasClass("choosebackground") ? window.currentEditingLayer = "background" : e.hasClass("chooseforeground") ? window.currentEditingLayer = "foreground" : e.hasClass("chooseobjects") ? window.currentEditingLayer = "objects" : e.hasClass("choosemap") ? window.currentEditingLayer = "map" : e.hasClass("choosegmlayer") ? window.currentEditingLayer = "gmlayer" : e.hasClass("choosewalls") && (window.currentEditingLayer = "walls",
					$("#drawingtools .choosepath").hide(),
				"path" !== d20.engine.mode && $("#drawingtools").removeClass("path").addClass("polygon"));
			}
			// END MOD
			$("#editinglayer").addClass(window.currentEditingLayer);
			$(document).trigger("d20:editingLayerChanged");
		});
	};
	// END ROLL20 CODE

	// prevent prototype methods from breaking some poorly-written property loops
	d20plus.mod.fixHexMethods = () => {
		try {
			// BEGIN ROLL20 CODE
			HT.Grid.prototype.GetHexAt = function(e) {
				// BEGIN MOD
				for (const t of this.Hexes)
					if (t.Contains(e))
						return t;
				// END MOD
				return null
			};
			// END ROLL20 CODE
		} catch (ignored) {
			console.error(ignored)
		}

		try {
			// BEGIN ROLL20 CODE
			HT.Grid.prototype.GetHexById = function(e) {
				// BEGIN MOD
				for (const t of this.Hexes)
					if (t.Id == e)
						return t;
				// END MOD
				return null
			};
			// END ROLL20 CODE
		} catch (ignored) {
			console.error(ignored)
		}
	};

	// prevent prototype methods from breaking some poorly-written property loops
	d20plus.mod.fixVideoMethods = () => {
		const arr = [];
		for (const k in arr) {
			const v = arr[k];
			if (typeof v === "function") {
				v.getReceiver = v.getReceiver || (() => null);
				v.getSender = v.getSender || (() => null);
			}
		}
	};
}

SCRIPT_EXTENSIONS.push(d20plusMod);
