import type { TranslationFile, SortResult } from './types.js'
import { writeTranslationFile } from './fileUtils.js'

function sortObjectKeys(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.keys(obj)
    .sort()
    .reduce(
      (acc, key) => {
        const value = obj[key]
        acc[key] =
          typeof value === 'object' && value !== null && !Array.isArray(value)
            ? sortObjectKeys(value as Record<string, unknown>)
            : value
        return acc
      },
      {} as Record<string, unknown>,
    )
}

/**
 * Sorts all keys in a translation file recursively and optionally writes
 * the result back to disk.
 *
 * @returns The sorted data and whether the file actually changed.
 */
export function sortTranslationFile(file: TranslationFile): {
  sortedData: Record<string, unknown>
  changed: boolean
} {
  const sortedData = sortObjectKeys(file.data)
  const changed = JSON.stringify(file.data) !== JSON.stringify(sortedData)
  return { sortedData, changed }
}

/**
 * Sorts keys in every translation file in the given list.
 *
 * @param files - Translation files to sort.
 * @param write - When `true` (default), writes changed files to disk.
 */
export function sortTranslationFiles(
  files: TranslationFile[],
  write = true,
): SortResult[] {
  return files.map((file) => {
    const { sortedData, changed } = sortTranslationFile(file)
    if (changed && write) {
      writeTranslationFile(file.filePath, sortedData)
    }
    return { filePath: file.filePath, locale: file.locale, changed }
  })
}
