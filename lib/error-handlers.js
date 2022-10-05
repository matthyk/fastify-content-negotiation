// See https://www.rfc-editor.org/rfc/rfc7231#section-6.5.6
async function notAcceptableHandler (request) {
  throw this.httpErrors.notAcceptable(
        `Media type '${request.headers.accept}' is not acceptable.`
  )
}

// See https://www.rfc-editor.org/rfc/rfc7231#section-6.5.13
async function unsupportedMediaTypeHandler (request) {
  throw this.httpErrors.unsupportedMediaType(
        `Media type '${request.headers['content-type']}' is not supported for this resource and method.`
  )
}

module.exports = {
  notAcceptableHandler,
  unsupportedMediaTypeHandler
}
