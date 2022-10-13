import  { ContentNegotiationPluginOptions } from '.'

const options: ContentNegotiationPluginOptions = {
  ignoreVary: true,
  unsupportedMediaTypeHandler: request => {},
  notAcceptableHandler: request => {}
}
