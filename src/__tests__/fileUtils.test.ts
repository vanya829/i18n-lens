import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  flattenObject,
  loadTranslationFiles,
  writeTranslationFile,
} from '../fileUtils.js'

let tmpDir: string

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'tu-test-'))
})

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true })
})

// ─── flattenObject ────────────────────────────────────────────────────────────

describe('flattenObject', () => {
  it('returns an empty object for empty input', () => {
    expect(flattenObject({})).toEqual({})
  })

  it('returns flat keys unchanged', () => {
    expect(flattenObject({ a: 'hello', b: 'world' })).toEqual({
      a: 'hello',
      b: 'world',
    })
  })

  it('flattens one level of nesting', () => {
    expect(flattenObject({ a: { b: 'hello' } })).toEqual({ 'a.b': 'hello' })
  })

  it('flattens multiple levels of nesting (3 deep)', () => {
    expect(flattenObject({ a: { b: { c: 'deep' } } })).toEqual({
      'a.b.c': 'deep',
    })
  })

  it('handles mixed nested and flat keys', () => {
    expect(flattenObject({ top: 'value', group: { key: 'nested' } })).toEqual({
      top: 'value',
      'group.key': 'nested',
    })
  })

  it('converts numeric values to strings', () => {
    expect(flattenObject({ count: 42 })).toEqual({ count: '42' })
  })

  it('treats array values as leaf values (not recursed)', () => {
    const result = flattenObject({ items: ['a', 'b'] })
    // Array is a leaf — String(['a','b']) === 'a,b'
    expect(result).toEqual({ items: 'a,b' })
  })

  it('produces all expected keys for a realistic translation object', () => {
    const input = {
      actions: { save: 'Save', cancel: 'Cancel' },
      errors: { notFound: 'Not found' },
    }
    expect(flattenObject(input)).toEqual({
      'actions.save': 'Save',
      'actions.cancel': 'Cancel',
      'errors.notFound': 'Not found',
    })
  })
})

// ─── loadTranslationFiles ─────────────────────────────────────────────────────

describe('loadTranslationFiles', () => {
  it('loads a single JSON file and derives locale from the filename', async () => {
    writeFileSync(join(tmpDir, 'en.json'), JSON.stringify({ hello: 'Hello' }))

    const files = await loadTranslationFiles(tmpDir)

    expect(files).toHaveLength(1)
    expect(files[0].locale).toBe('en')
    expect(files[0].fileName).toBe('en.json')
    expect(files[0].data).toEqual({ hello: 'Hello' })
  })

  it('loads multiple JSON files and returns one entry per file', async () => {
    writeFileSync(join(tmpDir, 'en.json'), JSON.stringify({ hello: 'Hello' }))
    writeFileSync(join(tmpDir, 'fr.json'), JSON.stringify({ hello: 'Bonjour' }))
    writeFileSync(join(tmpDir, 'de.json'), JSON.stringify({ hello: 'Hallo' }))

    const files = await loadTranslationFiles(tmpDir)

    expect(files).toHaveLength(3)
    expect(files.map((f) => f.locale).sort()).toEqual(['de', 'en', 'fr'])
  })

  it('each file entry includes the absolute filePath', async () => {
    writeFileSync(join(tmpDir, 'en.json'), JSON.stringify({ a: '1' }))

    const [file] = await loadTranslationFiles(tmpDir)

    expect(file.filePath).toContain('en.json')
  })

  it('respects a custom glob pattern and ignores non-matching files', async () => {
    writeFileSync(join(tmpDir, 'en.json'), JSON.stringify({ a: '1' }))
    writeFileSync(join(tmpDir, 'notes.txt'), 'ignore me')

    const files = await loadTranslationFiles(tmpDir, '*.json')

    expect(files).toHaveLength(1)
    expect(files[0].locale).toBe('en')
  })

  it('loads nested translation data as a plain object', async () => {
    const data = { actions: { save: 'Save', cancel: 'Cancel' } }
    writeFileSync(join(tmpDir, 'en.json'), JSON.stringify(data))

    const [file] = await loadTranslationFiles(tmpDir)

    expect(file.data).toEqual(data)
  })

  it('throws when the folder does not exist', async () => {
    await expect(
      loadTranslationFiles('/this/path/does/not/exist/at/all'),
    ).rejects.toThrow('Folder not found')
  })

  it('throws when no files match the pattern', async () => {
    // tmpDir exists but has no .yaml files
    await expect(
      loadTranslationFiles(tmpDir, '*.yaml'),
    ).rejects.toThrow('No files matching')
  })

  it('throws when a file contains invalid JSON', async () => {
    writeFileSync(join(tmpDir, 'en.json'), '{ invalid json {{{')

    await expect(loadTranslationFiles(tmpDir)).rejects.toThrow(
      'Failed to parse JSON',
    )
  })
})

// ─── writeTranslationFile ─────────────────────────────────────────────────────

describe('writeTranslationFile', () => {
  it('writes formatted JSON with 2-space indentation', () => {
    const outPath = join(tmpDir, 'out.json')
    writeTranslationFile(outPath, { b: 'world', a: 'hello' })

    const content = readFileSync(outPath, 'utf-8')
    expect(content).toBe(JSON.stringify({ b: 'world', a: 'hello' }, null, 2) + '\n')
  })

  it('ends the file with a trailing newline', () => {
    const outPath = join(tmpDir, 'out.json')
    writeTranslationFile(outPath, { a: '1' })

    expect(readFileSync(outPath, 'utf-8').endsWith('\n')).toBe(true)
  })

  it('overwrites an existing file', () => {
    const outPath = join(tmpDir, 'out.json')
    writeFileSync(outPath, '{"old": true}')

    writeTranslationFile(outPath, { new: true })

    expect(JSON.parse(readFileSync(outPath, 'utf-8'))).toEqual({ new: true })
  })

  it('preserves key order exactly as provided', () => {
    const outPath = join(tmpDir, 'out.json')
    writeTranslationFile(outPath, { z: 'last', a: 'first' })

    const parsed = JSON.parse(readFileSync(outPath, 'utf-8'))
    expect(Object.keys(parsed)).toEqual(['z', 'a'])
  })
})
