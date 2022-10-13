'use strict'

const t = require('tap')
const test = t.test
const fastify = require('fastify')

let server

t.beforeEach(async () => {
  server = await fastify().register(require('@fastify/sensible')).register(require('..'))

  await server.addContentTypeParser('application/vnd.v3+json', { parseAs: 'string' }, async () => {})
  await server.addContentTypeParser('application/xml', { parseAs: 'string' }, async () => {})
})

test('notAcceptableHandler should build correct error', async t => {
  server.get('/users/:id', {
    constraints: {
      produces: 'text/plain'
    }
  }, () => {})

  server.get('/users/:id', {
    constraints: {
      produces: 'application/xml'
    }
  }, () => {})

  const response = await server.inject({
    method: 'GET',
    url: '/users/:id',
    headers: {
      accept: 'application/json'
    }
  })

  const bodyAsJson = JSON.parse(response.body)

  t.equal(response.statusCode, 406)
  t.equal(bodyAsJson.statusCode, 406)
  t.equal(bodyAsJson.error, 'Not Acceptable')
  t.equal(bodyAsJson.message, 'Media type \'application/json\' is not acceptable.')
})

test('unsupportedMediaTypeHandler should build correct error', async t => {
  server.post('/users/:id', {
    constraints: {
      consumes: 'application/json'
    }
  }, () => {})

  server.post('/users/:id', {
    constraints: {
      consumes: 'application/xml'
    }
  }, () => {})

  const response = await server.inject({
    method: 'POST',
    url: '/users/:id',
    headers: {
      'content-type': 'text/plain'
    }
  })

  const bodyAsJson = JSON.parse(response.body)

  t.equal(response.statusCode, 415)
  t.equal(bodyAsJson.statusCode, 415)
  t.equal(bodyAsJson.error, 'Unsupported Media Type')
  t.equal(bodyAsJson.message, 'Media type \'text/plain\' is not supported for this resource and method.')
})

test('produces constraint', async () => {
  test('simple case', async t => {
    server.get('/users/:id', {
      constraints: {
        produces: 'image/gif'
      }
    }, async () => 'image/gif')

    server.get('/users/:id', {
      constraints: {
        produces: 'image/png'
      }
    }, async () => 'image/png')

    server.put('/users/:id', {
      constraints: {
        produces: 'image/png'
      }
    }, async () => 'image/png with PUT')

    const response1 = await server.inject({
      method: 'GET',
      url: '/users/:id',
      headers: {
        accept: 'image/gif'
      }
    })
    const response2 = await server.inject({
      method: 'GET',
      url: '/users/:id',
      headers: {
        accept: 'image/png'
      }
    })
    const response3 = await server.inject({
      method: 'PUT',
      url: '/users/:id',
      headers: {
        accept: 'image/png'
      }
    })

    t.equal(response1.body, 'image/gif')
    t.equal(response2.body, 'image/png')
    t.equal(response3.body, 'image/png with PUT')
  })

  test('with q-value', async t => {
    server.get('/', {
      constraints: {
        produces: 'application/vnd.v1+json'
      }
    }, async () => 'v1')

    server.get('/', {
      constraints: {
        produces: 'application/vnd.v2+json'
      }
    }, async () => 'v2')

    server.get('/', {
      constraints: {
        produces: 'audio/mpeg'
      }
    }, async () => 'audio/mpeg')

    const response1 = await server.inject({
      method: 'GET',
      url: '/',
      headers: {
        accept: 'image/gif;q=1,application/xml;q=0.9,application/vnd.v1+json;q=0.8'
      }
    })
    const response2 = await server.inject({
      method: 'GET',
      url: '/',
      headers: {
        accept: 'audio/mp3;q=1.0,audio/mpeg;q=0.1'
      }
    })
    const response3 = await server.inject({
      method: 'GET',
      url: '/',
      headers: {
        accept: 'application/vnd.v2+json;q=1.0,application/vnd.v1+json;q=0.8'
      }
    })

    t.equal(response1.body, 'v1')
    t.equal(response2.body, 'audio/mpeg')
    t.equal(response3.body, 'v2')
  })

  test('error case', async t => {
    // TODO
  })
})

