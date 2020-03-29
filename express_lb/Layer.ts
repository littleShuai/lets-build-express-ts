import route from './route'

export default class Layer {
  handle: Function
  name: string
  params: any
  path: string
  route: route

  constructor(path:string , options:any, fn:Function) {
    if (!(this instanceof Layer)) {
      return new Layer(path, options, fn)
    }
    this.handle = fn
    this.name = fn.name || '<anonymous>'
    this.params = undefined
    this.path = undefined
  }

  public match(path:string) {
    return this.route.path === path
  }

  public handle_request(req:any, res:any, next:Function) {
    const fn = this.handle
    try {
      fn(req, res, next)
    } catch (error) {
      console.log("handle_request: ", error)
    }
  }
}