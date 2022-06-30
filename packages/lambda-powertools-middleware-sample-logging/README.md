# lambda-powertools-middleware-sample-logging

A [Middy](https://github.com/middyjs/middy) middleware that will enable debug logging for a configurable % of invocations. Defaults is 1%.

Main features:

* integrates with the `@kmihaltsov/lambda-powertools-logger` package to enable debug logging

* integrates with the `@kmihaltsov/lambda-powertools-correlation-ids` package to allow sampling decision to flow through correlation IDs - i.e. enable debug logging at the edge, and the entire call chain will respect that decision

* enables debug logging for some % (defaults to 1%) of invocations

* records an error log message with the invocation event as attribute when an invocation errors

## Getting Started

Install from NPM: `npm install @kmihaltsov/lambda-powertools-middleware-sample-logging`

Alternatively, if you use the template `@kmihaltsov/lambda-powertools-pattern-basic` then this would be configured for you.

## API

Accepts a configuration object of the following shape:

```js
{
  sampleRate: double [between 0 and 1]
}
```

```js
const middy = require('middy')
const sampleLogging = require('@kmihaltsov/lambda-powertools-middleware-sample-logging')

const handler = async (event, context) => {
  return 42
}

module.exports = middy(handler)
  .use(sampleLogging({ sampleRate: 0.01 }))
}
```

This middleware is often used alongside the `@kmihaltsov/lambda-powertools-middleware-correlation-ids` middleware to implement sample logging. It's **recommended** that you use the `@kmihaltsov/lambda-powertools-pattern-basic` which configures both to enable debug logging at 1% of invocations.
