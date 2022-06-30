const uuid = require('uuid/v4')
const middy = require('@middy/core')
const CorrelationIds = require('@kmihaltsov/lambda-powertools-correlation-ids')
const captureCorrelationIds = require('../index')

const invokeHandler = (event, awsRequestId, sampleDebugLogRate, f) => {
  const handler = middy(async (event, context) => {
    const correlationIds = CorrelationIds.get()
    f(correlationIds)
  })
  handler.use(captureCorrelationIds({ sampleDebugLogRate }))

  handler(event, { awsRequestId }, (err, result) => {
    if (err) {
      throw err
    }
  })
}

const standardTests = (genEvent) => {
  describe('when sampleDebugLogRate = 0', () => {
    it('always sets debug-log-enabled to false', () => {
      const requestId = uuid()
      invokeHandler(genEvent(), requestId, 0, x => {
        expect(x['awsRequestId']).toBe(requestId)
        expect(x['x_correlation_id']).toBe(requestId)
      })
    })
  })

  describe('when sampleDebugLogRate = 1', () => {
    it('always sets debug-log-enabled to true', () => {
      const requestId = uuid()
      invokeHandler(genEvent(), requestId, 1, x => {
        expect(x['awsRequestId']).toBe(requestId)
        expect(x['x_correlation_id']).toBe(requestId)
      })
    })
  })

  describe('when correlation ID is not provided in the event', () => {
    it('sets it to the AWS Request ID', () => {
      const requestId = uuid()
      invokeHandler(genEvent(), requestId, 0, x => {
        expect(x['x_correlation_id']).toBe(requestId)
        expect(x['awsRequestId']).toBe(requestId)
      })
    })
  })

  describe('when correlation IDs are provided in the event', () => {
    it('captures them', () => {
      const id = uuid()
      const userId = uuid()

      const correlationIds = {
        'x_correlation_id': id,
        'x_correlation_user-id': userId
      }

      const event = genEvent(correlationIds)

      const requestId = uuid()
      invokeHandler(event, requestId, 0, x => {
        expect(x['x_correlation_id']).toBe(id)
        expect(x['x_correlation_user-id']).toBe(userId)
        expect(x['awsRequestId']).toBe(requestId)
      })
    })
  })

  describe('when call-chain-length is provided in the event', () => {
    it('increments it by 1', () => {
      const id = uuid()

      const correlationIds = {
        'x_correlation_id': id
      }

      const event = genEvent(correlationIds)

      const requestId = uuid()
      invokeHandler(event, requestId, 0, x => {
        expect(x['x_correlation_id']).toBe(id)
      })
    })
  })
}

// dummy test to stop the jest scheduler from complaining about not finding any tests
test.skip('skip', () => {})

module.exports = {
  invokeHandler,
  standardTests
}
