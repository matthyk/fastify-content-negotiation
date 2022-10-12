'use strict'

const t = require('tap')
const { defaultNotAcceptableHandler, defaultUnsupportedMediaTypeHandler } = require('../lib/error-handlers')
const fastify = require('fastify')
const test = t.test

let server

const request = {
  headers: {
    accept: 'application/json',
    'content-type': 'text/plain'
  }
}

t.beforeEach(async () => {
  server = fastify().register(require('@fastify/sensible'))

  await server.ready()
})

test('notAcceptableHandler should throw correct error', async t => {
  try {
    await defaultNotAcceptableHandler.call(server, request)
    t.fail()
  } catch (err) {
    t.equal(err.message, 'Media type \'application/json\' is not acceptable.')
    t.equal(err.name, 'NotAcceptableError')
    t.equal(err.statusCode, 406)
  }
})

test('unsupportedMediaTypeHandler should throw correct error', async t => {
  try {
    await defaultUnsupportedMediaTypeHandler.call(server, request)
    t.fail()
  } catch (err) {
    t.equal(err.message, 'Media type \'text/plain\' is not supported for this resource and method.')
    t.equal(err.name, 'UnsupportedMediaTypeError')
    t.equal(err.statusCode, 415)
  }
})

t.afterEach(async () => {
  server.close()
})
