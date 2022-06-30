const CorrelationIds = require('@kmihaltsov/lambda-powertools-correlation-ids')
const consts = require('../consts')

function isMatch (event) {
  return true
}

function captureCorrelationIds (event, { awsRequestId }, sampleDebugLogRate) {
  const correlationIds = { awsRequestId }
  correlationIds[consts.X_CORRELATION_ID] = awsRequestId

  CorrelationIds.replaceAllWith(correlationIds)
}

module.exports = {
  isMatch,
  captureCorrelationIds
}
