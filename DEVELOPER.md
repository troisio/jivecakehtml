### Things You Should Know

Before working on this project, you should be familiar with [docker](https://www.docker.com), [javascript](https://developer.mozilla.org/en-US/docs/Web/JavaScript), [angularJS 1](https://angularjs.org), [gulp](http://gulpjs.com/), [git](https://git-scm.com/doc), [OAuth 2.0](https://oauth.net/2), HTTP, and using a linux terminal

You will also need an [auth0](https://auth0.com) account and will need to configure a web client.
Create a `single page application` web client.
Under that client set the following:

- Allowed Logout URLs: `projectHost:port.com`
- Allowed callback URLs: `https://projectHost:port/oauth/redirect, http://projectHost:port/oauth/redirect`
- If you're running on docker, the projectHost:port will probably just be `192.168.99.100`

We only use Google and FaceBook for social identity logins

In your auth0 account, go to Connection -> Social -> FaceBook and enable the `email` attribute

### Required Software

I would tell you what this is but it's best to run your project via `docker`. Go read `DOCKER.md`. If you're going to be a ding dong and not do this, then you'll need `npm`, `nodejs`, `nginx`. I would tell you what versions but you can just go to the `docker` directory and see what all the dependency versions are.

You will also need to run the api for this client

Check it out [here](https://github.com/troisio/jivecakeapi)

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