test('consumes constraint', async () => {
  test('simple case', async t => {
    server.post('/', {
      constraints: {
        consumes: 'application/vnd.v1+json'
      }
    }, () => t.fail())

    server.post('/', {
      constraints: {
        consumes: 'application/vnd.v2+json'
      }
    }, () => t.pass())

    await server.inject({
      method: 'POST',
      url: '/',
      headers: {
        'content-type': 'application/vnd.v2+json'
      }
    })
  })

  test('error case', async t => {
    server.post('/', {
      constraints: {
        consumes: 'application/vnd.v1+json'
      }
    }, () => t.fail())

    server.post('/', {
      constraints: {
        consumes: 'application/vnd.v2+json'
      }
    }, () => t.pass())

    const response = await server.inject({
      method: 'POST',
      url: '/',
      headers: {
        'content-type': 'application/vnd.v3+json'
      },
      payload: {}
    })

    const bodyAsJson = JSON.parse(response.body)

    t.equal(response.statusCode, 415)
    t.equal(bodyAsJson.statusCode, 415)
    t.equal(bodyAsJson.error, 'Unsupported Media Type')
    t.equal(bodyAsJson.message, 'Media type \'application/vnd.v3+json\' is not supported for this resource and method.')
  })

  test('missing content type parser error case', async t => {
    server.post('/', {
      constraints: {
        consumes: 'application/vnd.v1+json'
      }
    }, () => t.fail())

    const response = await server.inject({
      method: 'POST',
      url: '/',
      headers: {
        'content-type': 'application/vnd.v1+json'
      },
      payload: {}
    })

    const bodyAsJson = JSON.parse(response.body)

    t.equal(response.statusCode, 415)
    t.equal(bodyAsJson.statusCode, 415)
    t.equal(bodyAsJson.error, 'Unsupported Media Type')
    t.equal(bodyAsJson.message, 'Unsupported Media Type: application/vnd.v1+json')
  })
})

test('producesAndConsumes constraint', async () => {
  test('simple case', async t => {
    server.put('/', {
      constraints: {
        producesAndConsumes: {
          produces: 'application/vnd.v1+json',
          consumes: 'application/json'
        }
      }
    }, () => t.fail())
    server.put('/', {
      constraints: {
        producesAndConsumes: {
          produces: 'application/vnd.v2+json',
          consumes: 'application/json'
        }
      }
    }, () => t.pass())

    await server.inject({
      method: 'PUT',
      url: '/',
      headers: {
        'content-type': 'application/json',
        accept: 'application/vnd.v2+json'
      },
      payload: {}
    })
  })

  test('with q-value', async t => {
    server.put('/', {
      constraints: {
        producesAndConsumes: {
          produces: 'application/vnd.v1+json',
          consumes: 'application/json'
        }
      }
    }, () => t.pass())
    server.put('/', {
      constraints: {
        producesAndConsumes: {
          produces: 'application/vnd.v2+json',
          consumes: 'application/json'
        }
      }
    }, () => t.fail())

    await server.inject({
      method: 'PUT',
      url: '/',
      headers: {
        'content-type': 'application/json',
        accept: 'application/vnd.v2+json;q=0.3,application/vnd.v1+json;q=0.4'
      },
      payload: {}
    })
  })

  test('error case', async t => {
    server.put('/', {
      constraints: {
        producesAndConsumes: {
          produces: 'application/vnd.v1+json',
          consumes: 'application/json'
        }
      }
    }, () => t.pass())
    server.put('/', {
      constraints: {
        producesAndConsumes: {
          produces: 'application/vnd.v2+json',
          consumes: 'application/json'
        }
      }
    }, () => t.fail())

    const response1 = await server.inject({
      method: 'PUT',
      url: '/',
      headers: {
        'content-type': 'application/json',
        accept: 'application/vnd.v3+json'
      },
      payload: {}
    })

    const response2 = await server.inject({
      method: 'PUT',
      url: '/',
      headers: {
        'content-type': 'application/xml',
        accept: 'application/vnd.v2+json'
      },
      payload: {}
    })

    const response1AsJson = JSON.parse(response1.body)
    const response2AsJson = JSON.parse(response2.body)

    t.equal(response1.statusCode, 406)
    t.equal(response1AsJson.statusCode, 406)
    t.equal(response1AsJson.message, 'Media type \'application/vnd.v3+json\' is not acceptable.')
    t.equal(response1AsJson.error, 'Not Acceptable')

    t.equal(response2.statusCode, 415)
    t.equal(response2AsJson.statusCode, 415)
    t.equal(response2AsJson.message, 'Media type \'application/xml\' is not supported for this resource and method.')
    t.equal(response2AsJson.error, 'Unsupported Media Type')
  })
})

