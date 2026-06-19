// Copyright (c) Experiential Inc. and other XRP contributors.
// Open Source Software; GNU General Public License v.3.
//
// Firmware-loader resolution helpers.
//
// Projects declare *what* they install by friendly version ids and an optional
// local UF2; the actual files live under directory conventions and are listed
// in build-generated `files.json` manifests. This module turns a project.json
// document into a concrete, fully-resolved set of install instructions:
//   - the UF2 fetch URL
//   - the [deviceDestination, sourceUrl] entries to copy to the robot
//   - the XRPLib version label (used to stamp /lib/XRPLib/version.py)
//
// See public/firmware-loader/spec.md for the on-disk format.

export const FIRMWARE_LOADER_BASE = '/firmware-loader/';

/** One entry in a version registry (boards/XRPLib/index.json, micropython/index.json). */
export type FirmwareVersionEntry = {
    id: string;
    name: string;
    dir: string;
    version: string;
    /** UF2 filename inside the version directory (MicroPython registries only). */
    uf2?: string;
};

/** Parsed project.json. A project references shared versions by friendly id. */
export type FirmwareProjectDoc = {
    title: string;
    description?: string;
    /** Friendly id into the board's micropython-firmware/index.json (shared MicroPython firmware). */
    micropython?: string;
    /** Local UF2 path relative to the project dir (a project-specific firmware). */
    uf2?: string;
    /** Friendly id into the shared boards/XRPLib/index.json. */
    xrplib?: string;
    /** Optional project-specific extra files: [deviceDestinationPath, sourcePathRelativeToProjectDir]. */
    files?: [string, string][];
};

/** Fully-resolved install instructions consumed by the install wizard. */
export type ResolvedInstall = {
    boardId: string;
    /** Fully-resolved, site-relative URL of the UF2 to flash. */
    uf2Url: string;
    /** [deviceDestinationPath, fullyResolvedSourceUrl] entries to copy after flashing. */
    libraryEntries: [string, string][];
    /** XRPLib version label written to /lib/XRPLib/version.py (undefined when no library copy). */
    xrplibVersion?: string;
};

/** Build a site-relative URL for a file under a firmware-loader subdirectory. */
function fileUrl(relDir: string, relPath: string): string {
    const cleanRel = relPath.startsWith('/') ? relPath.slice(1) : relPath;
    const encoded = cleanRel.split('/').map(encodeURIComponent).join('/');
    return `${FIRMWARE_LOADER_BASE}${relDir}${encoded}`;
}

async function fetchJson(url: string): Promise<unknown> {
    const r = await fetch(url);
    if (!r.ok) {
        throw new Error(`${url}: ${r.status} ${r.statusText}`);
    }
    return r.json();
}

/** Parse and lightly validate a project.json document. */
export function parseProjectDoc(raw: unknown): FirmwareProjectDoc {
    if (raw === null || typeof raw !== 'object') {
        throw new Error('Invalid project manifest');
    }
    const o = raw as Record<string, unknown>;
    if (typeof o.title !== 'string' || !o.title) {
        throw new Error('Invalid project manifest: missing title');
    }
    return {
        title: o.title,
        description: typeof o.description === 'string' ? o.description : undefined,
        micropython: typeof o.micropython === 'string' ? o.micropython : undefined,
        uf2: typeof o.uf2 === 'string' && o.uf2 ? o.uf2 : undefined,
        xrplib: typeof o.xrplib === 'string' ? o.xrplib : undefined,
        files: parseFileEntries(o.files),
    };
}

/** Validate an optional inline [deviceDest, sourceRel][] file list from project.json. */
function parseFileEntries(raw: unknown): [string, string][] | undefined {
    if (raw === undefined) return undefined;
    if (!Array.isArray(raw)) {
        throw new Error('Invalid project manifest: "files" must be an array');
    }
    const out: [string, string][] = [];
    for (const e of raw) {
        if (!Array.isArray(e) || e.length !== 2 || typeof e[0] !== 'string' || typeof e[1] !== 'string') {
            throw new Error('Invalid project manifest: "files" entries must be [string, string] pairs');
        }
        out.push([e[0], e[1]]);
    }
    return out;
}

