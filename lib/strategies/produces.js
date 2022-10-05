'use strict'

const assert = require('assert')
const Negotiator = require('negotiator')
const { kNotAcceptable } = require('../constants')

const producesStrategy = {
  name: 'produces',
  storage: function () {
    const handlers = {}
    const mediaTypes = []
    return {
      get: (accept) => {
        const negotiator = new Negotiator({ headers: { accept } })

        const acceptedMediaTypes = negotiator.mediaTypes(mediaTypes)

        if (acceptedMediaTypes.length === 0) {
          return handlers[kNotAcceptable]
        } else {
          return handlers[acceptedMediaTypes[0]]
        }
      },
      set: (mediaType, handler) => {
        if (mediaType !== kNotAcceptable) {
          mediaTypes.push(mediaType)
        }
        handlers[mediaType] = handler
      }
    }
  },
  deriveConstraint: (req) => {
    return req.headers.accept || '*/*'
  },
  mustMatchWhenDerived: false,
  validate(value) {
    assert(typeof value === 'string')
  }
}

module.exports = producesStrategy
