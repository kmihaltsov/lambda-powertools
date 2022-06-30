const CorrelationIds = require('@kmihaltsov/lambda-powertools-correlation-ids')
const Log = require('@kmihaltsov/lambda-powertools-logger')
const consts = require('../consts')

function isMatch (event) {
  return event.hasOwnProperty('httpMethod') && event.requestContext && !event.requestContext.hasOwnProperty('elb')
}

function captureCorrelationIds ({ requestContext, headers }, { awsRequestId }, sampleDebugLogRate) {
  if (!headers) {
    Log.warn(`Request ${awsRequestId} is missing headers`)
    return
  }

  const apiGatewayRequestId = requestContext ? requestContext.requestId : undefined
  const correlationIds = { awsRequestId, apiGatewayRequestId }
  for (const header in headers) {
    if (header.toLowerCase().startsWith('x_correlation_')) {
      correlationIds[header] = headers[header]
    }
  }

  if (!correlationIds[consts.X_CORRELATION_ID]) {
    correlationIds[consts.X_CORRELATION_ID] = apiGatewayRequestId || awsRequestId
  }

  CorrelationIds.replaceAllWith(correlationIds)
}

module.exports = {
  isMatch,
  captureCorrelationIds
}
