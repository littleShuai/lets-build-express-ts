import methods from 'methods'
import Layer from './Layer'

export default class Route {
  path: string
  stack: Layer[]
  methods: {}

  constructor(path:string) {
    this.path = path
    this.stack = []
    this.methods = {}

    methods.forEach(function(method) {
      Route.prototype[method] = function() { // 这里必须用prototype 才会在 new 的时候就进入方法,不然 stack 为空
        let handles = Array.prototype.slice.call(arguments)
        handles.flat(Infinity)

        for(let i = 0; i < handles.length; i++) {
          let handle = handles[i]
          if (typeof handle !== 'function') {
            let type = toString.call(handle)
            let msg = `Route.${method}() requires a callback function but got a ${type}`
            throw new Error(msg);
          }
          let layer = new Layer('/', {}, handle);
          layer[method] = method

          this.methods[method] = true
          this.stack.push(layer)
        }
        return this;
      }
    })
  }

  public dispatch(req:any, res:any, done:any) {

  }

}


