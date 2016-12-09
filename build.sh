#!/bin/bash

BUILD_DIR=./dist
STAGE_DIR=$BUILD_DIR/stage
PACKAGE=../alexa-sfmta-llambda.zip

tsc
mkdir -p $STAGE_DIR
cp package.json $STAGE_DIR
cp ./*.js $STAGE_DIR
pushd $STAGE_DIR
npm install --production
zip -r $PACKAGE .
popd
