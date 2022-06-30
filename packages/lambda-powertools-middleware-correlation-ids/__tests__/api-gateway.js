const _ = require('lodash')
const uuid = require('uuid/v4')
const { invokeHandler } = require('./lib')

global.console.log = jest.fn()

const apig = require('./event-templates/apig.json')
const genApiGatewayEvent = (correlationIds = {}) => {
  const event = _.cloneDeep(apig)
  event.headers = correlationIds
  return event
}

describe('Correlation IDs middleware (API Gateway)', () => {
  describe('when sampleDebugLogRate = 0', () => {
    it('always sets debug-log-enabled to false', () => {
      const requestId = uuid()
      const event = genApiGatewayEvent()
      invokeHandler(event, requestId, 0, x => {
        expect(x['awsRequestId']).toBe(requestId)
        expect(x['x_correlation_id']).toBe(event.requestContext.requestId)
      })
    })
  })

  describe('when sampleDebugLogRate = 1', () => {
    it('always sets debug-log-enabled to true', () => {
      const requestId = uuid()
      const event = genApiGatewayEvent()
      invokeHandler(event, requestId, 1, x => {
        expect(x['awsRequestId']).toBe(requestId)
        expect(x['x_correlation_id']).toBe(event.requestContext.requestId)
      })
    })
  })

  describe('when correlation ID is not provided in the event', () => {
    it('sets it to the API Gateway Request ID', () => {
      const requestId = uuid()
      const event = genApiGatewayEvent()
      invokeHandler(event, requestId, 0, x => {
        expect(x['x_correlation_id']).toBe(event.requestContext.requestId)
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

      const event = genApiGatewayEvent(correlationIds)

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

      const event = genApiGatewayEvent(correlationIds)

      const requestId = uuid()
      invokeHandler(event, requestId, 0, x => {
        expect(x['x_correlation_id']).toBe(id)
      })
    })
  })
})
