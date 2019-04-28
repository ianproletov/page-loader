#!/usr/bin/env node

import loadPage from '..';
import program from 'commander';
import { version } from '../../package.json';

program
  .version(version, '-V, --version')
  .description('Usage: page-loader [options]')
  .description('Downloads the page content')
  .option('-o, --output [path]', 'Output directory path', process.cwd())
  .arguments('<pageAddress>')
  .action(pageAddress => loadPage(pageAddress, program.output));
program.parse(process.argv);
