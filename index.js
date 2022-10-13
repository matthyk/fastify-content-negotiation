const producesStrategy = require('./lib/strategies/produces')
const consumesStrategy = require('./lib/strategies/consumes')
const producesAndConsumesStrategy = require('./lib/strategies/producesAndConsumes')

const fp = require('fastify-plugin')
const { defaultNotAcceptableHandler, defaultUnsupportedMediaTypeHandler } = require('./lib/error-handlers')
const { kNotAcceptable, kUnsupportedMediaType } = require('./lib/constants')
const { vary } = require('./lib/vary')

// See https://github.com/fastify/fastify/issues/4319#issuecomment-1266184728
const kRouteAlreadyProcessed = Symbol('route-already-processed')

function fastifyContentNegotiation (fastify, options, done) {
  const ignoreVary = options.ignoreVary
  const notAcceptableHandler = options.notAcceptableHandler || defaultNotAcceptableHandler
  const unsupportedMediaTypeHandler = options.unsupportedMediaTypeHandler || defaultUnsupportedMediaTypeHandler

  function onRouteHook (routeOptions) {
    const { url, method, constraints, custom } = routeOptions

    if (!constraints || (custom && custom[kRouteAlreadyProcessed])) return

    function addOnSendHook (fn) {
      if (routeOptions.onSend) {
        if (Array.isArray(routeOptions.onSend)) {
          routeOptions.onSend.push(fn)
        } else {
          routeOptions.onSend = [routeOptions.onSend, fn]
        }
      } else {
        routeOptions.onSend = fn
      }
    }

    function addRoute (constraints, handler) {
      fastify.route({
        method,
        url,
        constraints,
        schema: {
          hide: true
        },
        custom: {
          [kRouteAlreadyProcessed]: true
        },
        exposeHeadRoute: false,
        handler
      })
    }

    if (constraints.produces) {
      if (this.hasRoute({
        method,
        url,
        constraints: {
          produces: kNotAcceptable
        }
      })) return

      addRoute({ produces: kNotAcceptable }, notAcceptableHandler)

      if (!ignoreVary) {
        addOnSendHook(vary)
      }

      addOnSendHook(async function (req, reply) {
        reply.type(constraints.produces + '; charset=UTF-8')
      })
    }

    if (constraints.consumes) {
      if (this.hasRoute({
        method,
        url,
        constraints: {
          consumes: kUnsupportedMediaType
        }
      })) return

      addRoute({ consumes: kUnsupportedMediaType }, unsupportedMediaTypeHandler)
    }

    if (constraints.producesAndConsumes) {
      if (!this.hasRoute({
        method,
        url,
        constraints: {
          producesAndConsumes: {
            produces: kUnsupportedMediaType,
            consumes: kUnsupportedMediaType
          }
        }
      })) {
        addRoute({
          producesAndConsumes: {
            produces: kUnsupportedMediaType,
            consumes: kUnsupportedMediaType
          }
        }, unsupportedMediaTypeHandler)
      }

      if (!this.hasRoute({
        method,
        url,
        constraints: {
          producesAndConsumes: {
            produces: kNotAcceptable,
            consumes: kNotAcceptable
          }
        }
      })) {
        addRoute({
          producesAndConsumes: {
            produces: kNotAcceptable,
            consumes: kNotAcceptable
          }
        }, notAcceptableHandler)
      }

      if (!ignoreVary) {
        addOnSendHook(vary)
      }

      addOnSendHook(async function (req, reply) {
        reply.type(constraints.producesAndConsumes.produces + '; charset=UTF-8')
      })
    }
  }

  fastify.addHook('onRoute', onRouteHook)

  fastify.addConstraintStrategy(producesStrategy)
  fastify.addConstraintStrategy(consumesStrategy)
  fastify.addConstraintStrategy(producesAndConsumesStrategy)

  done()
}

module.exports = fp(fastifyContentNegotiation, {
  fastify: '>=4.6',
  name: 'fastify-content-negotiation',
  dependencies: [
    '@fastify/sensible'
  ]
})
