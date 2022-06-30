const CorrelationIds = require('@kmihaltsov/lambda-powertools-correlation-ids')
const consts = require('../consts')

function isMatch (event) {
  if (!event.hasOwnProperty('detail') ||
      !event.hasOwnProperty('detail-type') ||
      !event.hasOwnProperty('source')) {
    return false
  }

  return true
}

function captureCorrelationIds ({ detail }, { awsRequestId }, sampleDebugLogRate) {
  const correlationIds = detail['__context__'] || {}
  correlationIds.awsRequestId = awsRequestId
  if (!correlationIds[consts.X_CORRELATION_ID]) {
    correlationIds[consts.X_CORRELATION_ID] = awsRequestId
  }

  CorrelationIds.replaceAllWith(correlationIds)
}

module.exports = {
  isMatch,
  captureCorrelationIds
}
