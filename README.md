#### JiveCake Web Project

#### Install

```sh
npm install
cd docker
docker build -t jivecakehtml .
```

#### Watch your files for changes

```sh
$(npm bin)/webpack --env.sourceMap --watch
```

#### Run the nginx / go server

```sh
docker run \
    -it \
    --rm \
    -p 80:80 \
    --name=jivecakehtml \
    -v $(pwd):/root/jivecakehtml \
    jivecakehtml
```

### Settings

You need to fill out `app/src/settings.js`

You also need to run [jivecakeapi](https://github.com/troisio/jivecakeapi). That's what `jivecakeapi.uri` is for in the settings file.

### Things You Should Know

Before working on this project, you should be familiar with [docker](https://www.docker.com), [javascript](https://developer.mozilla.org/en-US/docs/Web/JavaScript), [angularJS 1](https://angularjs.org), [webpack](https://webpack.js.org), [git](https://git-scm.com/doc), [OAuth 2.0](https://oauth.net/2), HTTP, and using a linux terminal

You will also need an [auth0](https://auth0.com) account and will need to configure a web client.
Create a `single page application` web client.
Under that client set the following:

- Allowed Logout URLs: `{yourOrigin}`
- Allowed callback URLs: `{yourOrigin}/oauth/redirect`, e.g., `http://127.0.0.1/oauth/redirect, https://localhost/oauth/redirect`

In your auth0 account, go to Connection -> Social -> FaceBook and enable the `email` attribute