async function vary(request, reply, payload) {
  if (reply.hasHeader('vary')) {
    reply.header( 'vary', reply.getHeader('vary') + ', accept' )
  } else {
    reply.header( 'vary', 'accept')
  }

  return payload
}

module.exports = {
  vary
}
