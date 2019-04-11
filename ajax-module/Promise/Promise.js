/*
*   title：  Promise 原理和实现
*   author： gerry.zhong
*   github:
*   blog：
* */
function Promise(fn) {
  let self = this
  self.PromiseStatus = 'PENDING'

  let callbackArr = [], finallyCall

  this.then = function (resolveFun, rejectFun) {
    // 2.2.1 ✔️
    let Promise2

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
                let x = resolveFun(result)
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
                let x = rejectFun(result)
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
              let x = resolveFun(self.PromiseValue)
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
                let x = rejectFun(self.PromiseValue)
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
        let then;
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
  let temp = arr.map(x => {
    return Promise.resolve(x)
  })

  return new Promise(function (res, rej) {
    let resValue = [], isReject = false
    temp.forEach(x => {
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
  let temp = arr.map(x => {
    return Promise.resolve(x)
  })

  return new Promise(function (res, rej) {
    let isComplete = false
    temp.forEach(x => {
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
