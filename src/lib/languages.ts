/**
 * Single source of truth for all language / region configuration.
 *
 * To add a new language:
 *   1. Add it to the relevant region (or create a new region) below.
 *   2. That's it — the navbar dropdown, page renderers, admin translate
 *      tab, and translate API all read from this file automatically.
 *
 * Rules:
 *  - `isDefault: true` marks the authoring language (English / US).
 *    There must be exactly one default language.
 *  - `code` must match the ?lang= URL param and the database
 *    `section_translations.language_code` values.
 */

export interface LangOption {
  code: string;
  label: string;       // English display name
  nativeLabel: string; // Name in that language
  isDefault?: boolean;
}

export interface Region {
  code: string;        // Region identifier (not a language code)
  country: string;     // Display name
  flag: string;        // Emoji flag
  languages: LangOption[];
}

export const REGIONS: Region[] = [
  {
    code: "us",
    country: "United States",
    flag: "🇺🇸",
    languages: [
      { code: "en", label: "English", nativeLabel: "English", isDefault: true },
    ],
  },
  {
    code: "in",
    country: "India",
    flag: "🇮🇳",
    languages: [
      { code: "hi", label: "Hindi",  nativeLabel: "हिन्दी" },
      { code: "ta", label: "Tamil",  nativeLabel: "தமிழ்"  },
    ],
  },
  {
    code: "es_region",
    country: "Spain",
    flag: "🇪🇸",
    languages: [
      { code: "es", label: "Spanish", nativeLabel: "Español" },
    ],
  },
  // ── Add future regions / languages below ─────────────────────────
  // Example — France:
  // {
  //   code: "fr",
  //   country: "France",
  //   flag: "🇫🇷",
  //   languages: [{ code: "fr", label: "French", nativeLabel: "Français" }],
  // },
  // Example — adding Portuguese to Spain's region or a new region:
  // {
  //   code: "br",
  //   country: "Brazil",
  //   flag: "🇧🇷",
  //   languages: [{ code: "pt", label: "Portuguese", nativeLabel: "Português" }],
  // },
];

/** Flat list of all languages with their region flag attached */
export const LANG_OPTIONS: (LangOption & { flag: string; region: string })[] =
  REGIONS.flatMap(r =>
    r.languages.map(l => ({ ...l, flag: r.flag, region: r.country }))
  );

/** The default language (authoring language — English) */
export const DEFAULT_LANG =
  LANG_OPTIONS.find(l => l.isDefault)?.code ?? "en";

/**
 * Set of non-default language codes that the system supports for
 * translation.  Used by page renderers to decide whether to query
 * section_translations for the requested ?lang= value.
 */
export const SUPPORTED_LANG_CODES: ReadonlySet<string> = new Set(
  LANG_OPTIONS.filter(l => !l.isDefault).map(l => l.code)
);

/**
 * Map of code → label used by the translate API (e.g. { es: "Spanish" }).
 */
export const SUPPORTED_LANGS_MAP: Record<string, string> = Object.fromEntries(
  LANG_OPTIONS.filter(l => !l.isDefault).map(l => [l.code, l.label])
);

/** Returns the Region that contains a given language code */
export function getRegionForLang(code: string): Region {
  return REGIONS.find(r => r.languages.some(l => l.code === code)) ?? REGIONS[0];
}
