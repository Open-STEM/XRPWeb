import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IoClose } from 'react-icons/io5';
import FirmwareInstallWizard, { type WizardAssets } from '@/components/dialogs/firmware-install-wizard';

const FIRMWARE_LOADER_BASE = '/firmware-loader/';
const ROOT_MANIFEST = 'index.json';

/** Pair of [path on device including directories, source] — same shape as public/lib/package.json `urls`. */
export type FirmwareFileEntry = [string, string];

export type FirmwareBoardEntry = {
    id: string;
    name: string;
    description: string;
    image: string;
    nextLevel?: string;
};

/** Project row in `boards/*.json` — display only; file lists live in `nextLevel` JSON. */
export type FirmwareProjectSummary = {
    id: string;
    name: string;
    description: string;
    image: string;
    nextLevel?: string;
};

export type FirmwareLevelDocument = {
    title: string;
    description?: string;
    boards: FirmwareBoardEntry[];
    projects: FirmwareProjectSummary[];
    /** Per-file entries: [deviceDestinationPath, sourcePathRelativeToProjectDir]. */
    urls?: FirmwareFileEntry[];
    /** Legacy deps array; new project.json files no longer use this. */
    deps?: FirmwareFileEntry[];
    version?: string;
    /** Path to the UF2 relative to the project directory (e.g. "firmware.uf2"). */
    uf2Path?: string;
    /** Optional further step after reviewing this manifest */
    nextLevel?: string;
};

type FirmwareLoaderDlgProps = {
    toggleDialog: () => void;
};

function isFileEntryTuple(v: unknown): v is FirmwareFileEntry {
    return (
        Array.isArray(v) &&
        v.length === 2 &&
        typeof v[0] === 'string' &&
        typeof v[1] === 'string'
    );
}

function parseFileTupleArray(raw: unknown, label: string): FirmwareFileEntry[] {
    if (raw === undefined) {
        return [];
    }
    if (!Array.isArray(raw)) {
        throw new Error(`Invalid firmware loader manifest: ${label} must be an array`);
    }
    if (!raw.every(isFileEntryTuple)) {
        throw new Error(`Invalid firmware loader manifest: ${label} entries must be [string, string] pairs`);
    }
    return raw;
}

function parseLevelDocument(raw: unknown): FirmwareLevelDocument {
    if (raw === null || typeof raw !== 'object') {
        throw new Error('Invalid firmware loader manifest');
    }
    const o = raw as Record<string, unknown>;
    if (typeof o.title !== 'string' || !o.title) {
        throw new Error('Invalid firmware loader manifest: missing title');
    }
    const boardsRaw = o.boards;
    const projectsRaw = o.projects;
    if (boardsRaw !== undefined && !Array.isArray(boardsRaw)) {
        throw new Error('Invalid firmware loader manifest: boards must be an array');
    }
    if (projectsRaw !== undefined && !Array.isArray(projectsRaw)) {
        throw new Error('Invalid firmware loader manifest: projects must be an array');
    }
    const boards = (boardsRaw ?? []) as FirmwareBoardEntry[];
    const projects = (projectsRaw ?? []) as FirmwareProjectSummary[];

    for (const p of projects) {
        if (!p.id || typeof p.name !== 'string' || typeof p.description !== 'string' || typeof p.image !== 'string') {
            throw new Error(`Invalid project summary: ${p.id ?? 'unknown'} (need id, name, description, image)`);
        }
    }

    const urls = parseFileTupleArray(o.urls, 'urls');
    const deps = parseFileTupleArray(o.deps, 'deps');

    const version = o.version === undefined ? undefined : String(o.version);
    const nextLevel = typeof o.nextLevel === 'string' && o.nextLevel ? o.nextLevel : undefined;
    const uf2Path = typeof o.uf2Path === 'string' && o.uf2Path ? o.uf2Path : undefined;

    return {
        title: o.title,
        description: typeof o.description === 'string' ? o.description : undefined,
        boards,
        projects,
        urls: urls.length > 0 ? urls : undefined,
        deps: deps.length > 0 ? deps : undefined,
        version,
        uf2Path,
        nextLevel,
    };
}

