async function vary (request, reply, payload) {
  reply.vary('accept')

  return payload
}

module.exports = {
  vary
}
