import methods from 'methods'
import Router from './router'
import Layer from './Layer'
import http from 'http'

const slice = Array.prototype.slice;

export default class App {
  cache: {}
  engines: {}
  settings: {}
  _router: Router
  port: number
  listenCallbacks: Function[]

  constructor() {
    methods.forEach(function(method) {
      App[method] = function(path: string) {
        this.lazyrouter()
        let route = this._router.route(path);
        if (route[method]) route[method].apply(route, slice.call(arguments, 1));

        return this
      }
    })
  }

  init() {
    this.cache = {}
    this.engines = {}
    this.settings = {}
    this._router = undefined
  }

  public get(path:string, ...funcs:Function[]) {
    const method = App["get"]
    method.apply(this, [path, ...funcs])
  }

  public post(path:string, ...funcs:Function[]) {
    const method = App["post"]
    method.apply(this, [path, ...funcs])
  }

  public put(path:string, ...funcs:Function[]) {
    const method = App["put"]
    method.apply(this, [path, ...funcs])
  }

  set(setting: string, val?: any) {
    this.settings[setting] = val
    switch (setting) {
      case 'etag': this.set('etag fn ', ""); break;
      case 'query parser': this.set('query parser fn ', ""); break;
      case 'trust proxy': this.set('trust proxy fn', ""); break;
    }
    return this;
  }

  enabled(setting: string) {
    return Boolean(this.set(setting));
  }

  lazyrouter() {
    if (!this._router) this._router = new Router({})
  }

  // ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
  listen(port: number, ...funcs: Function[]) {
    this.port = port
    this.listenCallbacks = funcs
    // 这里 http 启动 server express 源码是在express.js 文件中 createApplication 函数中 通过 let app 来建立 http 连接的；
    // 但是这里用 TypeScript 写的话需要变化一下：意思都是相同的，就是需要传入一个函数作为中间件
    const requestEntrance = this.handleRequestEntrance.bind(this) as http.RequestListener
    const server = http.createServer(requestEntrance)
    return server.listen.apply(server, arguments)
  }

  handleRequestEntrance(req:any, res:any, next:Function) {
    console.log('handleRequestEntrance ')
    this.handle(req, res, next)
  }

  // ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑

  handle(req?:any, res?:any, ...funcs: Function[]) {
    let router = this._router
    if (router) {
      router.handle(req, res)
    } else {
      console.log('🍒 ---- router handle router is undefined')
    }
  }
}