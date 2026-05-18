import { describe, it, expect } from 'vitest'
import { compareTranslationFiles } from '../comparator.js'
import type { TranslationFile } from '../types.js'

function makeFile(
  locale: string,
  data: Record<string, unknown>,
): TranslationFile {
  return {
    filePath: `/locales/${locale}.json`,
    fileName: `${locale}.json`,
    locale,
    data,
  }
}

describe('compareTranslationFiles', () => {
  it('throws when passed an empty array', () => {
    expect(() => compareTranslationFiles([])).toThrow(
      'No translation files provided',
    )
  })

  it('throws when the requested base locale is not in the list', () => {
    const files = [makeFile('en', { hello: 'Hello' })]
    expect(() => compareTranslationFiles(files, 'fr')).toThrow(
      'Base locale "fr" was not found',
    )
  })

  it('returns isConsistent: true for a single file (no peers to differ)', () => {
    const result = compareTranslationFiles([makeFile('en', { a: '1', b: '2' })])
    expect(result.isConsistent).toBe(true)
    expect(result.diffs).toHaveLength(0)
  })

  it('returns isConsistent: true when all files share the same keys', () => {
    const files = [
      makeFile('en', { hello: 'Hello', bye: 'Goodbye' }),
      makeFile('fr', { hello: 'Bonjour', bye: 'Au revoir' }),
      makeFile('de', { hello: 'Hallo', bye: 'Auf Wiedersehen' }),
    ]
    const result = compareTranslationFiles(files, 'en')
    expect(result.isConsistent).toBe(true)
    expect(
      result.diffs.every(
        (d) => d.missingKeys.length === 0 && d.extraKeys.length === 0,
      ),
    ).toBe(true)
  })

  it('detects keys present in the base but missing from another locale', () => {
    const files = [
      makeFile('en', { a: '1', b: '2', c: '3' }),
      makeFile('fr', { a: '1' }), // missing b, c
    ]
    const result = compareTranslationFiles(files, 'en')
    const frDiff = result.diffs.find((d) => d.locale === 'fr')!

    expect(frDiff.missingKeys).toContain('b')
    expect(frDiff.missingKeys).toContain('c')
    expect(frDiff.extraKeys).toHaveLength(0)
  })

  it('detects keys present in a locale but absent from the base', () => {
    const files = [
      makeFile('en', { a: '1' }),
      makeFile('fr', { a: '1', extra: 'bonus' }),
    ]
    const result = compareTranslationFiles(files, 'en')
    const frDiff = result.diffs.find((d) => d.locale === 'fr')!

    expect(frDiff.extraKeys).toContain('extra')
    expect(frDiff.missingKeys).toHaveLength(0)
  })

  it('uses the first file as the base when no baseLocale is specified', () => {
    const files = [
      makeFile('de', { only_de: '1' }),
      makeFile('en', { a: '1' }),
    ]
    const result = compareTranslationFiles(files)
    expect(result.baseLocale).toBe('de')
  })

  it('honours an explicit baseLocale option', () => {
    const files = [makeFile('en', { a: '1' }), makeFile('fr', { a: '1' })]
    const result = compareTranslationFiles(files, 'fr')
    expect(result.baseLocale).toBe('fr')
  })

  it('sets baseKeys to the flattened keys of the base locale', () => {
    const files = [
      makeFile('en', { a: '1', b: '2' }),
      makeFile('fr', { a: '1', b: '2' }),
    ]
    const result = compareTranslationFiles(files, 'en')
    expect(result.baseKeys.sort()).toEqual(['a', 'b'])
  })

  it('sets allKeys to the union of keys across all files', () => {
    const files = [
      makeFile('en', { a: '1' }),
      makeFile('fr', { b: '2' }),
    ]
    const result = compareTranslationFiles(files)
    expect(result.allKeys.sort()).toEqual(['a', 'b'])
  })

  it('allKeys includes base keys even when absent from all other locales', () => {
    const files = [
      makeFile('en', { unique: 'only here', shared: 'yes' }),
      makeFile('fr', { shared: 'oui' }),
    ]
    const result = compareTranslationFiles(files, 'en')
    expect(result.allKeys).toContain('unique')
    expect(result.allKeys).toContain('shared')
  })

  it('flattens nested keys before comparing', () => {
    const files = [
      makeFile('en', { actions: { save: 'Save', cancel: 'Cancel' } }),
      makeFile('fr', { actions: { save: 'Sauvegarder' } }), // missing actions.cancel
    ]
    const result = compareTranslationFiles(files, 'en')

    expect(result.baseKeys).toContain('actions.save')
    expect(result.baseKeys).toContain('actions.cancel')

    const frDiff = result.diffs.find((d) => d.locale === 'fr')!
    expect(frDiff.missingKeys).toContain('actions.cancel')
    expect(frDiff.missingKeys).not.toContain('actions.save')
  })

  it('marks isConsistent: false when any locale has differences', () => {
    const files = [
      makeFile('en', { a: '1', b: '2' }),
      makeFile('fr', { a: '1', b: '2' }), // consistent
      makeFile('de', { a: '1' }), // missing b
    ]
    const result = compareTranslationFiles(files, 'en')
    expect(result.isConsistent).toBe(false)
  })

  it('produces one diff entry per non-base locale', () => {
    const files = [
      makeFile('en', { a: '1' }),
      makeFile('fr', { a: '1' }),
      makeFile('de', { a: '1' }),
    ]
    const result = compareTranslationFiles(files, 'en')
    expect(result.diffs).toHaveLength(2)
  })
})
