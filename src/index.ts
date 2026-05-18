export { loadTranslationFiles, flattenObject } from './fileUtils.js'
export { sortTranslationFile, sortTranslationFiles } from './sorter.js'
export { compareTranslationFiles } from './comparator.js'
export { findDuplicateValues } from './duplicateFinder.js'

export type {
  TranslationFile,
  SortResult,
  CompareResult,
  KeyDiff,
  DuplicateValuesResult,
  FileDuplicates,
  DuplicateEntry,
} from './types.js'
