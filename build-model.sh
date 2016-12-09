#!/bin/bash
tsc -t es6 -m commonjs model.ts
if [[ $? -ne 0 ]]; then
  exit 1
fi
node -e 'require("./model.js").buildModel()'
tsc
if [[ $? -ne 0 ]]; then
  exit 1
fi
node -e 'require("./index.js").buildModel()'
