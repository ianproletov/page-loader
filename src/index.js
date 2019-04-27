import axios from 'axios';
import path from 'path';
import url from 'url';
import { trimStart, trimEnd } from 'lodash';
import { promises as fs } from 'fs';
import cheerio from 'cheerio';
import httpAdapter from 'axios/lib/adapters/http';

axios.defaults.adapter = httpAdapter;

const tags = {
  script: 'src',
  img: 'src',
  link: 'href',
};

const types = {
  file: (pageAddress) => {
    const { host, pathname } = url.parse(pageAddress);
    const filename = `${host}${trimEnd(pathname, '/')}`.replace(/\W/g, '-');
    return `${filename}.html`;
  },
  link: (pageAddress) => {
    const { dir, name, ext } = path.parse(pageAddress);
    return `${trimStart(path.join(dir, name), '/')}`.replace(/\W/g, '-').concat(`${ext}`);
  },
  dir: (pageAddress) => {
    const urlAdd = url.parse(pageAddress);
    const filename = `${urlAdd.host}${trimEnd(urlAdd.pathname, '/')}`.replace(/\W/g, '-');
    return `${filename}_files`;
  },
};

export const getName = (pageAddress, type) => types[type](pageAddress);

export default (pageAddress, outputpath) => {
  const loadedLinks = [];
  let localContent;
  const filepath = path.join(outputpath, getName(pageAddress, 'file'));
  const linkDir = getName(pageAddress, 'dir');
  let absoluteLinkPath = '';
  return axios.get(pageAddress)
    .then((response) => {
      const $ = cheerio.load(response.data);
      const listOfTags = Object.keys(tags);
      listOfTags.forEach((tag) => {
        const attribute = tags[tag];
        $(tag).each((index, currentTag) => {
          const link = $(currentTag).attr(attribute);
          if (link && !url.parse(link).host) {
            const linkName = getName(link, 'link');
            const linkPath = path.join(linkDir, linkName);
            loadedLinks.push(link);
            $(currentTag).attr(attribute, linkPath);
          }
        });
      });
      localContent = $.html();
      return fs.mkdir(path.join(outputpath, linkDir));
    })
    .then(() => {
      const linkPromises = loadedLinks.map(link => axios.get(url.resolve(pageAddress, link), { responseType: 'arraybuffer' })
        .then((resp) => {
          const linkName = getName(link, 'link');
          const linkPath = path.join(linkDir, linkName);
          absoluteLinkPath = path.join(outputpath, linkPath);
          return fs.writeFile(absoluteLinkPath, resp.data);
        }));
      return Promise.all(linkPromises);
    })
    .then(() => fs.writeFile(filepath, localContent))
    .catch((error) => {
      console.error(error.message);
    });
};
