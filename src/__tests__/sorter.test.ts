import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { sortTranslationFile, sortTranslationFiles } from '../sorter.js'
import type { TranslationFile } from '../types.js'

let tmpDir: string

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'tu-test-'))
})

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true })
})

function makeFile(
  locale: string,
  data: Record<string, unknown>,
  filePath = '',
): TranslationFile {
  return { filePath, fileName: `${locale}.json`, locale, data }
}

// ─── sortTranslationFile ──────────────────────────────────────────────────────

describe('sortTranslationFile', () => {
  it('reports changed: false when keys are already alphabetically sorted', () => {
    const { changed } = sortTranslationFile(makeFile('en', { a: '1', b: '2', c: '3' }))
    expect(changed).toBe(false)
  })

  it('reports changed: true and reorders keys when out of order', () => {
    const { changed, sortedData } = sortTranslationFile(
      makeFile('en', { z: 'last', a: 'first', m: 'middle' }),
    )
    expect(changed).toBe(true)
    expect(Object.keys(sortedData)).toEqual(['a', 'm', 'z'])
  })

  it('sorts nested object keys recursively', () => {
    const { sortedData } = sortTranslationFile(
      makeFile('en', { z: 'top', nested: { b: '2', a: '1' } }),
    )
    expect(Object.keys(sortedData)).toEqual(['nested', 'z'])
    expect(Object.keys(sortedData.nested as Record<string, unknown>)).toEqual(['a', 'b'])
  })

  it('sorts deeply nested keys (3 levels)', () => {
    const { sortedData } = sortTranslationFile(
      makeFile('en', { a: { z: { beta: '1', alpha: '2' } } }),
    )
    const inner = (sortedData.a as Record<string, unknown>).z as Record<string, unknown>
    expect(Object.keys(inner)).toEqual(['alpha', 'beta'])
  })

  it('preserves array values as-is without recursing into them', () => {
    const { sortedData } = sortTranslationFile(
      makeFile('en', { z: [3, 1, 2], a: 'text' }),
    )
    expect(sortedData.z).toEqual([3, 1, 2])
    expect(Object.keys(sortedData)).toEqual(['a', 'z'])
  })

  it('returns changed: false for an empty object', () => {
    const { changed, sortedData } = sortTranslationFile(makeFile('en', {}))
    expect(changed).toBe(false)
    expect(sortedData).toEqual({})
  })

  it('returns changed: false for a single-key object', () => {
    const { changed } = sortTranslationFile(makeFile('en', { only: 'one' }))
    expect(changed).toBe(false)
  })

  it('does not mutate the original file data', () => {
    const data = { z: 'last', a: 'first' }
    sortTranslationFile(makeFile('en', data))
    expect(Object.keys(data)).toEqual(['z', 'a'])
  })
})

// ─── sortTranslationFiles ─────────────────────────────────────────────────────

describe('sortTranslationFiles', () => {
  it('returns a result entry for every input file', () => {
    const files = [makeFile('en', { a: '1' }), makeFile('fr', { b: '2' })]
    const results = sortTranslationFiles(files, false)
    expect(results).toHaveLength(2)
  })

  it('correctly sets changed flags across a mixed list', () => {
    const sorted = makeFile('en', { a: '1', b: '2' })
    const unsorted = makeFile('fr', { z: '1', a: '2' })
    const results = sortTranslationFiles([sorted, unsorted], false)
    expect(results[0].changed).toBe(false)
    expect(results[1].changed).toBe(true)
  })

  it('does not write to disk when write = false', () => {
    const filePath = join(tmpDir, 'fr.json')
    const original = '{"z":"1","a":"2"}'
    writeFileSync(filePath, original)

    sortTranslationFiles([makeFile('fr', { z: '1', a: '2' }, filePath)], false)

    expect(readFileSync(filePath, 'utf-8')).toBe(original)
  })

  it('writes sorted content to disk when write = true', () => {
    const filePath = join(tmpDir, 'fr.json')
    writeFileSync(filePath, JSON.stringify({ z: '1', a: '2' }))

    sortTranslationFiles([makeFile('fr', { z: '1', a: '2' }, filePath)], true)

    const written = JSON.parse(readFileSync(filePath, 'utf-8'))
    expect(Object.keys(written)).toEqual(['a', 'z'])
  })

  it('does not write to disk when the file is already sorted (write = true)', () => {
    const filePath = join(tmpDir, 'en.json')
    // Compact format — would be expanded by writeTranslationFile if called
    const original = '{"a":"1","b":"2"}'
    writeFileSync(filePath, original)

    sortTranslationFiles([makeFile('en', { a: '1', b: '2' }, filePath)], true)

    // File must be untouched because changed = false
    expect(readFileSync(filePath, 'utf-8')).toBe(original)
  })

  it('includes locale and filePath in each result', () => {
    const file = makeFile('de', { a: '1' }, '/some/path/de.json')
    const [result] = sortTranslationFiles([file], false)
    expect(result.locale).toBe('de')
    expect(result.filePath).toBe('/some/path/de.json')
  })
})
