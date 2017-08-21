import express from 'express';
import fs from 'fs';

import indexTemplate from './template/index.js';
import applicationTemplate from './template/application.js';
import indexHtml from './partial/index.html';
import privacyHtml from './partial/privacy.html';
import faqHtml from './partial/faq.html';
import termsHtml from './partial/terms.html';
import html404 from './partial/404.html';
import headerHtml from './partial/header.html';
import settings from '../web/src/settings.js';
import EventService from './service/EventService';

const application = express();
const eventService = new EventService(settings.jivecakeapi.uri);

const indexBody = indexTemplate({
  lang: 'en',
  description: 'Event registration',
  locale: 'en_US',
  title: 'JiveCake',
  content: indexHtml,
  header: headerHtml
});

application.get('/', function(_, response) {
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.send(indexBody);
});

application.get('/e/:hash', function(request, response) {
  response.setHeader('Content-Type', 'text/html; charset=utf-8');

  eventService.getByHash(request.params.hash).then((event) => {
    return applicationTemplate({
      lang: 'en',
      locale: 'en_US',
      description: event.name,
      title: event.name,
      image: 'https://jivecake.com/assets/chrome/icon144.png'
    });
  }, () => {
    return applicationTemplate({
      lang: 'en',
      locale: 'en-US',
      description: 'Event registration',
      title: 'JiveCake',
      image: 'https://jivecake.com/assets/chrome/icon144.png'
    });
  }).then((body) => {
    response.send(body);
  });
});

application.get('/privacy', function(_, response) {
  const body = indexTemplate({
    lang: 'en',
    description: 'Privacy',
    locale: 'en_US',
    title: 'Privacy',
    content: privacyHtml,
    header: ''
  });

  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.send(body);
});

application.get('/faq', function(_, response) {
  const body = indexTemplate({
    lang: 'en',
    description: 'Frequently Asked Questions',
    locale: 'en_US',
    title: 'Frequently Asked Questions',
    content: faqHtml,
    header: ''
  });

  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.send(body);
});

application.get('/terms', function(_, response) {
  const body = indexTemplate({
    lang: 'en',
    description: 'Terms of Service',
    locale: 'en_US',
    title: 'Terms of Service',
    content: termsHtml,
    header: ''
  });

  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.send(body);
});

application.get('/blog/:id', function(request, response) {
  const path = 'service/partial/blog/' + request.params.id;
  fs.readFile(path, 'utf8', function (error, data) {
    let options;

    if (error) {
      options = {
        lang: 'en',
        description: 'Event registration',
        locale: 'en_US',
        title: 'Not Found',
        content: html404,
        header: headerHtml
      };
    } else {
      options = {
        lang: 'en',
        description: 'Event registration',
        locale: 'en_US',
        title: 'Blog',
        content: data,
        header: headerHtml
      }
    }

    const body = indexTemplate(options);
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.status(404).send(body);
  });
});


export default application;