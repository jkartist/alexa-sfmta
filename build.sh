#!/bin/bash

BUILD_DIR=./dist
STAGE_DIR=$BUILD_DIR/stage
PACKAGE=../alexa-sfmta-llambda.zip
BUILD_CMD="npm install"

if hash yarn 2>/dev/null; then
  BUILD_CMD="yarn"
fi

tsc

if [[ $? -ne 0 ]]; then
  exit 1
fi

mkdir -p $STAGE_DIR
cp package.json $STAGE_DIR
cp ./*.js $STAGE_DIR
pushd $STAGE_DIR
$BUILD_CMD --production
zip -r $PACKAGE .
popd