/** Resolve board id from loader path stack (e.g. boards/xrp-beta/micropython/project.json → xrp-beta). */
export function boardIdFromPathStack(pathStack: string[]): string | null {
    for (let i = pathStack.length - 1; i >= 0; i--) {
        const p = pathStack[i]!;
        const proj = p.match(/^boards\/([^/]+)\/[^/]+\/project\.json$/);
        if (proj) return proj[1]!;
    }
    for (const p of pathStack) {
        const brd = p.match(/^boards\/([^/.]+)\.json$/);
        if (brd) return brd[1]!;
    }
    return null;
}

/**
 * Derive the project base directory (relative to firmware-loader root, with trailing slash)
 * from a project manifest path. Example:
 *   "boards/xrp-2350/micropython/project.json" → "boards/xrp-2350/micropython/"
 * Returns null when the path is not a project manifest under boards/<id>/<project>/.
 */
export function projectBaseDirFromPath(manifestPath: string): string | null {
    const m = manifestPath.match(/^(boards\/[^/]+\/[^/]+\/)project\.json$/);
    return m ? m[1]! : null;
}

type SelectionCardProps = {
    name: string;
    description: string;
    image: string;
    onClick: () => void;
    disabled?: boolean;
};

function SelectionCard({ name, description, image, onClick, disabled }: SelectionCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="group flex w-full max-w-sm flex-col rounded-xl border border-mountain-mist-200 bg-white text-left shadow-sm transition hover:border-curious-blue-400 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-curious-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-shark-700 dark:bg-shark-900 dark:hover:border-curious-blue-600"
        >
            <div className="flex h-56 w-full items-center justify-center overflow-hidden rounded-t-xl bg-mountain-mist-100 dark:bg-shark-800">
                <img src={image} alt="" className="h-52 w-full object-contain p-2" />
            </div>
            <div className="flex min-h-[3.5rem] items-center justify-center border-b border-mountain-mist-100 px-3 py-2 dark:border-shark-800">
                <span className="text-center text-base font-semibold">{name}</span>
            </div>
            <div className="flex min-h-[5rem] items-start justify-center px-3 py-3">
                <p className="text-center text-sm leading-snug text-mountain-mist-600 dark:text-shark-400">
                    {description}
                </p>
            </div>
        </button>
    );
}

/**
 * Full-screen firmware loader: data-driven from JSON under /public/firmware-loader/.
 */
