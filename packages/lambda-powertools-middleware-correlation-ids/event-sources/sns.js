const CorrelationIds = require('@kmihaltsov/lambda-powertools-correlation-ids')
const consts = require('../consts')

function isMatch (event) {
  if (!event.hasOwnProperty('Records')) {
    return false
  }

  if (!Array.isArray(event.Records)) {
    return false
  }

  return event.Records[0].EventSource === 'aws:sns'
}

function captureCorrelationIds ({ Records }, { awsRequestId }, sampleDebugLogRate) {
  const correlationIds = { awsRequestId }

  const snsRecord = Records[0].Sns
  const msgAttributes = snsRecord.MessageAttributes

  for (const msgAttribute in msgAttributes) {
    if (msgAttribute.toLowerCase().startsWith('x_correlation_')) {
      correlationIds[msgAttribute] = msgAttributes[msgAttribute].Value
    }
  }

  if (!correlationIds[consts.X_CORRELATION_ID]) {
    correlationIds[consts.X_CORRELATION_ID] = awsRequestId
  }

  CorrelationIds.replaceAllWith(correlationIds)
}

module.exports = {
  isMatch,
  captureCorrelationIds
}
