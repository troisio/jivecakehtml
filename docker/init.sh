#!/bin/bash

if [ ! -d $SOURCE_DIRECTORY ]; then
  ssh-keyscan github.com >> ~/.ssh/known_hosts
  git clone -b $BRANCH --single-branch $REPOSITORY $SOURCE_DIRECTORY

  if [ ! -z $COMMIT ]; then
      cd $SOURCE_DIRECTORY
      git reset --hard $COMMIT
  fi

  cd $SOURCE_DIRECTORY
  npm install
  cp ~/settings.js $SOURCE_DIRECTORY/app/src/settings.js

  $(npm bin)/gulp production
fi

if [ -a ~/star_jivecake_com.pem ] && [ -a ~/star_jivecake_com.key ]; then
  nginx -g "daemon off;" -c /root/nginx-https.conf
else
  nginx -g "daemon off;" -c /root/nginx.conf
fi