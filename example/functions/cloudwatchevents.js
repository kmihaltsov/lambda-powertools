const SNS = require('@kmihaltsov/lambda-powertools-sns-client')
const wrap = require('@kmihaltsov/lambda-powertools-pattern-basic')
const Log = require('@kmihaltsov/lambda-powertools-logger')
const CorrelationIds = require('@kmihaltsov/lambda-powertools-correlation-ids')

module.exports.handler = wrap(async (event, context) => {
  console.log(JSON.stringify(event))

  CorrelationIds.set('sns-sender', 'cloudwatchevents')
  Log.debug('publishing cloudwatchevents event as SNS message...', { event })

  const req = {
    Message: JSON.stringify(event),
    TopicArn: process.env.TOPIC_ARN
  }
  return SNS.publish(req).promise()
})
