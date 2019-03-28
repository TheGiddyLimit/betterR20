function jukeboxWidget () {
	d20plus.jukeboxWidget = {
		getPlaylistButtonsHtml() {
			const buttons = d20plus.jukebox.getJukeboxFileStructure()
				.map((playlist, i) => {
					const hotkey = i + 1 < 10 ? i + 1 : false;
					const title = hotkey ? "ALT+" + hotkey : "";
					let name, id;
					if (typeof playlist === "object") {
						name = hotkey ? `${i + 1}. ${playlist.n}` : playlist.n;
						id = playlist.id;
					} else {
						const trackName = d20plus.jukebox.getTrackById(playlist).attributes.title;
						name = hotkey ? `${i + 1}. ${trackName}` : trackName;
						id = playlist;
					}

					return `
						<div
							class="btn btn-small jukebox-widget-button"
							style="flex:1;text-overflow:ellipsis;overflow:hidden;min-width: 50px;"
							title="${title}"
							data-id=${id}
						>
							<span>${name}</span>
						</div>
					`;
				})
				.filter(p => !!p);
		
			return buttons.join('');
		},

		init() {
			//TODO: Make the slider a seperate component at some point
			const changeTrackVolume = (trackId, value) => {
				const track = d20plus.jukebox.getTrackById(trackId);
				if (track && value) {
					track.changeVolume(value);
				}
			};

			slider = $(`<div id="jbwMasterVolume" style="margin:10px;display:inline-block;flex:15"></div>`)
			.slider({
				slide: (e, ui) => {
					if ($("#masterVolumeEnabled").prop("checked")) {
						window.d20.jukebox.lastFolderStructure.forEach(playlist => {
							// The track is outside a playlist
							if (!playlist.i) {
								changeTrackVolume(playlist, ui.value);
							} else {
								playlist.i.forEach(trackId => changeTrackVolume(trackId, ui.value))
							}
						});
					}
					$("#masterVolume").slider("value", ui.value);
				},
				value: 50,
			});

			// Stop and skip buttons
			controls = $(`
			<div style="display:flex;">
				<div id="jbwStop" title="ALT+S" class="btn btn-inverse" style="flex: 1;"><span class="pictos">6</span></div>
				<div id="jbwSkip" title="ALT+D" class="btn btn-inverse" style="flex: 1;"><span class="pictos">7</span></div>
			</div>
			`).append(slider);


			// Jukebox widget layout
			dialog = $(`<div id="jukeboxWidget" title="Jukebox Player" style="margin-top:10px"></div>`)
			.dialog({
				autoOpen: false,
				resizable: true,
				width: 350,
			})
			.append("body")
			.css("padding-top", "0")
			.html(`<div id="jbwButtons" style="display:flex;flex-wrap:wrap">${d20plus.jukeboxWidget.getPlaylistButtonsHtml()}</div>`)
			.prepend(controls)
			.prepend(`<div id="widgeNowPlaying"></div>`);

			dialog.parent().find(".ui-dialog-title").css("margin", "0").css("padding", "0");
			$("#jbwStop").click(d20plus.jukebox.stopAll);
			$("#jbwSkip").click(d20plus.jukebox.skip);

			// Start listening to jukebox state changes
			d20plus.jukebox.addJukeboxChangeHandler(() => {
				$("#jbwButtons").html(d20plus.jukeboxWidget.getPlaylistButtonsHtml());
				$(".jukebox-widget-button")
				.removeClass("btn-info")
				.click((e) => {
					const id = e.currentTarget.dataset.id;
					if (d20plus.jukebox.getCurrentPlayingPlaylist() === id || d20plus.jukebox.getCurrentPlayingTracks().find(t => t.id === id)) {
						d20plus.jukebox.stop(e.currentTarget.dataset.id);
					} else {
						d20plus.jukebox.play(e.currentTarget.dataset.id);
					}
				});
				$(`.jukebox-widget-button[data-id=${d20plus.jukebox.getCurrentPlayingPlaylist()}]`).addClass("btn-info")
				d20plus.jukebox.getCurrentPlayingTracks().forEach(t => {
					$(`.jukebox-widget-button[data-id=${t.id}]`).addClass("btn-info");
				});
			});

			// Add widget button in the Jukebox tab
			$(`<button class="btn" style="margin-right:10px;"><span class="pictos">|</span>Widget</button>`)
			.click(() => {
				dialog.dialog("open");
			})
			.insertAfter("[href=#superjukeboxadd]");

			// Add keyboard shortcuts
			$(document).keyup((e) => {
				if (e.altKey) {
					if (e.keyCode > 48 && e.keyCode < 58) {
						const numberKey = e.keyCode - 48;
						const playElement = d20plus.jukebox.getJukeboxFileStructure()[numberKey - 1];
						if (typeof playElement === "object") {
							if (d20plus.jukebox.getCurrentPlayingPlaylist() === playElement.id) {
								d20plus.jukebox.stopPlaylist(playElement.id);
							} else {
								d20plus.jukebox.playPlaylist(playElement.id);
							}
						} else {
							if (d20plus.jukebox.getCurrentPlayingTracks().find(t => t.id === playElement)) {
								d20plus.jukebox.stopTrack(playElement);
							} else {
								d20plus.jukebox.playTrack(playElement);
							}
						}
					} else if (e.keyCode === 83) {
						d20plus.jukebox.stopAll();
					} else if (e.keyCode === 68) {
						d20plus.jukebox.skip();
					}
				}
			});
		}
	}
}

SCRIPT_EXTENSIONS.push(jukeboxWidget);
