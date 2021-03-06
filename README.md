#### JiveCake Web Project

#### Dependencies
 - [nodejs / npm](https://nodejs.org/en/download/)
 - [docker](https://www.docker.com/)

#### Watch your server files for changes

```sh
$(npm bin)/webpack --watch --config webpack.server-confg.js
```

#### Watch your web files for changes

```sh
$(npm bin)/webpack --watch --config webpack.web-config.js
```

#### Install

```sh
npm install
cd docker
docker build -t jivecakehtml .
```

#### Run the nginx / nodejs server

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

You need to fill out `web/src/settings.js`
