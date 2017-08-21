#### JiveCake Web Project

#### Watch your server files for changes

```sh
$(npm bin)/webpack --config webpack.server-confg.js
```

#### Watch your web files for changes

```sh
$(npm bin)/webpack --config webpack.web-confg.js
```

#### Install

```sh
npm install
cd docker
docker build -t jivecakehtml .
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

You need to fill out `web/src/settings.js`