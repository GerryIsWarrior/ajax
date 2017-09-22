/**
 * purpose：     ajax通用解决方案
 * author：      仲强
 * version:      1.7
 * date:         2017-9-21
 * email:        gerry.zhong@outlook.com
 * update:          --1.1   去除跨域请求头部设置   ==> author: keepfool (cnblogs)
 *                  --1.2   更新tool方法，完善结构  ==> author: pod4g  (github)
 *                    --1.3   去除参数中的跨域设置，post方法已经支持跨域   ==>author: wYhooo  (github)
 *                    --1.4   集成ajax的轮询技术
 *                    --1.5.0 集成ajax level2的文件上传 新增tool.is对象，判断数据类型，支持formData数据类型发送
 *                  --1.5.1 集成ajax大文件切割上传，upload_big方法，新增文件切割方法tool.cutFile 返回值为切割好的数组对象
 *                  --1.5.2 更新bug，更细ajax默认值相互影响问题，调试ajax长轮询bug
 *                  --1.6   集成promise规范，更优雅的操作异步
 *                  --1.7   新增ajax的全局配置、对请求参数拓展和重构、对初始化参数类型检查（非正确格式则恢复默认）、增加浏览器错误回收机制、增加请求blob类型、增加跨域传递凭证配置
 */
(function () {

    var root = this;
    //默认参数
    var initParam = {
        url: "",
        type: "",
        baseURL: '',
        data: {},
        async: true,
        requestHeader: {},
        publicData: {},
        timeout: 5000,
        responseType: 'json',
        contentType: '',
        withCredentials: false,
        isOpenErr: false,
        errURL: '',
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
        isOpenErr: 'Boolean',
        errURL: 'String',
        transformRequest: 'function',
        transformResponse: 'function',
        successEvent: 'function',
        errorEvent: 'function',
        timeoutEvent: 'function'
    };
    //内部使用工具
    var tool = {
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
            var temp = {};
            tool.MergeObject(temp, initParam);
            //解决深度拷贝引用地址问题
            temp.data = JSON.parse(JSON.stringify(temp.data))
            temp.requestHeader = JSON.parse(JSON.stringify(temp.requestHeader))
            temp.publicData = JSON.parse(JSON.stringify(temp.publicData))
            tool.MergeObject(temp, options);
            return tool.checkDataTypeBatch(temp, initParamType) ? temp : {};
        },
        //判断是否为其他域的请求
        checkRealUrl: function (param) {
            var temp;
            if (/http:\/\/|https:\/\//.test(param.url)) {
                temp = param.url;
            } else {
                temp = param.baseURL + param.url
            }
            return temp;
        },
        //批量检查数据类型
        checkDataTypeBatch: function (obj, objType) {
            var temp = true;
            tool.each(obj, function (value, key) {
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
                    file: file.slice(cutSize * i, cutSize * ( i + 1 ))
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
            var newPromise = function (fn) {
                var promise = this;
                //状态机的状态
                var PROMISESTATE = {
                    PENDING: 0,
                    FULFILLED: 1,
                    REJECTED: 2
                };
                //存储当前变量的回调函数和标记对象为promise
                promise._fullCalll = [], promise._rejCall = [];
                promise._name = "promise";
                //执行过程中的状态变化(初始化状态为默认状态)
                var _state = PROMISESTATE.PENDING;
                //回调函数的参数
                var _value = undefined;

                //状态变更
                function setState(stateT, valueT) {
                    var promise = this;
                    _state = stateT;
                    _value = valueT;
                    handleFun.call(promise);  //传递作用域，并且执行回调函数
                };

                //根据状态处理回调
                function handleFun() {
                    var promise = this, isThen;

                    if (_state === PROMISESTATE.FULFILLED &&
                        typeof promise._fullCalll[0] === 'function') {
                        isThen = promise._fullCalll[0](_value);
                    }
                    ;
                    if (_state === PROMISESTATE.REJECTED &&
                        typeof promise._rejCall[0] === 'function') {
                        isThen = promise._rejCall[0](_value);
                    }
                    ;
                    //对于是否可以继续进行then做判断
                    //  1. 不可then的，直接return结束（条件：无返回值、返回值不是promise对象的）
                    //  2. 对于可以then的，将then的回调进行处理，然后对象之间传递。
                    if (isThen === undefined || !(typeof isThen === 'object' && isThen._name === 'promise')) return;

                    promise._fullCalll.shift();
                    promise._rejCall.shift();      //清除当前对象使用过的对调
                    isThen._fullCalll = promise._fullCalll;
                    isThen._rejCall = promise._rejCall;  //将剩下的回调传递到下一个对象
                };

                //promimse入口
                function doResolve(fn) {
                    var promise = this;
                    fn(function (param) {
                        setState.call(promise, PROMISESTATE.FULFILLED, param);
                    }, function (reason) {
                        setState.call(promise, PROMISESTATE.REJECTED, reason);
                    });
                };

                //函数then，处理回调，返回对象保证链式调用
                this.then = function (onFulfilled, onRejected) {
                    this._fullCalll.push(onFulfilled);
                    this._rejCall.push(onRejected);
                    return this;
                }

                doResolve.call(promise, fn);
            };
            window.Promise = newPromise;
        },
        //监控浏览器的错误日志
        setOnerror: function () {
            window.onerror = function (errInfo, errUrl, errLine) {
                tempObj.post(initParam.errURL, {
                    errInfo: errInfo,
                    errUrl: errUrl,
                    errLine: errLine,
                    Browser: navigator.userAgent
                })
            }
        },
        //监控ajax请求的错误日志
        // uploadAjaxError: function (obj) {
        //     if (initParam.isOpenErr) {
        //         if (obj.errUrl != initParam.errURL) {
        //             tempObj.post(initParam.errURL, obj)
        //         }
        //     }
        // }
    };
    //抛出去给外部使用的方法
    var tempObj = {
        //通用ajax
        common: function (options) {
            //每次清空请求缓存,并重新合并对象
            var ajaxSetting = tool.checkParam(options), sendData = '';

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
                        break
                }
                //请求前处理参数
                sendData = ajaxSetting.transformRequest(sendData)

                //判断请求类型
                if (ajaxSetting.type === 'get') {
                    xhr.open(ajaxSetting.type, tool.checkRealUrl(ajaxSetting) + '?' + sendData, ajaxSetting.async)
                } else {
                    xhr.open(ajaxSetting.type, tool.checkRealUrl(ajaxSetting), ajaxSetting.async)
                }
            } else {
                xhr.open(ajaxSetting.type, ajaxSetting.baseURL + ajaxSetting.url, ajaxSetting.async)
            }

            xhr.responseType = ajaxSetting.responseType;

            //设置超时时间（只有异步请求才有超时时间）
            ajaxSetting.async ? (xhr.timeoutEvent = ajaxSetting.timeout) : (null);

            //设置http协议的头部
            tool.each(ajaxSetting.requestHeader, function (item, index) {
                xhr.setRequestHeader(index, item)
            });

            //onload事件（IE8下没有该事件）
            xhr.onload = function (e) {
                if (this.status == 200 || this.status == 304) {
                    /*
                    *  ie浏览器全系列不支持responseType='json'，所以在ie下使用JSON.parse进行转换
                    * */
                    if (ajaxSetting.responseType === 'json') {
                        if (isNaN(tool.getIEVersion())) {
                            ajaxSetting.successEvent(ajaxSetting.transformResponse(xhr.response));
                        } else {
                            ajaxSetting.successEvent(ajaxSetting.transformResponse(JSON.parse(xhr.responseText)));
                        }
                    } else {
                        ajaxSetting.successEvent(ajaxSetting.transformResponse(xhr.response));
                    }
                } else {
                    /*
                     *  这边为了兼容IE8、9的问题，以及请求完成而造成的其他错误，比如404等
                     *   如果跨域请求在IE8、9下跨域失败不走onerror方法
                     *       其他支持了Level 2 的版本 直接走onerror
                     * */
                    ajaxSetting.errorEvent(e.currentTarget.status, e.currentTarget.statusText);
                }
            };

            //xmlhttprequest每次变化一个状态所监控的事件（可拓展）
            xhr.onreadystatechange = function () {
                switch (xhr.readyState) {
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
                        if (xhr.xhr_ie8) {
                            if (xhr.status == 200 || xhr.status == 304) {
                                if (ajaxSetting.responseType == "json") {
                                    ajaxSetting.successEvent(ajaxSetting.transformResponse(JSON.parse(xhr.responseText)))
                                }
                            }
                        }
                        break;
                }
                ;
            };

            //ontimeout超时事件
            xhr.ontimeout = function (e) {
                ajaxSetting.timeoutEvent("000000", e ? (e.type) : ("timeoutEvent"));   //IE8 没有e参数
                xhr.abort();  //关闭请求
            };

            //错误事件，直接ajax失败，而不走onload事件
            xhr.onerror = function (e) {
                ajaxSetting.errorEvent(e)
                //错误日志上传
                // tool.uploadAjaxError({
                //     errInfo: e.currentTarget.statusText,
                //     errUrl: tool.checkRealUrl(ajaxSetting),
                //     errLine: e.currentTarget.status,
                //     Browser: navigator.userAgent
                // })
            };

            //发送请求
            xhr.send(ajaxSetting.type === 'get' ? '' : sendData);
        },
        //设置ajax全局配置文件
        config: function (config) {
            tool.MergeObject(initParam, config)
            if (initParam.isOpenErr) {
                tool.setOnerror();
            }
        },
        //异步get请求
        get: function (url, data, successEvent, errorEvent, timeoutEvent) {
            var ajaxParam = {
                type: "get",
                url: url,
                data: data,
                successEvent: successEvent,
                errorEvent: errorEvent,
                timeoutEvent: timeoutEvent
            };
            tempObj.common(ajaxParam);
        },
        //异步post请求
        post: function (url, data, successEvent, errorEvent, timeoutEvent) {
            var ajaxParam = {
                type: "post",
                url: url,
                data: data,
                contentType: '',
                successEvent: successEvent,
                errorEvent: errorEvent,
                timeoutEvent: timeoutEvent
            };
            tempObj.common(ajaxParam);
        },
        //异步post请求
        postJSON: function (url, data, successEvent, contentType, errorEvent, timeoutEvent) {
            var ajaxParam = {
                type: "post",
                url: url,
                data: data,
                contentType: 'json',
                successEvent: successEvent,
                errorEvent: errorEvent,
                timeoutEvent: timeoutEvent
            };
            tempObj.common(ajaxParam);
        },
        //异步post请求
        postFormData: function (url, formData, successEvent, errorEvent, timeoutEvent) {
            var ajaxParam = {
                type: "post",
                url: url,
                data: formData,
                contentType: 'form',
                successEvent: successEvent,
                errorEvent: errorEvent,
                timeoutEvent: timeoutEvent
            };
            tempObj.common(ajaxParam);
        },
        //获取blob数据集
        obtainBlob: function (type, url, data, successEvent, errorEvent, timeoutEvent) {
            var ajaxParam = {
                type: type,
                url: url,
                data: data,
                responseType: 'blob',
                successEvent: successEvent,
                errorEvent: errorEvent,
                timeoutEvent: timeoutEvent
            };
            tempObj.common(ajaxParam);
        },
        //集成promise的ajax请求(默认设置post和get请求，如有其他需求，可自己拓展)
        promiseAjax: function (url, data, type) {
            if (!window.Promise) tool.createPromise();  //保证浏览器的兼容性
            return new Promise(function (resolve, reject) {
                if (type === undefined) tempObj.post(url, data, resolve, reject);
                else tempObj.get(url, data, resolve, reject);
            });
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
            tempObj.common(ajaxParam);
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
        upload: function (url, fileSelector, size, fileType, successEvent, errorEvent, timeoutEvent) {
            var formdata = new FormData(), fileNode = document.querySelector(fileSelector),
                fileCount = fileNode.files.length, data = {}, result = {};
            //以下为上传文件限制检查
            if (fileCount > 0) {
                tool.each(Array.prototype.slice.call(fileNode.files), function (value) {
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

            var ajaxParam = {
                type: "post",
                url: url,
                data: formdata,
                contentType: 'form',
                successEvent: successEvent,
                errorEvent: errorEvent,
                timeoutEvent: timeoutEvent
            };
            tempObj.common(ajaxParam);
        },
        /*
         *   ajax大文件切割上传(支持单个文件)  -- level2的新特性，请保证你的项目支持新的特性再使用
         *       url                 文件上传地址
         *       fileSelector        input=file 选择器
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
        upload_big: function (url, fileSelector, cutSize, fileType, successEvent, progressEvent, errorEvent, timeoutEvent) {
            var file = document.querySelector(fileSelector).files, result = {};
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
                var ajaxParam = {
                    type: "post",
                    url: url,
                    data: fileForm,
                    contentType: 'form',
                    successEvent: function (data) {
                        successEvent(data);
                        progressEvent(1, 1);
                    },
                    errorEvent: errorEvent,
                    timeoutEvent: timeoutEvent
                };
                tempObj.common(ajaxParam);
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
                var ajaxParam = {
                    type: "post",
                    url: url,
                    data: formData,
                    contentType: 'form',
                    successEvent: function (data) {
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
                    },
                    errorEvent: errorEvent,
                    timeoutEvent: timeoutEvent
                };
                tempObj.common(ajaxParam);
            }
        }
    };

    var outputObj = function () {
        //虽然在IE6、7上可以支持，但是最好升级你的浏览器，毕竟xp已经淘汰，面向未来吧，骚年，和我一起努力吧！！
        if (tool.getIEVersion() < 7) {
            //实在不想说：lowB，升级你的浏览器吧
            throw new Error("Sorry,please upgrade your browser.(IE8+)");
        }else{
            tool.each(tempObj,function (value, key) {
                root[key] = value
            })
        }
    };

    new outputObj();

}.call(this));