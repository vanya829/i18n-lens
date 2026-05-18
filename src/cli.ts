import { Command } from 'commander'
import chalk from 'chalk'
import { loadTranslationFiles } from './fileUtils.js'
import { sortTranslationFiles } from './sorter.js'
import { compareTranslationFiles } from './comparator.js'
import { findDuplicateValues } from './duplicateFinder.js'

const program = new Command()

program
  .name('i18n-lens')
  .description('Utilities for managing i18n translation files')
  .version('0.1.0')

// ─── sort ────────────────────────────────────────────────────────────────────

program
  .command('sort')
  .description('Sort keys in translation files alphabetically (recursive)')
  .argument('<folder>', 'Path to the folder containing translation files')
  .option('-p, --pattern <pattern>', 'Glob pattern for files', '*.json')
  .option('--dry-run', 'Preview changes without writing to disk')
  .action(
    async (folder: string, options: { pattern: string; dryRun?: boolean }) => {
      try {
        const files = await loadTranslationFiles(folder, options.pattern)
        const results = sortTranslationFiles(files, !options.dryRun)

        console.log(chalk.bold('\nSort results:\n'))
        for (const r of results) {
          const tag = r.changed
            ? options.dryRun
              ? chalk.yellow('~ would sort')
              : chalk.green('✓ sorted    ')
            : chalk.gray('  unchanged  ')
          console.log(`  ${tag}  ${chalk.cyan(r.locale)}  ${chalk.dim(r.filePath)}`)
        }

        const count = results.filter((r) => r.changed).length
        console.log(
          `\n${chalk.bold(String(count))} file(s) ${options.dryRun ? 'would be sorted' : 'sorted'}.\n`,
        )
      } catch (err) {
        console.error(chalk.red(`\nError: ${(err as Error).message}\n`))
        process.exit(1)
      }
    },
  )

// ─── compare ─────────────────────────────────────────────────────────────────

program
  .command('compare')
  .description('Compare keys across translation files and report differences')
  .argument('<folder>', 'Path to the folder containing translation files')
  .option('-p, --pattern <pattern>', 'Glob pattern for files', '*.json')
  .option(
    '-b, --base <locale>',
    'Base locale used as the reference (e.g. en)',
  )
  .action(
    async (folder: string, options: { pattern: string; base?: string }) => {
      try {
        const files = await loadTranslationFiles(folder, options.pattern)
        const result = compareTranslationFiles(files, options.base)

        console.log(chalk.bold('\nComparison results:\n'))
        console.log(`  Base locale : ${chalk.cyan(result.baseLocale)}`)
        console.log(`  Base keys   : ${chalk.yellow(String(result.baseKeys.length))}`)
        console.log(`  Total unique: ${chalk.yellow(String(result.allKeys.length))}\n`)

        if (result.isConsistent) {
          console.log(chalk.green('✓ All translation files have the same keys.\n'))
          return
        }

        for (const diff of result.diffs) {
          if (diff.missingKeys.length === 0 && diff.extraKeys.length === 0) {
            console.log(chalk.green(`  ✓ ${diff.locale} — consistent`))
            continue
          }

          console.log(chalk.bold(`  ${chalk.cyan(diff.locale)}:`))

          if (diff.missingKeys.length > 0) {
            console.log(
              chalk.red(`    Missing keys (${diff.missingKeys.length}) — present in base but not here:`),
            )
            for (const k of diff.missingKeys) {
              console.log(chalk.red(`      - ${k}`))
            }
          }

          if (diff.extraKeys.length > 0) {
            console.log(
              chalk.yellow(`    Extra keys (${diff.extraKeys.length}) — present here but not in base:`),
            )
            for (const k of diff.extraKeys) {
              console.log(chalk.yellow(`      + ${k}`))
            }
          }

          console.log()
        }
      } catch (err) {
        console.error(chalk.red(`\nError: ${(err as Error).message}\n`))
        process.exit(1)
      }
    },
  )

// ─── find-duplicates ─────────────────────────────────────────────────────────

program
  .command('find-duplicates')
  .description('Find keys that share the same translation value within each file')
  .argument('<folder>', 'Path to the folder containing translation files')
  .option('-p, --pattern <pattern>', 'Glob pattern for files', '*.json')
  .action(async (folder: string, options: { pattern: string }) => {
    try {
      const files = await loadTranslationFiles(folder, options.pattern)
      const result = findDuplicateValues(files)

      console.log(chalk.bold('\nDuplicate values:\n'))

      if (!result.hasDuplicates) {
        console.log(chalk.green('✓ No duplicate values found.\n'))
        return
      }

      for (const file of result.files) {
        if (file.duplicates.length === 0) {
          console.log(chalk.green(`  ✓ ${file.locale} — no duplicates`))
          continue
        }

        console.log(
          chalk.bold(
            `  ${chalk.cyan(file.locale)} — ${chalk.red(String(file.duplicates.length))} duplicate value(s):`,
          ),
        )

        for (const dup of file.duplicates) {
          console.log(chalk.yellow(`    "${dup.value}"`))
          console.log(chalk.gray(`      keys: ${dup.keys.join(', ')}`))
        }

        console.log()
      }
    } catch (err) {
      console.error(chalk.red(`\nError: ${(err as Error).message}\n`))
      process.exit(1)
    }
  })

program.parse()
