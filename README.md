# i18n-lens

A CLI tool and TypeScript library for managing i18n translation JSON files.

## Features

| Command | Description |
|---|---|
| `sort` | Sort all keys alphabetically (recursive) |
| `compare` | Compare key sets across locales and show missing / extra keys |
| `find-duplicates` | Find keys that share the same translation value within a file |

---

## Installation

```bash
npm install -g i18n-lens
# or locally in a project
npm install --save-dev i18n-lens
```

---

## CLI usage

### `sort`

Sort all keys in every translation file alphabetically (nested keys are sorted recursively).

```bash
i18n-lens sort <folder> [options]
```

| Option | Default | Description |
|---|---|---|
| `-p, --pattern <glob>` | `*.json` | Glob pattern to match files |
| `--dry-run` | — | Preview changes without writing to disk |

**Example:**

```bash
# Sort all JSON files in ./locales, preview only
i18n-lens sort ./locales --dry-run

# Sort and write
i18n-lens sort ./locales
```

---

### `compare`

Compare the key sets of all translation files against a base locale. Reports keys that are missing or extra relative to the base.

```bash
i18n-lens compare <folder> [options]
```

| Option | Default | Description |
|---|---|---|
| `-p, --pattern <glob>` | `*.json` | Glob pattern to match files |
| `-b, --base <locale>` | first file | Locale to use as the reference (e.g. `en`) |

**Example:**

```bash
i18n-lens compare ./locales --base en
```

Sample output:

```
Comparison results:

  Base locale : en
  Base keys   : 7
  Total unique: 8

  de:
    Missing keys (2) — present in base but not here:
      - actions.delete
      - goodbye
    Extra keys (1) — present here but not in base:
      + actions.extra

  ✓ fr — consistent
```

---

### `find-duplicates`

Find keys inside the same file that share the same translated string. Duplicate values are a common i18n smell — they often indicate concepts that will diverge across languages later.

```bash
i18n-lens find-duplicates <folder> [options]
```

| Option | Default | Description |
|---|---|---|
| `-p, --pattern <glob>` | `*.json` | Glob pattern to match files |

**Example:**

```bash
i18n-lens find-duplicates ./locales
```

Sample output:

```
Duplicate values:

  fr — 1 duplicate value(s):
    "Bienvenue"
      keys: welcome, errors.notFound
```

---

## Programmatic API

```ts
import {
  loadTranslationFiles,
  sortTranslationFiles,
  compareTranslationFiles,
  findDuplicateValues,
} from 'i18n-lens'

const files = await loadTranslationFiles('./locales', '*.json')

// Sort
const sortResults = sortTranslationFiles(files, /* write = */ true)

// Compare
const compareResult = compareTranslationFiles(files, /* base locale = */ 'en')
console.log(compareResult.diffs)

// Find duplicates
const dupResult = findDuplicateValues(files)
console.log(dupResult.files)
```

All public types are re-exported from the package root:

```ts
import type {
  TranslationFile,
  SortResult,
  CompareResult,
  KeyDiff,
  DuplicateValuesResult,
  FileDuplicates,
  DuplicateEntry,
} from 'i18n-lens'
```

---

## Building from source

```bash
npm install
npm run build      # build to dist/
npm run typecheck  # type-check without emitting
npm run dev        # watch mode
```
