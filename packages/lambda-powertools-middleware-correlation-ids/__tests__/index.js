const uuid = require('uuid/v4')
const { invokeHandler } = require('./lib')

global.console.log = jest.fn()

describe('correlation IDs are always initialized', () => {
  describe('when sampleDebugLogRate = 0', () => {
    it('always sets debug-log-enabled to false', () => {
      const requestId = uuid()
      invokeHandler({}, requestId, 0, x => {
        expect(x['awsRequestId']).toBe(requestId)
      })
    })
  })

  it('always initialises it from the awsRequestId', () => {
    const requestId = uuid()
    invokeHandler({}, requestId, 0, x => {
      expect(x['x_correlation_id']).toBe(requestId)
      expect(x['awsRequestId']).toBe(requestId)
    })
  })
})
