const fs = require("fs");

const SCRIPT_VERSION = "1.25.0";

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
// @author       5egmegaanon/astranauta/MrLabRat/TheGiddyLimit/DBAWiseMan/BDeveau/Remuz/Callador Julaan/Erogroth/Stormy/FlayedOne/Cucucc/Cee/oldewyrm/darthbeep/Mertang
${matchString}
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==
`;

const JS_DIR = "./js/";
const LIB_DIR = "./lib/";
const BUILD_DIR = "./dist";

function joinParts (...parts) {
	return parts.join("\n\n");
}

function getDataDirPaths () {
	const walkSync = (dir, filelist = []) => {
		fs.readdirSync(dir).forEach(file => {

			filelist = fs.statSync(dir + "/" + file).isDirectory()
				? walkSync(dir + "/" + file, filelist)
				: filelist.concat(dir +"/" + file);
		});
		return filelist;
	}
	return walkSync("data").filter(it => it.toLowerCase().endsWith("json"));
}

function wrapLibData (filePath, data) {
	data = JSON.stringify(JSON.parse(data));
	return `
JSON_DATA[\`${filePath}\`] = JSON.parse(${JSON.stringify(data)});
`
}

let ixLibApiScript = 0;
function wrapLibScript (script, isApiScript) {
	const name = `lib_script_${ixLibApiScript++}`;
	return `
${isApiScript ? "EXT_LIB_API_SCRIPTS" : "EXT_LIB_SCRIPTS"}.push((function ${name} () {
${script}
}).toString());
`;
}

if (!fs.existsSync(BUILD_DIR)){
	fs.mkdirSync(BUILD_DIR);
}

const LIB_SCRIPTS = {
	core: [
		"list.min.js",
		"jszip.min.js",
		"localforage.min.js",

		"parser.js",
		"utils.js",
		"utils-ui.js",
		"hist-port.js",
	],
	"5etools": [
		"list.min.js",
		"jszip.min.js",
		"localforage.min.js",

		"parser.js",
		"utils.js",
		"utils-ui.js",
		"hist-port.js",
		"render.js",
		"render-dice.js",
		"scalecreature.js"
	]
};

const LIB_SCRIPTS_API = {
	core: [
		"VecMath.js",
		"matrixMath.js",
		"PathMath.js",
	],
	"5etools": [
		"VecMath.js",
		"matrixMath.js",
		"PathMath.js",
	]
};

const LIB_JSON = {
	core: [],
	"5etools": getDataDirPaths()
};

const SCRIPTS = {
	core: {
		header: HEADER_CORE,
		scripts: [
			"base-util",
			"base-jsload",
			"base-qpi",
			"base-jukebox",
			"base-math",
			"base-config",
			"base-tool",
			"base-tool-module",
			"base-tool-unlock",
			"base-tool-animator",
			"base-art",
			"base-art-browse",
			"overwrites/base",
			"overwrites/canvas-handler",
			"base-engine",
			"base-weather",
			"base-journal",
			"base-css",
			"base-ui",
			"base-mod",
			"templates/base",
			"templates/template-token-editor",
			"templates/template-page-settings",
			"base-template",
			"base-emoji",
			"base-remote-libre",
			"base-jukebox-widget",

			"core-bootstrap",

			"base"
		]
	},
	"5etools": {
		header: HEADER_5ETOOLS,
		scripts: [
			"base-util",
			"base-jsload",
			"base-qpi",
			"base-jukebox",
			"base-math",
			"base-config",
			"base-tool",
			"base-tool-module",
			"base-tool-unlock",
			"base-tool-animator",
			"base-art",
			"base-art-browse",
			"overwrites/base",
			"overwrites/canvas-handler",
			"base-engine",
			"base-weather",
			"base-journal",
			"base-css",
			"base-ui",
			"base-mod",
			"templates/base",
			"templates/template-token-editor",
			"templates/template-page-settings",
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
			"5etools-objects",

			"base"
		]
	}
};

Object.entries(SCRIPTS).forEach(([k, v]) => {
	const libScripts = LIB_SCRIPTS[k];
	const libScriptsApi = LIB_SCRIPTS_API[k];
	const libJson = LIB_JSON[k];

	const filename = `${BUILD_DIR}/betteR20-${k}.user.js`;
	const fullScript = joinParts(
		v.header,
		fs.readFileSync(`${JS_DIR}header.js`, "utf-8").toString(),
		...libJson.map(filePath => wrapLibData(filePath, fs.readFileSync(filePath, "utf-8"))),
		...v.scripts.map(filename => fs.readFileSync(`${JS_DIR}${filename}.js`, "utf-8").toString()),
		...libScripts.map(filename => wrapLibScript(fs.readFileSync(`${LIB_DIR}${filename}`, "utf-8").toString())),
		...libScriptsApi.map(filename => wrapLibScript(fs.readFileSync(`${LIB_DIR}${filename}`, "utf-8").toString(), true))
	);
	fs.writeFileSync(filename, fullScript);
});

console.log(`v${SCRIPT_VERSION}: Build completed at ${(new Date()).toJSON().slice(11, 19)}`);
