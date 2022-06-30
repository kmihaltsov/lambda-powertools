const CorrelationIds = require('../index')

global.console.debug = jest.fn()
global.console.info = jest.fn()
global.console.warn = jest.fn()
global.console.error = jest.fn()

const suite = (correlationIds) => () => {
  afterEach(correlationIds.clearAll)
  describe('.set', () => {
    describe('when the key is missing x_correlation_ prefix', () => {
      beforeEach(() => {
        correlationIds.set('id', 'test')
      })
      it('adds the prefix', () => {
        expect(correlationIds.get()).toEqual({
          'x_correlation_id': 'test'
        })
      })
    })

    describe('when the key has x_correlation_prefix', () => {
      beforeEach(() => {
        correlationIds.set('x_correlation_id', 'test')
      })
      it('sets it as is', () => {
        expect(correlationIds.get()).toEqual({
          'x_correlation_id': 'test'
        })
      })
    })

    describe('when setting twice', () => {
      beforeEach(() => {
        correlationIds.set('x_correlation_id', 'hello')
        correlationIds.set('x_correlation_id', 'world')
      })
      it('overrides the previous value', () => {
        expect(correlationIds.get()).toEqual({
          'x_correlation_id': 'world'
        })
      })
    })
  })

  describe('.replaceAllWith', () => {
    beforeEach(() => {
      correlationIds.set('x_correlation_id', 'this should be replaced')
      correlationIds.set('x_correlation_user-id', 'this should be removed')
    })
    it('replaces all existing IDs', () => {
      correlationIds.replaceAllWith({
        'x_correlation_id': 'id',
        'x_correlation_order-id': 'order'
      })

      const ids = correlationIds.get()
      expect(ids).toHaveProperty('x_correlation_id')
      expect(ids['x_correlation_id']).toBe('id')
      expect(ids).not.toHaveProperty('x_correlation_user-id')
      expect(ids).toHaveProperty('x_correlation_order-id')
      expect(ids['x_correlation_order-id']).toBe('order')
    })
  })

  describe('.clearAll', () => {
    it('removes all correlation IDs', () => {
      correlationIds.set('x_correlation_id', 'this should be removed')

      correlationIds.clearAll()

      const ids = correlationIds.get()
      expect(ids).toEqual({})
    })
  })
}

describe('CorrelationIds (global)', suite(CorrelationIds))
describe('CorrelationIds (child)', suite(new CorrelationIds()))

describe('Global references', () => {
  it('stores a reference to the global instance as a global', () => {
    expect(global.CORRELATION_IDS).toBeInstanceOf(CorrelationIds)
  })

  describe('when re-requiring correlationIds', () => {
    let NewCorrelationIds
    beforeEach(() => {
      CorrelationIds.set('testing', 'true')
      jest.resetModules()
      NewCorrelationIds = require('../index')
    })

    it('shares the same global instance', () => {
      expect(NewCorrelationIds).not.toBe(CorrelationIds)

      expect(NewCorrelationIds.get()).toEqual({
        'x_correlation_testing': 'true'
      })
    })
  })
})
