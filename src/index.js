import axios from 'axios';
import path from 'path';
import url from 'url';
import { trimEnd } from 'lodash';
import { promises as fs } from 'fs';
import httpAdapter from 'axios/lib/adapters/http';

axios.defaults.adapter = httpAdapter;

export const getFileName = (pageAddress) => {
  const urlAdd = url.parse(pageAddress);
  const filename = `${urlAdd.host}${trimEnd(urlAdd.pathname, '/')}`.replace(/\W/g, '-');
  return `${filename}.html`;
};

export default (pageAddress, outputpath) => {
  const filepath = path.resolve(outputpath, getFileName(pageAddress));
  return axios.get(pageAddress)
    .then(response => fs.writeFile(filepath, response.data))
    .catch(e => console.error(e.message));
};
