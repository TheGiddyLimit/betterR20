function baseConfig () {
	d20plus.cfg = {current: {}};

	d20plus.cfg.pLoadConfigFailed = false;

	addConfigOptions("token", {
		"_name": "Tokens",
		"massRollWhisperName": {
			"name": "Whisper Token Name to Mass-Rolls",
			"default": false,
			"_type": "boolean",
		},
	},
	);
	addConfigOptions("canvas", {
		"_name": "Canvas",
		"_player": true,
		"gridSnap": {
			"name": "Grid Snap",
			"default": "1",
			"_type": "_enum",
			"__values": ["0.25", "0.5", "1"],
			"_player": true,
		},
		"scaleNamesStatuses": {
			"name": "Scaled Names and Status Icons",
			"default": true,
			"_type": "boolean",
			"_player": true,
		},
	},
	);
	addConfigOptions("import", {
		"_name": "Import",
		"importIntervalMap": {
			"name": "Rest Time between Each Map (msec)",
			"default": 2500,
			"_type": "integer",
		},
	});
	addConfigOptions("interface", {
		"_name": "Interface",
		"toolbarOpacity": {
			"name": "Horizontal Toolbar Opacity",
			"default": 100,
			"_type": "_slider",
			"__sliderMin": 1,
			"__sliderMax": 100,
			"__sliderStep": 1,
		},
		"quickLayerButtons": {
			"name": "Add Quick Layer Buttons",
			"default": true,
			"_type": "boolean",
		},
		"quickInitButtons": {
			"name": "Add Quick Initiative Sort Button",
			"default": true,
			"_type": "boolean",
		},
		"streamerChatTag": {
			"name": "Streamer-Friendly Chat Tags",
			"default": false,
			"_type": "boolean",
		},
		"hideDefaultJournalSearch": {
			"name": "Hide Default Journal Search Bar",
			"default": false,
			"_type": "boolean",
		},
	});

	d20plus.cfg.pLoadConfig = async () => {
		d20plus.ut.log("Reading Config");
		let configHandout = d20plus.cfg.getConfigHandout();

		if (!configHandout) {
			d20plus.ut.log("No config found! Initialising new config...");
			await d20plus.cfg.pMakeDefaultConfig();
		}

		configHandout = d20plus.cfg.getConfigHandout();
		if (configHandout) {
			configHandout.view.render();
			return new Promise(resolve => {
				configHandout._getLatestBlob("gmnotes", async function (gmnotes) {
					try {
						const decoded = decodeURIComponent(gmnotes);

						d20plus.cfg.current = JSON.parse(decoded);

						d20plus.ut.log("Config Loaded:");
						d20plus.ut.log(d20plus.cfg.current);
						resolve();
					} catch (e) {
						// eslint-disable-next-line no-console
						console.error(e);
						if (!d20plus.cfg.pLoadConfigFailed) {
							// prevent infinite loops
							d20plus.cfg.pLoadConfigFailed = true;

							d20plus.ut.log("Corrupted config! Rebuilding...");
							await d20plus.cfg.pMakeDefaultConfig();
							await d20plus.cfg.pLoadConfig();
							resolve();
						} else {
							// if the config fails, continue to load anyway
							resolve();
						}
					}
				});
			});
		} else d20plus.ut.log("Failed to create config handout!");
	};

	d20plus.cfg.pLoadPlayerConfig = async () => {
		d20plus.ut.log("Reading player Config");
		const loaded = await StorageUtil.pGet(`Veconfig`);
		if (!loaded) {
			d20plus.ut.log("No player config found! Initialising new config...");
			const dfltConfig = d20plus.cfg.getDefaultConfig();
			d20plus.cfg.current = Object.assign(d20plus.cfg.current, dfltConfig);
			await StorageUtil.pSet(`Veconfig`, d20plus.cfg.current);
		} else {
			d20plus.cfg.current = loaded;
		}
		d20plus.ut.log("Player config Loaded:");
		d20plus.ut.log(d20plus.cfg.current);
	};

	d20plus.cfg.pMakeDefaultConfig = () => {
		return new Promise(resolve => {
			d20.Campaign.handouts.create({
				name: CONFIG_HANDOUT,
				archived: true,
			}, {
				success: function (handout) {
					notecontents = "The GM notes contain config options saved between sessions. If you want to wipe your saved settings, delete this handout and reload roll20. If you want to edit your settings, click the \"Edit Config\" button in the <b>Settings</b> (cog) panel.";

					// default settings
					// token settings mimic official content; other settings as vanilla as possible
					const gmnotes = JSON.stringify(d20plus.cfg.getDefaultConfig());

					handout.updateBlobs({notes: notecontents, gmnotes: gmnotes});
					handout.save({notes: (new Date()).getTime(), inplayerjournals: ""});

					resolve();
				},
			});
		});
	};

	d20plus.cfg.getConfigHandout = () => {
		d20plus.ut.getJournalFolderObj(); // ensure journal init

		return d20.Campaign.handouts.models.find(function (handout) {
			return handout.attributes.name === CONFIG_HANDOUT;
		});
	};

	d20plus.cfg.getCfgKey = (group, val) => {
		if (val === undefined || d20plus.cfg.current[group] === undefined) return undefined;
		const gr = d20plus.cfg.current[group];
		for (const key of Object.keys(d20plus.cfg.current[group])) {
			if (gr[key] !== undefined && gr[key] === val) {
				return key;
			}
		}
		return undefined;
	};

	d20plus.cfg.getRawCfgVal = (group, key) => {
		if (d20plus.cfg.current[group] === undefined) return undefined;
		if (d20plus.cfg.current[group][key] === undefined) return undefined;
		return d20plus.cfg.current[group][key];
	};

	d20plus.cfg.get = (group, key) => {
		if (d20plus.cfg.current[group] === undefined) return undefined;
		if (d20plus.cfg.current[group][key] === undefined) return undefined;
		if (CONFIG_OPTIONS[group][key]._type === "_SHEET_ATTRIBUTE") {
			if (!NPC_SHEET_ATTRIBUTES[d20plus.cfg.current[group][key]]) return undefined;
			return NPC_SHEET_ATTRIBUTES[d20plus.cfg.current[group][key]][d20plus.sheet];
		}
		if (CONFIG_OPTIONS[group][key]._type === "_SHEET_ATTRIBUTE_PC") {
			if (!PC_SHEET_ATTRIBUTES[d20plus.cfg.current[group][key]]) return undefined;
			return PC_SHEET_ATTRIBUTES[d20plus.cfg.current[group][key]][d20plus.sheet];
		}
		return d20plus.cfg.current[group][key];
	};

	d20plus.cfg.getDefault = (group, key) => {
		return d20plus.cfg._getProp("default", group, key);
	};

	d20plus.cfg.getPlaceholder = (group, key) => {
		return d20plus.cfg._getProp("_placeholder", group, key);
	};

	d20plus.cfg._getProp = (prop, group, key) => {
		if (CONFIG_OPTIONS[group] === undefined) return undefined;
		if (CONFIG_OPTIONS[group][key] === undefined) return undefined;
		return CONFIG_OPTIONS[group][key][prop];
	};

	d20plus.cfg.getOrDefault = (group, key) => {
		if (d20plus.cfg.has(group, key)) return d20plus.cfg.get(group, key);
		return d20plus.cfg.getDefault(group, key);
	};

	d20plus.cfg.getCfgEnumVals = (group, key) => {
		if (CONFIG_OPTIONS[group] === undefined) return undefined;
		if (CONFIG_OPTIONS[group][key] === undefined) return undefined;
		return CONFIG_OPTIONS[group][key].__values
	};

	d20plus.cfg.getCfgSliderVals = (group, key) => {
		if (CONFIG_OPTIONS[group] === undefined) return undefined;
		if (CONFIG_OPTIONS[group][key] === undefined) return undefined;
		const it = CONFIG_OPTIONS[group][key];
		return {
			min: it.__sliderMin,
			max: it.__sliderMax,
			step: it.__sliderStep,
		}
	};

	d20plus.cfg.getDefaultConfig = () => {
		const outCpy = {};
		$.each(CONFIG_OPTIONS, (sectK, sect) => {
			if (window.is_gm || sect._player) {
				outCpy[sectK] = outCpy[sectK] || {};
				$.each(sect, (k, data) => {
					if (!k.startsWith("_") && (window.is_gm || data._player)) {
						outCpy[sectK][k] = data.default;
					}
				});
			}
		});
		return outCpy;
	};

	// Helpful for checking if a boolean option is set even if false
	d20plus.cfg.has = (group, key) => {
		if (d20plus.cfg.current[group] === undefined) return false;
		return d20plus.cfg.current[group][key] !== undefined;
	};

	d20plus.cfg.setCfgVal = (group, key, val) => {
		if (d20plus.cfg.current[group] === undefined) d20plus.cfg.current[group] = {};
		d20plus.cfg.current[group][key] = val;
	};

	d20plus.cfg.makeTabPane = ($addTo, headers, content) => {
		if (headers.length !== content.length) throw new Error("Tab header and content length were not equal!");

		if ($addTo.attr("hastabs") !== "YES") {
			const $tabBar = $(`<ul class="nav nav-tabs"/>`);

			const tabList = [];
			const paneList = [];
			const $tabPanes = $(`<div class="tabcontent"/>`);

			$.each(content, (i, e) => {
				const toAdd = $(`<div class="plustab${i} tab-pane" ${i === 0 ? "" : `style="display: none"`}/>`);
				toAdd.append(e);
				paneList[i] = toAdd;
				$tabPanes.append(toAdd);
			});

			$.each(headers, (i, e) => {
				const toAdd = $(`<li ${i === 0 ? `class="active"` : ""}><a data-tab="plustab${i}" href="#">${e}</a></li>`).on("click", () => {
					paneList.forEach((p, i2) => {
						if (i2 === i) {
							tabList[i2].addClass("active");
							paneList[i2].show();
						} else {
							tabList[i2].removeClass("active");
							paneList[i2].hide();
						}
					});
				});
				tabList[i] = (toAdd);
				$tabBar.append(toAdd);
			});

			$addTo
				.append($tabBar)
				.append($tabPanes);

			$addTo.attr("hastabs", "YES");
		}
	};

	d20plus.cfg.openConfigEditor = () => {
		const cEdit = $("#d20plus-configeditor");
		cEdit.dialog("open");

		if (cEdit.attr("hastabs") !== "YES") {
			cEdit.attr("hastabs", "YES");
			const appendTo = $(`<div/>`);
			cEdit.prepend(appendTo);

			const configFields = {};

			let sortedKeys = Object.keys(CONFIG_OPTIONS).sort((a, b) => d20plus.ut.ascSort(CONFIG_OPTIONS[a]._name, CONFIG_OPTIONS[b]._name));
			if (!window.is_gm) sortedKeys = sortedKeys.filter(k => CONFIG_OPTIONS[k]._player);

			const tabList = sortedKeys.map(k => CONFIG_OPTIONS[k]._name);

			const makeTab = (cfgK) => {
				const cfgGroup = CONFIG_OPTIONS[cfgK];
				configFields[cfgK] = {};

				const content = $(`
						<div class="config-table-wrapper">
							<table class="config-table">
								<thead><tr><th>Property</th><th>Value</th></tr></thead>
								<tbody></tbody>
							</table>
						</div>
					`);
				const tbody = content.find(`tbody`);

				let sortedTabKeys = Object.keys(cfgGroup).filter(k => !k.startsWith("_"));
				if (!window.is_gm) sortedTabKeys = sortedTabKeys.filter(k => cfgGroup[k]._player);

				sortedTabKeys.forEach((grpK, idx) => {
					const prop = cfgGroup[grpK];

					// IDs only used for label linking
					const toAdd = $(`<tr><td><label for="conf_field_${idx}" class="config-name">${prop.name}</label></td></tr>`);

					// Each config `_type` should have a case here. Each case should add a function to the map [configFields:[cfgK:grpK]]. These functions should return the value of the input.
					switch (prop._type) {
						case "boolean": {
							const field = $(`<input type="checkbox" id="conf_field_${idx}" ${d20plus.cfg.getOrDefault(cfgK, grpK) ? `checked` : ""}>`);

							configFields[cfgK][grpK] = () => {
								return field.prop("checked")
							};

							const td = $(`<td/>`).append(field);
							toAdd.append(td);
							break;
						}
						case "String": {
							const curr = d20plus.cfg.get(cfgK, grpK) || "";
							const placeholder = d20plus.cfg.getPlaceholder(cfgK, grpK);
							const def = d20plus.cfg.getDefault(cfgK, grpK) || "";
							const field = $(`<input id="conf_field_${idx}" value="${curr}" ${placeholder ? `placeholder="${placeholder}"` : def ? `placeholder="Default: ${def}"` : ""}>`);

							configFields[cfgK][grpK] = () => {
								return field.val() ? field.val().trim() : "";
							};

							const td = $(`<td/>`).append(field);
							toAdd.append(td);
							break;
						}
						case "_SHEET_ATTRIBUTE_PC":
						case "_SHEET_ATTRIBUTE": {
							const DICT = prop._type === "_SHEET_ATTRIBUTE" ? NPC_SHEET_ATTRIBUTES : PC_SHEET_ATTRIBUTES;
							const sortedNpcsAttKeys = Object.keys(DICT).sort((at1, at2) => d20plus.ut.ascSort(DICT[at1].name, DICT[at2].name));
							const field = $(`<select id="conf_field_${idx}" class="cfg_grp_${cfgK}" data-item="${grpK}">${sortedNpcsAttKeys.map(npcK => `<option value="${npcK}">${DICT[npcK].name}</option>`)}</select>`);
							const cur = d20plus.cfg.get(cfgK, grpK);
							if (cur !== undefined) {
								field.val(cur);
							}

							configFields[cfgK][grpK] = () => {
								return field.val()
							};

							const td = $(`<td/>`).append(field);
							toAdd.append(td);
							break;
						}
						case "float":
						case "integer": {
							const def = d20plus.cfg.getDefault(cfgK, grpK);
							const curr = d20plus.cfg.get(cfgK, grpK);
							const field = $(`<input id="conf_field_${idx}" type="number" ${curr != null ? `value="${curr}"` : ""} ${def != null ? `placeholder="Default: ${def}"` : ""} step="any">`);

							configFields[cfgK][grpK] = () => {
								return Number(field.val());
							};

							const td = $(`<td/>`).append(field);
							toAdd.append(td);
							break;
						}
						case "_FORMULA": {
							const $field = $(`<select id="conf_field_${idx}" class="cfg_grp_${cfgK}" data-item="${grpK}">${d20plus.formulas._options.sort().map(opt => `<option value="${opt}">${opt}</option>`)}</select>`);

							const cur = d20plus.cfg.get(cfgK, grpK);
							if (cur !== undefined) {
								$field.val(cur);
							}

							configFields[cfgK][grpK] = () => {
								return $field.val();
							};

							const td = $(`<td/>`).append($field);
							toAdd.append(td);
							break;
						}
						case "_WHISPERMODE": {
							const $field = $(`<select id="conf_field_${idx}" class="cfg_grp_${cfgK}" data-item="${grpK}">${d20plus.whisperModes.map(mode => `<option value="${mode}">${mode}</option>`)}</select>`);

							const cur = d20plus.cfg.get(cfgK, grpK);
							if (cur !== undefined) {
								$field.val(cur);
							}

							configFields[cfgK][grpK] = () => {
								return $field.val();
							};

							const td = $(`<td/>`).append($field);
							toAdd.append(td);
							break;
						}
						case "_ADVANTAGEMODE": {
							const $field = $(`<select id="conf_field_${idx}" class="cfg_grp_${cfgK}" data-item="${grpK}">${d20plus.advantageModes.map(mode => `<option value="${mode}">${mode}</option>`)}</select>`);

							const cur = d20plus.cfg.get(cfgK, grpK);
							if (cur !== undefined) {
								$field.val(cur);
							}

							configFields[cfgK][grpK] = () => {
								return $field.val();
							};

							const td = $(`<td/>`).append($field);
							toAdd.append(td);
							break;
						}
						case "_DAMAGEMODE": {
							const $field = $(`<select id="conf_field_${idx}" class="cfg_grp_${cfgK}" data-item="${grpK}">${d20plus.damageModes.map(mode => `<option value="${mode}">${mode}</option>`)}</select>`);

							const cur = d20plus.cfg.get(cfgK, grpK);
							if (cur !== undefined) {
								$field.val(cur);
							}

							configFields[cfgK][grpK] = () => {
								return $field.val();
							};

							const td = $(`<td/>`).append($field);
							toAdd.append(td);
							break;
						}
						case "_enum": { // for generic String enums not covered above
							const $field = $(`<select id="conf_field_${idx}" class="cfg_grp_${cfgK}" data-item="${grpK}">${d20plus.cfg.getCfgEnumVals(cfgK, grpK).map(it => `<option value="${it}">${it}</option>`)}</select>`);

							const cur = d20plus.cfg.get(cfgK, grpK);
							if (cur !== undefined) {
								$field.val(cur);
							} else {
								const def = d20plus.cfg.getDefault(cfgK, grpK);
								if (def !== undefined) {
									$field.val(def);
								}
							}

							configFields[cfgK][grpK] = () => {
								return $field.val();
							};

							const td = $(`<td/>`).append($field);
							toAdd.append(td);
							break;
						}
						case "_slider": {
							const def = d20plus.cfg.getDefault(cfgK, grpK);
							const curr = d20plus.cfg.get(cfgK, grpK);
							const sliderMeta = d20plus.cfg.getCfgSliderVals(cfgK, grpK);

							const field = $(`<input style="max-width: calc(100% - 40px);" type="range" min="${sliderMeta.min || 0}" max="${sliderMeta.max || 0}" step="${sliderMeta.step || 1}" value="${curr == null ? def : curr}">`);

							configFields[cfgK][grpK] = () => {
								return Number(field.val());
							};

							const td = $(`<td/>`).append(field);
							toAdd.append(td);
							break;
						}
						case "_color": {
							const value = d20plus.cfg.getOrDefault(cfgK, grpK);

							const field = $(`<input type="color" value="${value == null ? "" : value}">`);

							configFields[cfgK][grpK] = () => {
								return field.val();
							};

							const td = $(`<td/>`).append(field);
							toAdd.append(td);
							break;
						}
					}
					tbody.append(toAdd);
				});

				return content;
			}

			const contentList = sortedKeys.map(k => makeTab(k));

			d20plus.cfg.makeTabPane(
				appendTo,
				tabList,
				contentList,
			);

			const saveButton = $(`#configsave`);
			saveButton.unbind("click");
			saveButton.bind("click", () => {
				function _updateLoadedConfig () {
					$.each(configFields, (cfgK, grp) => {
						$.each(grp, (grpK, grpVField) => {
							d20plus.cfg.setCfgVal(cfgK, grpK, grpVField());
						})
					});
				}

				if (window.is_gm) {
					const doSave = () => {
						_updateLoadedConfig();

						const gmnotes = JSON.stringify(d20plus.cfg.current).replace(/%/g, "%25");
						handout.updateBlobs({gmnotes: gmnotes});
						handout.save({notes: (new Date()).getTime()});

						d20plus.ut.log("Saved config");

						d20plus.cfg.baseHandleConfigChange();
						if (d20plus.cfg5e) d20plus.cfg5e.handleConfigChange();
					};

					let handout = d20plus.cfg.getConfigHandout();
					if (!handout) {
						d20plus.cfg.pMakeDefaultConfig(doSave);
					} else {
						doSave();
					}
				} else {
					_updateLoadedConfig();
					StorageUtil.pSet(`Veconfig`, d20plus.cfg.current);
					d20plus.cfg.baseHandleConfigChange();
					if (d20plus.cfg5e) d20plus.cfg5e.handleConfigChange();
				}
			});
		}
	};

	/*
	// Left here for future use, in case anything similar is required
	d20plus.cfg._handleWeatherConfigChange = () => {
		function handleProp (prop) {
			const campaignKey = `bR20cfg_${prop}`;
			if (d20plus.cfg.has("weather", prop)) {
				Campaign && Campaign.save({[campaignKey]: d20plus.cfg.get("weather", prop)});
			} else {
				if (Campaign) {
					delete Campaign[campaignKey];
					Campaign.save();
				}
			}
		}
		if (window.is_gm) {
			handleProp("weatherType1");
			handleProp("weatherTypeCustom1");
			handleProp("weatherSpeed1");
			handleProp("weatherDir1");
			handleProp("weatherDirCustom1");
			handleProp("weatherOscillate1");
			handleProp("weatherOscillateThreshold1");
			handleProp("weatherIntensity1");
			handleProp("weatherTint1");
			handleProp("weatherTintColor1");
			handleProp("weatherEffect1");
		}
	};
	*/

	d20plus.cfg.baseHandleConfigChange = () => {
		// d20plus.cfg._handleWeatherConfigChange();
		if (d20plus.cfg.has("interface", "toolbarOpacity")) {
			const v = Math.max(Math.min(Number(d20plus.cfg.get("interface", "toolbarOpacity")), 100), 0);
			$(`#secondary-toolbar`).css({opacity: v * 0.01});
		}

		$(`#floatinglayerbar`).toggle(d20plus.cfg.getOrDefault("interface", "quickLayerButtons"));
		$(`#init-quick-sort-desc`).toggle(d20plus.cfg.getOrDefault("interface", "quickInitButtons"));
		$(`input[placeholder="Search by tag or name..."]`).parent().toggle(!d20plus.cfg.getOrDefault("interface", "hideDefaultJournalSearch"))
	};

	d20plus.cfg.startPlayerConfigHandler = () => {
		function handlePlayerCfg () {
			d20plus.cfg.baseHandleConfigChange();
			if (d20plus.handleConfigChange) d20plus.handleConfigChange(true);
		}

		// every 5 seconds, poll and apply any config changes the GM might have made
		if (!window.is_gm) {
			setInterval(() => {
				handlePlayerCfg();
			}, 5000);
		}
		handlePlayerCfg();
	};
}

SCRIPT_EXTENSIONS.push(baseConfig);
