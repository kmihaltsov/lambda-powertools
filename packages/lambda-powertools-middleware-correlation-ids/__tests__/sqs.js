const _ = require('lodash')
const uuid = require('uuid/v4')
const middy = require('@middy/core')
const CorrelationIds = require('@kmihaltsov/lambda-powertools-correlation-ids')
const captureCorrelationIds = require('../index')

global.console.log = jest.fn()

const sqs = require('./event-templates/sqs.json')
const sqsWithoutRawDelivery = require('./event-templates/sqs-wrapped-sns.json')
const genSqsEvent = (wrappedSns, correlationIDs = {}) => {
  if (wrappedSns) {
    const event = _.cloneDeep(sqsWithoutRawDelivery)
    const body = JSON.parse(event.Records[0].body)

    body.MessageAttributes = _.mapValues(correlationIDs, value => ({
      Type: 'String',
      Value: value
    }))

    event.Records[0].body = JSON.stringify(body)

    return event
  } else {
    const event = _.cloneDeep(sqs)

    event.Records[0].messageAttributes = _.mapValues(correlationIDs, value => ({
      stringValue: value,
      stringListValues: [],
      binaryListValues: [],
      dataType: 'String'
    }))

    return event
  }
}

const sqsTests = (wrappedSns = false) => {
  describe('when sampleDebugLogRate = 0', () => {
    it('always sets debug-log-enabled to false', async () => {
      const requestId = uuid()
      await invokeSqsHandler(genSqsEvent(wrappedSns), requestId, 0,
        x => {
          expect(x['awsRequestId']).toBe(requestId)
        },
        record => {
          const x = record.correlationIds.get()
          expect(x['awsRequestId']).toBe(requestId)
        })
    })
  })

  describe('when correlation ID is not provided in the event', () => {
    it('sets it to the AWS Request ID', async () => {
      const requestId = uuid()
      await invokeSqsHandler(genSqsEvent(wrappedSns), requestId, 0,
        x => {
          // correlation IDs at the handler level
          expect(x['x_correlation_id']).toBe(requestId)
          expect(x['awsRequestId']).toBe(requestId)
        },
        record => {
          const x = record.correlationIds.get()
          // correlation IDs at the record level should just take from the handler
          expect(x['x_correlation_id']).toBe(requestId)
          expect(x['awsRequestId']).toBe(requestId)
        })
    })
  })

  describe('when correlation IDs are provided in the event', () => {
    let handlerCorrelationIds
    let record
    let id
    let userId
    let requestId

    beforeEach(async () => {
      id = uuid()
      userId = uuid()

      const correlationIds = {
        'x_correlation_id': id,
        'x_correlation_user-id': userId
      }

      const event = genSqsEvent(wrappedSns, correlationIds)
      requestId = uuid()
      await invokeSqsHandler(event, requestId, 0, x => {
        handlerCorrelationIds = x
      }, aRecord => {
        record = aRecord
      })
    })

    it('still has the correct handler correlation IDs', () => {
      expect(handlerCorrelationIds['x_correlation_id']).toBe(requestId)
      expect(handlerCorrelationIds['awsRequestId']).toBe(requestId)
    })

    it('captures them on the record', () => {
      const x = record.correlationIds.get()
      // correlation IDs at the record level should match what was passed in
      expect(x['x_correlation_id']).toBe(id)
      expect(x['x_correlation_user-id']).toBe(userId)

      expect(x['awsRequestId']).toBe(requestId)
    })

    it('sets correlationIds as a non-enumerable property', () => {
      expect(record).toHaveProperty('correlationIds')
      expect(record.propertyIsEnumerable('correlationIds')).toBe(false)
    })

    it('sets logger as a non-enumerable property', () => {
      expect(record).toHaveProperty('logger')
      expect(record.propertyIsEnumerable('logger')).toBe(false)
      expect(record.logger.correlationIds).toBe(record.correlationIds)
    })
  })
}

const sqsWrappedSnsTests = () => {
  sqsTests(true)

  describe('when correlation ID is not provided in the event and message attributes are set in the event body', () => {
    it('does not modify sqs record message attributes', async () => {
      const messageAttributes = {
        'att1': 'value1',
        'att2': 'value2',
        'att3': 'value3'
      }

      const event = genSqsEvent(true)
      const body = JSON.parse(event.Records[0].body)
      body.MessageAttributes = _.mapValues(messageAttributes, value => ({
        Type: 'String',
        Value: value
      }))
      event.Records[0].body = JSON.stringify(body)

      await invokeSqsHandler(event, uuid(), 0,
        () => ({}),
        record => {
          expect(record.messageAttributes).toEqual({})
        })
    })
  })
}

const invokeSqsHandler = async (event, awsRequestId, sampleDebugLogRate, handlerF, recordF) => {
  const handler = middy(async (event, context) => {
    // check the correlation IDs outside the context of a record are correct
    handlerF(CorrelationIds.get())

    event.Records.forEach(record => {
      recordF(record)
    })

    // check the correlation IDs outside the context of a record are correct
    handlerF(CorrelationIds.get())
  })
  handler.use(captureCorrelationIds({ sampleDebugLogRate }))

  await handler(event, { awsRequestId })
}

describe('Correlation IDs middleware (SQS)', () => {
  sqsTests()
})

describe('Correlation IDs middleware (SQS wrapped SNS message)', () => {
  sqsWrappedSnsTests()
})
