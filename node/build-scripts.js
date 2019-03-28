const fs = require("fs");

const SCRIPT_VERSION = "1.14.20";

const matchString = `
// @match        https://app.roll20.net/editor
// @match        https://app.roll20.net/editor#*
// @match        https://app.roll20.net/editor?*
// @match        https://app.roll20.net/editor/
// @match        https://app.roll20.net/editor/#*
// @match        https://app.roll20.net/editor/?*
`;

const HEADER_CORE = `// ==UserScript==
// @name         betteR20-core
// @namespace    https://5e.tools/
// @license      MIT (https://opensource.org/licenses/MIT)
// @version      ${SCRIPT_VERSION}
// @updateURL    https://get.5e.tools/script/betteR20-core.user.js
// @downloadURL  https://get.5e.tools/script/betteR20-core.user.js
// @description  Enhance your Roll20 experience
// @author       TheGiddyLimit
${matchString}
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==
`;

const HEADER_5ETOOLS = `// ==UserScript==
// @name         betteR20-5etools
// @namespace    https://5e.tools/
// @license      MIT (https://opensource.org/licenses/MIT)
// @version      ${SCRIPT_VERSION}
// @updateURL    https://get.5e.tools/script/betteR20-5etools.user.js
// @downloadURL  https://get.5e.tools/script/betteR20-5etools.user.js
// @description  Enhance your Roll20 experience
// @author       5egmegaanon/astranauta/MrLabRat/TheGiddyLimit/DBAWiseMan/BDeveau/Remuz/Callador Julaan/Erogroth/Stormy/FlayedOne
${matchString}
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==
`;

const JS_DIR = "./js/";
const BUILD_DIR = "./dist";

function joinParts (...parts) {
	return parts.join("\n\n");
}

if (!fs.existsSync(BUILD_DIR)){
	fs.mkdirSync(BUILD_DIR);
}

const SCRIPTS = {
	core: {
		header: HEADER_CORE,
		scripts: [
			"header",
			"base-jsload",
			"base-qpi",
			"base-util",
			"base-jukebox",
			"base-math",
			"base-config",
			"base-tool",
			"base-tool-module",
			"base-tool-unlock",
			"base-art",
			"base-art-browse",
			"base-engine",
			"base-weather",
			"base-journal",
			"base-css",
			"base-ui",
			"base-mod",
			"base-template",
			"base-emoji",

			"core-bootstrap",

			"base"
		]
	},
	"5etools": {
		header: HEADER_5ETOOLS,
		scripts: [
			"header",
			"base-jsload",
			"base-qpi",
			"base-util",
			"base-jukebox",
			"base-math",
			"base-config",
			"base-tool",
			"base-tool-module",
			"base-tool-unlock",
			"base-art",
			"base-art-browse",
			"base-engine",
			"base-weather",
			"base-journal",
			"base-css",
			"base-ui",
			"base-mod",
			"base-template",
			"base-emoji",
			"base-remote-libre",
			"base-jukebox-widget",

			"5etools-bootstrap",
			"5etools-main",
			"5etools-importer",
			"5etools-monsters",
			"5etools-spells",
			"5etools-backgrounds",
			"5etools-classes",
			"5etools-items",
			"5etools-feats",

			"base"
		]
	}
};

Object.entries(SCRIPTS).forEach(([k, v]) => {
	const filename = `${BUILD_DIR}/betteR20-${k}.user.js`;
	const fullScript = joinParts(v.header, ...v.scripts.map(filename => fs.readFileSync(`${JS_DIR}${filename}.js`).toString()));
	fs.writeFileSync(filename, fullScript);
});

console.log(`v${SCRIPT_VERSION}: Build completed at ${(new Date()).toJSON().slice(11, 19)}`);
