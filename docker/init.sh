#!/bin/bash

if [ ! -d $SOURCE_DIRECTORY ]; then
  ssh-keyscan github.com >> ~/.ssh/known_hosts
  ssh-keyscan bitbucket.com >> ~/.ssh/known_hosts
  git clone -b $BRANCH --single-branch $REPOSITORY $SOURCE_DIRECTORY

  if [ ! -z $COMMIT ]; then
      cd $SOURCE_DIRECTORY
      git reset --hard $COMMIT
  fi

  cd $SOURCE_DIRECTORY
  npm install
  cp -R node_modules app/node_modules
  sed --i \
    -e s#\$APIURI#$APIURI#g \
    -e s#\$GA_ENABLED#$GA_ENABLED#g \
    -e s#\$AUTH0CLIENTID#$AUTH0CLIENTID#g \
    -e s#\$AUTH0DOMAIN#$AUTH0DOMAIN#g \
    -e s#\$PAYPALMOCK#$PAYPALMOCK#g \
    $SOURCE_DIRECTORY/app/src/settings.js
  $(npm bin)/gulp production
fi

if [ -d "$TLS_DIRECTORY" ]; then
  nginx -g "daemon off;" -c /root/tls-nginx.conf
else
  nginx -g "daemon off;" -c /root/nginx.conf
fi