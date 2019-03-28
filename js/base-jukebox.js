// Borrowed with <3 from Stormy's JukeboxIO
function baseJukebox () {
	d20plus.jukebox = {
		playPlaylist(playlistId) {
			$(document)
			.find(`#jukeboxfolderroot .dd-folder[data-globalfolderid="${playlistId}"]`)
			.find("> .dd-content .play[data-isplaying=false]")
			.trigger("click")
		},

		playTrack(trackId) {
			$(document)
			.find(`#jukeboxfolderroot .dd-item[data-itemid="${trackId}"]`)
			.find("> .dd-content .play[data-isplaying=false]")
			.trigger("click")
		},

		stopPlaylist(playlistId) {
			$(document)
			.find(`#jukeboxfolderroot .dd-folder[data-globalfolderid="${playlistId}"]`)
			.find("> .dd-content .play[data-isplaying=true]")
			.trigger("click")
		},

		stopTrack(trackId) {
			$(document)
			.find(`#jukeboxfolderroot .dd-item[data-itemid="${trackId}"]`)
			.find("> .dd-content .play[data-isplaying=true]")
			.trigger("click")
		},

		play(id) {
			d20plus.jukebox.playPlaylist(id);
			d20plus.jukebox.playTrack(id);
		},

		stop(id) {
			d20plus.jukebox.stopPlaylist(id);
			d20plus.jukebox.stopTrack(id);
		},

		stopAll() {
			d20.jukebox.stopAllTracks();
		},

		skip() {
			const playlistId = d20plus.jukebox.getCurrentPlayingPlaylist();
			d20.jukebox.stopAllTracks();
			d20plus.jukebox.playPlaylist(playlistId);
		},

		getCurrentPlayingTracks() {
			let playlingTracks = [];
			window.Jukebox.playlist.each((track) => {
				if (track.get("playing")) {
					playlingTracks.push(track.attributes);
				}
			});
			return playlingTracks;
		},

		getCurrentPlayingPlaylist() {
			const id = d20.Campaign.attributes.jukeboxplaylistplaying;
			return id ? id.split("|")[0] : id;
		},

		addJukeboxChangeHandler(func) {
			d20plus.jukebox.addPlaylistChangeHandler(func);
			d20plus.jukebox.addTrackChangeHandler(func);
		},

		addPlaylistChangeHandler(func) {
			d20.Campaign.on("change:jukeboxplaylistplaying change:jukeboxfolder", func);
		},

		addTrackChangeHandler(func) {
			window.Jukebox.playlist.each((track) => {
				track.on("change:playing", func);
			});
		},

		getJukeboxFileStructure () {
			d20plus.jukebox.forceJukeboxRefresh();
			return window.d20.jukebox.lastFolderStructure;
		},

		getTrackById (id) {
			return window.Jukebox.playlist.get(id);
		},

		getJukeboxPlaylists () {
			const fs = d20plus.jukebox.getJukeboxFileStructure();
			const retVals = [];

			for (const fsItem of fs) {
				if (typeof(fsItem) === "string") continue;

				const rawPlaylist = fsItem;

				const playlist = {
					name: rawPlaylist.n,
					mode: rawPlaylist.s,
					tracks: [],
				};

				for (const trackId of rawPlaylist.i) {
					const track = d20plus.jukebox.getTrackById(trackId);
					if (!track) {
						console.warn(`Tried to get track id ${trackId} but the query returned a falsy value. Skipping`);
						continue;
					}

					playlist.tracks.push(track);
				}

				retVals.push(playlist);
			}

			return retVals;
		},

		getJukeboxTracks () {
			const fs = d20plus.jukebox.getJukeboxFileStructure();

			const retVals = [];

			for (const fsItem of fs) {
				if (typeof(fsItem) !== "string") continue;

				const track = d20plus.jukebox.getTrackById(fsItem);
				if (!track) {
					console.warn(`Tried to get track id ${fsItem} but the query returned a falsy value. Skipping`);
					continue;
				}

				retVals.push(track);
			}

			return retVals;
		},

		_getExportableTrack (s) {
			return {
				loop: s.attributes.loop,
				playing: s.attributes.playing,
				softstop: s.attributes.softstop,
				source: s.attributes.source,
				tags: s.attributes.tags,
				title: s.attributes.title,
				track_id: s.attributes.track_id,
				volume: s.attributes.volume,
			};
		},

		getExportablePlaylists () {
			return d20plus.jukebox.getJukeboxPlaylists().map(p => {
				return {
					name: p.name,
					mode: p.mode,
					tracks: p.tracks.map(d20plus.jukebox._getExportableTrack),
				};
			});
		},

		getExportableTracks () {
			return d20plus.jukebox.getJukeboxTracks().map(d20plus.jukebox._getExportableTrack)
		},

		importWrappedData (data) {
			d20plus.jukebox.forceJukeboxRefresh();

			const tracks = (data.tracks || []).map(t => d20plus.jukebox.createTrack(t).id);

			const playlists = (data.playlists || []).map(p => {
				const trackIds = p.tracks.map(s => d20plus.jukebox.createTrack(s).id);
				return d20plus.jukebox.makePlaylistStructure(p.name, p.mode, trackIds);
			});

			let fs = JSON.parse(d20.Campaign.attributes.jukeboxfolder);
			fs = fs.concat(tracks, playlists);

			d20.Campaign.save({
				jukeboxfolder: JSON.stringify(fs)
			});
		},

		createTrack (data) {
			return window.Jukebox.playlist.create(data);
		},

		makePlaylistStructure (name, mode, trackIds) {
			return {
				id: window.generateUUID(),
				n: name,
				s: mode,
				i: trackIds || []
			};
		},

		forceJukeboxRefresh () {
			const $jukebox = $("#jukebox");
			const serializable = $jukebox.find("#jukeboxfolderroot").nestable("serialize");
			serializable && d20.Campaign.save({
				jukeboxfolder: JSON.stringify(serializable)
			})
		}
	};
}


SCRIPT_EXTENSIONS.push(baseJukebox);
