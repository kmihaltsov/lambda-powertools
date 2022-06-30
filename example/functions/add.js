const Log = require('@kmihaltsov/lambda-powertools-logger')
const wrap = require('@kmihaltsov/lambda-powertools-pattern-basic')

module.exports.handler = wrap(async ({ x, y }, context) => {
  Log.debug(`adding ${x} and ${y}`)
  return x + y
})
