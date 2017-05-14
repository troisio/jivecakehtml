#!/bin/bash

if [ ! -d $SOURCE_DIRECTORY ]; then
  ssh-keyscan github.com >> ~/.ssh/known_hosts
  git clone -b $BRANCH --single-branch $REPOSITORY $SOURCE_DIRECTORY
  cp -R ~/node_modules $SOURCE_DIRECTORY/node_modules

  if [ ! -z $COMMIT ]; then
      cd $SOURCE_DIRECTORY
      git reset --hard $COMMIT
  fi

  cd $SOURCE_DIRECTORY
  npm install
  mv ~/settings.js $SOURCE_DIRECTORY/app/src/settings.js
  mv ~/server-settings.js $SOURCE_DIRECTORY/app/src/settings.js

  $(npm bin)/gulp production
fi

cd $SOURCE_DIRECTORY

if [ -a ~/star_jivecake_com.pem ] && [ -a ~/star_jivecake_com.key ]; then
  nginx -c /root/nginx-https.conf
else
  nginx -c /root/nginx.conf
fi

/usr/local/go/bin/go run server.go