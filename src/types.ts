export interface TranslationFile {
  filePath: string
  fileName: string
  /** Locale code derived from the file name, e.g. "en", "fr", "de" */
  locale: string
  data: Record<string, unknown>
}

export interface SortResult {
  filePath: string
  locale: string
  /** Whether the file contents actually changed after sorting */
  changed: boolean
}

export interface KeyDiff {
  locale: string
  /** Keys present in the base locale but missing from this locale */
  missingKeys: string[]
  /** Keys present in this locale but not in the base locale */
  extraKeys: string[]
}

export interface CompareResult {
  baseLocale: string
  /** Flat dot-notation keys in the base locale */
  baseKeys: string[]
  /** Union of all flat keys across every file */
  allKeys: string[]
  /** Per-locale diff against the base */
  diffs: KeyDiff[]
  /** True when every locale has exactly the same keys as the base */
  isConsistent: boolean
}

export interface DuplicateEntry {
  value: string
  /** All flat dot-notation keys that share this value */
  keys: string[]
}

export interface FileDuplicates {
  filePath: string
  locale: string
  duplicates: DuplicateEntry[]
}

export interface DuplicateValuesResult {
  files: FileDuplicates[]
  hasDuplicates: boolean
}
