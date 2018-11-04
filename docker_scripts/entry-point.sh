#!/bin/bash

(cd src && python -m SimpleHTTPServer 7800 &)
sls offline start
