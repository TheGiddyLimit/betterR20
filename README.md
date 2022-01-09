# betteR20

> > DISCLAIMER: This tool is intended to enhance your Roll20 experience by allowing you to easily utilize content that you already own.
> The use of this tool may be against the [Roll 20 Marketplace Asset End User License Agreement](https://wiki.roll20.net/Marketplace_Asset_EULA) and the [Roll 20 EULA or Terms of Service](https://wiki.roll20.net/Terms_of_Service_and_Privacy_Policy), and/or may be considered grounds for account suspension or termination. Use at your own risk.

**If you wish to use creatures with the Shaped sheet, import with your game using the OGL sheet, and then switch to the shaped sheet afterwards.** Due to the complexity of the process (read: it's a colossal hack), we are unable to support both sheets natively.

## Discord
For help, advice, and updates; or to suggest improvements and changes, please [join our Discord](https://discord.gg/nGvRCDs)!

## How to Import 5etools Data (Monsters, Spells, Items, ...)
1. Install the VTT Enhancement Suite browser extension ([Chrome](https://justas-d.github.io/roll20-enhancement-suite/chrome.html)/[Firefox](https://addons.mozilla.org/en-US/firefox/addon/roll20-enhancement-suite/)/)

   - (This adds many other features, view a sample of them [here](https://ssstormy.github.io/roll20-enhancement-suite/features.html).)

2. Install the Tampermonkey browser extension ([Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en)/[Firefox](https://addons.mozilla.org/en-GB/firefox/addon/tampermonkey/)).

3. Click [here](https://github.com/TheGiddyLimit/betterR20/blob/development/dist/betteR20-5etools.user.js?raw=true) and install the script.

4. Open the Roll20 game where you want the stuff imported.

5. Go to the gear icon and select the category you want to import from the dropdown. Use the Importer to pick things you want to import.

6. Hit import, and let it run. The journal will start fill up with the stuff you selected. It's not too laggy but can take a long time depending on the amount of stuff you selected. **Adding hundreds of character sheets will slow down your game, including loading times, significantly.** We recommend importing creatures only as you need them, but other categories can be fully imported without noticeable impact on performance.

7. Done. If you are using the Shaped sheet, be sure to open up the NPC sheets and let them convert before using it.

## Other Features
There are a variety of other features added by the script. Some highlights include:

- GM and Player Drag-n-Drop: using the "Bind Drag-n-Drop" button, glowing-green handouts can be drag-dropped to character sheets, allowing you to quickly populate spells, items, psionics, and so on. Players can access similar functionality through the button at the top of the journal.
- Quick Search: available for both GMs and players, this search bar will show you results instead of collapsed folders.
- External Art Manager: as a GM, you can use the "Manage External Art" button in the in-game Art Library to add tokens or maps by URL, saving your account storage (and making them easily transferable from game to game).
- Better Page Selector: the GM page selector is now a full-screen dropdown.
- Better Journal Folder Delete: you can rightclick a folder and "Delete Folder + Contents."
- Journal Cleaner: allows you to quickly select and remove junk which has landed in the journal root.
- Scaling Measure Tool: the measure tool now scales with zoom, making it readable.
- Hex Grid Snap: for fog reveal and polygon tools.
- ...and much more! Many options can be enabled or configured using the built-in Config Editor (accessed via the "Edit Config" button in the in-game settings panel).


## But I Don't Play 5e!
A version of the script including all the non-5e related features is available [here](https://github.com/TheGiddyLimit/betterR20/blob/development/dist/betteR20-core.user.js?raw=true). **Do not use both scripts at the same time, they are mutually incompatible.**
