#!/bin/bash

ids=$(docker ps --filter="name=jivecakehtml" -qa)

if [ "$ids" != "" ]; then
    docker stop "$ids"
    docker rm "$ids"
fi

docker run \
    -it \
    -p 80:80 \
    --name=jivecakehtml \
    -v $(dirname $(pwd)):/root/jivecakehtml \
    jivecakehtml
