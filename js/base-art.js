function d20plusArt () {
	d20plus.art = {
		button: () => {
			// add external art button was clicked
			const $art = $("#d20plus-artfolder");
			$art.dialog("open");
			const $artList = $art.find(`.list`);
			$artList.empty();

			if (d20plus.art.custom) {
				d20plus.art.custom.forEach(a => {
					const $liArt = getArtLi(a.name, a.url);
					$artList.append($liArt);
				});
			}

			// init list library
			const artList = new List("art-list-container", {
				valueNames: ["name"],
				listClass: "artlist"
			});

			const $btnAdd = $(`#art-list-add-btn`);
			const $iptAddName = $(`#art-list-add-name`);
			const $iptAddUrl = $(`#art-list-add-url`);
			$btnAdd.off("click");
			$btnAdd.on("click", () => {
				const name = $iptAddName.val().trim();
				const url = $iptAddUrl.val().trim();
				if (!name || !url) {
					alert("Missing required fields!")
				} else {
					artList.search();
					artList.filter();
					const $liArt = getArtLi(name, url);
					$artList.append($liArt);
					refreshCustomArtList();
				}
			});

			const $btnMassAdd = $(`#art-list-multi-add-btn`);
			$btnMassAdd.off("click");
			$btnMassAdd.on("click", () => {
				$("#d20plus-artmassadd").dialog("open");
				const $btnMassAddSubmit = $(`#art-list-multi-add-btn-submit`);
				$btnMassAddSubmit.off("click");
				$btnMassAddSubmit.on("click", () => {
					artList.search();
					artList.filter();
					const $iptUrls = $(`#art-list-multi-add-area`);
					const massUrls = $iptUrls.val();
					const spl = massUrls.split("\n").map(s => s.trim()).filter(s => s);
					if (!spl.length) return;
					else {
						const delim = "---";
						const toAdd = [];
						for (const s of spl) {
							if (!s.includes(delim)) {
								alert(`Badly formatted line: ${s}`);
								return;
							} else {
								const parts = s.split(delim);
								if (parts.length !== 2) {
									alert(`Badly formatted line: ${s}`);
									return;
								} else {
									toAdd.push({
										name: parts[0],
										url: parts[1]
									});
								}
							}
						}
						toAdd.forEach(a => {
							$artList.append(getArtLi(a.name, a.url));
						});
						refreshCustomArtList();
						$("#d20plus-artmassadd").dialog("close");
					}
				});
			});

			const $btnDelAll = $(`#art-list-delete-all-btn`);
			$btnDelAll.off("click").on("click", () => {
				$artList.empty();
				refreshCustomArtList();
			});

			makeDraggables();
			d20plus.art.refreshList = refreshCustomArtList;

			function getArtLi (name, url) {
				const showImage = d20plus.cfg.get("interface", "showCustomArtPreview");
				const $liArt = $(`
						<li class="dd-item library-item draggableresult Vetools-draggable-art ui-draggable" data-fullsizeurl="${url}">
							${showImage ? `<img src="${url}" style="width: 30px; max-height: 30px; display: inline-block" draggable="false">` : ""}
							<div class="dd-content name" style="display: inline-block; width: 35%;" data-url="${url}">${name}</div>
							<a href="${url}"><span class="url" style="display: inline-block; width: ${showImage ? "40%" : "55%"};">${url}</span></a>
						</li>
					`);
				if (!showImage) {
					$liArt.on("mousedown", () => {
						const $loader = $(`<div class="temp-warning">Loading image - don't drop yet!</div>`);
						const $img = $(`<img src="${url}" style="width: 30px; max-height: 30px; display: none">`);
						if (!$img.prop("complete")) {
							$(`body`).append($loader);
							$img.on("load", () => {
								$loader.remove();
							});
							$loader.append($img);
						}
					});
				}

				const $btnDel = $(`<span class="delete btn btn-danger"><span class="pictos">#</span></span>`).on("click", () => {
					$liArt.remove();
					deleteCustomArt(name);
				});
				$liArt.append($btnDel);
				return $liArt;
			}

			function deleteCustomArt (name) {			
				artList.remove('name', name)
				d20plus.art.custom.splice(d20plus.art.custom.findIndex(i => i.name === name), 1);
				makeDraggables();
				d20plus.art.saveToHandout();
			}

			function refreshCustomArtList () {
				artList.reIndex();
				const custom = [];
				artList.items.forEach(i => {
					const $ele = $(i.elm);
					custom.push({
						name: $ele.find(`.name`).text(),
						url: $ele.find(`.url`).text()
					});
				});
				d20plus.art.custom = custom;
				makeDraggables();
				d20plus.art.saveToHandout();
			}

			function makeDraggables () {
				$(`.Vetools-draggable-art`).draggable({
					handle: ".dd-content",
					revert: true,
					revertDuration: 0,
					helper: "clone",
					appendTo: "body"
				})
			}
		},

		saveToHandout () {
			const handout = d20plus.art.getArtHandout();
			if (!handout) {
				d20.Campaign.handouts.create({
					name: ART_HANDOUT,
					archived: true
				}, {
					success: function (handout) {
						notecontents = "This handout is used to store custom art URLs.";

						const gmnotes = JSON.stringify(d20plus.art.custom);
						handout.updateBlobs({notes: notecontents, gmnotes: gmnotes});
						handout.save({notes: (new Date).getTime(), inplayerjournals: ""});
					}
				});
			} else {
				const gmnotes = JSON.stringify(d20plus.art.custom);
				handout.updateBlobs({gmnotes: gmnotes});
				handout.save({notes: (new Date).getTime()});
			}
		},

		/**
		 * @param items Array of Objects with "name" and "url" properties.
		 * @private
		 */
		addToHandout (items) {
			const invalid = items.find(it => !it.name || !it.url);
			if (invalid) throw new Error(`Invalid item ${JSON.stringify(invalid)} did not contain required name and URL properties!`);
			d20plus.art.custom = (d20plus.art.custom || []).concat(items);
			d20plus.art.saveToHandout();
		},

		// TODO load a decent default art library from somewhere
		default: [
			// {
			// 	name: "Phoenix",
			// 	url: "http://www.discgolfbirmingham.com/wordpress/wp-content/uploads/2014/04/phoenix-rising.jpg"
			// }
		]
	};

	d20plus.art.getArtHandout = () => {
		return d20.Campaign.handouts.models.find((handout) => {
			return handout.attributes.name === ART_HANDOUT;
		});
	};

	d20plus.art.pLoadArt = async () => {
		d20plus.ut.log("Loading custom art");
		const handout = d20plus.art.getArtHandout();
		if (handout) {
			handout.view.render();
			return new Promise(resolve => {
				handout._getLatestBlob("gmnotes", function (gmnotes) {
					const decoded = decodeURIComponent(gmnotes);
					try {
						d20plus.art.custom = JSON.parse(decoded);
						resolve();
					} catch (e) {
						console.error(e);
						resolve();
					}
				});
			});
		}
	};

	d20plus.art.addCustomArtSearch = () => {
		d20plus.ut.log("Add custom art search");
		const $afterTo = $(`#libraryresults`);
		$afterTo.after(d20plus.artListHTML);

		const $olNone = $(`#image-search-none`);
		const $olHasResults = $(`#image-search-has-results`);

		const $olArt = $(`#custom-art-results`);
		const $srchImages = $(`#imagedialog .searchbox input.keywords`);
		$srchImages.on("keyup", () => {
			$olArt.empty();
			const searched = $srchImages.val().trim().toLowerCase();
			if (searched.length < 2) {
				$olNone.show();
				$olHasResults.hide();
				return;
			}

			let toShow = d20plus.art.default.filter(a => a.name.toLowerCase().includes(searched));
			if (d20plus.art.custom) toShow = toShow.concat(d20plus.art.custom.filter(a => a.name.toLowerCase().includes(searched)));

			if (!toShow.length) {
				$olNone.show();
				$olHasResults.hide();
			} else {
				$olNone.hide();
				$olHasResults.show();

				toShow.forEach(a => {
					$olArt.append(`
						<li class="dd-item library-item draggableresult Vetoolsresult ui-draggable" data-fullsizeurl="${a.url}">
							<div class="dd-content">
								<div class="token"><img src="${a.url}" draggable="false"></div>
								<div class="name">
									<div class="namecontainer"><a href="${a.url}" rel="external">${a.name}</a></div>
								</div>
							</div>
						</li>
					`);
				});
			}

			$("#imagedialog #Vetoolsresults .draggableresult").draggable({
				handle: ".dd-content",
				revert: true,
				revertDuration: 0,
				helper: "clone",
				appendTo: "body"
			}).addTouch();
		});
	};

	d20plus.art.initArtFromUrlButtons = () => {
		d20plus.ut.log("Add direct URL art buttons");
		// requires templates to be swapped, which happens ASAP during Init

		$(`.character-image-by-url`).live("click", function () {
			const cId = $(this).closest(`[data-characterid]`).attr(`data-characterid`);
			const url = window.prompt("Enter a URL", d20plus.art.getLastImageUrl());
			if (url) {
				d20plus.art.setLastImageUrl(url);
				d20.Campaign.characters.get(cId).set("avatar", url);
			}
		});

		$(`.handout-image-by-url`).live("click", function () {
			const hId = $(this).closest(`[data-handoutid]`).attr(`data-handoutid`);
			const url = window.prompt("Enter a URL", d20plus.art.getLastImageUrl());
			if (url) {
				d20plus.art.setLastImageUrl(url);
				d20.Campaign.handouts.get(hId).set("avatar", url);
			}
		});

		$(`.token-image-by-url`).live("click", function () {
			const cId = $(this).closest(`[data-characterid]`).attr(`data-characterid`);
			const url = window.prompt("Enter a URL", d20plus.art.getLastImageUrl());
			if (url) {
				d20plus.art.setLastImageUrl(url);
				const char = d20.Campaign.characters.get(cId);
				char._getLatestBlob("defaulttoken", (blob) => {
					blob = blob && blob.trim() ? JSON.parse(blob) : {};
					blob.imgsrc = url;
					char.updateBlobs({defaulttoken: JSON.stringify(blob)});
				});
			}
		});

		$(`.deck-image-by-url`).live("click", function () {
			const dId = $(this).attr("data-deck-id");
			const url = window.prompt("Enter a URL", d20plus.art.getLastImageUrl());
			if (url) {
				d20plus.art.setLastImageUrl(url);
				d20.Campaign.decks.get(dId).set("avatar", url)
			}
		});

		$(`.card-image-by-url`).live("click", function () {
			const cId = $(this).attr("data-card-id");
			const url = window.prompt("Enter a URL", d20plus.art.getLastImageUrl());
			if (url) {
				d20plus.art.setLastImageUrl(url);
				const card = d20.Campaign.decks.find(it => it.cards.find(c => c.id === cId)).cards.find(c => c.id === cId);
				card.set("avatar", url);
			}
		});

		$(`.deck-mass-cards-by-url`).live("click", function () {
			const dId = $(this).attr("data-deck-id");

			const deck = d20.Campaign.decks.get(dId);

			const cleanTemplate = d20plus.addArtMassAdderHTML.replace(/id="[^"]+"/gi, "");
			const $dialog = $(cleanTemplate).appendTo($("body"));
			const $iptTxt = $dialog.find(`textarea`);
			const $btnAdd = $dialog.find(`button`).click(() => {
				const lines = ($iptTxt.val() || "").split("\n");
				const toSaveAll = [];
				lines.filter(it => it && it.trim()).forEach(l => {
					const split = l.split("---").map(it => it.trim()).filter(Boolean);
					if (split.length >= 2) {
						const [name, url] = split;
						const toSave = deck.cards.push({
							avatar: url,
							id: d20plus.ut.generateRowId(),
							name,
							placement: 99
						});
						toSaveAll.push(toSave);
					}
				});
				$dialog.dialog("close");

				toSaveAll.forEach(s => s.save());
				deck.save();
			});

			$dialog.dialog({
				width: 800,
				height: 650
			});
		});
	};

	d20plus.art._lastImageUrl = "https://example.com/pic.png";
	d20plus.art.getLastImageUrl = () => {
		return d20plus.art._lastImageUrl;
	};
	d20plus.art.setLastImageUrl = (url) => {
		d20plus.art._lastImageUrl = url || d20plus.art._lastImageUrl;
	};
}

SCRIPT_EXTENSIONS.push(d20plusArt);
