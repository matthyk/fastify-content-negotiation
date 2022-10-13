import { FastifyPluginCallback, RouteHandlerMethod } from 'fastify'

export type ContentNegotiationPluginOptions = {
  ignoreVary?: boolean
  notAcceptableHandler?: RouteHandlerMethod
  unsupportedMediaTypeHandler?: RouteHandlerMethod
}

declare const fastifyContentNegotiation: FastifyPluginCallback<ContentNegotiationPluginOptions>

declare module 'fastify' {

  export interface RouteShorthandOptions {
    // @ts-ignore
    constraints?: {
      produces?: string
      consumes?: string
      producesAndConsumes?: {
        produces: string,
        consumes: string
      }
    } & { [name: string]: any }
  }
}

export default fastifyContentNegotiation;