/** A project is installable when it specifies a firmware source (shared MicroPython id or local UF2). */
export function isInstallable(doc: FirmwareProjectDoc): boolean {
    return Boolean(doc.micropython || doc.uf2);
}

function findVersionEntry(index: unknown, id: string, label: string): FirmwareVersionEntry {
    const versions = (index as { versions?: unknown })?.versions;
    if (!Array.isArray(versions)) {
        throw new Error(`Invalid version registry: ${label}`);
    }
    const entry = versions.find((v) => (v as { id?: string })?.id === id) as
        | FirmwareVersionEntry
        | undefined;
    if (!entry || typeof entry.dir !== 'string' || typeof entry.version !== 'string') {
        throw new Error(`Version id "${id}" not found in ${label}`);
    }
    return entry;
}

/**
 * Resolve a project.json into concrete install instructions by reading the
 * referenced version registries and the build-generated files.json manifests.
 *
 * @param boardId         e.g. "xrp-2350"
 * @param projectBaseDir  project dir relative to firmware-loader root, trailing slash
 *                        (e.g. "boards/xrp-2350/micropython/")
 * @param doc             parsed project.json
 */
export async function resolveInstall(
    boardId: string,
    projectBaseDir: string,
    doc: FirmwareProjectDoc,
): Promise<ResolvedInstall> {
    // --- Resolve the UF2 to flash ---
    let uf2Url: string;
    if (doc.micropython) {
        const idx = await fetchJson(
            `${FIRMWARE_LOADER_BASE}boards/${boardId}/micropython-firmware/index.json`,
        );
        const entry = findVersionEntry(idx, doc.micropython, `${boardId} micropython registry`);
        uf2Url = `${FIRMWARE_LOADER_BASE}boards/${boardId}/micropython-firmware/${entry.dir}/${entry.uf2 ?? 'firmware.uf2'}`;
    } else if (doc.uf2) {
        uf2Url = `${FIRMWARE_LOADER_BASE}${projectBaseDir}${doc.uf2}`;
    } else {
        throw new Error('Project specifies no firmware (need "micropython" id or local "uf2")');
    }

    const libraryEntries: [string, string][] = [];
    let xrplibVersion: string | undefined;

    // --- Resolve the shared XRPLib release (optional) ---
    // An XRPLib release bundles the library plus the standard support files
    // (XRPLib/, ble/, phew/, XRPExamples/); its files.json already carries the
    // device destination for each file.
    if (doc.xrplib) {
        const idx = await fetchJson(`${FIRMWARE_LOADER_BASE}boards/XRPLib/index.json`);
        const entry = findVersionEntry(idx, doc.xrplib, 'XRPLib registry');
        xrplibVersion = entry.version;
        const verDir = `boards/XRPLib/${entry.dir}/`;
        const files = await fetchJson(`${FIRMWARE_LOADER_BASE}${verDir}files.json`);
        if (Array.isArray(files)) {
            for (const e of files) {
                if (
                    Array.isArray(e) &&
                    e.length === 2 &&
                    typeof e[0] === 'string' &&
                    typeof e[1] === 'string'
                ) {
                    libraryEntries.push([e[0], fileUrl(verDir, e[1])]);
                }
            }
        }
    }

    // --- Resolve project-specific extra files declared inline in project.json ---
    if (doc.files) {
        for (const [deviceDest, sourceRel] of doc.files) {
            libraryEntries.push([deviceDest, fileUrl(projectBaseDir, sourceRel)]);
        }
    }

    return { boardId, uf2Url, libraryEntries, xrplibVersion };
}
