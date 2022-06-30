const CorrelationIds = require('@kmihaltsov/lambda-powertools-correlation-ids')
const Log = require('@kmihaltsov/lambda-powertools-logger')
const consts = require('../consts')

function isMatch (event) {
  return typeof event.deliveryStreamArn === 'string' &&
    event.deliveryStreamArn.startsWith('arn:aws:firehose') &&
    Array.isArray(event.records)
}

function captureCorrelationIds ({ records }, context, sampleDebugLogRate) {
  const awsRequestId = context.awsRequestId
  const events = records
    .map(record => {
      const json = Buffer.from(record.data, 'base64').toString('utf8')
      try {
        const event = JSON.parse(json)

        // the wrapped firehose client would put the correlation IDs as part of
        // the payload as a special __context__ property
        const correlationIds = event.__context__ || {}
        correlationIds.awsRequestId = awsRequestId

        delete event.__context__

        if (!correlationIds[consts.X_CORRELATION_ID]) {
          correlationIds[consts.X_CORRELATION_ID] = awsRequestId
        }

        const correlationIdsInstance = new CorrelationIds(correlationIds)

        Object.defineProperties(event, {
          correlationIds: {
            value: correlationIdsInstance,
            enumerable: false
          },
          logger: {
            value: new Log({ correlationIds: correlationIdsInstance }),
            enumerable: false
          }
        })

        return event
      } catch (e) {
        Log.warn(`unable to parse Firehose record`, { firehoseRecord: record })
        // TODO: is this really the best we can do? maybe we need to record these failed
        // records somewhere else, maybe in a failedFirehoseEvents array on the context?
        return undefined
      }
    })

  context.parsedFirehoseEvents = events

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
