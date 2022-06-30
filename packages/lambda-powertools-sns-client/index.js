process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = '1'
const SNS = require('aws-sdk/clients/sns')
const client = new SNS()
const CorrelationIds = require('@kmihaltsov/lambda-powertools-correlation-ids')

function addCorrelationIds (correlationIds, messageAttributes) {
  const attributes = {}
  const ids = correlationIds.get()
  for (const key in ids) {
    attributes[key] = {
      DataType: 'String',
      StringValue: `${ids[key]}`
    }
  }

  // use `attributes` as base so if the user's message attributes would override
  // our correlation IDs
  return Object.assign(attributes, messageAttributes || {})
}

client._publish = client.publish

client.publish = (...args) => {
  return client.publishWithCorrelationIds(CorrelationIds, ...args)
}

client.publishWithCorrelationIds = (correlationIds, params, ...args) => {
  const newMessageAttributes = addCorrelationIds(correlationIds, params.MessageAttributes)
  const extendedParams = {
    ...params,
    MessageAttributes: newMessageAttributes
  }

  return client._publish(extendedParams, ...args)
}

module.exports = client
