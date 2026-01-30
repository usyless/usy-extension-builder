#!/usr/bin/env node

import fs from "node:fs/promises";
import fs_sync from "node:fs";
import { execSync } from "node:child_process";
import * as common from './common.js';

import pkg from "../package.json" with { type: "json" }

export const chrome_manifest_name = 'manifest_chrome.json';
export const firefox_manifest_name = 'manifest_firefox.json';
export const main_manifest_name = 'manifest.json';

export const chrome_manifest = common.joinWithSrc(chrome_manifest_name);
export const firefox_manifest = common.joinWithSrc(firefox_manifest_name);
export const main_manifest = common.joinWithSrc(main_manifest_name);

export function isFirefoxManifest() {
    return fs_sync.existsSync(chrome_manifest);
}

export function isChromeManifest() {
    return fs_sync.existsSync(firefox_manifest);
}

export function swapManifests() {
    if (isFirefoxManifest()) { // make chrome
        fs_sync.renameSync(main_manifest, firefox_manifest);
        fs_sync.renameSync(chrome_manifest, main_manifest);
        console.log('Switched to Chrome manifest');
    } else if (isChromeManifest()) { // make firefox
        fs_sync.renameSync(main_manifest, chrome_manifest);
        fs_sync.renameSync(firefox_manifest, main_manifest);
        console.log('Switched to Firefox manifest');
    } else {
        console.error('No alternate manifest files found.');
    }
}

async function mkdir(dir) {
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch {
        // ignore if exists
    }
}

const platforms = {
    firefox: "firefox",
    chromium: "chromium"
}

const version_string = '"version": "0.0.0.1",';
const new_version_string = `"version": "${pkg.version}",`;

async function applyManifestPatches(platform) {
    let text = await fs.readFile(main_manifest, "utf8");
    text = text.replaceAll(version_string, new_version_string);
    for (const {from, to} of pkg.extensionManifestConfig?.[platform]?.replaceAll ?? []) {
        text = text.replaceAll(from, to);
    }
    await fs.writeFile(main_manifest, text);
}

async function undoManifestPatches(platform) {
    let text = await fs.readFile(main_manifest, "utf8");
    text = text.replaceAll(new_version_string, version_string);
    for (const {from, to} of pkg.extensionManifestConfig?.[platform]?.replaceAll ?? []) {
        text = text.replaceAll(to, from);
    }
    await fs.writeFile(main_manifest, text);
}

function run(cmd, options = {}) {
    console.log(`> ${cmd}`);
    execSync(cmd, { stdio: "inherit", ...options });
}

async function makeZip(output, directory) {
    let cmd;
    if (process.platform === "win32") { // use 7z
        cmd = `7z a ${output} .`;
    } else { // use zip
        if (fs_sync.existsSync(output)) fs_sync.unlinkSync(output);
        cmd = `zip -r ${output} .`;
    }
    if (cmd) run(cmd,{ cwd: directory });
}

async function makeReleaseFor(platform) {
    console.log(`\nMaking release for: ${platform}\n`);

    const output_file = common.joinWithReleasesQuoted(`${pkg.name} ${platform} v${pkg.version}.zip`);

    await makeZip(output_file, common.SRC_DIR);

    console.log(`\nFinished making release for: ${platform}\nAt: ${output_file}\n`);
}

await (async () => {
    await mkdir(common.RELEASES_DIR);

    console.log("\nMaking Release\n");

    // make it firefox
    if (!isFirefoxManifest()) {
        swapManifests();
    }

    console.log(`Version: ${pkg.version}`);

    const chrome_manifest_temp = common.joinWithDir(chrome_manifest_name);
    const firefox_manifest_temp = common.joinWithDir(firefox_manifest_name);

    try {
        await fs.rename(chrome_manifest, chrome_manifest_temp);

        await applyManifestPatches(platforms.firefox);
        await makeReleaseFor(platforms.firefox);
        await undoManifestPatches(platforms.firefox);

        await fs.rename(main_manifest, firefox_manifest_temp);
        await fs.rename(chrome_manifest_temp, main_manifest);

        await applyManifestPatches(platforms.chromium);
        await makeReleaseFor(platforms.chromium);
        await undoManifestPatches(platforms.chromium);

        await fs.rename(main_manifest, chrome_manifest);
        await fs.rename(firefox_manifest_temp, main_manifest);
    } catch (e) {
        console.error('\nFailed to make release! Make sure you have 7zip installed if on windows and zip if on linux.\nError:', e, '\n');
        // this will mess up files for now but that can be fixed eventually
    }

    console.log("\nRelease Finished\n");
})();