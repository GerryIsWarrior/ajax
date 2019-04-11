/**
 * purpose：     ajax通用解决方案
 * author：      仲强
 * version:      1.9.2
 * date:         2019-04-11
 * email:        gerry.zhong@outlook.com
 * update:          --1.1   去除跨域请求头部设置   ==> author: keepfool (cnblogs)
 *                  --1.2   更新tool方法，完善结构  ==> author: pod4g  (github)
 *                  --1.3   去除参数中的跨域设置，post方法已经支持跨域   ==>author: wYhooo  (github)
 *                  --1.4   集成ajax的轮询技术
 *                    --1.5.0 集成ajax level2的文件上传 新增tool.is对象，判断数据类型，支持formData数据类型发送
 *                    --1.5.1 集成ajax大文件切割上传，upload_big方法，新增文件切割方法tool.cutFile 返回值为切割好的数组对象
 *                    --1.5.2 更新bug，更细ajax默认值相互影响问题，调试ajax长轮询bug
 *                  --1.6   集成promise规范，更优雅的操作异步
 *                  --1.7   新增ajax的全局配置、对请求参数拓展和重构、对初始化参数类型检查（非正确格式则恢复默认）、增加浏览器错误回收机制、增加请求blob类型、增加跨域传递凭证配置
 *                  --1.8   增加请求错误监控、前端负载均衡、宕机切换、以及迭代问题修复
 *                  --1.9   设计请求连接池，让通信更快一点，以及一些迭代的优化
 *                    --1.9.1   完善api文档，upload和upload_big中fileSelector换成file，直接使用文件，而不是去获取
 *                    --1.9.2   完全实现Promise A+模型，增加mock数据功能
 */
