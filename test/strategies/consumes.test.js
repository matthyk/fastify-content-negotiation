'use strict'

const t = require('tap')
const test = t.test

const consumesStrategy = require('../../lib/strategies/consumes')
const { kUnsupportedMediaType } = require('../../lib/constants')

const first = 1
const second = 2
const third = 3
const fourth = 4

test('strategy should have name "consumes"', t => {
  t.plan(1)

  t.equal(consumesStrategy.name, 'consumes')
})

test('strategy must not match when derived', t => {
  t.plan(1)

  t.notOk(consumesStrategy.mustMatchWhenDerived)
})

test('strategy should validate that value is typeof string', t => {
  t.plan(5)

  t.doesNotThrow(() => consumesStrategy.validate('text/plain'))
  t.throws(() => consumesStrategy.validate(false))
  t.throws(() => consumesStrategy.validate(11))
  t.throws(() => consumesStrategy.validate({}))
  t.throws(() => consumesStrategy.validate(undefined))
})

test('strategy should derive content-type header', t => {
  t.plan(1)

  const req = { headers: { 'content-type': 'image/png' } }

  t.equal(consumesStrategy.deriveConstraint(req), 'image/png')
})

test('strategy should derive "application/octet-stream" if no content-type header is present', t => {
  t.plan(1)

  const req = { headers: {} }

  t.equal(consumesStrategy.deriveConstraint(req), 'application/octet-stream')
})

test('strategy.get should return kUnsupportedMediaType handler if content type is not supported for this route', t => {
  t.plan(1)

  const storage = consumesStrategy.storage()

  storage.set(kUnsupportedMediaType, first)
  storage.set('text/html', second)

  t.equal(storage.get('text/plain'), first)
})

test('strategy.get should return correct handler', t => {
  t.plan(3)

  const storage = consumesStrategy.storage()

  storage.set(kUnsupportedMediaType, first)
  storage.set('text/html', second)
  storage.set('application/javascript', third)
  storage.set('application/vnd.api+json', fourth)

  t.equal(storage.get('text/html'), second)
  t.equal(storage.get('application/javascript'), third)
  t.equal(storage.get('application/vnd.api+json'), fourth)
})
