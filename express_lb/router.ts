import Route from './route'
import Layer from './Layer'

export class Proto {
  opts: any
  stack: Layer[]

  constructor(options: any) {
    this.opts = options || {}
    this.stack = []
  }

  route(path: string) {
    let route = new Route(path)
    let layer = new Layer(path, {}, route.dispatch.bind(route))
    layer.route = route
    // if (!this.stack) this.stack = []
    this.stack.push(layer)
    return route
  }

  handle(req:any, res:any, out?: Function) {
    if (this.stack && this.stack.length > 0) {
      let route = this.stack[0].route
      route.stack[0].handle_request(req, res, out)
    }
  }
}

export default class Router extends Proto {
  params:{}
  _params: []
  caseSentistive: any
  mergeParams: any
  strict: any
  stack: Layer[]

  constructor(options:any, req?:any, res?:any, next?:Function) {
    super(options)
    this.handle(req, res, next)

    this.params = {}
    this._params = []
    this.caseSentistive = this.opts.caseSentistive
    this.mergeParams = this.opts.mergeParams
    this.strict = this.opts.strict
  }
}