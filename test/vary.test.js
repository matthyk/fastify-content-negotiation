'use strict'

const t = require('tap')
const test = t.test
const { vary } = require('../lib/vary')

test('vary should add "accept" to vary header with already set vary header ', async t => {
  const response = {
    headers: {
      vary: 'authorization'
    }
  }

  vary({}, response, {})

  t.equal(response.headers.vary, 'authorization, accept')
})

test('vary should add "accept" to vary header', async t => {
  const response = {
    headers: {}
  }

  vary({}, response, {})

  t.equal(response.headers.vary, 'accept')
})