function FirmwareLoaderDlg({ toggleDialog }: FirmwareLoaderDlgProps) {
    const { t } = useTranslation();
    const [pathStack, setPathStack] = useState<string[]>([ROOT_MANIFEST]);
    const [doc, setDoc] = useState<FirmwareLevelDocument | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    /** `undefined` = still loading wizard image map; `null` = failed to load. */
    const [wizardAssets, setWizardAssets] = useState<WizardAssets | null | undefined>(undefined);
    const [installContext, setInstallContext] = useState<{
        boardId: string;
        doc: FirmwareLevelDocument;
        projectBaseDir: string;
    } | null>(null);
    /** Friendly title shown when a clicked project has no installable content yet. */
    const [unavailableProject, setUnavailableProject] = useState<string | null>(null);
    /** True while a project.json is being fetched after a project tile click. */
    const [projectLoading, setProjectLoading] = useState(false);

    const currentPath = pathStack[pathStack.length - 1];

    const loadManifest = useCallback(async (relativePath: string) => {
        setLoading(true);
        setLoadError(null);
        const url = `${FIRMWARE_LOADER_BASE}${relativePath}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`${response.status} ${response.statusText}`);
            }
            const json = await response.json();
            setDoc(parseLevelDocument(json));
        } catch (e) {
            setDoc(null);
            setLoadError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadManifest(currentPath);
    }, [currentPath, loadManifest]);

    useEffect(() => {
        let cancelled = false;
        fetch(`${FIRMWARE_LOADER_BASE}wizard-assets.json`)
            .then((r) => {
                if (!r.ok) throw new Error(String(r.status));
                return r.json() as Promise<WizardAssets>;
            })
            .then((data) => {
                if (!cancelled) setWizardAssets(data);
            })
            .catch(() => {
                if (!cancelled) {
                    setWizardAssets(null);
                }
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const handleBoardClick = (board: FirmwareBoardEntry) => {
        const next = board.nextLevel;
        if (next) {
            setPathStack((s) => [...s, next]);
        }
    };

    /**
     * Loads the project.json for a clicked project tile and either launches the
     * install wizard directly (when the manifest has installable content) or
     * surfaces a "not yet available" message for TBD entries. The project path
     * is not pushed onto pathStack — the wizard owns the flow from here on.
     */
    const handleProjectClick = async (project: FirmwareProjectSummary) => {
        const next = project.nextLevel;
        if (!next) return;
        setUnavailableProject(null);
        setLoadError(null);
        setProjectLoading(true);
        try {
            const response = await fetch(`${FIRMWARE_LOADER_BASE}${next}`);
            if (!response.ok) {
                throw new Error(`${response.status} ${response.statusText}`);
            }
            const projectDoc = parseLevelDocument(await response.json());
            const hasInstallable =
                (projectDoc.urls && projectDoc.urls.length > 0) ||
                (projectDoc.uf2Path !== undefined && projectDoc.uf2Path !== '');
            if (!hasInstallable) {
                setUnavailableProject(projectDoc.title || project.name);
                return;
            }
            const bid = boardIdFromPathStack([...pathStack, next]);
            const baseDir = projectBaseDirFromPath(next);
            if (!bid || !baseDir) {
                throw new Error(`Could not resolve install context from ${next}`);
            }
            setInstallContext({ boardId: bid, doc: projectDoc, projectBaseDir: baseDir });
        } catch (e) {
            setLoadError(e instanceof Error ? e.message : String(e));
        } finally {
            setProjectLoading(false);
        }
    };

    const handleBack = () => {
        if (unavailableProject !== null) {
            setUnavailableProject(null);
            return;
        }
        if (pathStack.length <= 1) {
            toggleDialog();
            return;
        }
        setPathStack((s) => s.slice(0, -1));
    };

    const hasBoards = doc !== null && doc.boards.length > 0;
    const hasProjects = doc !== null && doc.projects.length > 0;
    const isEmptyLevel = doc !== null && !hasBoards && !hasProjects;

    const selectionGridClass =
        'mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3';

    const headerTitle = installContext
        ? t('firmwareWizardTitle')
        : doc?.title ??
          (loadError
              ? t('firmwareLoaderLoadError')
              : loading
                ? t('firmwareLoaderLoading')
                : t('firmwareLoader'));

    return (
        <div className="fixed inset-0 z-[1001] flex h-[100dvh] w-screen flex-col overflow-hidden bg-shark-50 text-mountain-mist-900 dark:bg-shark-950 dark:text-shark-100">
            <header className="flex shrink-0 items-center justify-between gap-4 border-b border-mountain-mist-200 px-4 py-3 dark:border-shark-700">
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-mountain-mist-500 dark:text-shark-400">
                        {t('firmwareLoader')}
                    </p>
                    <h1 className="truncate text-lg font-semibold text-mountain-mist-900 dark:text-shark-100 sm:text-xl">
                        {headerTitle}
                    </h1>
                </div>
                <button
                    type="button"
                    onClick={toggleDialog}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-mountain-mist-600 hover:bg-mountain-mist-200 hover:text-mountain-mist-900 dark:text-shark-300 dark:hover:bg-shark-800 dark:hover:text-shark-100"
                    aria-label={t('firmwareLoaderClose')}
                >
                    <IoClose className="h-7 w-7" />
                </button>
            </header>

            <main className="flex flex-1 flex-col overflow-y-auto px-4 py-6 sm:px-8">
                {installContext && wizardAssets === undefined && (
                    <p className="text-mountain-mist-600 dark:text-shark-400">{t('firmwareWizardAssetsLoading')}</p>
                )}
                {installContext && wizardAssets === null && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                        <p className="font-medium">{t('firmwareWizardAssetsError')}</p>
                        <button
                            type="button"
                            onClick={() => setInstallContext(null)}
                            className="mt-3 rounded-lg border border-red-300 px-3 py-1.5 text-sm dark:border-red-800"
                        >
                            {t('firmwareLoaderBack')}
                        </button>
                    </div>
                )}
                {installContext && wizardAssets && (
                    <FirmwareInstallWizard
                        boardId={installContext.boardId}
                        projectDoc={installContext.doc}
                        projectBaseDir={installContext.projectBaseDir}
                        assets={wizardAssets}
                        onCancel={() => setInstallContext(null)}
                        onComplete={() => {
                            setInstallContext(null);
                            toggleDialog();
                        }}
                    />
                )}

                {!installContext && !unavailableProject && doc?.description && (
                    <p className="mb-8 max-w-3xl text-sm text-mountain-mist-700 dark:text-shark-300 sm:text-base">
                        {doc.description}
                    </p>
                )}

                {!installContext && !unavailableProject && loading && (
                    <p className="text-mountain-mist-600 dark:text-shark-400">{t('firmwareLoaderLoading')}</p>
                )}

                {!installContext && loadError && !loading && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                        <p className="font-medium">{t('firmwareLoaderLoadError')}</p>
                        <p className="mt-1 text-sm">{loadError}</p>
                    </div>
                )}

                {!installContext && !loading && !loadError && !unavailableProject && hasBoards && (
                    <div className={selectionGridClass}>
                        {doc!.boards.map((board) => (
                            <SelectionCard
                                key={board.id}
                                name={board.name}
                                description={board.description}
                                image={board.image}
                                onClick={() => handleBoardClick(board)}
                                disabled={!board.nextLevel}
                            />
                        ))}
                    </div>
                )}

                {!installContext && !loading && !loadError && !unavailableProject && hasProjects && (
                    <div className={hasBoards ? 'mt-12' : ''}>
                        {hasBoards && (
                            <h2 className="mb-6 text-center text-base font-semibold text-mountain-mist-800 dark:text-shark-200">
                                {t('firmwareLoaderProjectsHeading')}
                            </h2>
                        )}
                        <div className={selectionGridClass}>
                            {doc!.projects.map((project) => (
                                <SelectionCard
                                    key={project.id}
                                    name={project.name}
                                    description={project.description}
                                    image={project.image}
                                    onClick={() => void handleProjectClick(project)}
                                    disabled={!project.nextLevel || projectLoading}
                                />
                            ))}
                        </div>
                        {projectLoading && (
                            <p className="mt-6 text-center text-sm text-mountain-mist-600 dark:text-shark-400">
                                {t('firmwareLoaderLoading')}
                            </p>
                        )}
                    </div>
                )}

                {!installContext && !loading && !loadError && !unavailableProject && isEmptyLevel && (
                    <div className="mx-auto max-w-xl text-center">
                        <p className="text-mountain-mist-700 dark:text-shark-300">
                            {t('firmwareLoaderNoOptions')}
                        </p>
                    </div>
                )}

                {!installContext && unavailableProject && (
                    <div className="mx-auto max-w-xl text-center">
                        <p className="text-mountain-mist-700 dark:text-shark-300">
                            {t('firmwareLoaderProjectUnavailable', { name: unavailableProject })}
                        </p>
                    </div>
                )}

                {!installContext && (pathStack.length > 1 || unavailableProject) && (
                    <div className="mt-10 flex justify-center">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="rounded-lg border border-mountain-mist-300 bg-white px-5 py-2 text-sm font-medium text-mountain-mist-800 hover:bg-mountain-mist-50 dark:border-shark-600 dark:bg-shark-900 dark:text-shark-200 dark:hover:bg-shark-800"
                        >
                            {t('firmwareLoaderBack')}
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

export default FirmwareLoaderDlg;
