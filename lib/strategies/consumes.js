'use strict'

const { kUnsupportedMediaType } = require('../constants')
const assert = require('assert')

const consumesStrategy = {
  name: 'consumes',
  storage: function () {
    const handlers = {}
    return {
      get: (mediaType) => {
        return handlers[mediaType] || handlers[kUnsupportedMediaType]
      },
      set: (mediaType, handler) => {
        handlers[mediaType] = handler
      }
    }
  },

  // If no Content-Type header is provided, we DOES assume that the content type is "application/octet-stream"
  // as suggested in https://tools.ietf.org/html/rfc7231#section-3.1.1.5.
  deriveConstraint: (req) => {
    return req.headers['content-type'] || 'application/octet-stream'
  },
  mustMatchWhenDerived: false,
  validate(value) {
    assert(typeof value === 'string')
  }
}

module.exports = consumesStrategy
