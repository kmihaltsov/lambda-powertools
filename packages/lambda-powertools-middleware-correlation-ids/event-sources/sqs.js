const CorrelationIds = require('@kmihaltsov/lambda-powertools-correlation-ids')
const Log = require('@kmihaltsov/lambda-powertools-logger')
const consts = require('../consts')

function isMatch (event) {
  if (!event.hasOwnProperty('Records')) {
    return false
  }

  if (!Array.isArray(event.Records)) {
    return false
  }

  return event.Records[0].eventSource === 'aws:sqs'
}

function captureCorrelationIds (event, context, sampleDebugLogRate) {
  const awsRequestId = context.awsRequestId
  event.Records.forEach(record => {
    // the wrapped sqs client would put the correlation IDs in the MessageAttributes
    const msgAttributes = { ...record.messageAttributes }
    const correlationIds = { awsRequestId }

    // try retrieve message attributes from sns->sqs subscriptions
    // where raw message delivery is disabled
    if (Object.entries(msgAttributes).length === 0) {
      let body = {}
      try {
        body = JSON.parse(record.body)
      } catch (e) {
      }

      if (body.hasOwnProperty('MessageAttributes') &&
        body.hasOwnProperty('TopicArn') &&
        body.TopicArn.startsWith('arn:aws:sns')
      ) {
        for (const bodyMsgAttribute in body.MessageAttributes) {
          const stringValue = body.MessageAttributes[bodyMsgAttribute].Value
          msgAttributes[bodyMsgAttribute] = { stringValue }
        }
      }
    }

    for (const msgAttribute in msgAttributes) {
      if (msgAttribute.toLowerCase().startsWith('x_correlation_')) {
        correlationIds[msgAttribute] = msgAttributes[msgAttribute].stringValue
      }
    }

    if (!correlationIds[consts.X_CORRELATION_ID]) {
      correlationIds[consts.X_CORRELATION_ID] = awsRequestId
    }

    const correlationIdsInstance = new CorrelationIds(correlationIds)

    Object.defineProperties(record, {
      correlationIds: {
        value: correlationIdsInstance,
        enumerable: false
      },
      logger: {
        value: new Log({ correlationIds: correlationIdsInstance }),
        enumerable: false
      }
    })
  })

  // although we're going to have per-record correlation IDs, the default one for the function
  // should still have the awsRequestId at least
  CorrelationIds.replaceAllWith({
    [consts.X_CORRELATION_ID]: awsRequestId,
    awsRequestId
  })
}

module.exports = {
  isMatch,
  captureCorrelationIds
}
