import axios from 'axios';
import path from 'path';
import url from 'url';
import debug from 'debug';
import Listr from 'listr';
import { trimStart, trimEnd } from 'lodash';
import { promises as fs } from 'fs';
import cheerio from 'cheerio';
import httpAdapter from 'axios/lib/adapters/http';

axios.defaults.adapter = httpAdapter;

const loadlog = debug('page-loader:download');
const getlog = debug('page-loader:get');
const createlog = debug('page-loader:create');


const tags = {
  script: 'src',
  img: 'src',
  link: 'href',
};

const types = {
  main: (pageAddress) => {
    const { host, pathname } = url.parse(pageAddress);
    return `${host}${trimEnd(pathname, '/')}`.replace(/\W/g, '-');
  },
  file: pageAddress => `${types.main(pageAddress)}.html`,
  link: (pageAddress) => {
    const { dir, name, ext } = path.parse(pageAddress);
    return `${trimStart(path.join(dir, name), '/')}`.replace(/\W/g, '-').concat(`${ext}`);
  },
  dir: pageAddress => `${types.main(pageAddress)}_files`,
};

export const getName = (pageAddress, type) => types[type](pageAddress);

const getDOMContent = data => cheerio.load(data);

export default (pageAddress, outputpath) => {
  const loadedLinks = [];
  let localContent;
  const filepath = path.join(outputpath, getName(pageAddress, 'file'));
  const linkDir = getName(pageAddress, 'dir');
  let absoluteLinkPath = '';
  return axios.get(pageAddress)
    .then((response) => {
      getlog('response from', pageAddress);
      loadlog('to ', outputpath);
      const $ = getDOMContent(response.data);
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
            getlog('link: ', link);
          }
        });
      });
      localContent = $.html();
      createlog('directory for downloading page content: ', path.join(outputpath, linkDir));
      return fs.mkdir(path.join(outputpath, linkDir));
    })
    .then(() => {
      const tasks = new Listr(loadedLinks.map(link => ({
        title: `downloading ${link}`,
        task: () => axios.get(url.resolve(pageAddress, link), { responseType: 'arraybuffer' })
          .then((resp) => {
            const linkName = getName(link, 'link');
            const linkPath = path.join(linkDir, linkName);
            absoluteLinkPath = path.join(outputpath, linkPath);
            loadlog(`${link} content to ${absoluteLinkPath}`);
            return fs.writeFile(absoluteLinkPath, resp.data);
          })
          .catch((error) => {
            const message = `The error occured: ${error.message}`;
            throw new Error(message);
          }),
      })), { concurrent: true });

      return tasks.run();
    })
    .then(() => {
      loadlog('page to: ', filepath);
      return fs.writeFile(filepath, localContent);
    })
    .catch((error) => {
      const message = `The error occured: ${error.message}`;
      throw new Error(message);
    });
};
