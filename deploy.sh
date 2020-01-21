#!/bin/bash
set -e

echo "Building image"
docker build . -t epickiwi/epickiwi-web

echo "Starting stack"
docker stack deploy --compose-file docker-compose.yml epickiwi-web

echo "Killing remaining containers"
docker ps | grep "epickiwi-web_" | cut -d' ' -f1 | xargs docker rm -f