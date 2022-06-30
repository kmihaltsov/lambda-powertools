process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = '1'
const Lambda = require('aws-sdk/clients/lambda')
const client = new Lambda({
  endpoint: process.env.IS_OFFLINE ? 'http://localhost:3000' : undefined
})
const Log = require('@kmihaltsov/lambda-powertools-logger')
const CorrelationIds = require('@kmihaltsov/lambda-powertools-correlation-ids')

function tryJsonParse (input) {
  if (typeof input !== 'string') {
    return null
  }

  try {
    return JSON.parse(input)
  } catch (err) {
    Log.warn('only JSON string data can be modified to insert correlation IDs', null, err)
    return null
  }
}

function addCorrelationIds (correlationIds, input) {
  // only do this with JSON string data
  const payload = tryJsonParse(input)
  if (!payload) {
    return input
  }

  const ids = correlationIds.get()
  const newPayload = {
    __context__: ids,
    ...payload
  }
  return JSON.stringify(newPayload)
}

client._invoke = client.invoke

client.invoke = (...args) => {
  return client.invokeWithCorrelationIds(CorrelationIds, ...args)
}

client.invokeWithCorrelationIds = (correlationIds, params, ...args) => {
  const newPayload = addCorrelationIds(correlationIds, params.Payload)
  const extendedParams = {
    ...params,
    Payload: newPayload
  }

  return client._invoke(extendedParams, ...args)
}

client._invokeAsync = client.invokeAsync

client.invokeAsync = (...args) => {
  return client.invokeAsyncWithCorrelationIds(CorrelationIds, ...args)
}

client.invokeAsyncWithCorrelationIds = (correlationIds, params, ...args) => {
  const newPayload = addCorrelationIds(correlationIds, params.InvokeArgs)
  const extendedParams = {
    ...params,
    InvokeArgs: newPayload
  }

  return client._invokeAsync(extendedParams, ...args)
}

module.exports = client
