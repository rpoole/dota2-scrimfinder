#!/bin/bash

# sometimes docker compose will report the container is init 
# when the db isn't
#./docker_scripts/wait-for-it.sh -t 40 db:5432

sls offline start
