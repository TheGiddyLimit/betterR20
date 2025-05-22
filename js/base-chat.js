function baseChat () {
	d20plus.chat = d20plus.chat || {};

	d20plus.chat.localHistory = [];
	d20plus.chat.lastRespondent = "";
	const languages = d20plus.chat.languages;

	function buildLanguageIndex () {
		d20plus.chat.languageIndex = {};
		d20plus.chat.languageAdditions = {};
		Object.keys(languages).forEach(id => {
			const language = languages[id];
			d20plus.chat.languageIndex[id] = id;
			d20plus.chat.languageIndex[language.title.toLowerCase()] = id;
			language.alias.forEach(name => {
				d20plus.chat.languageIndex[name] = id;
			})
		});
	}

	function gibberish (string, langId, incompetent) {
		if (!languages[langId]) langId = d20plus.chat.languageAdditions[langId];
		if (!languages[langId]) return string;

		const paragraphs = string.split("\n");
		if (paragraphs.length > 1) return paragraphs.map(str => gibberish(str, langId, incompetent)).join("\n");

		// The code below generates pseudo-random text "in selected language".
		// Each separate word replacement is different in each case, yet chunks of 3 and more
		// words are always replaced with the same "words" to create an illusion of real translation.
		// This is done by calculating numerical value for each 3 words, and then using its last 2 digits
		// as an index to select "translated word" from the dictionary of 100 fake words.

		const particle = { left: false };
		const words = string.toLowerCase().match(/(--\p{L}+|\p{L}+)/gu);
		if (words === null) return "";
		if (incompetent) words.shuffle();

		const calcIndex = (word) => {
			return Array.from(`${word}`).reduce((index, letter) =>
				index + letter.charCodeAt(0)
			, 0);
		};
		const indexes = words.map((word, i) => {
			const left = i ? calcIndex(words[i - 1]) : 0;
			const right = 2 * calcIndex(words[i + 1]);
			return left + calcIndex(word) + right;
		});

		const translations = indexes.map((index, i) => {
			particle.left = particle.this && particle.left;
			particle.this = (index - 1) % 9 + 1 < languages[langId].factor;
			const spacing = i < words.length - 1 ? " " : "";
			if (incompetent && Math.random() > 0.5) {
				return words[i] + spacing;
			} else if (words[i].indexOf("--") === 0) {
				return words[i].replace(/--/gu, "").uppercaseFirst() + spacing;
			} else if (particle.this && !particle.left && i < words.length - 1) {
				particle.left = true;
				const transId = (index.toString().charAt(0) + index - 1) % 9;
				const spacing = /['-]$/.test(languages[langId].particles[transId]) ? "" : " ";
				return languages[langId].particles[transId] + spacing;
			} else {
				const transId = index.toString().slice(-2);
				return languages[langId].lexis[parseInt(transId)] + spacing;
			}
		});

		translations[0] = translations[0].uppercaseFirst();
		return translations.join("");
	}

	function availableLanguages (charId) {
		const char = d20.Campaign.characters.get(charId);
		const firstCharSheet = d20.journal.customSheets ?? d20.journal.characterSheetsManager.getAllSheets().first();
		const langId = firstCharSheet.availableAttributes.repeating_proficiencies_prof_type;
		if (!char) return [];
		if (!char.attribs.length) {
			const fetched = d20plus.ut.fetchCharAttribs(char);
			fetched.then(d20plus.chat.refreshLanguages);
		}
		// roll20 OGL sheet stores languages differently compared to other traits
		// by default, they don't have corresponding "proficiency type" attribute
		// however, if you create a trait and THEN change it to be language, it will have LOCALIZED "language" proficiency type
		// so to find all languages, we must filter out other named traits, except for the traits named "language" or "(localized word for LANGUAGE)"
		const traits = char.attribs.models
			.filter(prop => {
				return prop.attributes.name.match(/repeating_proficiencies_(.*?)_prof_type/)
				&& ![langId, "LANGUAGE"].includes(prop.attributes.current);
			})
			.map(trait => trait.attributes.name.replace(/repeating_proficiencies_(.*?)_prof_type/, "$1"));
		// now that we have a list of named non-language traits we can just find what we need
		const charspeaks = char.attribs.models.map(prop => {
			const filter = /repeating_proficiencies_(.*?)_name/;
			if (prop.attributes.name.match(filter)) {
				const isSimpleTrait = traits.includes(filter.exec(prop.attributes.name)[1]);
				if (!isSimpleTrait) return prop.attributes.current;
			} else if (prop.attributes.name === "npc_languages") {
				return prop.attributes.current.split(", ");
			}
		}).filter(lang => lang !== undefined);
		return charspeaks.flatten().map(lang => lang.normalize());
	}

	function availableLanguagesPlayer (playerId) {
		const characters = d20.Campaign.characters.models
			.filter(char => {
				if (playerId) {
					const actors = char.attributes.controlledby.split(",");
					return actors.includes(playerId) || actors.includes("all");
				} else {
					return char.currentPlayerControls();
				}
			})
			.map(char => char.id);
		return characters
			.map(charId => availableLanguages(charId))
			.flatten();
	}

	function hasLanguageProficiency (langId) {
		const proficientIn = availableLanguagesPlayer()
			.map(lang => d20plus.chat.getLanguageId(lang));
		return proficientIn.includes(d20plus.chat.getLanguageId(langId));
	}

	d20plus.chat.listSpeakingIn = (available) => {
		$("#speakingin").html(available
			.map(lang => lang.toSentenceCase())
			.reduce((html, lang) => `${html}<option>${lang}</option>`, "<option></option>"),
		);
	}

	d20plus.chat.getLanguageId = (lang) => {
		if (Array.isArray(lang)) return lang.map(language => d20plus.chat.getLanguageId(language));
		else return d20plus.chat.languageIndex[lang.normalize().toLowerCase()] || lang.normalize().toLowerCase();
	}

	d20plus.chat.refreshLanguages = () => {
		const $speakingIn = $("#speakingin");
		const speakingAs = $("#speakingas").val().split("|");
		const actorId = speakingAs[1];
		const actorIsPlayer = speakingAs[0] === "player";
		if (actorIsPlayer) {
			if (window.is_gm) {
				const prev = $speakingIn.val();
				d20plus.chat.listSpeakingIn(Object.keys(languages)
					.filter(lang => !lang.includes("fake"))
					.map(lang => languages[lang].title));
				$speakingIn.val(prev);
			} else {
				d20plus.chat.listSpeakingIn([]);
				$speakingIn.val("<option></option>");
			}
		} else {
			const prev = $speakingIn.val();
			const langs = availableLanguages(actorId);
			d20plus.chat.listSpeakingIn(langs);
			$speakingIn.val(prev);
		}
	}

	d20plus.chat.availableAddressees = () => {
		const players = d20.Campaign.players.models
			.filter(player => player.attributes.online && player.attributes.id !== d20_player_id)
			.map(player => ({name: player.attributes.displayname, id: player.attributes.id}));
		const characters = d20.Campaign.characters.models
			.filter(char => {
				if (!char.attributes.inplayerjournals) return false;
				const actors = char.attributes.controlledby.split(",");
				return actors.some(actor => actor && players.map(player => player.id).includes(actor))
			})
			.map(char => ({name: char.attributes.name}));
		return players.concat(characters);
	}

	d20plus.chat.setLanguagePreset = (message, language) => {
		if ($("#soundslike").length) return;
		const dialog = $(languageDialogTemplate(message, language));
		const src = d20.textchat.$textarea.val();
		const msg = {};
		setTimeout(() => {
			d20.textchat.$textarea.val(src);
			dialog.find("#soundslike").focus();
		}, 200);
		dialog.dialog({
			title: "Choose transcription",
			modal: true,
			width: 365,
			open: () => {
				msg.selected = dialog.find("#soundslike");
				msg.sample = dialog.find("#languageeg");
				$("#soundslike").change(() => {
					msg.sample.html(gibberish(message, msg.selected.val()));
				});
				msg.selected.focus();
			},
			close: () => {
				dialog.off();
				dialog.dialog("destroy").remove();
			},
			buttons: {
				[`Submit`]: function () {
					const val = msg.selected.val();
					const langId = language.normalize().toLowerCase();
					d20plus.ut.log(`Select language style ${language} to ${val}`);

					dialog.off();
					dialog.dialog("destroy").remove();
					d20.textchat.$textarea.focus();

					d20plus.chat.languageAdditions[langId] = val;
					$("#textchat-input button.btn").get(0).click();
				},
				[`Cancel`]: function () {
					dialog.off();
					dialog.dialog("destroy").remove();
				},
			},
		});
	}

	const languageTemplate = () => `
		<script id="sheet-rolltemplate-inlanguage" type="text/html">{{displaymessage}}<br>
			<span style="font-style:italic" title="You understand this because one of your characters speaks {{titlelanguage}}">
			<span style="font-weight:bold">{{displaylanguage}}</span> {{translated}}
			</span>
		</script>
	`;

	const languageDialogTemplate = (msg, language) => `
			<div>
				<p><strong>What does ${language} language sound like?</strong></p>
				<p>It seems you're trying to speak language not included in the standard list of D&D 5e PHB.</p>
				<p>That's not a problem. Please select one of the languages from the dropdown below, and it will be used for the imitated message.</p>
				<p>Your choice is purely cosmetic and will not affect who can or can not understand it. This will be remembered until you refresh the page.</p>
				<span style="display:block; height: 40px;">
					<label style="display: inline-block;" for="soundslike">Transcribe as:</label>
					<select id="soundslike" style="float: right; width: 60%;">
						${Object.keys(languages).reduce((options, lang) => `${options}<option value="${lang}">${lang}</option>`, "")}
					</select>
				</span>
				<p>This is what your message will look like with the current selection to those who don't speak ${language}:</p>
				<p><textarea id="languageeg" disabled="" style="width: 100%; box-sizing: border-box; height: 50px;cursor: default;resize: none; background: rgba(100, 100, 150, 0.2);"
					>${gibberish(msg, "common")}</textarea>
				</p>
			</div>
	`;

	const playerVersionsTemplate = (id) => `
			<input type="checkbox" class="connects-state" id="connects${id}-state"/>
			<label for="connects${id}-state">
				<span id="connects${id}-info" class="connects-info" title="Show player details">0</span>
				<span id="connects${id}" class="connects-log">
				B20 not responding...
				</span>
			</label>
	`;

	const removeClassUserscript = (html) => {
		return html.replace(/class="(?<class>[^""]*)"/g, (...str) => {
			const cls = str.last().class;
			return `class="${cls.replaceAll("userscript-", "")}"`
		});
	};

	const chatHelp = [
		{
			code: "/w %%",
			descr: "private message (whisper)",
			param: "name",
			tip: "Name of a player or a character, put in quotation marks if it contains spaces",
		},
		{
			code: "/w gm",
			descr: "private message to your GM",
		},
		{
			code: "/wb",
			descr: "PM back to last contact",
			b20: true,
		},
		{
			code: "/ws",
			descr: "PM to selected tokens (GM)",
			b20: true,
			gm: true,
		},
		{
			code: "/v %%",
			descr: "get script versions (GM)",
			param: "name",
			tip: "Name of a player that you want to get version info from, put in quotation marks if it contains spaces",
			b20: true,
			gm: true,
		},
		{
			code: "/em, /me",
			descr: "emote (action from your POV)",
		},
		{
			code: "/ooc, /o",
			descr: "out of character emote",
		},
		{
			code: "/desc",
			descr: "GM-only describe events",
			gm: true,
		},
		{
			code: "/as %%",
			descr: "GM-only speak as Name",
			param: "name",
			tip: "Name of the personified character, put in quotation marks if it contains spaces",
			gm: true,
		},
		{
			code: "/emas %%",
			descr: "GM-only emote as Name",
			param: "name",
			tip: "Name of the described character, put in quotation marks if it contains spaces",
			gm: true,
		},
		{
			code: "/in %%",
			descr: "speak in a language",
			param: "language",
			tip: "Name of a language that you know, put in quotation marks if it contains spaces",
			b20: true,
		},
		{
			code: "--%%",
			descr: "skip word (for in-language)",
			param: "word",
			tip: "Any single word inside in-language text that you want to keep from being translated, without spaces or hyphens",
			b20: true,
		},
		{
			code: "/talktomyself",
			descr: "silent mode on/off",
		},
		{
			code: "/ttms",
			descr: "shortcut to /talktomyself",
			b20: true,
		},
		{
			code: "/mtms %%",
			descr: "execute silently",
			param: "commands",
			tip: "Set of commands, separated by line breaks, to be executed in /ttms mode",
			b20: true,
		},
		{
			code: "/roll, /r %%",
			descr: "roll dice, e.g. /r 2d6",
			param: "XdY",
			tip: "Dice roll formula, like 1d20 +5",
		},
		{
			code: "/gmroll, /gr %%",
			descr: "roll only for GM",
			param: "XdY",
			tip: "Dice roll formula, like 1d20 +5, the result of which will be visible only to GM",
		},
		{
			code: "[[%%]]",
			descr: "inline dice roll",
			param: "XdY",
			tip: "Dice roll formula, like 1d20 +5, to be shown inside any other text",
		},
		{
			code: "&#42;%%&#42;",
			descr: "format text: italic",
			param: "text",
			tip: "Any formatted text without line breaks",
		},
		{
			code: "&#42;&#42;%%&#42;&#42;",
			descr: "format text: bold",
			param: "text",
			tip: "Any formatted text without line breaks",
		},
		{
			code: "&#96;&#96;%%&#96;&#96;",
			descr: "format text: code",
			param: "text",
			tip: "Any formatted text without line breaks",
		},
		{
			code: "&#126;&#126;%%&#126;&#126;",
			descr: "format text: strikethrough",
			param: "text",
			tip: "Any formatted text without line breaks",
		},
		{
			code: "/fx %%",
			descr: "show visual effect",
			param: "effect",
			tip: "Effect parameters, using the following syntax: Type&#8209;Color&nbsp;SourceID&nbsp;[TargetID]",
		},
		{
			code: "#%%",
			descr: "run specified macro",
			param: "macro",
			tip: "Name of the macro to be executed",
		},
		{
			code: "/help",
			descr: "show this list of chat commands",
			b20: true,
		},
		{
			code: "",
			descr: "<a style=\"font-variant: diagonal-fractions; font-size: smaller; font-variant-caps: small-caps;\" href=\"https://wiki.roll20.net/Text_Chat\">roll20 wiki</a>",
		},
	];

	d20plus.chat.help = (text, msg) => {
		d20plus.chat.modifyMsg(null, {legalize: true, sys: true});
		d20plus.ut.sendHackerChat(chatHelp.reduce((html, it) => {
			const isb20 = it.b20 ? `<span class="showtip tipsy-n-right" style="cursor:help;font-weight: bold;" title="This command was added by betteR20">&#42;</span>` : "";
			const param = it.param ? `<span class="showtip tipsy-n-right" style="background: rgba(206, 96, 96, 0.3);" title="${it.tip}">${it.param}</span>` : "";
			const code = it.code ? `<code>${it.code.replace("%%", param)}</code>${isb20}` : "&nbsp;";
			const gmcheck = !it.gm || window.is_gm;
			const langcheck = d20plus.cfg.getOrDefault("chat", "languages") || it.code.search(/^\/in|^--/) === -1;
			if (gmcheck && langcheck) return `${html}<br>${code}<span style="float:right"> ${it.descr}</span>`;
			return html;
		}, "<strong>List of chat commands:</strong><br>betteR20 commands marked with &#42;"));
		return "";
	}

	d20plus.chat.actions = { run: (id) => {
		d20plus.chat.actions[id]?.callback(d20plus.chat.actions[id]?.params);
		delete d20plus.chat.actions[id];
	}};

	d20plus.chat.smallActionBtnAdd = (msg, action) => {
		const id = d20plus.ut.generateRowId();
		const actions = {
			request: {title: "Request script info", icon: "?", callback: d20plus.chat.requestScriptVersions},
		}[action.type];
		d20plus.chat.actions[id] = Object.assign({params: action}, actions);
		msg.append(`<span class="msg-action-button showtip tipsy-n-right"
			data-action="${id}" title="${actions.title}">${actions.icon}
		</span>`);
	}

	d20plus.chat.smallActionBtnPress = (event) => {
		const $el = $(event.target);
		const id = $el.attr("data-action");
		d20plus.chat.actions.run(id);
	}

	d20plus.chat.requestScriptVersions = (params, msg) => {
		const id = d20plus.ut.generateRowId();
		msg = msg || `"${params.name}"`;
		msg.replace(/^("?)(?<name>[^ ]+|[^"]+)\1.*$/u, (...str) => {
			const name = str.last().name;
			const transport = {type: "handshake", id};
			d20.textchat.doChatInput(`/w "${name}" &nbsp;`, undefined, transport);
		});
		return "";
	}

	d20plus.chat.modifyMsg = (id, mod) => {
		id = id || d20plus.ut.generateRowId();
		d20plus.chat.modify = d20plus.chat.modify || {};
		d20plus.chat.modify[id] = d20plus.chat.modify[id] || {};
		Object.assign(d20plus.chat.modify[id], mod);
	}

	d20plus.chat.checkTTMSStatus = () => {
		const $speakingTo = $("#speakingto");
		if (d20.textchat.talktomyself) {
			if (d20plus.cfg.getOrDefault("chat", "highlightttms")) $("#textchat-input").addClass("talkingtoself");
			$speakingTo.val("ttms");
		} else {
			$("#textchat-input").removeClass("talkingtoself");
			if ($speakingTo.val() === "ttms") $speakingTo.val("");
		}
	}

	d20plus.chat.resetSendMyself = () => {
		if (d20plus.chat.mtms?.await) {
			d20.textchat.talktomyself = false;
			delete d20plus.chat.mtms;
		}
	}

	d20plus.chat.sendMyself = (text, msg) => {
		// This enables talktomyself mode only for the block of commands in the textarea
		// and then a hook in d20plus.chat.r20outgoing (doChatInput injection) disables it
		d20.textchat.talktomyself = true;
		setTimeout(() => {
			d20.textchat.doChatInput(msg);
			d20plus.chat.mtms = {await: true};
		}, 100);
		return "";
	}

	d20plus.chat.sendReply = (text, msg) => {
		const lastRespondent = d20plus.chat.lastRespondent;
		if (lastRespondent) return `/w "${lastRespondent}"${msg}`;
		else d20plus.ut.sendHackerChat("You have to start a private chat with someone first", true);
		return "";
	}

	d20plus.chat.sendToSelected = (text, msg) => {
		const canSpeakTo = d20plus.chat.availableAddressees().map(char => char.name);
		const addressees = d20.engine.selected()
			.map(token => token._model.character.attributes?.name)
			.filter(name => canSpeakTo.includes(name));
		if (addressees.length) return addressees.reduce((result, name) => { return `${result}/w "${name}"${msg}\n` }, "");
		else d20plus.ut.sendHackerChat("You have to select tokens belonging to actual players", true);
		return "";
	}

	d20plus.chat.sendInLanguage = (message, language) => {
		let langId = d20plus.chat.getLanguageId(language);
		if (!languages[langId] && !d20plus.chat.languageAdditions[langId]) {
			d20plus.chat.setLanguagePreset(message, language);
			return "";
		}
		const knows = window.is_gm || hasLanguageProficiency(langId);
		message = knows ? message : gibberish(message, langId, true);
		return `${gibberish(message, langId)}|&inlang|${language}|&meta|${langId}|&meta|${message}`;
	}

	d20plus.chat.sendParsedInLanguage = (text, msg) => {
		return msg.replace(/^("?)(?<lang>[^ ]+|[^"]+)\1 (?<msg>.+)$/u, (...str) => {
			const inlang = str.last();
			return d20plus.chat.sendInLanguage(inlang.msg, inlang.lang);
		});
	}

	d20plus.chat.getSpeakingTo = () => {
		const $speakingTo = $("#speakingto");
		const prev = $speakingTo.val();
		$speakingTo.html((() => {
			return d20plus.chat.availableAddressees().reduce((result, addressee) => {
				const icon = addressee.id ? "🗣" : "⚑";
				const option = `${icon} ${addressee.name}`;
				const value = `value="${addressee.name}"`;
				result += `<option ${value}>${option}</option>`;
				return result;
			}, `<option value="">All</option><option value="ttms">None</option>`);
		})());
		$speakingTo.val(prev);
	}

	addConfigOptions(
		"chat", {
			"social": {
				"name": "Enable chat social panel (requires restart)",
				"default": true,
				"_type": "boolean",
				"_player": true,
			},
			"showPlayerConnects": {
				"name": "Show player connects messages",
				"default": true,
				"_type": "boolean",
			},
			"commands": {
				"name": "Additional text chat commands (/help for full list)",
				"default": true,
				"_type": "boolean",
				"_player": true,
			},
			"highlightttms": {
				"name": "Highlight text box when in TTMS mode",
				"default": true,
				"_type": "boolean",
				"_player": true,
			},
			"executeJSMacro": {
				"name": "Execute JS script in macros",
				"default": "own",
				"_type": "_enum",
				"__values": ["none", "own", "all"],
				"__texts": [
					"Disabled",
					"Run your own scripts",
					"Run all scripts (only if you trust your GM!)",
				],
				"_player": true,
			},
		},
	);

	d20plus.chat.onSocial = () => {
		const $inputContainer = $("#textchat-input");
		if (!d20plus.chat.social) {
			const resized = $inputContainer.attr("style").includes("height")
			if (resized) $inputContainer.addClass("social-resized");
			else $inputContainer.addClass("social-default");
			d20plus.chat.refreshLanguages();
			d20plus.chat.getSpeakingTo();
			d20plus.chat.social = true;
		} else {
			d20plus.chat.closeSocial();
		}
	}

	d20plus.chat.onSpeakingAs = () => {
		d20plus.chat.refreshLanguages();
	}

	d20plus.chat.onSpeakingTo = () => {
		const speakingTo = $("#speakingto").val();
		const ttms = speakingTo === "ttms";
		if (d20.textchat.talktomyself && !ttms) {
			d20.textchat.doChatInput(`/talktomyself off`);
			d20plus.chat.localHistory.push(false);
			setTimeout(() => d20plus.chat.checkTTMSStatus(), 10);
		} else if (!d20.textchat.talktomyself && ttms) {
			d20.textchat.doChatInput(`/talktomyself on`);
			d20plus.chat.localHistory.push(false);
			setTimeout(() => d20plus.chat.checkTTMSStatus(), 10);
		}
		if (speakingTo && !ttms) {
			$("#textchat-social-notifier").addClass("b20-to");
			$("#textchat-social-notifier-to").text(speakingTo);
		} else {
			$("#textchat-social-notifier").removeClass("b20-to");
		}
	}

	d20plus.chat.onSpeakingIn = () => {
		const speakingIn = $("#speakingin").val();
		if (speakingIn) {
			$("#textchat-social-notifier").addClass("b20-in");
			$("#textchat-social-notifier-in").text(speakingIn);
		} else {
			$("#textchat-social-notifier").removeClass("b20-in");
		}
	}

	d20plus.chat.resetSocial = () => {
		$("#speakingin").val("");
		if (!d20.textchat.talktomyself) $("#speakingto").val("");
		$("#textchat-social-notifier").removeClass("b20-in b20-to");
		d20plus.chat.closeSocial();
	}

	d20plus.chat.resetTTMS = () => {
		$("#speakingto").val("");
		d20plus.chat.closeSocial();
		d20plus.chat.onSpeakingTo();
	}

	d20plus.chat.closeSocial = () => {
		d20plus.chat.social = false;
		$("#textchat-input").removeClass("social-resized social-default");
	}

	d20plus.chat.processPlayersList = (changelist) => {
		if (!d20plus.chat.players) d20plus.chat.players = {};
		d20.Campaign.players.models.forEach(current => {
			const player = {
				on: current.attributes.online,
				name: current.attributes.displayname,
			};
			let notification = false;
			player.name = player.name.length > 17 ? `${player.name.slice(0, 15)}...` : player.name;
			if (!d20plus.chat.players[current.id]) {
				d20plus.chat.players[current.id] = { online: player.on };
				notification = "joined";
			} else {
				if (d20plus.chat.players[current.id].online && !player.on) {
					notification = "disconnected";
					d20plus.chat.players[current.id].online = false;
				} else if (!d20plus.chat.players[current.id].online && player.on) {
					notification = "connected";
					d20plus.chat.players[current.id].online = true;
				}
			}
			if (changelist && notification && d20plus.cfg.getOrDefault("chat", "showPlayerConnects")) {
				const id = d20plus.ut.generateRowId();
				d20plus.chat.modifyMsg(id, {class: "system connect", decolon: true});
				if (!player.on) d20plus.chat.modifyMsg(id, {class: "system disconnect"});
				if (player.on) d20plus.chat.modifyMsg(id, {action: {type: "request", name: player.name}});
				d20.textchat.incoming(false, { id,
					type: "general",
					who: `${player.on ? "" : "&nbsp;"}${player.name}`,
					avatar: `/users/avatar/${current.attributes.d20userid}/30`,
					content: `${notification}`,
				});
			}
		})
	}

	d20plus.chat.processIncomingMsg = (msg, msgData) => {
		if (msg.listenerid?.language && d20plus.cfg.getOrDefault("chat", "languages")) {
			const speech = msg.listenerid;
			const inKnownLanguage = window.is_gm || hasLanguageProficiency(speech.languageid);
			if (msgData.from_me || inKnownLanguage) {
				const translated = speech.message.replace(/\n/g, "<br>").replace(/ --([^ ^-])/g, " $1");
				msg.content += `<br><i class="showtip tipsy-n-right" title="You understand this because one of your characters speaks ${speech.language}">
					<strong>(${speech.language})</strong> ${translated}</i>`;
				d20plus.chat.modifyMsg(msg.id, {class: "inlang", legalize: true});
			}
		} else if (msg.listenerid?.type === "handshake") {
			if (msgData.from_me && !msg.listenerid.data) {
				msg.content = `script versions info`;
				msg.avatar = `/users/avatar/${d20plus.ut.getAccountById(msg.target)}/30`;
				d20plus.chat.modifyMsg(msg.id, {class: "system connects", decolon: true, versions: msg.listenerid.id});
			} else if (msgData.from_me && msg.listenerid.data) {
				return false;
			} else if (msgData.to_me && !msg.listenerid.data) {
				const name = d20plus.ut.getPlayerNameById(msg.playerid);
				msg.listenerid.data = d20plus.ut.generateVersionInfo();
				d20.textchat.doChatInput(`/w "${name}" &nbsp;`, undefined, msg.listenerid);
				return false;
			} else if (msgData.to_me && msg.listenerid.data) {
				$(`#connects${msg.listenerid.id}`).html(d20plus.ut.parseVersionInfo(msg.listenerid.data));
				$(`#connects${msg.listenerid.id}-state`).attr("checked", "true");
				$(`#connects${msg.listenerid.id}-info`).text("3");
				return false;
			}
		}
		if (d20.textchat.talktomyself && msgData.from_me) {
			if (d20plus.cfg.getOrDefault("chat", "highlightttms")) d20plus.chat.modifyMsg(msg.id, {class: "talktomyself"});
		}
		return true;
	}

	d20plus.chat.r20outgoing = (r20outgoing, params) => {
		if (!params[2]) {
			d20plus.chat.resetSendMyself();
		}
		const macroJS = d20plus.cfg.getOrDefault("chat", "executeJSMacro");

		if (macroJS !== "none") {
			const template = /#(?<macroid>[^ ^#]+)/g;
			params[0] = params[0].replace(template, (...match) => {
				const macroId = match.last().macroid;
				const macroObj = d20plus.ut.getMacroByName(macroId);
				if (!macroObj) return match[0];
				const macro = macroObj.attributes.action;
				const script = d20plus.engine.decodeScript(macro);
				if (!script) return match[0];
				if (macroObj.collection.player.id !== d20_player_id && macroJS !== "all") {
					d20plus.ut.sendHackerChat(`
						Enable execution for scripts shared by other players
						(select Execute All in betteR20 options for JS Script).
						You should do this only if you trust your GM
					`, true);
					return "";
				}
				return d20plus.engine.runScript(script, macroObj);
			});
		}

		return r20outgoing(...params);
	}

	d20plus.chat.r20incoming = (r20incoming, params) => {
		const msg = params[1];
		const msgData = {};
		msgData.from_me = msg.playerid === d20_player_id;
		msgData.to_me = msg.target?.includes(d20_player_id);

		// For rolls &  r20 generates duplicate messages that don't show on the log with
		// params [sound, msg, true, true]. Hence check params[2]&[3] !== true to avoid double processing
		const skipProcessing = (
			(params[2] === true && params[3] === true)
			|| (d20.textchat.chatstartingup)
		);

		if (msgData.from_me || msg.type === "system") {
			const stash = [];
			while (d20plus.chat.localHistory.length) {
				const record = d20plus.chat.localHistory.pop();
				if (record) {
					stash.push(record);
					d20.textchat.commandhistory.pop();
				}
			}
			d20.textchat.commandhistory = d20.textchat.commandhistory.concat(stash);
		}

		if (msg.type === "whisper" && !skipProcessing) {
			if (msgData.from_me) {
				d20plus.chat.lastRespondent = msg.target_name;
			} else if (msgData.to_me) {
				d20plus.chat.lastRespondent = d20plus.ut.getPlayerNameById(msg.playerid);
			}
		}

		if (skipProcessing || d20plus.chat.processIncomingMsg(msg, msgData)) {
			const result = r20incoming(...params);
			d20plus.chat.displaying();
			return result;
		}
	}

	d20plus.chat.displaying = () => {
		Object.entries({...d20plus.chat.modify}).forEach(([id, mods]) => {
			const msg = mods.sys ? $(`#textchat .message.system`).last() : $(`[data-messageid=${id}]`);

			if (mods.intro) {
				const code = "<code style='cursor:pointer'>/help</code>";
				const wiki = "https://wiki.roll20.net/Text_Chat#Chat";
				const intro = $(".userscript-commandintro ul");
				if (intro.get(0)) {
					intro.last().append(`<li>Full list of chat commands<br>type or press ${code}<br>or visit <a target='blank' href='${wiki}'>roll20 wiki</a></li>`);
					delete d20plus.chat.modify[id];
				}
			}

			if (msg.get(0)) {
				if (mods.declass) msg.removeClass(mods.declass);
				if (mods.class) msg.addClass(mods.class);
				if (mods.versions) msg.append(playerVersionsTemplate(mods.versions));
				if (mods.decolon) msg.find(".by").text((i, txt) => txt.replace(/(?:\(To |)(.+?)\)?:/, "$1"));
				if (mods.legalize) msg.html(removeClassUserscript(msg.html()));
				if (mods.action) d20plus.chat.smallActionBtnAdd(msg, mods.action);
				delete d20plus.chat.modify[id];
			}
		});
	}

	d20plus.chat.sending = () => {
		d20plus.chat.resetSendMyself();
		const $tc = d20.textchat.$textarea;

		if (d20plus.cfg.getOrDefault("chat", "emoji")) {
			$tc.val($tc.val().replace(/(:\w*?:)/g, (m0, m1) => {
				const clean = m1.replace(/:/g, "");
				return d20plus.chat.emojiIndex && d20plus.chat.emojiIndex[clean] ? `[${clean}](https://github.com/TheGiddyLimit/emoji-dump/raw/master/out/${clean}.png)` : m1;
			}));
		}

		let text = $tc.val();
		const srcText = text;

		if (d20plus.cfg.getOrDefault("chat", "commands")) {
			// add custom commands
			text = text.replace(/^\/wb (.*?)$/gm, d20plus.chat.sendReply);
			if (is_gm) text = text.replace(/^\/ws (.*?)$/gm, d20plus.chat.sendToSelected);
			text = text.replace(/^\/ttms( |$)/s, "/talktomyself$1");
			text = text.replace(/^\/help(.*?)$/s, d20plus.chat.help);
			if (!d20.textchat.talktomyself) text = text.replace(/^\/mtms ?(.*?)$/s, d20plus.chat.sendMyself);
			if (is_gm) text = text.replace(/^\/v (.*?)$/s, d20plus.chat.requestScriptVersions);
			if (d20plus.cfg.getOrDefault("chat", "languages")) text = text.replace(/\/in (.*?)$/gm, d20plus.chat.sendParsedInLanguage);
		}

		if (d20plus.cfg.getOrDefault("chat", "social")) {
			const speakingto = $("#speakingto").val();
			const speakingin = $("#speakingin").val();

			if (speakingin) {
				text = text.replace(/^[^/][^{^}]*?$/gm, msg => {
					return d20plus.chat.sendInLanguage(msg, speakingin);
				});
			}

			if (speakingto && speakingto !== "ttms") {
				text = text.replace(/^([^/]*?)$/mgu, (...str) => {
					const prepared = str[1].replace(/\/(r|roll) (?<dice>[ \dd+-]*)$/umg, "[[$<dice>]]");
					return `/w "${speakingto}" ${prepared}`;
				});
			}
		}

		// $.trim() instead of .trim() cause it's used in roll20's doChatInput()
		let toSend = $.trim(text);
		if (text !== srcText && text) d20plus.chat.localHistory.push($.trim(srcText));
		if (document.getElementById("soundslike")) toSend = "";

		if (toSend.includes("|&inlang|")) {
			toSend.split("\n").forEach((str, i) => {
				const data = str.split("|&inlang|");
				if (data.length === 2) {
					const msg = data[0];
					const meta = data[1].split("|&meta|");
					const transport = {language: meta[0], languageid: meta[1], message: meta[2]};
					d20.textchat.doChatInput(msg, undefined, transport);
				} else {
					d20.textchat.doChatInput(str);
				}
			})
			$tc.val("").focus();
		} else {
			d20.textchat.doChatInput(toSend);
			$tc.val("").focus();
		}

		if (d20plus.cfg.getOrDefault("chat", "highlightttms")) {
			if (toSend.includes("/talktomyself")) {
				setTimeout(() => d20plus.chat.checkTTMSStatus(), 20);
			}
		}
	}

	d20plus.chat.enhanceChat = () => {
		d20plus.ut.log("Enhancing chat");
		d20plus.ut.injectCode(d20.textchat, "incoming", d20plus.chat.r20incoming);
		d20plus.ut.injectCode(d20.textchat, "doChatInput", d20plus.chat.r20outgoing);

		$(document.body)
			.append(languageTemplate())
			.on("click", ".macro > .name", (evt) => {
				const {currentTarget: target} = evt;
				const openedMacroId = $(target).closest(`[data-macroid]`).data("macroid");
				d20plus.engine.enhanceMacros(openedMacroId);
			});
		is_gm || availableLanguagesPlayer();
		buildLanguageIndex();

		if (window.is_gm) {
			d20plus.chat.processPlayersList();
			const obsconfig = { childList: true, subtree: false };
			d20plus.cfg.playerWatcher = new MutationObserver(d20plus.chat.processPlayersList);
			d20plus.cfg.playerWatcher.observe(document.getElementById("avatarContainer"), obsconfig);
		}

		if (d20plus.cfg.getOrDefault("chat", "social")) {
			const $inputContainer = $("#textchat-input");
			const $chatNotifier = $("#textchat-notifier");
			const $chatTextarea = d20.textchat.$textarea;

			$inputContainer.append(d20plus.html.chatSocial);
			$inputContainer.prepend(d20plus.html.chatSocialNotifier);

			const $socialSwitch = $("#socialswitch");
			$("#chatSendBtn").after($socialSwitch);
			$("#textchat-note-container").append($chatNotifier);

			$chatTextarea.on("focus", d20plus.chat.closeSocial);
			$chatNotifier.on("click", d20plus.chat.resetTTMS);
			$("#textchat-social-notifier").on("click", d20plus.chat.resetSocial);

			$socialSwitch.on("click", d20plus.chat.onSocial);
			$("#speakingas").on("change", d20plus.chat.onSpeakingAs);
			$("#speakingto").on("change", d20plus.chat.onSpeakingTo);
			$("#speakingin").on("change", d20plus.chat.onSpeakingIn);

			d20plus.chat.getSpeakingTo();
		}

		if (d20plus.cfg.getOrDefault("chat", "commands")) {
			d20plus.chat.modifyMsg(null, {intro: true});
			d20.textchat.$textchat
				.on("click", ".userscript-commandintro ul code", d20plus.chat.help)
				.on("click", ".msg-action-button", d20plus.chat.smallActionBtnPress);
		}

		$("#textchat-input")
			.off("click", "button")
			.on("click", "button", d20plus.chat.sending);
	};
}

SCRIPT_EXTENSIONS.push(baseChat);
