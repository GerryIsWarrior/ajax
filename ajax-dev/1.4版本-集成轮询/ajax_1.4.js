/**
 * purpose：     ajax通用解决方案
 * author：      仲强
 * version:      1.4
 * date:         2016-12-7
 * email:        gerry.zhong@outlook.com
 * update:          --1.1 去除跨域请求头部设置   ==> author: keepfool (cnblogs)
 *                  --1.2 更新tool方法，完善结构  ==> author: pod4g  (github)
 *					--1.3 去除参数中的跨域设置，post方法已经支持跨域   ==>author: wYhooo  (github)
 *				    --1.4 集成ajax的轮询技术
 *
 */
(function(window){
    var initParam ={
        time:10000,                             //超时时间（单位：毫秒）
        type:"",                                //请求类型（get、post...）
        url:"",                                 //请求接口
        data:"",                                //请求参数（格式：json对象）  例子：{"name":"gerry","age":"88"}
        async:true,                             //同|异步请求 （异步：true 同步：false）
        dataType:'',                            //返回值处理（可拓展）   目前只实现：JSON
        success:function(data){},               //请求成功处理事件
        error:function(x,xx,xxx){},             //请求失败处理事件
        timeout:function(){},                   //请求超时处理事件
        requestHeader:{}                        //报文头设置（可自定义报文头）
    };

    var tool = {
        hasOwn: function(obj, key){
            return Object.prototype.hasOwnProperty.call(obj, key)
        },

        keys: function(obj){
            if(Object.keys) return Object.keys(obj);

            var keys = [];
            for(var key in obj){
                if(this.hasOwn(obj, key)) keys.push(key);
            };
            return keys
        },
        //each循环
        each:function(obj,callback){
            var keys = this.keys(obj)
            var i = 0, len = keys.length, key, item;
            while( i < len ){
                key = keys[i++];
                item = obj[key];
                callback.call(obj, item, key);
            }
        },
        //合并对象,将第二个合并到第一个对象上
        MergeObject:function(target,source){
            if(Object.assign){
                return Object.assign(target, source)
            }
            var targetKeys = this.keys(target),
                sourceKeys = this.keys(source),
                i = 0
            var len = sourceKeys.length;
            while( i < len ){
                var key = sourceKeys[i++]
                target[key] = source[key];
            }
            return target;
        },
        //创建xhr对象
        createXhrObject:function(){
            var xhr;
            try{
                // IE7 已经有了XMLHttpRequest对象
                XMLHttpRequest?(xhr= new XMLHttpRequest()):(xhr= new ActiveXObject('Microsoft.XMLHTTP'));
            }catch (e){
                throw new Error('ajax:Could not create an XHR object.')
            };
            return xhr;
        },
        //ajax参数处理，可拓展
        dealWithParam:function(ajaxSetting,that,xhr){
            switch (ajaxSetting.type.toUpperCase()) {
                case "GET":
                    var getParam = "?";
                    tool.each(ajaxSetting.data,function(item,index){
                        getParam +=(encodeURI(index)+"="+encodeURI(item)+"&")
                    });
                    //处理最后一位"&"符号，其实不处理也没事，强迫症犯了，尴尬
                    getParam =getParam.substr(0,getParam.length-1);
                    //打开请求
                    xhr.open(ajaxSetting.type.toUpperCase(), ajaxSetting.url+=getParam, ajaxSetting.async);
                    break;
                case "POST":
                    //打开请求
                    xhr.open(ajaxSetting.type.toUpperCase(), ajaxSetting.url, ajaxSetting.async);
                    var postParam ="";
                    xhr.setRequestHeader("content-type","application/x-www-form-urlencoded");
                    tool.each(ajaxSetting.data,function(item,index){
                        postParam +=(index+"="+item+"&")
                    });
                    //处理最后一位"&"符号，其实不处理也没事，强迫症犯了，尴尬
                    postParam =postParam.substr(0,postParam.length-1);
                    that.postParam = postParam;
                    break;
            };
            return xhr;
        },
        //判断IE版本
        // 如果不是IE，返回 true
        // 若是IE，返回IE版本号
        getIEVersion:function(){
            return function() {
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
        }
    };

    var tempObj ={
        //通用ajax
        common:function(options){
            //合并参数对象
            var ajaxSetting = tool.MergeObject(initParam,options);

            //创建xhr对象
            var xhr = tool.createXhrObject();

            //针对某些特定版本的mozillar浏览器的BUG进行修正
            xhr.overrideMimeType?(xhr.overrideMimeType("text/javascript")):(null);

            //针对IE8的xhr做处理    PS：ie8下的xhr无xhr.onload事件，所以这里做判断
            xhr.onload===undefined?(xhr.xhr_ie8=true):(xhr.xhr_ie8=false);

            //参数处理（get和post）,包括xhr.open     get:拼接好url再open   post:先open，再设置其他参数
            ajaxSetting.data === ""?(xhr.open(ajaxSetting.type.toUpperCase(), ajaxSetting.url, ajaxSetting.async)):(xhr = tool.dealWithParam(ajaxSetting,this,xhr));

            //设置超时时间（只有异步请求才有超时时间）
            ajaxSetting.async?(xhr.timeout = ajaxSetting.time):(null);

            //设置http协议的头部
            tool.each(ajaxSetting.requestHeader,function(item,index){xhr.setRequestHeader(index,item)});

            //onload事件（IE8下没有该事件）
            xhr.onload = function(e) {
                if(this.status == 200||this.status == 304){
                    ajaxSetting.dataType.toUpperCase() == "JSON"?(ajaxSetting.success(JSON.parse(xhr.responseText))):(ajaxSetting.success(xhr.responseText));
                }else{
                    /*
                     *  这边为了兼容IE8、9的问题，以及请求完成而造成的其他错误，比如404等
                     *   如果跨域请求在IE8、9下跨域失败不走onerror方法
                     *       其他支持了Level 2 的版本 直接走onerror
                     * */
                    ajaxSetting.error(e.currentTarget.status, e.currentTarget.statusText);
                }
            };

            //xmlhttprequest每次变化一个状态所监控的事件（可拓展）
            xhr.onreadystatechange = function(){
                switch(xhr.readyState){
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
                        xhr.xhr_ie8?((xhr.status == 200 || xhr.status == 304)?(ajaxSetting.dataType.toUpperCase() == "JSON"?(ajaxSetting.success(JSON.parse(xhr.responseText))):(ajaxSetting.success(xhr.responseText))):(null)):(null);
                        break;
                };
            };

            //ontimeout超时事件
            xhr.ontimeout = function(e){
                ajaxSetting.timeout(999,e?(e.type):("timeout"));   //IE8 没有e参数
                xhr.abort();  //关闭请求
            };

            //错误事件，直接ajax失败，而不走onload事件
            xhr.onerror = function(e){
                ajaxSetting.error();
            };

            //发送请求
            xhr.send((function(result){result == undefined?(result =null):(null);return result;})(this.postParam));
        },
        //异步get请求
        get:function(url,data,success,error,timeout){
            var ajaxParam ={
                type:"get",
                url:url,
                data:data,
                success:success,
                error:error,
                timeout:timeout
            };
            ajax.common(ajaxParam);
        },
        //异步post请求
        post:function(url,data,success,error,timeout){
            var ajaxParam ={
                type:"post",
                url:url,
                data:data,
                success:success,
                error:error,
                timeout:timeout
            };
            ajax.common(ajaxParam);
        },
        //同步post请求
        postSync:function(url,data,success,error,timeout){
            var ajaxParam ={
                type:"post",
                url:url,
                data:data,
                async:false,
                success:success,
                error:error,
                timeout:timeout
            };
            ajax.common(ajaxParam);
        },
        /*
         * 长轮询的实现
         *   a. 业务上只需要得到服务器一次响应的轮询
         *   b. 业务上需要无限次得到服务器响应的轮询
         *
         *   param: url   请求接口地址
         *          data  请求参数
         *          successEvent    成功事件处理
         *          isAll           是否一直请求（例如，等待付款完成业务，只需要请求一次）
         *          timeout         ajax超时时间
         *          timeFrequency   每隔多少时间发送一次请求
         *          error           错误事件
         *          timeout         超时处理
         * */
        longPolling:function(url,data,successEvent,isAll,timeout,timeFrequency,errorEvent,timeoutEvent){
            var ajaxParam ={
                time:timeout,
                type:"post",
                url:url,
                data:data,
                async:false,
                success:function(date){
                    successEvent(data);
                    var timer = setTimeout(function(){
                        tempObj.longPolling(url,data,successEvent,isAll,errorEvent,timeoutEvent);
                    },timeFrequency);
                    //业务需求判断，是否只需要得到一次结果
                    if (!isAll) clearTimeout(timer);
                },
                //如果走了error说明该接口有问题，没必要继续下去了
                error:errorEvent,
                timeout:function(){
                    timeoutEvent();
                    setTimeout(function(){
                        tempObj.longPolling(url,data,successEvent,isAll,errorEvent,timeoutEvent)
                    },timeFrequency);
                }
            };
            ajax.common(ajaxParam);
        }
    };

    var outputObj = function(){
        //虽然在IE6、7上可以支持，但是最好升级你的浏览器，毕竟xp已经淘汰，面向未来吧，骚年，和我一起努力吧！！
        if( tool.getIEVersion() < 7 ){
            //实在不想说：lowB，升级你的浏览器吧
            throw new Error ("Sorry,please upgrade your browser.(IE8+)");
        }
        return tempObj;
    };

    window.ajax = new outputObj();

})(this);