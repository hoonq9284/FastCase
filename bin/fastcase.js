#!/usr/bin/env node

const { Command } = require('commander');
const pkg = require('../package.json');

const { initConfig } = require('../src/config');
const { runGenerate } = require('../src/generate');

const program = new Command();

program
  .name('fastcase')
  .description('AI-powered test case generator from specs and designs')
  .version(pkg.version)
  .enablePositionalOptions();

program
  .command('init')
  .description('Configure API provider and key')
  .action(async () => {
    await initConfig();
  });

program
  .command('generate', { isDefault: true, hidden: true })
  .argument('[files...]', 'Spec files to analyze (md, txt, png, jpg, etc.)')
  .option('-c, --clipboard', 'Read spec from clipboard')
  .option('-o, --output <file>', 'Output file path (default: stdout)')
  .option('-f, --format <format>', 'Output format: markdown | csv | json | xlsx', 'markdown')
  .option('-l, --lang <lang>', 'Output language: ko | en', 'ko')
  .action(async (files, options) => {
    if (files.length === 0 && !options.clipboard) {
      console.log('');
      console.log('  ⚡ FastCase - AI-powered test case generator');
      console.log('');
      console.log('  Usage:');
      console.log('    fastcase <files...>        Analyze spec files and generate TCs');
      console.log('    fastcase --clipboard       Analyze clipboard content');
      console.log('    fastcase init              Configure API key');
      console.log('');
      console.log('  Examples:');
      console.log('    fastcase ./spec.md');
      console.log('    fastcase ./spec.md ./flow.png');
      console.log('    fastcase ./spec.md -o testcases.md');
      console.log('    fastcase ./spec.md -f csv -o testcases.csv');
      console.log('    fastcase ./spec.md -o testcases.xlsx');
      console.log('    fastcase --clipboard');
      console.log('');
      return;
    }
    await runGenerate(files, options);
  });

program.parse();
