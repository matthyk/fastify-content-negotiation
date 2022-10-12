'use strict'

const t = require('tap')
const test = t.test
const { vary } = require('../lib/vary')

const createResponse = (headers) => {
  return {
    headers: { ...headers },
    hasHeader: function (key) {
      return this.getHeader(key) !== undefined
    },
    header: function (key, value) {
      this.headers[key] = value
    },
    getHeader: function (key) {
      return this.headers[key]
    }
  }
}

test('vary should add "accept" to vary header with already set vary header ', async t => {
  const response = createResponse({ vary: 'authorization' })

  vary({}, response, {})

  t.equal(response.headers.vary, 'authorization, accept')
})

test('vary should add "accept" to vary header', async t => {
  const response = createResponse({})

  vary({}, response, {})

  t.equal(response.headers.vary, 'accept')
})
