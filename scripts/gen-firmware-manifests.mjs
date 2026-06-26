// Copyright (c) Experiential Inc. and other XRP contributors.
// Open Source Software; GNU General Public License v.3.
//
// Build-time generator for the XRPLib release manifests.
//
// A static web server cannot enumerate directories at runtime, so this script
// walks each XRPLib release directory and emits a `files.json` listing every
// file in the release together with its destination path on the robot. An
// XRPLib release is a self-contained bundle of the library plus the standard
// support files (XRPLib/, ble/, phew/, XRPExamples/). Authors just drop files
// into the right folders; they never hand-maintain the list.
//
// Projects do NOT get a generated files.json — a project is described entirely
// by its project.json (version references plus an optional inline `files`
// array for project-specific extras).
//
// Output:
//   boards/XRPLib/<version>/files.json
//       -> [["/lib/XRPLib/__init__.py", "XRPLib/__init__.py"],
//           ["/lib/ble/__init__.py",    "ble/__init__.py"],
//           ["/XRPExamples/xrp_test.py","XRPExamples/xrp_test.py"], ...]
//          [deviceDestination, sourcePathRelativeToReleaseDir]
//
// Run: `node scripts/gen-firmware-manifests.mjs` (wired into prebuild/predev).

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FW_ROOT = path.join(ROOT, 'public', 'firmware-loader');
const XRPLIB_STORE = path.join(FW_ROOT, 'boards', 'XRPLib');

// First path segment -> device destination prefix. Anything mapped here lands
// under /lib on the robot; everything else (e.g. XRPExamples) lands at the
// device root.
const LIB_DIRS = new Set(['XRPLib', 'AgXRPLib', 'ble', 'phew']);

// Names that are never copied to the device as content.
const EXCLUDE_NAMES = new Set(['files.json', 'version.py', '.DS_Store']);

function isExcludedFile(name) {
    // .uf2 = firmware blobs; .zip = LSP stub bundles (e.g. xrplib.zip) that ship
    // alongside a release but are never copied to the robot.
    return EXCLUDE_NAMES.has(name) || name.endsWith('.uf2') || name.endsWith('.zip');
}

/** Recursively list files under `dir`, returning POSIX paths relative to `base`. */
async function listFilesRel(dir, base) {
    const out = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.name === '.DS_Store') continue;
        const abs = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            out.push(...(await listFilesRel(abs, base)));
        } else if (!isExcludedFile(entry.name)) {
            out.push(path.relative(base, abs).split(path.sep).join('/'));
        }
    }
    return out.sort();
}

function deviceDestFor(sourceRel) {
    const firstSeg = sourceRel.split('/')[0];
    return LIB_DIRS.has(firstSeg) ? `/lib/${sourceRel}` : `/${sourceRel}`;
}

async function writeJson(file, data) {
    await fs.writeFile(file, JSON.stringify(data, null, 4) + '\n', 'utf8');
}

async function dirExists(p) {
    try {
        return (await fs.stat(p)).isDirectory();
    } catch {
        return false;
    }
}

/** Generate files.json for every XRPLib release directory. version.py is excluded
 *  (synthesized on-device from the registry version). */
async function generateXrplibManifests() {
    if (!(await dirExists(XRPLIB_STORE))) return [];
    const written = [];
    const entries = await fs.readdir(XRPLIB_STORE, { withFileTypes: true });
    for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const verDir = path.join(XRPLIB_STORE, entry.name);
        const sources = await listFilesRel(verDir, verDir);
        const manifest = sources.map((rel) => [deviceDestFor(rel), rel]);
        const out = path.join(verDir, 'files.json');
        await writeJson(out, manifest);
        written.push(path.relative(ROOT, out));
    }
    return written;
}

async function main() {
    const written = await generateXrplibManifests();
    console.log(`firmware-loader: generated ${written.length} XRPLib release manifest(s)`);
    for (const f of written) console.log('  ' + f);
}

main().catch((e) => {
    console.error('gen-firmware-manifests failed:', e);
    process.exit(1);
});
