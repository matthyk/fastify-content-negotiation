async function vary(request, reply, payload) {
  if (reply.headers.vary) {
    reply.headers.vary += ', accept'
  } else {
    reply.headers.vary = 'accept'
  }

  return payload
}

module.exports = {
  vary
}
