const Log = require('@kmihaltsov/lambda-powertools-logger')
const wrap = require('@kmihaltsov/lambda-powertools-pattern-basic')

module.exports.handler = wrap(async ({ z }, context) => {
  Log.debug(`doubling ${z}`)
  return z * 2
})
