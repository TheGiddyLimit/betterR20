const process = require("process");
const fs = require("fs");
const path = require('path')

if (!process.argv[2]) {
	console.error(`Usage: node get-data.js <path_to_5etools_root>`);
	process.exit(1);
}

const _LIBS = new Set([
	"parser.js",
	"render.js",
	"render-dice.js",
	"scalecreature.js",
	"utils.js",
	"utils-ui.js",
	"utils-brew.js",
	"filter.js",
]);

async function main () {
	const siteJsRoot = path.join(process.argv[2], "js");

	fs.readdirSync(siteJsRoot).forEach(name => {
		if (!_LIBS.has(name)) return;

		const p = path.join(siteJsRoot, name);
		fs.copyFileSync(p, path.join("lib", name));
	});
}

main().then(() => console.log("Done!"));


