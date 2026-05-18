import { flattenObject } from './fileUtils.js'
import type {
  TranslationFile,
  DuplicateValuesResult,
  FileDuplicates,
  DuplicateEntry,
} from './types.js'

function findDuplicatesInFlat(
  flatData: Record<string, string>,
): DuplicateEntry[] {
  const valueMap = new Map<string, string[]>()

  for (const [key, value] of Object.entries(flatData)) {
    const existing = valueMap.get(value)
    if (existing) {
      existing.push(key)
    } else {
      valueMap.set(value, [key])
    }
  }

  return Array.from(valueMap.entries())
    .filter(([, keys]) => keys.length > 1)
    .map(([value, keys]) => ({ value, keys }))
}

/**
 * Finds translation keys that share the same value within each locale file.
 *
 * Duplicate values are a common i18n smell — they often indicate that
 * separate semantic concepts share a string that should be split as soon as
 * any locale needs a different wording.
 *
 * @param files - Translation files to scan.
 */
export function findDuplicateValues(
  files: TranslationFile[],
): DuplicateValuesResult {
  const fileResults: FileDuplicates[] = files.map((file) => {
    const flatData = flattenObject(file.data)
    const duplicates = findDuplicatesInFlat(flatData)
    return { filePath: file.filePath, locale: file.locale, duplicates }
  })

  return {
    files: fileResults,
    hasDuplicates: fileResults.some((f) => f.duplicates.length > 0),
  }
}
