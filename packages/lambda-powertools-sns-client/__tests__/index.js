const AWS = require('aws-sdk')

global.console.log = jest.fn()

const mockPublish = jest.fn()
AWS.SNS.prototype.publish = mockPublish

const SNS = require('../index')
const CorrelationIds = require('@kmihaltsov/lambda-powertools-correlation-ids')

beforeEach(() => {
  mockPublish.mockReturnValueOnce({
    promise: async () => Promise.resolve()
  })
})

afterEach(() => {
  mockPublish.mockClear()
  CorrelationIds.clearAll()
})

describe('SNS client', () => {
  describe('.publish', () => {
    describe('when there are no correlationIds', () => {
      it('sends empty MessageAttributes', async () => {
        const params = {
          Message: 'test',
          TopicArn: 'topic-arn'
        }
        await SNS.publish(params).promise()

        expect(mockPublish).toBeCalledWith({
          Message: 'test',
          TopicArn: 'topic-arn',
          MessageAttributes: {}
        })
      })
    })

    describe('when there are global correlationIds', () => {
      it('forwards them in MessageAttributes', async () => {
        CorrelationIds.replaceAllWith({
          'x_correlation_id': 'id',
          'debug-log-enabled': 'true',
          'call-chain-length': 1
        })

        const params = {
          Message: 'test',
          TopicArn: 'topic-arn'
        }
        await SNS.publish(params).promise()

        expect(mockPublish).toBeCalledWith({
          Message: 'test',
          TopicArn: 'topic-arn',
          MessageAttributes: {
            'x_correlation_id': {
              DataType: 'String',
              StringValue: 'id'
            },
            'debug-log-enabled': {
              DataType: 'String',
              StringValue: 'true'
            },
            'call-chain-length': {
              DataType: 'String',
              StringValue: '1'
            }
          }
        })
      })
    })
  })

  describe('.publishWithCorrelationIds', () => {
    it('forwards given correlationIds in MessageAttributes field', async () => {
      const correlationIds = new CorrelationIds({
        'x_correlation_id': 'child-id',
        'debug-log-enabled': 'true',
        'call-chain-length': 1
      })

      const params = {
        Message: 'test',
        TopicArn: 'topic-arn'
      }
      await SNS.publishWithCorrelationIds(correlationIds, params).promise()

      expect(mockPublish).toBeCalledWith({
        Message: 'test',
        TopicArn: 'topic-arn',
        MessageAttributes: {
          'x_correlation_id': {
            DataType: 'String',
            StringValue: 'child-id'
          },
          'debug-log-enabled': {
            DataType: 'String',
            StringValue: 'true'
          },
          'call-chain-length': {
            DataType: 'String',
            StringValue: '1'
          }
        }
      })
    })
  })
})
