#!/bin/bash

ids=$(docker ps --filter="name=jivecakeweb" -qa)

if [ "$ids" != "" ]; then
    docker stop "$ids"
    docker rm "$ids"
fi

docker run \
    -it \
    -p 80:80 \
    --name=jivecakeweb \
    -v $(dirname $(pwd)):/root/jivecakeweb \
    jivecakeweb