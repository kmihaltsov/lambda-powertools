#!/bin/sh
cd nodejs

echo 'installing DAZN powertools'
npm install @kmihaltsov/lambda-powertools-cloudwatchevents-client
npm install @kmihaltsov/lambda-powertools-correlation-ids
npm install @kmihaltsov/lambda-powertools-dynamodb-client
npm install @kmihaltsov/lambda-powertools-eventbridge-client
npm install @kmihaltsov/lambda-powertools-firehose-client
npm install @kmihaltsov/lambda-powertools-http-client
npm install @kmihaltsov/lambda-powertools-kinesis-client
npm install @kmihaltsov/lambda-powertools-lambda-client
npm install @kmihaltsov/lambda-powertools-logger
npm install @kmihaltsov/lambda-powertools-middleware-correlation-ids
npm install @kmihaltsov/lambda-powertools-middleware-log-timeout
npm install @kmihaltsov/lambda-powertools-middleware-obfuscater
npm install @kmihaltsov/lambda-powertools-middleware-sample-logging
npm install @kmihaltsov/lambda-powertools-middleware-stop-infinite-loop
npm install @kmihaltsov/lambda-powertools-pattern-basic
npm install @kmihaltsov/lambda-powertools-pattern-obfuscate
npm install @kmihaltsov/lambda-powertools-sns-client
npm install @kmihaltsov/lambda-powertools-sqs-client
npm install @kmihaltsov/lambda-powertools-step-functions-client

cd ..
cd ..

echo "current path:" `pwd`
VERSION=`cat lerna.json | jq -r '.version'`
echo "current lerna version is:" $VERSION

cd layer
echo "current path:" `pwd`
echo "incrementing template.yml's version"
PATTERN="<VERSION>"
sed "s/${PATTERN}/${VERSION}/g" template.txt >> template.yml

zip -rq layer.zip nodejs

npm run package
npm run publish
