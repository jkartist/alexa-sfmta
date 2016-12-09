#!/bin/bash
tsc -t es6 -m commonjs model.ts
node -e 'require("./model.js").buildModel()'
tsc
node -e 'require("./index.js").buildModel()'
