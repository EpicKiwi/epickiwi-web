#!/bin/bash

echo "Building image"
docker build . -t epickiwi/epickiwi-web

echo "Starting stack"
docker stack deploy --compose-file docker-compose.yml epickiwi-web