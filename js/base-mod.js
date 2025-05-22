/**
 * All the modified minified based on parts of Roll20's `app.js`
 */
function d20plusMod () {
	d20plus.mod = {};

	d20plus.mod.preserveDrawingColor = (() => {
		const drawingTools = ["rect", "ellipse", "text", "path", "polygon"];
		const drawingProps = [{nm: "fill", el: "fillcolor"}, {nm: "color", el: "strokecolor"}];
		return (t) => {
			if (!drawingTools.includes(t)) return;
			drawingProps.forEach(prop => {
				if (!prop.stashed) {
					prop.stashed = true;
					prop.value = d20.engine.canvas.freeDrawingBrush[prop.nm];
				} else {
					prop.stashed = false;
					if (drawingProps[1].value === "rgb(0, 0, 0)" || !drawingProps[1].value) return;
					$(`#path_${prop.el}`).val(prop.value).trigger("change");
				}
			});
		}
	})();

	d20plus.mod.setMode = function (t) {
		d20plus.ut.log(`Setting mode ${t}`);
		try {
			d20plus.mod.preserveDrawingColor(t);
			d20.Campaign.activePage().setModeRef(t);
			d20plus.mod.preserveDrawingColor(t);
		} catch (e) {
			d20plus.ut.log(`Switching using legacy because ${e.message}`);
			d20plus.mod.setModeLegacy(t);
		}
	}

	// modified to allow players to use the FX tool, and to keep current colour selections when switching tool
	/* eslint-disable */
	// BEGIN ROLL20 CODE
	d20plus.mod.setModeLegacy = function (e) {
		// BEGIN MOD
		// "text" === e || "rect" === e || "ellipse" === e || "polygon" === e || "path" === e || "pan" === e || "select" === e || "targeting" === e || "measure" === e || window.is_gm || (e = "select"),
		// END MOD
		"text" == e ? $("#editor").addClass("texteditmode") : $("#editor").removeClass("texteditmode"),
			$("#floatingtoolbar li").removeClass("activebutton"),
			$("#" + e).addClass("activebutton"),
		"fog" == e.substring(0, 3) && $("#fogcontrols").addClass("activebutton");

		const drawingTools = ["rect", "ellipse", "text", "path", "polygon", "line_splitter"];
		if (drawingTools.includes(e)) {
			if ("ellipse" == e) $('#drawingtools span.subicon').addClass('fas fa-circle');
			else $('#drawingtools span.subicon').removeClass('fas fa-circle');
			$("#drawingtools").addClass("activebutton").removeClass("text rect ellipse path polygon line_splitter");
			"rect" == e && $("#drawingtools").addClass("rect");
			"ellipse" == e && $("#drawingtools").addClass("ellipse");
			"text" == e && $("#drawingtools").addClass("activebutton").removeClass("rect ellipse path polygon line_splitter").addClass("text");
			"path" == e && $("#drawingtools").addClass("path");
			"polygon" == e && $("#drawingtools").addClass("polygon");
			// BEGIN MOD (also line_splitter added to above removeClass calls
			"line_splitter" == e && $("#drawingtools").addClass("line_splitter");
			// END MOD
		}
		"polygon" != e && d20.engine.finishCurrentPolygon();

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
			d20.engine.mode = e,
		"measure" !== e && window.currentPlayer && d20.engine.measurements[window.currentPlayer.id] && !d20.engine.measurements[window.currentPlayer.id].sticky && (d20.engine.announceEndMeasure({
			player: window.currentPlayer.id
		}),
			d20.engine.endMeasure()),
			d20.engine.canvas.isDrawingMode = "path" == e ? !0 : !1;
		if ("text" == e || "path" == e || "rect" == e || "ellipse" == e || "polygon" == e || "fxtools" == e) {
			$("#secondary-toolbar").show();
			$("#secondary-toolbar .mode").hide();
			$("#secondary-toolbar ." + e).show();
			("path" == e || "rect" == e || "ellipse" == e || "polygon" == e) && ("" === $("#path_strokecolor").val() && ($("#path_strokecolor").val("#000000").trigger("change-silent"),
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
		'placelight' === e ? ($('#placelight').addClass('activebutton'), $('#babylonCanvas').addClass('torch-cursor')) : $('#babylonCanvas').removeClass('torch-cursor'),
		'placeWindow' === e ? ($('#placeWindow').addClass('activebutton'), $('#babylonCanvas').addClass('window-cursor')) : $('#babylonCanvas').removeClass('window-cursor'),
		'placeDoor' === e ? ($('#placeDoor').addClass('activebutton'), $('#babylonCanvas').addClass('door-cursor')) : $('#babylonCanvas').removeClass('door-cursor'),
		d20.engine.redrawScreenNextTick()
	};
	// END ROLL20 CODE

	d20plus.mod.overwriteStatusEffects = function () {
		d20.engine.canvasDirty = true;
		d20.engine.canvasTopDirty = true;
		d20.engine.canvas?._objects?.forEach(it => {
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

	// BEGIN ROLL20 CODE
	d20plus.mod.renderAll = function(v) {
		const p = v && v.context || this.contextContainer
		  , e = this.getActiveGroup()
		  , u = this.sortTokens();
		e && !window.is_gm && (e.hideResizers = !0),
		this.clipTo ? fabric.util.clipContext(this, p) : p.save(),
		v.tokens = u.map,
		this.drawMapLayer(p, v);
		const n = v && v.grid_before_afow
		  , y = !d20.Campaign.activePage().get("adv_fow_enabled") || v && v.disable_afow
		  , d = !d20.Campaign.activePage().get("showgrid") || v && v.disable_grid;
		return n && !d && d20.canvas_overlay.drawGrid(p),
		!y && window.largefeats && d20.canvas_overlay.drawAFoW(d20.engine.advfowctx, d20.engine.work_canvases.floater.context),
		!n && !d && d20.canvas_overlay.drawGrid(p),
		// BEGIN MOD
		["background", "objects", "foreground"].forEach(layer => {
			v.tokens = u[layer],
			this.drawAnyLayer(p, v, layer);
		}),
		window.is_gm && (v.tokens = u.gmlayer,
		this.drawAnyLayer(p, v, "gmlayer")),
		window.is_gm && window.currentEditingLayer === "walls" && (v.tokens = u.walls,
		this.drawDynamicLightingLayer(p, v)),
		window.currentEditingLayer === "weather" && (v.tokens = u.weather,
		this.drawAnyLayer(p, v, "weather")),
		// END MOD
		p.restore(),
		this
	}
	// END ROLL20 CODE

	// BEGIN ROLL20 CODE
	d20plus.mod.sortTokens = function() {
		const v = {
			map: [],
			// BEGIN MOD
			background: [],
			objects: [],
			foreground: [],
			gmlayer: [],
			weather: [],
			// END MOD
			walls: []
		};
		for (const p of this._objects) {
			const e = v[p.model.get("layer")];
			e && e.push(p)
		}
		return v
	}
	// END ROLL20 CODE

	d20plus.mod.setAlpha = function (layer) {
		const l = ["map", "walls", "weather", "background", "objects", "foreground", "gmlayer"];
		const o = ["background", "objects", "foreground"];
		return !window.is_gm
			|| (o.includes(layer) && o.includes(window.currentEditingLayer))
			|| (l.indexOf(window.currentEditingLayer) >= l.indexOf(layer)
				&& !(o.includes(layer) && window.currentEditingLayer === "gmlayer"))
			? 1 : (layer === "gmlayer" ? d20.engine.gm_layer_opacity : .5);
	}

	// BEGIN ROLL20 CODE
	d20plus.mod.drawAnyLayer = function(v, p={}, layer) {
		const e = p.tokens || this._objects.filter(u=>{
			const n = u.model;
			// BEGIN MOD
			return n && n.get("layer") === layer
			// END MOD
		});
		v.save(),
		// BEGIN MOD
		v.globalAlpha = d20plus.mod.setAlpha(layer),
		// END MOD
		this.drawTokenList(v, e, p),
		v.restore()
	},
	// END ROLL20 CODE

	// BEGIN ROLL20 CODE
	d20plus.mod.drawTokensWithoutAuras = function (v, p) {
		const e = this.getActiveGroup();
		v.save(),
		p.forEach(u=>{
			e && u && e.contains(u) ? (u.renderingInGroup = e,
			u.hasControls = !1) : (u.renderingInGroup = null,
			u.hasControls = !0,
			u.hideResizers = !window.is_gm);
			// BEGIN MOD
			v.globalAlpha = d20plus.mod.setAlpha(u.model.get("layer")),
			// END MOD
			u.renderPre(v, {
				noAuras: !0,
				should_update: !0
			}),
			this._draw(v, u)
		}
		),
		v.restore()
	},
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

			// BEGIN MOD
			d20.Campaign.activePage().onLayerChange();
			// END MOD
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

	/* eslint-enable */
}

SCRIPT_EXTENSIONS.push(d20plusMod);
