#!/usr/bin/env node

import fs from "node:fs/promises";
import fs_sync from "node:fs";
import * as common from './common.js';

const platforms = {
    firefox: "firefox",
    chromium: "chromium"
}

const pkg = JSON.parse(
    await fs.readFile(common.MANIFEST, "utf8")
);

const version_string = '"version": "0.0.0.1",';
const new_version_string = `"version": "${pkg.version}",`;

async function applyManifestPatches(platform) {
    let text = await fs.readFile(common.main_manifest, "utf8");
    text = text.replaceAll(version_string, new_version_string);
    for (const {from, to} of pkg.extensionManifestConfig?.[platform]?.replaceAll ?? []) {
        text = text.replaceAll(from, to);
    }
    await fs.writeFile(common.main_manifest, text);
}

async function undoManifestPatches(platform) {
    let text = await fs.readFile(common.main_manifest, "utf8");
    text = text.replaceAll(new_version_string, version_string);
    for (const {from, to} of pkg.extensionManifestConfig?.[platform]?.replaceAll ?? []) {
        text = text.replaceAll(to, from);
    }
    await fs.writeFile(common.main_manifest, text);
}

async function makeReleaseFor(platform) {
    console.log(`\nMaking release for: ${platform}\n`);

    const output_file = common.joinWithReleasesQuoted(`${pkg.name} ${platform} v${pkg.version}.zip`);

    await common.makeZip(output_file, common.SRC_DIR);

    console.log(`\nFinished making release for: ${platform}\nAt: ${output_file}\n`);
}

await (async () => {
    if (!common.checkZipExists()) return;
    if (!fs_sync.existsSync(common.SRC_DIR)) {
        console.error('No source directory found at', common.SRC_DIR);
        return;
    }

    await common.mkdir(common.RELEASES_DIR);

    console.log("\nMaking Release\n");

    // make it firefox
    if (!common.isFirefoxManifest()) {
        common.swapManifests();
    }

    console.log(`Version: ${pkg.version}`);

    const chrome_manifest_temp = common.joinWithDir(common.chrome_manifest_name);
    const firefox_manifest_temp = common.joinWithDir(common.firefox_manifest_name);

    try {
        await fs.rename(common.chrome_manifest, chrome_manifest_temp);

        await applyManifestPatches(platforms.firefox);
        await makeReleaseFor(platforms.firefox);
        await undoManifestPatches(platforms.firefox);

        await fs.rename(common.main_manifest, firefox_manifest_temp);
        await fs.rename(chrome_manifest_temp, common.main_manifest);

        await applyManifestPatches(platforms.chromium);
        await makeReleaseFor(platforms.chromium);
        await undoManifestPatches(platforms.chromium);

        await fs.rename(common.main_manifest, common.chrome_manifest);
        await fs.rename(firefox_manifest_temp, common.main_manifest);
    } catch (e) {
        console.error('\nFailed to make release! Make sure you have 7zip installed if on windows and zip if on linux.\nError:', e, '\n');
        // this will mess up files for now but that can be fixed eventually
    }

    console.log("\nRelease Finished\n");
})();