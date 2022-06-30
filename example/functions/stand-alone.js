const Log = require('@kmihaltsov/lambda-powertools-logger')
const wrap = require('@kmihaltsov/lambda-powertools-pattern-basic')

module.exports.handler = wrap(async (event, context) => {
  Log.debug('finding the answer to life, the universe and everything...')
  return { answer: 42 }
})
