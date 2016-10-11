### Things You Should Know

Before working on this project, you should be familiar with [docker](https://www.docker.com), [javascript](https://developer.mozilla.org/en-US/docs/Web/JavaScript), [angularJS 1](https://angularjs.org), [gulp](http://gulpjs.com/), [git](https://git-scm.com/doc), [OAuth 2.0](https://oauth.net/2), HTTP, and using a linux terminal

You will also need an [auth0](https://auth0.com) account and will need to configure a web client.
Create a `single page application` web client.
Under that client set the following:

- Allowed Logout URLs: `{yourOrigin}`
- Allowed callback URLs: `{yourOrigin}/oauth/redirect, {yourOrigin}oauth/redirect`, e.g., `http://127.0.0.1/oauth/redirect, https://localhost/oauth/redirect`

We only use Google and FaceBook for social identity logins

In your auth0 account, go to Connection -> Social -> FaceBook and enable the `email` attribute

### Required Software

Run your project via [docker](https://docker.com).

To watch local changes to your project you'll need [nodejs](https:/.nodejs.org) on your development machine. A `nodejs` install will also come with `npm`.

You will also need to run [jivecakepi](https://github.com/troisio/jivecakeapi) for this client.

### Running

Read `DOCKER.md` to read about how to run this project
You'll need to change the settings file location in `app/src/settings.js`
After you read it, and you successfully have a container hosting your files, go to the root of this project and

```sh
rm -rf node_modules
npm install
cp -R node_modules app/node_modules
$(npm bin)/gulp
```

This will start watching your files and reloading them. We use [livereload](http://livereload.com), so this process will attempt to bind to websocket port after your start livereload in chrome

You'll need to install [node v6.1.0](https://nodejs.org) and whatever version of npm that comes with, (eventually this installation process will be moved to the container itself)

### Testing

We're working on it dude