const _ = require('lodash')
const uuid = require('uuid/v4')
const { invokeHandler } = require('./lib')

global.console.log = jest.fn()

const alb = require('./event-templates/alb.json')
const genAlbEvent = (correlationIds = {}) => {
  const event = _.cloneDeep(alb)
  event.headers = correlationIds
  return event
}

describe('Correlation IDs middleware (ALB)', () => {
  describe('when sampleDebugLogRate = 0', () => {
    it('always sets debug-log-enabled to false', () => {
      const requestId = uuid()
      const event = genAlbEvent()
      invokeHandler(event, requestId, 0, x => {
        expect(x['awsRequestId']).toBe(requestId)
        expect(x['x_correlation_id']).toBe(requestId)
      })
    })
  })

  describe('when sampleDebugLogRate = 1', () => {
    it('always sets debug-log-enabled to true', () => {
      const requestId = uuid()
      const event = genAlbEvent()
      invokeHandler(event, requestId, 1, x => {
        expect(x['awsRequestId']).toBe(requestId)
        expect(x['x_correlation_id']).toBe(requestId)
      })
    })
  })

  describe('when correlation ID is not provided in the event', () => {
    it('sets it to the AWS Request ID', () => {
      const requestId = uuid()
      const event = genAlbEvent()
      invokeHandler(event, requestId, 0, x => {
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
        'x_correlation_user-id': userId,
        'user-agent': 'jest test',
        'debug-log-enabled': 'true'
      }

      const event = genAlbEvent(correlationIds)

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
        'x_correlation_id': id,
        'call-chain-length': 1
      }

      const event = genAlbEvent(correlationIds)

      const requestId = uuid()
      invokeHandler(event, requestId, 0, x => {
        expect(x['x_correlation_id']).toBe(id)
        expect(x['call-chain-length']).toBe(2)
      })
    })
  })
})
