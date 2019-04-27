import nock from 'nock';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import loadPage, { getName } from '../src';

axios.defaults.adapter = httpAdapter;

describe.each([
  ['https://hexlet.io', 'hexlet-io.html'],
  ['https://hexlet.io/courses', 'hexlet-io-courses.html'],
])(
  'convert %p', (address, expectedName) => {
    const actualName = getName(address, 'file');
    expect(actualName).toBe(expectedName);
  },
);

test('Download', async () => {
  const actualContentPath = './__tests__/__fixtures__/page-actual.html';
  const linkContentPath = './__tests__/__fixtures__/application.txt';
  const expectedContentPath = './__tests__/__fixtures__/page-expected.html';
  nock('https://localhost')
    .get('/')
    .replyWithFile(200, actualContentPath, { 'Content-type': 'text/html' });
  nock('https://localhost')
    .get('/assets/application.js')
    .replyWithFile(200, linkContentPath, { 'Content-type': 'text/html' });
  const outputDirPath = await fs.mkdtemp(`${os.tmpdir()}${path.sep}`);
  await loadPage('https://localhost/', outputDirPath);
  const outputPath = path.join(outputDirPath, getName('https://localhost/', 'file'));
  const outputResult = await fs.readFile(outputPath, 'utf-8');
  const expectedResult = await fs.readFile(expectedContentPath, 'utf-8');
  expect(outputResult).toBe(expectedResult);
});
