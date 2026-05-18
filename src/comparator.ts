import { flattenObject } from './fileUtils.js'
import type { TranslationFile, CompareResult, KeyDiff } from './types.js'

/**
 * Compares the flat key sets of all translation files against a base locale.
 *
 * @param files      - Translation files to compare.
 * @param baseLocale - Locale to treat as the reference (e.g. `"en"`).
 *                     Defaults to the first file in the list.
 */
export function compareTranslationFiles(
  files: TranslationFile[],
  baseLocale?: string,
): CompareResult {
  if (files.length === 0) {
    throw new Error('No translation files provided')
  }

  const flatFiles = files.map((f) => ({
    ...f,
    keys: Object.keys(flattenObject(f.data)).sort(),
  }))

  const base = baseLocale
    ? flatFiles.find((f) => f.locale === baseLocale)
    : flatFiles[0]

  if (!base) {
    throw new Error(
      `Base locale "${baseLocale}" was not found among the loaded files`,
    )
  }

  const baseKeys = base.keys

  const allKeysSet = new Set<string>()
  flatFiles.forEach((f) => f.keys.forEach((k) => allKeysSet.add(k)))
  const allKeys = Array.from(allKeysSet).sort()

  const diffs: KeyDiff[] = flatFiles
    .filter((f) => f.locale !== base.locale)
    .map((f) => ({
      locale: f.locale,
      missingKeys: baseKeys.filter((k) => !f.keys.includes(k)),
      extraKeys: f.keys.filter((k) => !baseKeys.includes(k)),
    }))

  const isConsistent = diffs.every(
    (d) => d.missingKeys.length === 0 && d.extraKeys.length === 0,
  )

  return { baseLocale: base.locale, baseKeys, allKeys, diffs, isConsistent }
}
