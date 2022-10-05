'use strict'

const t = require('tap')
const test = t.test

const producesAndConsumesStrategy = require('../../lib/strategies/producesAndConsumes')
const { kNotAcceptable, kUnsupportedMediaType } = require('../../lib/constants')

const first = 1
const second = 2
const third = 3
const fourth = 4
const fifth = 5

test('strategy should have name "producesAndConsumes"', t => {
  t.plan(1)

  t.equal(producesAndConsumesStrategy.name, 'producesAndConsumes')
})

test('strategy must not match when derived', t => {
  t.plan(1)

  t.notOk(producesAndConsumesStrategy.mustMatchWhenDerived)
})

test('strategy should validate that value is typeof object with properties produces and consumes', t => {
  t.plan(8)

  t.doesNotThrow(() => producesAndConsumesStrategy.validate({  produces: '', consumes: ''}))
  t.throws(() => producesAndConsumesStrategy.validate(false))
  t.throws(() => producesAndConsumesStrategy.validate(1))
  t.throws(() => producesAndConsumesStrategy.validate({}))
  t.throws(() => producesAndConsumesStrategy.validate(undefined))
  t.throws(() => producesAndConsumesStrategy.validate({ consumes: '' }))
  t.throws(() => producesAndConsumesStrategy.validate({ produces: '' }))
  t.throws(() => producesAndConsumesStrategy.validate({ produces: '', consumes: 1 }))
})

test('strategy should derive accept and content-type header', t => {
  t.plan(2)

  const req = { headers: { accept: 'text/plain', 'content-type': 'text/html' } }

  const derived = producesAndConsumesStrategy.deriveConstraint(req)

  t.equal(derived.produces, 'text/plain')
  t.equal(derived.consumes, 'text/html')
})


test('strategy should derive "*/*" if no accept header is present', t => {
  t.plan(1)

  const req = { headers: { 'content-type': 'application/json' } }

  t.equal(producesAndConsumesStrategy.deriveConstraint(req).produces, '*/*')
})

test('strategy should derive "application/octet-stream" if no content-type header is present', t => {
  t.plan(1)

  const req = { headers: { 'accept': 'application/json' } }

  t.equal(producesAndConsumesStrategy.deriveConstraint(req).consumes, 'application/octet-stream')
})

test('strategy should return correct handler', t => {
  t.plan(5)

  const storage = producesAndConsumesStrategy.storage()


  storage.set({ produces: kNotAcceptable, consumes: kNotAcceptable }, first)
  storage.set({ produces: kUnsupportedMediaType, consumes: kUnsupportedMediaType }, second)
  storage.set({ consumes: 'image/jpeg', produces: 'application/json' }, third)
  storage.set({ consumes: 'image/png', produces: 'text/html' }, fourth)
  storage.set({ consumes: 'image/jpeg', produces: 'application/vnd.v1+json' }, fifth)

  t.equal(storage.get({ consumes: 'image/jpeg', produces: 'application/json' }), third)
  t.equal(storage.get({ consumes: 'image/jpeg', produces: 'application/vnd.v1+json' }), fifth)
  t.equal(storage.get({ consumes: 'image/png', produces: 'application/vnd.v1+json' }), second)
  t.equal(storage.get({ consumes: 'image/png', produces: 'application/vnd.v2+json' }), first)
  t.equal(storage.get({ consumes: 'image/png', produces: 'text/html' }), fourth)
})

test('strategy should respect q-value', t => {
  t.plan(3)

  const storage = producesAndConsumesStrategy.storage()

  storage.set({ consumes: 'application/json', produces: 'application/xml' }, second)
  storage.set({ consumes: 'application/json', produces: 'application/json' }, third)
  storage.set({ consumes: 'text/plain', produces: 'text/plain' }, fourth)

  t.equal(storage.get({ consumes: 'application/json', produces: 'application/json;q=0.3,application/xml;q=0.2' }), third)
  t.equal(storage.get({ consumes: 'application/json', produces: 'application/json;q=0.3,application/xml;q=0.9' }), second)
  t.equal(storage.get({ consumes: 'text/plain', produces: 'application/json;q=0.3,application/xml;q=0.9,text/plain;q=0.1' }), fourth)
})

test('strategy should return correct error handler', t => {
  t.plan(3)

  const storage = producesAndConsumesStrategy.storage()

  storage.set({ produces: kNotAcceptable, consumes: kNotAcceptable }, first)
  storage.set({ produces: kUnsupportedMediaType, consumes: kUnsupportedMediaType }, second)
  storage.set({ consumes: 'application/json', produces: 'application/json' }, third)
  storage.set({ consumes: 'text/plain', produces: 'text/plain' }, fourth)

  t.equal(storage.get({ consumes: 'application/json', produces: 'text/plain' }), second)
  t.equal(storage.get({ consumes: 'application/json', produces: 'image/jpeg' }), first)
  t.equal(storage.get({ consumes: 'application/json', produces: 'application/json' }), third)
})
