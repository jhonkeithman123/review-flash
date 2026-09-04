/**
 * Single source of truth for application versioning and release metadata.
 * All historical and current version numbers, codenames, and release dates
 * are maintained here for centralized access across ReviewFlash.
 */

export interface VersionInfo {
  version: string;
  codename: string;
  releaseDate: string;
}

export const VERSION_HISTORY: readonly VersionInfo[] = [
  {
    version: "v2.1.0",
    codename: "The Fluid Motion & Ambient Lounge Update",
    releaseDate: "September 4, 2026",
  },
  {
    version: "v2.0.0",
    codename: "The Music & Social Horizon",
    releaseDate: "September 1, 2026",
  },
  {
    version: "v1.4.0",
    codename: "Cognitive Dual-Engine & Knowledge Hub",
    releaseDate: "August 31, 2026",
  },
  {
    version: "v1.3.0",
    codename: "DITroy AI Tutor & Spaced Retrieval",
    releaseDate: "August 30, 2026",
  },
  {
    version: "v1.2.0",
    codename: "Collaborative Study & Permission Mesh",
    releaseDate: "August 28, 2026",
  },
  {
    version: "v1.1.0",
    codename: "Deck Studio & Rich Text Engine",
    releaseDate: "August 25, 2026",
  },
  {
    version: "v1.0.0",
    codename: "Genesis: Modern Active Recall Flashcards",
    releaseDate: "August 20, 2026",
  },
] as const;

/**
 * Keyed lookup map for fast access by version string (e.g., VERSIONS_BY_TAG["v2.0.0"])
 */
export const VERSIONS_BY_TAG: Record<string, VersionInfo> = Object.fromEntries(
  VERSION_HISTORY.map((entry) => [entry.version, entry])
);

/**
 * Helper to retrieve release details for any given version tag.
 */
export function getVersionInfo(version: string): VersionInfo | undefined {
  return VERSIONS_BY_TAG[version];
}

/**
 * Active / Latest release metadata
 */
export const LATEST_VERSION = VERSION_HISTORY[0];
export const APP_VERSION = LATEST_VERSION.version;
export const APP_CODENAME = LATEST_VERSION.codename;
export const APP_RELEASE_DATE = LATEST_VERSION.releaseDate;
