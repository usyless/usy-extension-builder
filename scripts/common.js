#!/usr/bin/env node

import path from "node:path";
import fs_sync from "node:fs";
import fs from "node:fs/promises";
import { execSync } from "node:child_process";

export const __dirname = process.cwd();

export const SRC_DIR = path.join(__dirname, "src");
export const RELEASES_DIR = path.join(__dirname, "releases");

export const MANIFEST = path.join(__dirname, 'package.json');

export const makeQuoted = (a) => `"${a}"`;

export const joinWith = (dir) => a => path.join(dir, a);
export const joinWithSrc = joinWith(SRC_DIR);
export const joinWithReleases = joinWith(RELEASES_DIR);
export const joinWithDir = joinWith(__dirname);

export const joinWithQuoted = (jw) => a => makeQuoted(jw(a));

export const joinWithSrcQuoted = joinWithQuoted(joinWithSrc);
export const joinWithReleasesQuoted = joinWithQuoted(joinWithReleases);
export const joinWithDirQuoted = joinWithQuoted(joinWithDir);

export const chrome_manifest_name = 'manifest_chrome.json';
export const firefox_manifest_name = 'manifest_firefox.json';
export const main_manifest_name = 'manifest.json';

export const chrome_manifest = joinWithSrc(chrome_manifest_name);
export const firefox_manifest = joinWithSrc(firefox_manifest_name);
export const main_manifest = joinWithSrc(main_manifest_name);

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

export async function mkdir(dir) {
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch {
        // ignore if exists
    }
}

export function run(cmd, options = {}) {
    console.log(`> ${cmd}`);
    return execSync(cmd, { stdio: "inherit", ...options });
}

export async function makeZip(output, directory) {
    let cmd;
    if (process.platform === "win32") { // use 7z
        cmd = `7z a ${output} .`;
    } else { // use zip
        if (fs_sync.existsSync(output)) fs_sync.unlinkSync(output);
        cmd = `zip -r ${output} .`;
    }
    run(cmd,{ cwd: directory });
}

export function checkZipExists() {
    let cmd;
    if (process.platform === "win32") { // use 7z
        cmd = '7z --version';
    } else { // use zip
        cmd = 'zip --version';
    }
    try {
        const output = run(cmd).toString();
        console.log(`\nUsing zip utility: ${output}\n`);
        return true;
    } catch {
        console.error("\nNo zip utility found! Install 7zip if on windows or zip if on linux\n");
        return false;
    }
}