(function (window) {
  //默认参数
  var initParam = {
    url: "",
    type: "post",
    baseURL: '',
    data: {},
    async: true,
    requestHeader: {},
    publicData: {},
    timeout: 5000,
    responseType: 'json',
    contentType: '',
    withCredentials: false,
    // 错误搜集
    errStatus: {
      isOpenErr: false,
      errURL: '',
    },
    // 负载均衡
    loadBalancing: {
      isOpen: false,
      cluster: []
    },
    // 宕机切换
    serviceSwitching: {
      isOpen: false,
      // 切换策略
      strategies: function () {
      },
      backupUrl: '',
    },
    // 请求池
    pool: {
      isOpen: true,
      requestNumber: 6,
    },
    // mock功能
    mock: {
      isOpen: true,
      mockData: {}
    },

    transformRequest: function (data) {
      return data;
    },
    transformResponse: function (data) {
      return data;
    },
    successEvent: function (data) {
    },
    errorEvent: function (x, xx, xxx) {
    },
    timeoutEvent: function (code, e) {
    }
  };
  // 原型方法兼容
  Array.prototype.indexOf = function (data) {
    if (Array.indexOf) {
      return Array.indexOf
    } else {
      if (JSON.stringify(data) === '{}' || data.length === 0) {
        return -1
      } else {
        for (var key in this[0]) {
          if (this[0][key] === data) {
            return key
          } else {
            return -1
          }
        }
      }
    }
  }
  //初始化参数固定类型检查
  var initParamType = {
    url: "String",
    type: "String",
    baseURL: 'String',
    data: ['Object', 'FormData'],
    async: 'Boolean',
    requestHeader: 'Object',
    publicData: 'Object',
    timeout: 'Number',
    responseType: 'String',
    contentType: 'String',
    withCredentials: 'Boolean',
    errStatus: 'Object',
    loadBalancing: 'Object',
    serviceSwitching: 'Object',
    pool: 'Object',
    transformRequest: 'function',
    transformResponse: 'function',
    successEvent: 'function',
    errorEvent: 'function',
    timeoutEvent: 'function'
  };
  // 内部使用数据
  var selfData = {
    errAjax: {},
    isNeedSwitching: false,
    requestPool: [],   // 请求池
    queuePool: [],
    xhr: {}
  }

  //内部使用工具
  var tool = {
    random: function (max, min) {
      return Math.floor(Math.random() * (max - min + 1) + min)
    },
    hasOwn: function (obj, key) {
      return Object.prototype.hasOwnProperty.call(obj, key)
    },
    //类型判断
    is: (function checkType() {
      var is = {
        types: ["Array", "Boolean", "Date", "Number", "Object", "RegExp", "String", "Window", "HTMLDocument", "function", "FormData"]
      };
      for (var i = 0, c; c = is.types[i++];) {
        is[c] = (function (type) {
          return function (obj) {
            var temp;
            if (type === "function") {
              temp = typeof obj == type
            } else {
              temp = Object.prototype.toString.call(obj) == "[object " + type + "]";
            }
            return temp;
          }
        })(c);
      }
      ;
      return is;
    })(),
    //获取对象的key
    keys: function (obj) {
      if (Object.keys) return Object.keys(obj);

      var keys = [];
      for (var key in obj) {
        if (this.hasOwn(obj, key)) keys.push(key);
      }
      ;
      return keys
    },
    //each循环
    each: function (obj, callback) {
      var keys = this.keys(obj);
      if (this.is.Array(obj) && [].forEach) {  //判断是否为数组且支持新特性
        obj.forEach(callback);
      } else {
        var i = 0, len = keys.length, key, item;
        while (i < len) {
          key = keys[i++];
          item = obj[key];
          callback.call(obj, item, key);
        }
      }
    },
    //判断对象是否为空
    isEmptyObject: function (e) {
      var t;
      for (t in e)
        return !1;
      return !0
    },
    //合并对象,将第二个合并到第一个对象上
    MergeObject: function (target, source) {
      if (Object.assign) {
        return Object.assign(target, source)
      }
      var sourceKeys = this.keys(source),
        i = 0
      var len = sourceKeys.length;
      while (i < len) {
        var key = sourceKeys[i++]
        target[key] = source[key];
      }
      return target;
    },
    // 深度拷贝对象
    deepClone: function (data) {
      var obj = null, originQueue = [data], visitQueue = [], copyVisitQueue = []
      tool.is.Array(originQueue[0]) ? obj = [] : obj = {}
      var copyQueue = [obj];
      while (originQueue.length > 0) {
        var _data = originQueue.shift();
        var _obj = copyQueue.shift();
        visitQueue.push(_data);
        copyVisitQueue.push(_obj);
        for (var key in _data) {
          var _value = _data[key]
          if (typeof _value !== 'object') {
            _obj[key] = _value;
          } else {
            var index = visitQueue.indexOf(_value)
            if (index > -1) {
              _obj[key] = copyVisitQueue[index];
            } else {
              originQueue.push(_value);
              tool.is.Array(_value) ? _obj[key] = [] : _obj[key] = {}
              copyQueue.push(_obj[key]);
            }
          }
        }
      }
      return obj;
    },
    //创建xhr对象
    createXhrObject: function () {
      var xhr;
      try {
        // IE7 已经有了XMLHttpRequest对象
        XMLHttpRequest ? (xhr = new XMLHttpRequest()) : (xhr = new ActiveXObject('Microsoft.XMLHTTP'));
      } catch (e) {
        throw new Error('ajax:Could not create an XHR object.')
      }
      ;
      return xhr;
    },
    //检查初始化参数
    checkParam: function (options) {
      // 升级深度拷贝丑陋的写法
      var temp = tool.deepClone(initParam);
      tool.MergeObject(temp, options);

      return tool.checkDataTypeBatch(temp, initParamType) ? temp : {};
    },
    /*
     * 判断是否为其他域的请求
     *
     * 改方法中处理负载均衡方案
     *    1. 对于前后端分离，直接请求域名的方案  支持
     *    2. 对于直接请求本服务器的请求，暂时不做处理，让ngx做负载均衡  不支持
     *
     *
     */
    checkRealUrl: function (url, that) {
      if (/http:\/\/|https:\/\//.test(url)) {
        // 针对请求，负载均衡到配置域名  PS:负载均衡优先级 > 宕机切换优先级
        if (initParam.errStatus.errURL !== url) { // 错误搜集接口都不走
          if (initParam.loadBalancing.isOpen) {  // 负载打开肯定走负载
            url = url.replace(/^(http:\/\/|https:\/\/)/, '')
              .replace(/^.*?\//, initParam.loadBalancing.cluster[tool.random(initParam.loadBalancing.cluster.length - 1, 0)] + '/$`')
          } else {
            // 如果负载没开，宕机切换打开，则走介个
            if (initParam.serviceSwitching.isOpen && selfData.isNeedSwitching) {
              url = url.replace(/^(http:\/\/|https:\/\/)/, '')
                .replace(/^.*?\//, initParam.serviceSwitching.backupUrl + '/$`')
            }
          }
        }
      } else {
        url = initParam.baseURL + url
        if (initParam.errStatus.errURL !== url) {
          if (initParam.loadBalancing.isOpen) {
            url = initParam.loadBalancing.cluster[tool.random(initParam.loadBalancing.cluster.length - 1, 0)] + initParam.baseURL + url
          } else {
            // 如果负载没开，宕机切换打开，宕机策略成功则走介个
            if (initParam.serviceSwitching.isOpen && selfData.isNeedSwitching) {
              url = initParam.serviceSwitching.backupUrl + initParam.baseURL + url
            }
          }
        }
      }
      if (!initParam.mock.isOpen) that.currentUrl = url
      return url;
    },
    //批量检查数据类型
    checkDataTypeBatch: function (obj, objType) {
      var temp = true;
      tool.each(obj, function (value, key) {
        // 去除用户在全局配置中额外的参数检测
        if (objType[key] === undefined) return

        var typeName = objType[key], tempOutput;
        if (tool.is.Array(typeName)) {
          tool.each(typeName, function (item) {
            tempOutput = tempOutput || tool.is[item](value);
          })
        } else {
          tempOutput = tool.is[typeName](value)
        }
        if (!tempOutput) {
          obj[key] = initParam[key]
        }
      })
      return temp;
    },
    //判断IE版本
    // 如果不是IE，返回 true
    // 若是IE，返回IE版本号
    getIEVersion: function () {
      return function () {
        // 能进到这里来，说明一定是IE
        if (window.VBArray) {
          // 取出IE的版本
          var mode = document.documentMode
          // IE6、IE7 不支持documentMode，那就使用XMLHttpRequest，支持的就是IE7，否则就是IE6
          // 至于支持documentMode的IE，则直接return
          return mode ? mode : window.XMLHttpRequest ? 7 : 6
        } else {
          return NaN
        }
      }()
    },
    //切割大文件
    cutFile: function (file, cutSize) {
      var count = file.size / cutSize | 0, fileArr = [];
      for (var i = 0; i < count; i++) {
        fileArr.push({
          name: file.name + ".part" + (i + 1),
          file: file.slice(cutSize * i, cutSize * (i + 1))
        });
      }
      ;
      fileArr.push({
        name: file.name + ".part" + (count + 1),
        file: file.slice(cutSize * count, file.size)
      });
      return fileArr;
    },
    //如果浏览器不支持Promise特性，将用简易的promise代替(IE11-都不支持ES6 Promise)
    createPromise: function () {
      var newPromise = function Promise(fn) {
        var self = this
        self.PromiseStatus = 'PENDING'

        var callbackArr = [], finallyCall

        this.then = function (resolveFun, rejectFun) {
          // 2.2.1 ✔️
          var Promise2

          // pending 状态处理
          if (self.PromiseStatus === 'PENDING') {
            if (typeof resolveFun !== "function") {
              resolveFun = new Function()
            }
            if (typeof rejectFun !== "function") {
              rejectFun = new Function()
            }
            return Promise2 = new Promise(function (resolve, reject) {
              callbackArr.push({
                // 暂存resolveCall
                resolveCall: function (result) {
                  setTimeout(function () {
                    try {
                      var x = resolveFun(result)
                      resolvePromise(Promise2, x, resolve, reject)
                    } catch (e) {
                      reject(e)
                    }
                    if (finallyCall) finallyCall()
                  })
                },
                // 暂存rejectCall
                rejectCall: function (result) {
                  setTimeout(function () {
                    try {
                      var x = rejectFun(result)
                      resolvePromise(Promise2, x, resolve, reject)
                    } catch (e) {
                      reject(e)
                    }
                    if (finallyCall) finallyCall()
                  })
                }
              })
            })
          }

          // resolve 状态处理
          if (self.PromiseStatus === 'RESOLVE') {
            return Promise2 = new Promise(function (resolve, reject) {
              // 2.2.7.3 ✔️
              if (typeof resolveFun !== 'function') {
                resolve(self.PromiseValue)
              } else {
                try {
                  setTimeout(function () {
                    var x = resolveFun(self.PromiseValue)
                    resolvePromise(Promise2, x, resolve, reject)
                  })
                } catch (e) {
                  reject(e)
                }
              }
            })
          }

          // reject 状态处理
          if (self.PromiseStatus === 'REJECT') {
            return Promise2 = new Promise(function (resolve, reject) {
              setTimeout(function () {
                // 2.2.7.4 ✔️
                if (typeof rejectFun !== 'function') {
                  reject(rejectFun)
                } else {
                  try {
                    setTimeout(function () {
                      var x = rejectFun(self.PromiseValue)
                      resolvePromise(Promise2, x, resolve, reject)
                    })
                  } catch (e) {
                    reject(e)
                  }
                }
              })
            })
          }
        }

        // 由then方法实现catch方法
        this.catch = function (onRejected) {
          return this.then(null, onRejected)
        }

        // finally方法
        this.finally = function (callback) {
          finallyCall = callback
        }

        // 同步promise2和x状态
        function resolvePromise(promise2, x, resolve, reject) {
          // 2.3.1 ✔️
          if (promise2 === x) {
            return reject(new TypeError('promise and x refer to the same object'))
          }

          if (x instanceof Promise) {
            // 2.3.2 ✔️
            if (x.PromiseStatus === 'PENDING') {
              return x.then(resolve, reject)
            }
            if (x.PromiseStatus === 'RESOLVE') {
              return resolve(x.PromiseValue)
            }
            if (x.PromiseStatus === 'REJECT') {
              return reject(x.PromiseValue)
            }
          } else {
            if (typeof x === 'object' || typeof x === 'function') {
              var then;
              // 2.3.3.2 ✔️
              try {
                then = x.then
              } catch (e) {
                return reject(e)
              }

              if (typeof then === 'function') {
                try {
                  then.call(x, function (y) {
                    return resolvePromise(promise2, y, resolve, reject)
                  }, function (r) {
                    return reject(r)
                  })
                } catch (e) {
                  return reject(e)
                }
              } else {
                return resolve(x)
              }
            } else {
              return resolve(x)
            }
          }
        }

        // resolve状态变化
        function resolveFun(result) {
          // 2.2.2 ✔️
          setTimeout(function () {
            if (self.PromiseStatus === 'PENDING') {
              self.PromiseStatus = 'RESOLVE'
              self.PromiseValue = result
              // 2.2.2.3 ✔️
              if (callbackArr[0]) {
                callbackArr[0].resolveCall(result)   // 2.2.5 ✔️
              }
            }
          })
        }

        // reject状态变化
        function rejectFun(result) {
          // 2.2.3 ✔️
          setTimeout(function () {
            if (self.PromiseStatus === 'PENDING') {
              self.PromiseStatus = 'REJECT'
              self.PromiseValue = result
              if (callbackArr[0]) {
                // 2.2.3.3 ✔️
                callbackArr[0].rejectCall(result)    // 2.2.5 ✔️
              }
            }
          })
        }

        // 2.2.4 执行平台代码 ✔️
        fn(resolveFun, rejectFun)
      }
      Promise.all = function (arr) {
        var temp = []
        tool.each(arr, function (x) {
          temp.push(Promise.resolve(x))
        })

        return new Promise(function (res, rej) {
          var resValue = [], isReject = false
          tool.each(temp, function (x) {
            x.then(function (value) {
              resValue.push(value)
              if (resValue.length === temp.length) res(resValue)
            }, function (reason) {
              if (!isReject) {
                rej(reason)
                isReject = true
              }
            })
          })
        })
      }
      Promise.race = function (arr) {
        var temp = arr.map(x => {
          return Promise.resolve(x)
        })

        return new Promise(function (res, rej) {
          var isComplete = false
          tool.each(temp, function (x) {
            x.then(function (value) {
              if (!isComplete) {
                res(value)
                isComplete = true
              }
            }, function (reason) {
              if (!isComplete) {
                rej(reason)
                isComplete = true
              }
            })
          })
        })

      }
      Promise.resolve = function (param) {
        if (param instanceof Promise) {
          return param
        } else {
          if (param !== null && typeof param === 'object' && param.then && typeof param.then === "function") {
            return new Promise(param.then)
          } else {
            return new Promise(function (res, rej) {
              res(param)
            })
          }
        }
      }
      Promise.reject = function (param) {
        return new Promise(function (res, rej) {
          rej(param)
        })
      }
      window.Promise = newPromise;
    },
    //监控浏览器的错误日志
    setOnerror: function () {
      window.onerror = function (errInfo, errUrl, errLine) {
        tempObj.post(initParam.errStatus.errURL, {
          type: 'browser',
          errInfo: errInfo,
          errUrl: errUrl,
          errLine: errLine,
          Browser: navigator.userAgent
        })
      }
    },
    //监控ajax请求的错误日志
    uploadAjaxError: function (obj) {
      if (initParam.errStatus.isOpenErr) {
        if (obj.errUrl !== initParam.errStatus.errURL) {
          tempObj.post(initParam.errStatus.errURL, obj)
        }
      }
      // 记录错误信息，以便策略做判断
      if (selfData.errAjax[obj.errUrl] === undefined) {
        selfData.errAjax[obj.errUrl] = 1
      } else {
        selfData.errAjax[obj.errUrl] += 1
      }

      // 判断是否开启服务切换，以及验证策略切换
      if (initParam.serviceSwitching.isOpen) {
        // 验证策略
        selfData.isNeedSwitching = initParam.serviceSwitching.strategies(selfData.errAjax)
      }

    },
    // 拷贝xhr参数
    deepCloneXhr: function (data, requestNum) {
      var mapping = {
        currentUrl: true,
        onerror: true,
        onload: true,
        onreadystatechange: true,
        ontimeout: true,
        // responseType:true,
        timeout: true,               // IE系列只有open连接之后才支持覆盖
        withCredentials: true,
        xhr_ie8: true
      }
      var temp = {}

      for (var key in data) {
        if (mapping[key]) {
          if (isNaN(tool.getIEVersion()) && key !== 'timeout') {
            temp[key] = data[key]
          } else {
            var newKey = '_' + key
            temp[newKey] = data[key]
          }
        }
      }

      for (var i = 0; i < requestNum; i++) {
        var nullRequest = tool.createXhrObject()
        tool.MergeObject(nullRequest, temp)
        selfData.requestPool.push(nullRequest)
      }
    },
    // 创建请求池中链接
    createPool: function () {
      // IE 系列不支持发送请求传''，所以默认/
      tempObj.common({url: '/'}, true)
      tool.deepCloneXhr(selfData.xhr, initParam.pool.requestNumber)
    },
    // 请求池申请请求使用
    useRequestPool: function (param) {
      // mock数据校验
      var ajaxSetting = tool.checkParam(param)
      var urlMockValue = ajaxSetting.mock.mockData[ajaxSetting.url]
      if (ajaxSetting.mock.isOpen && urlMockValue ) {
        ajaxSetting.successEvent(urlMockValue)
      }else {
        // 判断请求池中是否有可用请求
        if (selfData.requestPool.length !== 0) {
          var temp = selfData.requestPool.shift(), sendData = '', tempHeader = {}
          // 赋值操作,将数据捆绑到原型上
          temp.callback_success = ajaxSetting.successEvent
          temp.callback_error = ajaxSetting.errorEvent
          temp.callback_timeout = ajaxSetting.timeoutEvent
          temp.data = ajaxSetting.data

          // 处理参数
          switch (ajaxSetting.contentType) {
            case '':
              tool.each(tool.MergeObject(ajaxSetting.data, initParam.publicData), function (item, index) {
                sendData += (index + "=" + item + "&")
              });
              sendData = sendData.slice(0, -1);
              break
            case 'json':
              sendData = JSON.stringify(tool.MergeObject(ajaxSetting.data, initParam.publicData))
              break
            case 'form':
              if (!tool.isEmptyObject(initParam.publicData)) {
                tool.each(initParam.publicData, function (item, index) {
                  ajaxSetting.data.append(index, item)
                })
              }
              sendData = ajaxSetting.data
              break
          }

          //判断请求类型
          if (ajaxSetting.type === 'get') {
            temp.open(ajaxSetting.type, tool.checkRealUrl(ajaxSetting.url, temp) + (sendData === '' ? '' : ('?' + sendData)))
          } else {
            temp.open(ajaxSetting.type, tool.checkRealUrl(ajaxSetting.url, temp))
          }

          ajaxSetting.responseType ? (temp.responseType = ajaxSetting.responseType) : null

          if (!isNaN(tool.getIEVersion())) {
            temp.timeout = temp._timeout
          }

          switch (ajaxSetting.contentType) {
            case '':
              tempHeader['Content-Type'] = 'application/x-www-form-urlencoded'
              break
            case 'json':
              tempHeader['Content-Type'] = 'application/json'
              break
          }

          //设置http协议的头部
          tool.each(tool.MergeObject(tempHeader, initParam.requestHeader), function (item, index) {
            temp.setRequestHeader(index, item)
          });

          //发送请求
          temp.send(ajaxSetting.type === 'get' ? '' : sendData);
        } else {
          // 没有请求，加载到待发送队列中
          selfData.queuePool.push(ajaxSetting)
        }
      }
    },
    // 请求周期结束操作
    responseOver: function (xhr) {
      selfData.requestPool.push(xhr)
      if (selfData.queuePool.length > 0) {
        var tempData = selfData.queuePool.shift()
        tool.useRequestPool(tempData)
      }
    }
  };
  //抛出去给外部使用的方法
  var tempObj = {
    //通用ajax
    common: function (options, isCreatePoll) {
      //每次清空请求缓存,并重新合并对象
      var ajaxSetting = tool.checkParam(options),
        sendData = '';

      // mock数据校验
      var urlMockValue = ajaxSetting.mock.mockData[ajaxSetting.url]
      if (ajaxSetting.mock.isOpen && urlMockValue ) {
        ajaxSetting.successEvent(urlMockValue)
      }else {
        //创建xhr对象
        var xhr = tool.createXhrObject();

        //针对某些特定版本的mozillar浏览器的BUG进行修正
        xhr.overrideMimeType ? (xhr.overrideMimeType("text/javascript")) : (null);

        //针对IE8的xhr做处理    PS：ie8下的xhr无xhr.onload事件，所以这里做判断
        xhr.onload === undefined ? (xhr.xhr_ie8 = true) : (xhr.xhr_ie8 = false);

        //参数处理（get和post）,包括xhr.open     get:拼接好url再open   post:先open，再设置其他参数
        if (ajaxSetting.data) {
          switch (ajaxSetting.contentType) {
            case '':
              tool.each(tool.MergeObject(ajaxSetting.data, ajaxSetting.publicData), function (item, index) {
                sendData += (index + "=" + item + "&")
              });
              sendData = sendData.slice(0, -1);
              ajaxSetting.requestHeader['Content-Type'] = 'application/x-www-form-urlencoded'
              break
            case 'json':
              sendData = JSON.stringify(tool.MergeObject(ajaxSetting.data, ajaxSetting.publicData))
              ajaxSetting.requestHeader['Content-Type'] = 'application/json'
              break
            case 'form':
              if (!tool.isEmptyObject(ajaxSetting.publicData)) {
                tool.each(ajaxSetting.publicData, function (item, index) {
                  ajaxSetting.data.append(index, item)
                })
              }
              sendData = ajaxSetting.data
              // ajaxSetting.requestHeader['Content-Type'] = 'multipart/form-data'
              break
          }
          //请求前处理参数
          sendData = ajaxSetting.transformRequest(sendData)

          //判断请求类型
          if (ajaxSetting.type === 'get') {
            xhr.open(ajaxSetting.type, tool.checkRealUrl(ajaxSetting.url, xhr) + '?' + sendData, ajaxSetting.async)
          } else {
            xhr.open(ajaxSetting.type, tool.checkRealUrl(ajaxSetting.url, xhr), ajaxSetting.async)
          }
        } else {
          xhr.open(ajaxSetting.type, ajaxSetting.baseURL + ajaxSetting.url, ajaxSetting.async)
        }

        /*
        * 同步请求注意事项
        *   xhr.timeout必须为0
        *   xhr.withCredentials必须为 false
        *   xhr.responseType必须为""（注意置为"text"也不允许）
        * */
        if (ajaxSetting.async) {
          xhr.timeout = ajaxSetting.timeout
          xhr.responseType = ajaxSetting.responseType;
          xhr.withCredentials = ajaxSetting.withCredentials;
        } else {
          //xhr.responseType = ""    // responseType在同步下。连设置都不允许
          // xhr.timeout = 0  // timeout在同步下。连设置都不允许
          xhr.withCredentials = false
        }

        //设置http协议的头部
        tool.each(ajaxSetting.requestHeader, function (item, index) {
          xhr.setRequestHeader(index, item)
        });

        //onload事件（IE8下没有该事件）
        xhr.onload = function (e) {
          if (this.readyState === 4 && (this.status == 200 || this.status == 304)) {
            /*
            *  ie浏览器全系列不支持responseType='json'和response取值，所以在ie下使用JSON.parse进行转换
            * */
            if (!isNaN(tool.getIEVersion())) {
              if (this.responseType === 'json') {
                this.callback_success ?
                  this.callback_success(ajaxSetting.transformResponse(JSON.parse(this.responseText))) :
                  ajaxSetting.successEvent(ajaxSetting.transformResponse(JSON.parse(this.responseText)));
              } else {
                this.callback_success ?
                  this.callback_success(ajaxSetting.transformResponse(this.responseText)) :
                  ajaxSetting.successEvent(ajaxSetting.transformResponse(this.responseText));
              }
            } else {
              this.callback_success ?
                this.callback_success(ajaxSetting.transformResponse(this.response)) :
                ajaxSetting.successEvent(ajaxSetting.transformResponse(this.response));
            }
          } else {
            /*
             *  这边为了兼容IE8、9的问题，以及请求完成而造成的其他错误，比如404等
             *   如果跨域请求在IE8、9下跨域失败不走onerror方法
             *       其他支持了Level 2 的版本 直接走onerror
             * */
            this.callback_error ?
              this.callback_error(e.currentTarget.status, e.currentTarget.statusText) :
              ajaxSetting.errorEvent(e.currentTarget.status, e.currentTarget.statusText);

            // 请求错误搜集
            tool.uploadAjaxError({
              type: 'request',
              errInfo: JSON.stringify(this.data ? this.data : ajaxSetting.data),
              errUrl: this.currentUrl,
              errLine: this.status,
              Browser: navigator.userAgent
            })
          }

          // 生命周期结束之后返回数据池，不绑定状态（是否为成功或失败状态）
          if (ajaxSetting.pool.isOpen) {
            tool.responseOver(this)
          }
        };

        //xmlhttprequest每次变化一个状态所监控的事件（可拓展）
        xhr.onreadystatechange = function () {
          switch (this.readyState) {
            case 1://打开
              //do something
              break;
            case 2://获取header
              //do something
              break;
            case 3://请求
              //do something
              break;
            case 4://完成
              //在ie8下面，无xhr的onload事件，只能放在此处处理回调结果
              if (this.xhr_ie8) {
                if (this.status === 200 || this.status === 304) {
                  if (this.responseType == "json") {
                    this.callback_success ?
                      this.callback_success(ajaxSetting.transformResponse(JSON.parse(this.responseText))) :
                      ajaxSetting.successEvent(ajaxSetting.transformResponse(JSON.parse(this.responseText)))
                  } else {
                    this.callback_success ?
                      this.callback_success(ajaxSetting.transformResponse(this.responseText)) :
                      ajaxSetting.successEvent(ajaxSetting.transformResponse(this.responseText))
                  }
                } else {
                  // 请求错误搜集
                  tool.uploadAjaxError({
                    type: 'request',
                    errInfo: JSON.stringify(this.data ? this.data : ajaxSetting.data),
                    errUrl: this.currentUrl,
                    errLine: this.status,
                    Browser: navigator.userAgent
                  })
                }
                // 针对IE8 请求池处理
                if (ajaxSetting.pool.isOpen) {
                  tool.responseOver(this)
                }
              } else {
                if (this.status === 0) {
                  // 发送不存在请求，将不会走onload，直接这里就挂了，请求归还请求池
                  if (ajaxSetting.pool.isOpen) {
                    tool.responseOver(this)
                  }
                }
              }
              break;
          }
          ;
        };

        //ontimeout超时事件
        xhr.ontimeout = function (e) {
          this.callback_timeout ?
            this.callback_timeout("000000", e ? (e.type) : ("timeoutEvent")) :
            ajaxSetting.timeoutEvent("000000", e ? (e.type) : ("timeoutEvent"));   //IE8 没有e参数
          this.abort();  //关闭请求
          // 请求错误搜集
          tool.uploadAjaxError({
            type: 'request',
            errInfo: JSON.stringify(this.data ? this.data : ajaxSetting.data),
            errUrl: this.currentUrl,
            errLine: 'timeout',
            Browser: navigator.userAgent
          })
        };

        //错误事件，直接ajax失败，而不走onload事件
        xhr.onerror = function (e, x, xx, xxx, xxxx) {
          this.callback_error ?
            this.callback_error(e) :
            ajaxSetting.errorEvent(e)

          // 请求错误搜集
          tool.uploadAjaxError({
            type: 'request',
            errInfo: JSON.stringify(this.data ? this.data : ajaxSetting.data),
            errUrl: this.currentUrl,
            errLine: 'RequestErr',
            Browser: navigator.userAgent
          })
        };

        if (!isCreatePoll) {
          //发送请求
          xhr.send(ajaxSetting.type === 'get' ? '' : sendData);
        } else {
          selfData.xhr = xhr
        }
      }
    },
    //设置ajax全局配置文件
    config: function (config) {
      // 深度拷贝且检查过没有错误的对象
      var temp = tool.checkParam(config)
      tool.MergeObject(initParam, temp)
      if (initParam.errStatus.isOpenErr) {
        tool.setOnerror();
      }

      if (initParam.pool.isOpen) {
        // 清空请求池+排队队列
        selfData.requestPool = []
        selfData.queuePool = []
        // 重新建立请求池
        tool.createPool()
      }
    },
    //异步get请求
    get: function (url, data) {
      return new Promise(function (res, rej) {
        var ajaxParam = {
          type: "get",
          url: url,
          data: data,
          contentType: '',
          successEvent: res,
          errorEvent: rej,
          timeoutEvent: rej
        };
        if (initParam.pool.isOpen) {
          tool.useRequestPool(ajaxParam)
        } else {
          tempObj.common(ajaxParam);
        }
      })
    },
    //异步post请求
    post: function (url, data) {
      return new Promise(function (res, rej) {
        var ajaxParam = {
          type: "post",
          url: url,
          data: data,
          contentType: 'json',
          successEvent: res,
          errorEvent: rej,
          timeoutEvent: rej
        };

        if (initParam.pool.isOpen) {
          tool.useRequestPool(ajaxParam)
        } else {
          tempObj.common(ajaxParam);
        }
      })
    },
    //异步post请求
    postFormData: function (url, formData) {
      return new Promise(function (res,rej) {
        var ajaxParam = {
          type: "post",
          url: url,
          data: formData,
          contentType: 'form',
          successEvent: res,
          errorEvent: rej,
          timeoutEvent: rej
        };
        if (initParam.pool.isOpen) {
          tool.useRequestPool(ajaxParam)
        } else {
          tempObj.common(ajaxParam);
        }
      })
    },
    //获取blob数据集
    obtainBlob: function (type, url, data) {
      return new Promise(function (res, rej) {
        var ajaxParam = {
          type: type,
          url: url,
          data: data,
          responseType: 'blob',
          successEvent: res,
          errorEvent: rej,
          timeoutEvent: rej
        };
        if (initParam.pool.isOpen) {
          tool.useRequestPool(ajaxParam)
        } else {
          tempObj.common(ajaxParam);
        }
      })
    },
    /*
     * 长轮询的实现
     *   param: type  请求类型
     *          url   请求接口地址
     *          data  请求参数
     *          successEvent(data,this)     成功事件处理  如果得到正确数据，则让轮询停止，则在第二个回调参数设置stop属性就好
     *          timeFrequency               每隔多少时间发送一次请求
     *          errorEvent                  错误事件
     *          timeoutEvent                超时处理
     * */
    longPolling: function (type, url, data, successEvent, timeFrequency, errorEvent, timeoutEvent) {
      var ajaxParam = {
        type: type,
        url: url,
        data: data,
        contentType: 'json',
        successEvent: function (dateCall) {
          successEvent(dateCall, this);
          if (!this.stop) {
            setTimeout(function () {
              tempObj.longPolling(type, url, data, successEvent, timeFrequency, errorEvent, timeoutEvent);
            }, timeFrequency);
          }
          ;
        },
        //如果走了error说明该接口有问题，没必要继续下去了
        errorEvent: errorEvent,
        timeoutEvent: function () {
          timeoutEvent();
          setTimeout(function () {
            tempObj.longPolling(type, url, data, successEvent, timeFrequency, errorEvent, timeoutEvent)
          }, timeFrequency);
        }
      };

      if (initParam.pool.isOpen) {
        tool.useRequestPool(ajaxParam)
      } else {
        tempObj.common(ajaxParam);
      }
    },
    /*
     *   ajax上传文件 -- level2的新特性，请保证你的项目支持新的特性再使用
     *       url                 文件上传地址
     *       fileSelector        input=file 选择器
     *       size                文件限制大小
     *       fileType            文件限制类型 mime类型
     *       successEvent             上传成功处理
     *       errorEvent               上传失败处理
     *       timeoutEvent             超时处理
     *
     *   return: status:  0      请选择文件
     *                    1      超出文件限制大小
     *                    2      非允许文件格式
     * */
    upload: function (url, file, size, fileType, successEvent, errorEvent, timeoutEvent) {
      var formdata = new FormData(),
        fileCount = file.length, data = {},
        result = {};
      //以下为上传文件限制检查
      if (fileCount > 0) {
        tool.each(Array.prototype.slice.call(file), function (value) {
          //检查文件大小
          if (value.size > size) {
            result["status"] = 1;
            result["errMsg"] = "超出文件限制大小";
          } else {
            if (fileType != "*") {
              //检查文件格式.因为支持formdata，自然支持数组的indexof(h5)
              if (fileType.indexOf(value.type) === -1) {
                result["status"] = 2;
                result["errMsg"] = "非允许文件格式";
              } else {
                formdata.append(value.name, value);
              }
              ;
            } else {
              formdata.append(value.name, value);
            }
          }
          ;
        });
      } else {
        result["status"] = 0;
        result["errMsg"] = "请选择文件";
      }
      ;

      if (result.status !== undefined) return result;   //如果有错误信息直接抛出去,结束运行

      tempObj.postFormData(url, formdata, successEvent, errorEvent, timeoutEvent)
    },
    /*
     *   ajax大文件切割上传(支持单个文件)  -- level2的新特性，请保证你的项目支持新的特性再使用
     *       url                 文件上传地址
     *       file                input=file选中的文件
     *       cutSize             切割文件大小
     *       fileType            文件限制类型 mime类型
     *       successEvent        上传成功处理
     *       progressEvent       上传进度事件
     *       errorEvent          上传失败处理
     *       timeoutEvent        超时处理事件
     *
     *   return: status:  0      请选择文件
     *                    1      非允许文件格式
     * */
    upload_big: function (url, file, cutSize, fileType, successEvent, progressEvent, errorEvent, timeoutEvent) {
      var result = {};
      //以下为上传文件限制检查
      if (file.length === 1) {
        if (fileType != "*") {
          if (fileType.indexOf(file.type) === -1) {
            result["status"] = 1;
            result["errMsg"] = "非允许文件格式";
          }
        }
      } else {
        result["status"] = 0;
        result["errMsg"] = "请选择文件/只能上传一个文件";
      }
      ;

      if (result.status !== undefined) return result;   //如果有错误信息直接抛出去,结束运行

      //判断上传文件是否超过需要切割的大小
      if (file[0].size > cutSize) {
        var fileArr = tool.cutFile(file[0], cutSize);  //切割文件
        cutFile_upload(fileArr);
      } else {
        var fileForm = new FormData();
        fileForm.append("name", file[0].name);
        fileForm.append("file".name, file[0]);
        fileForm.append("count", 1);
        fileForm.append("cutSize", cutSize);

        tempObj.postFormData(url, fileForm, function (data) {
          successEvent(data);
          progressEvent(1, 1);
        }, errorEvent, timeoutEvent)
      }
      ;

      /*
       *   切割文件上传，配合后台接口进行对接
       *       传输参数：
       *           count   -- 当前传输part的次数
       *           name    -- 做过处理的文件名称
       *           file    -- 上传的.part的切割文件
       *           isLast  -- 是否为最后一次切割文件上传（默认值："true"  字符串，只有最后一次才附加）
       * */
      function cutFile_upload(fileArr, count) {
        var formData = new FormData();
        if (count == undefined) {
          count = 0;
          formData.append("name", fileArr[0].name);
          formData.append("file".name, fileArr[0].file);
        } else {
          if (count === fileArr.length - 1) {
            formData.append("isLast", "true")
          }
          ;
          formData.append("name", fileArr[count].name);
          formData.append("file".name, fileArr[count].file);
        }
        formData.append("count", count);
        formData.append("cutSize", cutSize);
        ;

        tempObj.postFormData(url, formData, function (data) {
          /*
             *   data 参数设置  需要后台接口配合
             *       建议：如果后台成功保存.part文件，建议返回下次所需要的部分，比如当前发送count为0，则data返回下次为1。
             *             如果保存不成功，则可false，或者返回错误信息，可在successEvent中处理
             *
             * */
          progressEvent(count + 1, fileArr.length);   //上传进度事件，第一个参数：当前上传次数；第二个参数：总共文件数

          var currCount = Number(data);
          if (currCount) {
            if (currCount != fileArr.length) {
              cutFile_upload(fileArr, currCount);
            }
            ;
          }
          ;
          successEvent(data);  //成功处理事件
        }, errorEvent, timeoutEvent)
      }
    }
  };

  var outputObj = function () {
    //虽然在IE6、7上可以支持，但是最好升级你的浏览器，毕竟xp已经淘汰，面向未来吧，骚年，和我一起努力吧！！
    if (tool.getIEVersion() < 7) {
      //实在不想说：升级你的浏览器吧
      throw new Error("Sorry,please update your browser.(IE8+)");
    }

    // 是否开启连接池
    if (initParam.pool.isOpen) {
      tool.createPool()
    }

    return tempObj;
  };

  window.ajax = new outputObj();

})(this);
