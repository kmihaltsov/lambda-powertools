const Log = require('@kmihaltsov/lambda-powertools-logger')
const Lambda = require('@kmihaltsov/lambda-powertools-lambda-client')
const SFN = require('@kmihaltsov/lambda-powertools-step-functions-client')
const CorrelationIds = require('@kmihaltsov/lambda-powertools-correlation-ids')
const snsProcessor = require('@kmihaltsov/lambda-powertools-pattern-basic')
const uuid = require('uuid/v4')

module.exports.handler = snsProcessor(async (event, context) => {
  CorrelationIds.set('event-source', 'sns')

  const standAloneFunc = `lambda-powertools-demo-${process.env.STAGE}-stand-alone`
  const invokeReq = {
    FunctionName: standAloneFunc,
    InvocationType: 'Event',
    Payload: JSON.stringify({ message: 'hello lambda' })
  }

  Log.debug('invoking another function', { functionName: standAloneFunc })
  await Lambda.invoke(invokeReq).promise()

  const stateMachineArn = process.env.STATE_MACHINE_ARN
  const startReq = {
    stateMachineArn: stateMachineArn,
    input: JSON.stringify({ x: 13, y: 29 }),
    name: uuid()
  }

  Log.debug('starting a SFN execution', { stateMachineArn: stateMachineArn })
  await SFN.startExecution(startReq).promise()

  Log.debug('my job is done...')
})
