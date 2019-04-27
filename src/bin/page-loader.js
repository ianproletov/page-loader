#!/usr/bin/env node

import loadPage from '..';
import program from 'commander';

program
  .version('0.0.3', '-V, --version')
  .description('Usage: page-loader [options]')
  .description('Downloads the page content')
  .option('-o, --output [path]', 'Output directory path', process.cwd())
  .arguments('<pageAddress>')
  .action(pageAddress => loadPage(pageAddress, program.output));
program.parse(process.argv);
