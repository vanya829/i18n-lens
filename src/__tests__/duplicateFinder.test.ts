import { describe, it, expect } from 'vitest'
import { findDuplicateValues } from '../duplicateFinder.js'
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

describe('findDuplicateValues', () => {
  it('returns hasDuplicates: false and empty arrays when no duplicates exist', () => {
    const result = findDuplicateValues([
      makeFile('en', { a: 'unique1', b: 'unique2', c: 'unique3' }),
    ])
    expect(result.hasDuplicates).toBe(false)
    expect(result.files[0].duplicates).toHaveLength(0)
  })

  it('handles an empty translation object', () => {
    const result = findDuplicateValues([makeFile('en', {})])
    expect(result.hasDuplicates).toBe(false)
    expect(result.files[0].duplicates).toHaveLength(0)
  })

  it('detects a single duplicate value shared by two keys', () => {
    const result = findDuplicateValues([
      makeFile('en', { a: 'same', b: 'different', c: 'same' }),
    ])
    expect(result.hasDuplicates).toBe(true)

    const dup = result.files[0].duplicates.find((d) => d.value === 'same')!
    expect(dup.keys).toContain('a')
    expect(dup.keys).toContain('c')
    expect(dup.keys).not.toContain('b')
  })

  it('detects multiple distinct duplicate values in one file', () => {
    const result = findDuplicateValues([
      makeFile('en', { a: 'dup1', b: 'dup1', c: 'dup2', d: 'dup2', e: 'unique' }),
    ])
    expect(result.files[0].duplicates).toHaveLength(2)
  })

  it('reports all keys that share a duplicate value (more than two)', () => {
    const result = findDuplicateValues([
      makeFile('en', { x: 'v', y: 'v', z: 'v' }),
    ])
    const dup = result.files[0].duplicates[0]
    expect(dup.keys).toHaveLength(3)
    expect(dup.keys).toContain('x')
    expect(dup.keys).toContain('y')
    expect(dup.keys).toContain('z')
  })

  it('detects duplicates across flat and nested keys', () => {
    const result = findDuplicateValues([
      makeFile('en', {
        title: 'Welcome',
        header: { main: 'Welcome' }, // same value as title
      }),
    ])
    expect(result.hasDuplicates).toBe(true)

    const dup = result.files[0].duplicates[0]
    expect(dup.value).toBe('Welcome')
    expect(dup.keys).toContain('title')
    expect(dup.keys).toContain('header.main')
  })

  it('returns hasDuplicates: true when at least one file has duplicates', () => {
    const result = findDuplicateValues([
      makeFile('en', { a: 'unique1', b: 'unique2' }), // no duplicates
      makeFile('fr', { a: 'dup', b: 'dup' }),          // has duplicates
    ])
    expect(result.hasDuplicates).toBe(true)
    expect(result.files[0].duplicates).toHaveLength(0)
    expect(result.files[1].duplicates).toHaveLength(1)
  })

  it('returns a result entry for every input file', () => {
    const result = findDuplicateValues([
      makeFile('en', { a: '1' }),
      makeFile('fr', { a: '1' }),
      makeFile('de', { a: '1' }),
    ])
    expect(result.files).toHaveLength(3)
  })

  it('includes locale on each file result', () => {
    const result = findDuplicateValues([makeFile('en', { a: '1' })])
    expect(result.files[0].locale).toBe('en')
  })

  it('includes filePath on each file result', () => {
    const result = findDuplicateValues([makeFile('en', { a: '1' })])
    expect(result.files[0].filePath).toBe('/locales/en.json')
  })

  it('does not flag values that appear only once', () => {
    const result = findDuplicateValues([
      makeFile('en', { a: 'val1', b: 'val2', c: 'val3' }),
    ])
    expect(result.hasDuplicates).toBe(false)
    expect(result.files[0].duplicates).toHaveLength(0)
  })
})
