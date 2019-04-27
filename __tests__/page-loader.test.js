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
  const scriptContentPath = './__tests__/__fixtures__/application.txt';
  const expectedContentPath = './__tests__/__fixtures__/page-expected.html';
  const styleContentPath = './__tests__/__fixtures__/style.css';
  const imageContentPath = './__tests__/__fixtures__/image.png';
  const actualContent = await fs.readFile(actualContentPath, 'utf-8');
  const scriptContent = await fs.readFile(scriptContentPath, 'utf-8');
  const styleContent = await fs.readFile(styleContentPath, 'utf-8');
  const imageContent = await fs.readFile(imageContentPath, 'utf-8');

  nock('https://localhost')
    .get('/page')
    .reply(200, actualContent)
    .get('/assets/application.js')
    .reply(200, scriptContent)
    .get('/assets/image.png')
    .reply(200, imageContent)
    .get('/assets/style.css')
    .reply(200, styleContent);

  const tmpDirPath = await fs.mkdtemp(`${os.tmpdir()}${path.sep}`);
  await loadPage('https://localhost/page', tmpDirPath);
  const outputPath = path.join(tmpDirPath, getName('https://localhost/page', 'file'));
  const outputResult = await fs.readFile(outputPath, 'utf-8');
  const expectedResult = await fs.readFile(expectedContentPath, 'utf-8');

  const appPath = path.join(tmpDirPath, 'localhost-page_files/assets-application.js');
  const imagePath = path.join(tmpDirPath, 'localhost-page_files/assets-image.png');
  const stylePath = path.join(tmpDirPath, 'localhost-page_files/assets-style.css');

  const receivedApp = await fs.readFile(appPath, 'utf-8');
  const receivedImage = await fs.readFile(imagePath, 'utf-8');
  const receivedStyle = await fs.readFile(stylePath, 'utf-8');


  expect(outputResult).toBe(expectedResult);
  expect(receivedApp).toBe(scriptContent);
  expect(receivedImage).toBe(imageContent);
  expect(receivedStyle).toBe(styleContent);
});
