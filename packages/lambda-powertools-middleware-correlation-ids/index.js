const CorrelationIds = require('@kmihaltsov/lambda-powertools-correlation-ids')
const generic = require('./event-sources/generic')
const eventSources = [
  require('./event-sources/api-gateway'),
  require('./event-sources/alb'),
  require('./event-sources/sns'),
  require('./event-sources/sqs'),
  require('./event-sources/kinesis'),
  require('./event-sources/dynamodb'),
  require('./event-sources/firehose'),
  require('./event-sources/eventbridge'),
  require('./event-sources/direct-invoke')
]

module.exports = ({ sampleDebugLogRate }) => {
  return {
    before: async (request) => {
      CorrelationIds.clearAll()

      const { event, context } = request
      const eventSource = eventSources.find(evtSrc => evtSrc.isMatch(event))
      if (eventSource) {
        eventSource.captureCorrelationIds(event, context, sampleDebugLogRate)
      } else {
        generic.captureCorrelationIds(event, context, sampleDebugLogRate)
      }
    }
  }
}
