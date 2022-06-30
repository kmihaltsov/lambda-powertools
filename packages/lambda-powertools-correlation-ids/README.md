# lambda-powertools-correlation-ids

A helper module for recording correlation IDs.

Main features:

* allows you to fetch, update, and delete correlation IDs

* respects convention for correlation IDs - i.e. `x_correlation_`

* Manually enable/disable debug logging (`debug-log-enabled`) to be picked up by other/downstream middleware

* allows you to store more than one correlation IDs, which allows you to *correlate* logs on multiple dimensions (e.g. by `x_correlation_user-id`, or `x_correlation_order-id`, etc.)

## Getting Started

Install from NPM: `npm install @kmihaltsov/lambda-powertools-correlation-ids`

## API

```js
const CorrelationIds = require('@kmihaltsov/lambda-powertools-correlation-ids')

// automatically inserts 'x_correlation_' prefix if not provided
CorrelationIds.set('id', '12345678') // records id as x_correlation_id
CorrelationIds.set('x_correlation_username', 'theburningmonk') // records as x_correlation_username

// Manully enable debug logging (debug-log-enabled)
CorrelationIds.debugLoggingEnabled = true

const myCorrelationIds = CorrelationIds.get()
// {
//   'x_correlation_id': '12345678',
//   'x_correlation_username': 'theburningmonk',
//   'debug-log-enabled': 'true'
// }

CorrelationIds.clearAll() // removes all recorded correlation IDs
CorrelationIds.replaceAllWith({  // bypasses the 'x_correlation_' convention
  'debug-log-enabled': 'true',
  'User-Agent': 'jest test'
})

// Disable debug logging
CorrelationIds.debugLoggingEnabled = false
```

In practice, you're likely to only need `set` when you want to record correlation IDs from your function.

The middleware, `@kmihaltsov/lambda-powertools-middleware-correlation-ids`, would automatically capture the correlation IDs from the invocation event for supported event sources:

* API Gateway (via HTTP headers)

* Kinesis (via the JSON payload)

* SNS (via message attributes)

* any invocation event with the special field `__context__` (which is how we inject them with the Step Functions and Lambda clients below)

Whilst other power tools would use `get` to make use of the correlation IDs:

* `@kmihaltsov/lambda-powertools-logger` includes recorded correlation IDs in logs

* `@kmihaltsov/lambda-powertools-http-client` includes recorded correlation IDs as HTTP headers when you make a HTTP request

* `@kmihaltsov/lambda-powertools-sns-client` includes recorded correlation IDs as SNS message attributes when you publish a message to SNS (ie. `SNS.publish`)

* `@kmihaltsov/lambda-powertools-kinesis-client` injects recorded correlation IDs as part of the event payload when you publish event(s) to Kinesis (ie. `Kinesis.putRecord` and `Kinesis.putRecords`)

* `@kmihaltsov/lambda-powertools-step-functions-client` injects recorded correlation IDs as part of the payload when you start a Step Functions execution (ie. `SFN.startExecution`)

* `@kmihaltsov/lambda-powertools-lambda-client` injects recorded correlation IDs as part of the invocation payload when you invoke a Lambda function directly (ie. `Lambda.invoke` and `Lambda.invokeAsync`)
