function remoteLibre () {
	d20plus.remoteLibre = {
		getRemotePlaylists () {
			return fetch("https://api.github.com/repos/DMsGuild201/Roll20_resources/contents/playlist")
				.then(response => response.json())
				.then(data => {
					// check if blocked
					if (data.block)	return Promise.reject(`Blocked: ${data.block.reason ?? "Unknown reason"}`);
					const promises = data.filter(file => file.download_url.toLowerCase().endsWith(".json"))
						.map(file => d20plus.remoteLibre.downloadPlaylist(file.download_url));
					return Promise.all(promises).then(res => d20plus.remoteLibre.processRemotePlaylists(res));
				})
				// eslint-disable-next-line no-console
				.catch(error => console.error(error));
		},

		downloadPlaylist (url) {
			return fetch(url)
				.then(response => response.json())
				// eslint-disable-next-line no-console
				.catch(error => console.error("Error when fetching", url, error));
		},

		processRemotePlaylists (imports) {
			return $.map(imports.filter(p => !!p), entry => {
				return $.map(entry.playlists, playlist => playlist.songs);
			}).filter(track => track.source === "My Audio");
		},

		drawRemoteLibreResults (tracks) {
			return tracks.map((t, i) => `
                <p style="margin-top:15px">${t.title}</p>
                <div class="br20-result" style="display: flex">
                    <audio class="audio" controls preload="none" style="flex: 35" src="${t.track_id}"></audio>

                    <button class="remote-track btn" data-id=${i} style="margin-top:auto;margin-bottom:auto;flex:1;font-size:15px;margin-left:10px;">
                        <span class="pictos">&amp;</span>
                    </button>
                </div>
            `);
		},

		drawJukeBoxTab (tracks) {
			const trackHtml = d20plus.remoteLibre.drawRemoteLibreResults(tracks);
			return `
            <div class="betteR20 tab-pane" style="display: none;">
                <div class="row-fluid">
                    <div class="span12">
                        <h3 style="margin-top: 6px; margin-bottom: 10px; text-align:initial;">Search for:</h3>
                        <input id="remoteLibreSearch" type="text" placeholder="Begin typing to choose tracks by title..." style="width: 100%;">
                        <div id="remoteLibreResults">
                            ${trackHtml.join("")}
                        </div>
                    </div>
                </div>
            </div>`;
		},

		wireTrackButtons () {
			$(".remote-track.btn").click((e) => {
				const id = $(e.currentTarget).data().id;
				d20plus.jukebox.createTrack(d20plus.remoteLibre.filteredResults[id]);
			});
		},

		init () {
			d20plus.remoteLibre.jukeboxInjected = false;
			d20plus.remoteLibre.remoteLibreTracks = {};
			d20plus.remoteLibre.filteredResults = {};

			d20plus.remoteLibre.getRemotePlaylists().then((tracks) => {
				d20plus.remoteLibre.remoteLibreTracks = tracks;
				d20plus.remoteLibre.filteredResults = tracks;
			});

			$("#addjukebox").click(() => {
				if (!d20plus.remoteLibre.jukeboxInjected) {
					setTimeout(() => {
						const html = d20plus.remoteLibre.drawJukeBoxTab(d20plus.remoteLibre.filteredResults);
						$(".nav.nav-tabs").append(`<li><a data-tab="betteR20" href="javascript:void(0);">BetteR20</a></li>`);
						$(".tab-content").append(html);
						d20plus.remoteLibre.wireTrackButtons();
						$("#remoteLibreSearch").bind("paste keyup", function () {
							if ($(this).val()) {
								d20plus.remoteLibre.filteredResults = d20plus.remoteLibre.remoteLibreTracks.filter(t => t.title.toLowerCase().indexOf($(this).val()) >= 0);
							} else {
								d20plus.remoteLibre.filteredResults = d20plus.remoteLibre.remoteLibreTracks;
							}
							const results = d20plus.remoteLibre.drawRemoteLibreResults(d20plus.remoteLibre.filteredResults);
							$("#remoteLibreResults").html(results);
							d20plus.remoteLibre.wireTrackButtons();
						});
						// this needs to be moved
						d20plus.remoteLibre.jukeboxInjected = true;
					}, 100);
				}
			});
		},

	};
}

SCRIPT_EXTENSIONS.push(remoteLibre);
