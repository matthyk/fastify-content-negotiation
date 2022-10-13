'use strict'

const t = require('tap')
const test = t.test

const producesStrategy = require('../../lib/strategies/produces')
const { kNotAcceptable } = require('../../lib/constants')

const first = 1
const second = 2
const third = 3
const fourth = 4

test('strategy should have name "produces"', t => {
  t.plan(1)

  t.equal(producesStrategy.name, 'produces')
})

test('strategy must not match when derived', t => {
  t.plan(1)

  t.notOk(producesStrategy.mustMatchWhenDerived)
})

test('strategy should validate that value is typeof string', t => {
  t.plan(5)

  t.doesNotThrow(() => producesStrategy.validate('application/json'))
  t.throws(() => producesStrategy.validate(false))
  t.throws(() => producesStrategy.validate(1))
  t.throws(() => producesStrategy.validate({}))
  t.throws(() => producesStrategy.validate(undefined))
})

test('strategy should derive accept header', t => {
  t.plan(1)

  const req = { headers: { accept: 'text/plain' } }

  t.equal(producesStrategy.deriveConstraint(req), 'text/plain')
})

test('strategy should derive "*/*" if no accept header is present', t => {
  t.plan(1)

  const req = { headers: {} }

  t.equal(producesStrategy.deriveConstraint(req), '*/*')
})

test('storage.get should return not acceptable handler if media type is not acceptable', t => {
  t.plan(3)

  const storage = producesStrategy.storage()

  storage.set(kNotAcceptable, first)
  storage.set('application/xml', second)
  storage.set('text/plain', third)

  t.equal(storage.get('image/*'), first)
  t.equal(storage.get('text/html'), first)
  t.equal(storage.get('application/xm'), first)
})

test('storage.get should respect the q-value', t => {
  t.plan(2)

  const storage = producesStrategy.storage()

  storage.set(kNotAcceptable, first)
  storage.set('application/xml', second)
  storage.set('text/plain', third)
  storage.set('image/png', fourth)

  t.equal(storage.get('application/xml;q=0.8,image/*;q=0.85'), fourth)
  t.equal(storage.get('application/xml;q=0.8,image/*;q=0.1,text/plain;q=1'), third)
})

test('storage.get should return correct handler', t => {
  t.plan(2)

  const storage = producesStrategy.storage()

  storage.set(kNotAcceptable, first)
  storage.set('image/jpeg', second)
  storage.set('image/png', third)

  t.equal(storage.get('image/jpeg'), second)
  t.equal(storage.get('image/png'), third)
})
