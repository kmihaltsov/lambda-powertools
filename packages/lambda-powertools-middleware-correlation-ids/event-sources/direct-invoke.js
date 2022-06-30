const CorrelationIds = require('@kmihaltsov/lambda-powertools-correlation-ids')
const consts = require('../consts')

function isMatch (event) {
  return event.hasOwnProperty('__context__')
}

function captureCorrelationIds ({ __context__ }, { awsRequestId }, sampleDebugLogRate) {
  const correlationIds = __context__ || {}
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
