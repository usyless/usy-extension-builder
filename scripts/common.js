#!/usr/bin/env node

import path from "node:path";

export const __dirname = process.cwd();

export const SRC_DIR = path.join(__dirname, "src");
export const RELEASES_DIR = path.join(__dirname, "releases");

export const makeQuoted = (a) => `"${a}"`;

export const joinWith = (dir) => a => path.join(dir, a);
export const joinWithSrc = joinWith(SRC_DIR);
export const joinWithReleases = joinWith(RELEASES_DIR);
export const joinWithDir = joinWith(__dirname);

export const joinWithQuoted = (jw) => a => makeQuoted(jw(a));

export const joinWithSrcQuoted = joinWithQuoted(joinWithSrc);
export const joinWithReleasesQuoted = joinWithQuoted(joinWithReleases);
export const joinWithDirQuoted = joinWithQuoted(joinWithDir);