test('should add "accept" to vary header for produces constraint', async t => {
  server.get('/', {
    constraints: {
      produces: 'text/plain'
    }
  }, async () => 'text')

  const response = await server.inject({
    method: 'GET',
    url: '/',
    headers: {
      accept: 'text/plain'
    }
  })

  t.ok(response.headers.vary)
})

test('should append "accept" to vary header for produces constraint', async t => {
  server.get('/', {
    constraints: {
      produces: 'text/plain'
    }
  }, async (req, reply) => { reply.header('vary', 'authorization') })

  const response = await server.inject({
    method: 'GET',
    url: '/',
    headers: {
      accept: 'text/plain'
    }
  })

  t.ok(response.headers.vary)
  t.equal(response.headers.vary, 'authorization, accept')
})

test('should add "accept" to vary header for producesAndConsumes constraint', async t => {
  server.put('/', {
    constraints: {
      producesAndConsumes: {
        consumes: 'text/plain',
        produces: 'application/json'
      }
    }
  }, async (req, reply) => { reply.header('vary', 'authorization') })

  const response = await server.inject({
    method: 'PUT',
    url: '/',
    headers: {
      accept: 'application/json',
      'content-type': 'text/plain'
    }
  })

  t.ok(response.headers.vary)
  t.equal(response.headers.vary, 'authorization, accept')
})

test('should not add to vary header if configured - produces', async t => {
  server = await fastify().register(require('@fastify/sensible')).register(require('..'), { ignoreVary: true })

  server.get('/', {
    constraints: {
      produces: 'text/plain'
    }
  }, async () => 'text')

  const response = await server.inject({
    method: 'GET',
    url: '/',
    headers: {
      accept: 'text/plain'
    }
  })

  t.notOk(response.headers.vary)
})

test('should not add to vary header if configured - producesAndConsumes', async t => {
  server = await fastify().register(require('@fastify/sensible')).register(require('..'), { ignoreVary: true })

  server.put('/', {
    constraints: {
      producesAndConsumes: {
        consumes: 'text/plain',
        produces: 'application/json'
      }
    }
  }, async (req, reply) => { return '' })

  const response = await server.inject({
    method: 'PUT',
    url: '/',
    headers: {
      accept: 'application/json',
      'content-type': 'text/plain'
    }
  })

  t.notOk(response.headers.vary)
})

test('plugin should not override existing onSend hooks', async t => {
  let called = false

  server.get('/', {
    constraints: {
      produces: 'text/plain'
    },
    onSend: async () => { called = true }
  }, async () => 'text')

  await server.inject({
    method: 'GET',
    url: '/',
    headers: {
      accept: 'text/plain'
    }
  })

  t.ok(called)
})

test('plugin should not override existing onSend hooks - array', async t => {
  let counter = 0

  server.put('/', {
    constraints: {
      producesAndConsumes: {
        consumes: 'text/plain',
        produces: 'application/json'
      }
    },
    onSend: [async () => { counter++ }, async () => { counter++ }]
  }, async () => 'text')

  await server.inject({
    method: 'PUT',
    url: '/',
    headers: {
      accept: 'application/json',
      'content-type': 'text/plain'
    }
  })

  t.equal(counter, 2)
})

t.afterEach(async () => {
  server.close()
})
