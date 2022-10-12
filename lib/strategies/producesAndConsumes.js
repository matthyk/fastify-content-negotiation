'use strict'

const assert = require('assert')
const Negotiator = require('negotiator')
const { kNotAcceptable, kUnsupportedMediaType } = require('../constants')

const producesAndConsumesStrategy = {
  name: 'producesAndConsumes',
  storage: function () {
    const handlers = {}
    const mediaTypes = []
    return {
      get: (value) => {
        const { produces, consumes } = value

        const negotiator = new Negotiator({ headers: { accept: produces } })

        const acceptedMediaTypes = negotiator.mediaTypes(mediaTypes)

        if (acceptedMediaTypes.length === 0) {
          return handlers[kNotAcceptable]
        }

        for (let i = 0; i < acceptedMediaTypes.length; i++) {
          if (handlers[acceptedMediaTypes[i]][consumes]) {
            return handlers[acceptedMediaTypes[i]][consumes]
          }
        }

        return handlers[kUnsupportedMediaType]
      },
      set: (value, handler) => {
        const { produces, consumes } = value

        if (produces === kNotAcceptable && consumes === kNotAcceptable) {
          handlers[kNotAcceptable] = handler
        } else if (produces === kUnsupportedMediaType && consumes === kUnsupportedMediaType) {
          handlers[kUnsupportedMediaType] = handler
        } else {
          mediaTypes.push(produces)

          handlers[produces] = handlers[produces] || {}

          handlers[produces][consumes] = handler
        }
      }
    }
  },
  deriveConstraint: (req) => {
    return {
      produces: req.headers.accept || '*/*',
      consumes: req.headers['content-type'] || 'application/octet-stream'
    }
  },
  mustMatchWhenDerived: false,
  validate (value) {
    assert(typeof value === 'object', 'Should be object.')
    assert(typeof value.produces === 'string')
    assert(typeof value.consumes === 'string')
  }
}

module.exports = producesAndConsumesStrategy
