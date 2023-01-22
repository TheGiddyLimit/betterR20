const process = require("process");
const fs = require("fs");
const path = require("path")

if (!process.argv[2]) {
	console.error(`Usage: node get-data.js <path_to_5etools_root>`);
	process.exit(1);
}

const _BLACKLIST_FILENAMES_JSON = new Set([
	"changelog.json",
]);

// region https://stackoverflow.com/a/55566081

const recursiveReadDir = (p, a = []) => {
	if (fs.statSync(p).isDirectory()) fs.readdirSync(p).map(f => recursiveReadDir(a[a.push(path.join(p, f)) - 1], a))
	return a
}
// endregion

async function main () {
	const curListing = recursiveReadDir("data");

	for (const pth of curListing) {
		if (!pth.endsWith(".json")) continue;
		if (_BLACKLIST_FILENAMES_JSON.has(path.basename(pth))) continue;
		const pathSiteDir = path.join(process.argv[2], pth);
		if (!fs.existsSync(pathSiteDir)) console.log(`File ${pth} does not exist in 5etools data!`);
		else fs.copyFileSync(pathSiteDir, pth);
	}
}

main().then(() => console.log("Done!"));
