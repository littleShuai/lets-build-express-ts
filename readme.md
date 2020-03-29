# Express 源码解析
Express 框架包括 router.js / layer.js / application.js / express.js / route.js / middleware 6个模块组成。其中 layer 包含 route 等路由信息保存在 router 的 stack 栈中。router 类用来处理路由逻辑，重要属性是它的栈，这就是我们配置的路径，还有一个核心方法 next()， next 将调用下一个中间件或匹配路由。next 通过闭包捕获idx，stack等变量，当你从回调中调用next时，它会从它停止的地方恢复对 stack 的处理；Application 文件封装了 listen、lazyrouter 等方法，express 文件集成自 application，对 request、response进行封装，添加response 的send，json 方法，设置请求头，content-type等信息。

[源码解析](https://lq782655835.github.io/blogs/node/node-code-express.html#%E8%B7%AF%E7%94%B1%E6%9C%BA%E5%88%B6%E6%BA%90%E7%A0%81%E8%A7%A3%E6%9E%90)
> static class
* Router() 创建一个router对象
* static() 设置静态资源根目录，基于 serve-static 模块

> instance
* 路由相关：app.use(path, callback) 主要用来添加非路由中间件，底层调用 router.use();匹配 path 的方式：1）路径：/abcd 2）路径模式：/abc?d 3）正则表达式：//abc|/xyz/ 4）数组合集：['/abcd','/abc?e',//abc|/xys/]
* app.all/METHOD(path, callback [, callback ...]) 注册一个 http 请求路由
* aap.route(path) 获得 route 实例
* app.get(name) 获取app上定义属性
* app.set(name, value) 绑定或设置属性到app上
* app.listen() 跟 node 的 http.server.listen() 一致

> 大部分情况app.use() 和 app.all() 使用相似，最大不一样是中间件执行顺序。app.use() 针对主进程，放前面和放后面不一样；但 app.all() 针对应用的路由，放的位置和中间件执行无关。

# Router
跟 express 路由API相似：
* router.use(path, callback)
* router.all/METHOD(path, [callback])
* router.route()
# Request
express Request 扩展了 node  http.IncomingMessage 类，主要是增强了一些获取请求参数的便捷PAI。
```
req.headers extend http 返回 header object 对象
req.url extend http 返回除域名外所有字符串
req.method extend http 返回请求类型 GET、POST等
req.get(name)/req.header(name) 底层调用 node http 模块的 req.headers
req.params 返回参数对象，对应的属性名由定义路由时确定，比如 app.get('/user/:id')路由时，可以通过 req.params.id 取得参数
req.query 返回查询参数object对象，等同于  qs.parse(url.parse(req.url, true).query)
req.path 返回字符串，等同于 url.parse(req.url).pathname,pathname 跟 req.url 比，不带 query 后缀
req.body POST请求获取到数据。需要使用 body-parser 中间件
req.cookies 拿到 cookies 值，需要使用 cookie-parser 中间件
```
# Response
Express Response 扩展了 node http.ServerResponse 类，主要是增加一些便捷API以及返回数据时一些默认参数处理。
1. 设置响应头
* res.getHeader(name, value) extend http
* res.setHeader(name, value) extend http
* res.get(field) 底层调用 res.getHeader()
* res.set(field, [, value])/res.header() 底层调用 res.setHeader()
* res.status(code) 底层直接赋值 statusCode 属性
* res.type(type) 快捷设置 Content-Type，底层调用 res.set('Content-Type', type)
* res.cookie(name, value, options) 设置指定name的cookie，该功能 express 提供，而不是 cookie-parser 包实现
* res.clearCookie(name, options) 清除指定name的cookie
2. 发送数据
* res.write(chunk[, encoding], [, callback]) extend http 写入数据
* res.end([data][, encoding]) extend http
* res.send([body]) body可选：Buffer、object、string、Array。除非之前set过Content-Type，否则该方法会根据参数类型自动设置 Content—Type，底层写入数据使用 res.end()
* res.json() 返回json对象，底层调用res.send()
* res.redirect([status,] path) 302 转发 url
* res.render(view [, locals][, callback]) 输出对应html数据
* res.sendStatus(statusCode) status 和 send 的快捷键

# 路由机制源码解析
路由机制是 express 精髓。
express实例 和 new Router() 有一样的API：
* express/router.use(path, callback)
* express/router.all/METHOD(path, callback)
* express.router.route(path)
这是因为 express 实例中保存着一个单例模式的主 Router 对象，这就意味着 Router 有的 API 都可以在 express 实例上。
### use
use 方法一般用于执行中间件，express.use(args) = router.use(args)
```
app.use = function use(fn) {
   // 获取单例主路由
  this.lazyrouter();
  var router = this._router;

  fns.forEach(function (fn) {
    if (!fn || !fn.handle || !fn.set) {
      // 交给router对象去处理
      return router.use(path, fn);
    }
  }, this);

  return this;
};
```
router中use方法，最终定义了layer对象把路径和回调函数做了包装，并把layer压入stack中，方便调用时循环stack以执行匹配的回调函数：
```
proto.use = function use(fn) {
    // layer对象包装path和回调函数
    var layer = new Layer(path, {
      sensitive: this.caseSensitive,
      strict: false,
      end: false
    }, fn);
    // use通常是非路由中间件，故没有route实例
    layer.route = undefined;
    // 压入stack中，路由匹配时会从stack遍历
    this.stack.push(layer);

  return this;
};
```
### route
express/router.route(path) 该方法返回一个 Route 对象，注意是 Route 对象，不是 Router 对象，还是拿到主路由并调用主路由的 route 方法。
```
app.route = function route(path) {
  this.lazyrouter();
  return this._router.route(path);
};
```
router.route 方法是每次新建一个 Route 对象（存储了定义的路由 METHOD 方法），同样经过Layer包装，压入stack中，并最终返回该 Route 实例，简单理解：express.route(path) = new Route(path)

express.use 这种执行中间件方法只要求有path就可以；express.get/post/...需要同时给到path和method，express.get/post/...底层都会调用express.route以得到一个Route实例，Route实例存储了对应路由上哪些方法被注册，比如只有get方式可以匹配到。所以当实际匹配路由时，从router的stack遍历找到对应layer后，如果是中间件就不找了，如果是路由方法则需要通过layer找到对应Route实例，再继续匹配。
```
proto.route = function route(path) {
  // 创建了path下的Route
  var route = new Route(path);

  // 同样用layer包装。
  // 注意回调函数传递的是route.dispatch函数，这里是逻辑递增的关键
  // 保证了定义在路由上的多个中间件函数被按照定义的顺序依次执行
  var layer = new Layer(path, {
    sensitive: this.caseSensitive,
    strict: this.strict,
    end: true
  }, route.dispatch.bind(route));
  // route方法通常用于路由，需要知道具体的请求method
  // 所以需要从statck找到layer，再找到具体route
  // route实例上存储了对应path路由的哪些method
  layer.route = route;
  this.stack.push(layer);

  // 返回该route实例
  return route;
};
```
> 凡是路由机制API中有回调函数的，都会经过layer进行包装，路由匹配到的时候会被调用。
```
proto.handle = function handle(req, res, out) {
  var self = this;
  // 拿到主路由的stack
  var stack = self.stack;

  // next方法循环处理stack
  next();

  function next(err) {
    var layer;
    var match;
    var route;

    // match为true以及idx小于stack长度才继续循环
    // 其他情况都跳出循环
    while (match !== true && idx < stack.length) {
      layer = stack[idx++];
      // 匹配path
      match = matchLayer(layer, path);
      route = layer.route;
      // 没有匹配到，继续下次循环
      if (match !== true) {
        continue;
      }

      // 无路由的中间件，跳出while循环(此时match = true)
      if (!route) {
        continue;
      }

      // 有路由的需要拿到route实例，再判断是否匹配到method
      var method = req.method;
      var has_method = route._handles_method(method);
      // 没有匹配到则继续循环，否则跳出循环
      if (!has_method && method !== 'HEAD') {
        match = false;
        continue;
      }
    }

    // 匹配到的layer都会执行到这
    // process_params主要处理express.param API，这里不展开
    self.process_params(layer, paramcalled, req, res, function (err) {
      if (err) {
        return next(layerError || err);
      }

      // layer的handle_request函数是执行回调函数
      // 把next函数传递下去是为了继续循环执行
      layer.handle_request(req, res, next);
    });
  }
 Copied!
Layer.prototype.handle_request = function handle(req, res, next) {
  var fn = this.handle;

  if (fn.length > 3) {
    // not a standard request handler
    return next();
  }

  try {
    // 暴露给外面的回调函数，包含三个参数req、res、next
    // 所以这就解释了为什么一定要执行next()方法才能路由链路一直走下去
    fn(req, res, next);
  } catch (err) {
    next(err);
  }
};
```
# 总结
* Route 模块对应的是 route.js, 主要是用来处理路由信息的，每条路由都会生成一个Route实例
* Router 模块下可以定义多个路由，也就是说，一个Router模块会包含多个Route模块
* express 实例化了一个new Router()，实际上注册和执行路由都是通过调用Router实例的方法，类似于中介者模式
* 凡是有回调的都是用layer对象包装，layer对象中有match函数来检验是否匹配到路由，handle_request 函数来执行回调
* 路由流程：当客户端发送一个http请求后，会先进入express实例对象对应的router.handle函数中，router.handle 函数会通过next() 遍历stack中的每一个layer进行match，如果match返回true，则获取layer.route,执行route.dispatch 函数，route.dispatch 同样是通过 next() 遍历 stack 中的每一个layer，然后执行layer.handle_request，也就是调用中间件函数。直到所有的中间件函数被执行完毕，整个路由处理结束。

# 遇到的问题：
1. tsc index.ts 的时候控制台打印错误：Cannot compile modules unless the '--module' flag is provided.


