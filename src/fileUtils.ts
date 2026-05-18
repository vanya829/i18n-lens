import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, basename, extname } from 'node:path'
import fg from 'fast-glob'
import type { TranslationFile } from './types.js'

/**
 * Recursively flattens a nested translation object into dot-notation key/value pairs.
 *
 * @example
 * flattenObject({ a: { b: 'hello' } }) // => { 'a.b': 'hello' }
 */
export function flattenObject(
  obj: Record<string, unknown>,
  prefix = '',
): Record<string, string> {
  return Object.entries(obj).reduce(
    (acc, [key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(acc, flattenObject(value as Record<string, unknown>, fullKey))
      } else {
        acc[fullKey] = String(value)
      }
      return acc
    },
    {} as Record<string, string>,
  )
}

/**
 * Loads all JSON translation files from a folder matching an optional glob pattern.
 *
 * @param folder  - Path to the directory containing translation files.
 * @param pattern - Glob pattern relative to the folder. Defaults to `*.json`.
 */
export async function loadTranslationFiles(
  folder: string,
  pattern = '*.json',
): Promise<TranslationFile[]> {
  const resolvedFolder = resolve(folder)

  if (!existsSync(resolvedFolder)) {
    throw new Error(`Folder not found: ${resolvedFolder}`)
  }

  const filePaths = await fg(pattern, { cwd: resolvedFolder, absolute: true })

  if (filePaths.length === 0) {
    throw new Error(
      `No files matching "${pattern}" found in ${resolvedFolder}`,
    )
  }

  return filePaths.map((filePath) => {
    const fileName = basename(filePath)
    const locale = basename(filePath, extname(filePath))
    let data: Record<string, unknown>

    try {
      data = JSON.parse(readFileSync(filePath, 'utf-8')) as Record<string, unknown>
    } catch {
      throw new Error(`Failed to parse JSON in file: ${filePath}`)
    }

    return { filePath, fileName, locale, data }
  })
}

/** Writes a translation object back to disk as formatted JSON. */
export function writeTranslationFile(
  filePath: string,
  data: Record<string, unknown>,
): void {
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
}
