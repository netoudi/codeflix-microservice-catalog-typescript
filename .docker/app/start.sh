#!/bin/bash

## install dependencies
if [ ! -d "node_modules" ]; then
  npm ci
fi

tail -f /dev/null
