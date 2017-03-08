# 原生js的ajax设计方案
####整理ajax设计方案原因如下
  1. 从资源合理利用的角度以及网站优化角度去想，每次为了那几个功能，去引用一个框架，不划算   
  2. 拜读了w3c的ajax的设计方案，包括level1和level2的规范，有种豁然开朗的感觉    
  3. 有朋友遇到ajax的跨域方案，各种纠结在心里，导致内心不能舒畅    
  4. 自己的框架底层也要需要用到ajax的基础功能，（get post请求，对于level2的上传暂时没用到）   
  5. 最关键的也是之前对这块概念十分模糊，所以开始整理ajax这块的设计方案    
  
####一些概念
  * 浏览器的同源策略：浏览器最基本的安全功能，同源是指，域名，协议，端口相同（所以我写的接口部署端口分别为1122和2211即不是同源，属于跨域）
  * ajax：是一种技术方案，依赖的是CSS/HTML/Javascript，最核心依赖是浏览器提供的XMLHttpRequest对象，这个对象使得浏览器可以发出HTTP请求与接收HTTP响应。
  * nginx：是一个高性能的HTTP和反向代理服务器
  * IIS:微软开发的的服务器，window系统自带
  * XMLHttpRequest 兼容性如下：
	![](http://images2015.cnblogs.com/blog/801930/201611/801930-20161129224459115-1023971996.png)
  * XMLHttpRequest Level 1主要存在以下缺点:
    1. 受同源策略的限制，不能发送跨域请求；
    2. 不能发送二进制文件（如图片、视频、音频等），只能发送纯文本数据；
    3. 发送和获取数据的过程中，无法实时获取进度信息，只能判断是否完成；
  * XMLHttpRequest Level 2中新增了以下功能:
    1. 可以发送跨域请求，在服务端允许的情况下；   
    2. 支持发送和接收二进制数据；    
    3. 新增formData对象，支持发送表单数据；   
    4. 发送和获取数据时，可以获取进度信息；   
    5. 可以设置请求的超时时间；   
    
####开始准备
  * 纯前端代码
  * nginx反向代理服务器（前后端分离用）
  * 后台2套接口（端口：1122，端口：2211）  PS：一份必须支持跨域请求
  * IIS服务器（部署后台接口）
  * chrome插件postman（接口测试）
  * IE、chrome、firefox、Opera、safari、edge 6大浏览器，做兼容性测试
  
###XMLHttpRequest发送请求步骤
  1. 实例化XMLHttpRequest对象（IE8-9是微软封装的ActiveXObject('Microsoft.XMLHTTP')）获得一个实例
  2. 通过实例open一个请求，设置发送类型和接口以及同异步
  3. 如有需要配置报文，以及各种事件（success，error，timeout等）
  4. 调用实例的send方法，发送http/https的请求
  5. 服务器回调，客户端接收，并做响应处理
  
####关键代码
    //每次清空请求缓存,并重新合并对象
    var ajaxSetting = {},sendData=null;tool.MergeObject(ajaxSetting,initParam);tool.MergeObject(ajaxSetting,options);

    //创建xhr对象
    var xhr = tool.createXhrObject();

    //针对某些特定版本的mozillar浏览器的BUG进行修正
    xhr.overrideMimeType?(xhr.overrideMimeType("text/javascript")):(null);

    //针对IE8的xhr做处理    PS：ie8下的xhr无xhr.onload事件，所以这里做判断
    xhr.onload===undefined?(xhr.xhr_ie8=true):(xhr.xhr_ie8=false);

    //参数处理（get和post）,包括xhr.open     get:拼接好url再open   post:先open，再设置其他参数
    ajaxSetting.data === ""?(xhr.open(ajaxSetting.type.toUpperCase(), ajaxSetting.url, ajaxSetting.async)):(xhr = tool.dealWithParam(ajaxSetting,this,xhr));

    //设置超时时间（只有异步请求才有超时时间）
    ajaxSetting.async?(xhr.timeoutEvent = ajaxSetting.timeout):(null);

    //设置http协议的头部
    tool.each(ajaxSetting.requestHeader,function(item,index){xhr.setRequestHeader(index,item)});

    //onload事件（IE8下没有该事件）
    xhr.onload = function(e) {
        if(this.status == 200||this.status == 304){
            ajaxSetting.dataType.toUpperCase() == "JSON"?(ajaxSetting.successEvent(JSON.parse(xhr.responseText))):(ajaxSetting.successEvent(xhr.responseText));
        }else{
            /*
             *  这边为了兼容IE8、9的问题，以及请求完成而造成的其他错误，比如404等
             *   如果跨域请求在IE8、9下跨域失败不走onerror方法
             *       其他支持了Level 2 的版本 直接走onerror
             * */
            ajaxSetting.errorEvent(e.currentTarget.status, e.currentTarget.statusText);
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
                xhr.xhr_ie8?((xhr.status == 200 || xhr.status == 304)?(ajaxSetting.dataType.toUpperCase() == "JSON"?(ajaxSetting.successEvent(JSON.parse(xhr.responseText))):(ajaxSetting.successEvent(xhr.responseText))):(null)):(null);
                break;
        };
    };

    //ontimeout超时事件
    xhr.ontimeout = function(e){
        ajaxSetting.timeoutEvent(999,e?(e.type):("timeoutEvent"));   //IE8 没有e参数
        xhr.abort();  //关闭请求
    };

    //错误事件，直接ajax失败，而不走onload事件
    xhr.onerror = function(e){
        ajaxSetting.errorEvent();
    };

    if(this.postParam){
        (this.postParam)?(sendData = this.postParam):(sendData = null);
    }else{
        sendData = ajaxSetting.data;
    }

    //发送请求
    xhr.send(sendData);
            
###测试代码
####前端同源测试代码
    ajax.post("/api/ajax1/ajaxT1/",{"name":"测试异步post请求","age":"success"},function(data){alert(data)});  //该接口在1122上
####前端跨域测试代码
    ajax.post("http://192.168.0.3:2211/api/weixin/ajaxT2/",{"name":"测试跨域post请求","age":"success"},function(data){alert(data)});
####后端跨域接口代码
    /// <summary>
    /// 测试跨域请求
    /// </summary>
    /// <param name="module"></param>
    /// <returns></returns>
    [Route("ajaxT2")]
    public String kuaAjaxT2([FromBody]TModule module)
    {
        String result = "跨域post传输成功："+module.name+"-"+module.age;
        return result;
    }
####后端同源测试代码
    /// <summary>
    /// 测试ajax同源请求
    /// </summary>
    /// <param qwer="code"></param>
    /// <returns>result</returns>
    [Route("ajaxT2")]
    public String GetkuaAjaxT1(string name,string age)
    {
        String result = "1J跨域成功:" + name + "-" + age;
        return result;
    }
###以下是各种浏览器的测试结果（仅提供同源post请求和跨域post请求）
#####同源测试
######chrome
![](http://images2015.cnblogs.com/blog/801930/201611/801930-20161129230238927-2089656702.png)
######IE8-9
![](http://images2015.cnblogs.com/blog/801930/201611/801930-20161129230248709-1923043215.png)
![](http://images2015.cnblogs.com/blog/801930/201611/801930-20161129230306302-1703939611.png)
######IE10+
![](http://images2015.cnblogs.com/blog/801930/201611/801930-20161129230347068-1928619242.png)
######firefox
![](http://images2015.cnblogs.com/blog/801930/201611/801930-20161129230452615-113489743.png)
######opera
![](http://images2015.cnblogs.com/blog/801930/201611/801930-20161129230611365-1169854535.png)
######safari
![](http://images2015.cnblogs.com/blog/801930/201611/801930-20161129230713615-2040676482.png)
######edge
![](http://images2015.cnblogs.com/blog/801930/201611/801930-20161129230814818-1130849183.png)

#####跨域测试
######chrome
![](http://images2015.cnblogs.com/blog/801930/201611/801930-20161129230913599-1189375449.png)
######IE8-9
![](http://images2015.cnblogs.com/blog/801930/201611/801930-20161129230942302-1611540664.png)
![](http://images2015.cnblogs.com/blog/801930/201611/801930-20161129230956990-1637046338.png)
######IE10+
![](http://images2015.cnblogs.com/blog/801930/201611/801930-20161129231021209-1271264367.png)
######firefox
![](http://images2015.cnblogs.com/blog/801930/201611/801930-20161129231044943-1370903842.png)
######opera
![](http://images2015.cnblogs.com/blog/801930/201611/801930-20161129231104552-1637987456.png)
######safari
![](http://images2015.cnblogs.com/blog/801930/201611/801930-20161129231127834-855103713.png)
######edge
![](http://images2015.cnblogs.com/blog/801930/201611/801930-20161129231145693-678151401.png)

####1.4 版本更新  ---   轮询技术的实现（需要后台接口支持）
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
    longPolling:function(type,url,data,successEvent,timeFrequency,errorEvent,timeoutEvent){
        var ajaxParam ={
            type:type,
            url:url,
            data:data,
            async:true,
            isFormData:false,
            successEvent:function(dateCall){
                successEvent(dateCall,this);
                if (!this.stop){
                    setTimeout(function(){
                        tempObj.longPolling(type,url,data,successEvent,timeFrequency,errorEvent,timeoutEvent);
                    },timeFrequency);
                };
            },
            //如果走了error说明该接口有问题，没必要继续下去了
            errorEvent:errorEvent,
            timeoutEvent:function(){
                timeoutEvent();
                setTimeout(function(){
                    tempObj.longPolling(type,url,data,successEvent,timeFrequency,errorEvent,timeoutEvent)
                },timeFrequency);
            }
        };
        ajax.common(ajaxParam);
    },
> 考虑到业务需求
  >> 聊天系统会要一直需求轮询，不间断的向后台使用数据，所以isAll = true        
  >> 等待付款业务只需要得到后台一次响应是否支付成功，所以使用回调参数中的第二个参数的stop属性，结束轮询        

####1.5.0版本更新  ---   ajax的上传文件技术
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
    upload:function(url,fileSelector,size,fileType,successEvent,errorEvent,timeoutEvent){
        var formdata = new FormData(),fileNode = document.querySelector(fileSelector),fileCount = fileNode.files.length,data={},result ={};
        //以下为上传文件限制检查
        if ( fileCount > 0 ){
            tool.each(Array.prototype.slice.call(fileNode.files),function(value){
                //检查文件大小
                if (value.size > size){
                    result["status"] = 1;
                    result["errMsg"] = "超出文件限制大小";
                }else{
                    if (fileType != "*"){
                        //检查文件格式.因为支持formdata，自然支持数组的indexof(h5)
                        if (fileType.indexOf(value.type)=== -1 ){
                            result["status"] = 2;
                            result["errMsg"] = "非允许文件格式";
                        }else{
                            formdata.append(value.name,value);
                        };
                    }else{
                        formdata.append(value.name,value);
                    }
                };
            });
        }else{
            result["status"] = 0;
            result["errMsg"] = "请选择文件";
        };

        if (result.status !== undefined)  return result;   //如果有错误信息直接抛出去,结束运行

        var ajaxParam ={
            type:"post",
            url:url,
            data:formdata,
            isFormData:true,
            successEvent:successEvent,
            errorEvent:errorEvent,
            timeoutEvent:timeoutEvent
        };
        ajax.common(ajaxParam);
    },

如果想要看文件上传具体内容和测试各种结果，请转到这片博客：http://www.cnblogs.com/GerryOfZhong/p/6274536.html

####1.5.1版本更新  ---   ajax的大文件/超大文件上传技术  （需后台配合）
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
    upload_big:function(url,fileSelector,cutSize,fileType,successEvent,progressEvent,errorEvent,timeoutEvent){
        var file = document.querySelector(fileSelector).files,result ={};
        //以下为上传文件限制检查
        if (file.length === 1){
            if (fileType != "*"){
                if (fileType.indexOf(file.type)=== -1 ){
                    result["status"] = 1;
                    result["errMsg"] = "非允许文件格式";
                }
            }
        }else{
            result["status"] = 0;
            result["errMsg"] = "请选择文件/只能上传一个文件";
        };

        if (result.status !== undefined)  return result;   //如果有错误信息直接抛出去,结束运行

        //判断上传文件是否超过需要切割的大小
        if (file[0].size > cutSize){
            var fileArr = tool.cutFile(file[0],cutSize);  //切割文件
            cutFile_upload(fileArr);
        }else{
            return tempObj.upload(url,fileSelector,file[0].size,fileType,successEvent,errorEvent,timeoutEvent);
        };

        /*
         *   切割文件上传，配合后台接口进行对接
         *       传输参数：
         *           count   -- 当前传输part的次数
         *           name    -- 做过处理的文件名称
         *           file    -- 上传的.part的切割文件
         *           isLast  -- 是否为最后一次切割文件上传（默认值："true"  字符串，只有最后一次才附加）
         * */
        function cutFile_upload(fileArr,count){
            var formData = new FormData();
            if (count == undefined){
                count = 0;
                formData.append("count",count);
                formData.append("name",fileArr[0].name);
                formData.append("file".name,fileArr[0].file);
            }else{
                if (count === fileArr.length-1){
                    formData.append("isLast","true")
                };
                formData.append("count",count);
                formData.append("name",fileArr[count].name);
                formData.append("file".name,fileArr[count].file);
            };
            var ajaxParam ={
                type:"post",
                url:url,
                data:formData,
                isFormData:true,
                successEvent:function(data){
                    /*
                     *   data 参数设置  需要后台接口配合
                     *       建议：如果后台成功保存.part文件，建议返回下次所需要的部分，比如当前发送count为0，则data返回下次为1。
                     *             如果保存不成功，则可false，或者返回错误信息，可在successEvent中处理
                     *
                     * */
                    progressEvent(count+1,fileArr.length);   //上传进度事件，第一个参数：当前上传次数；第二个参数：总共文件数

                    var currCount = Number(data);
                    if (currCount){
                        if (currCount != fileArr.length){
                            cutFile_upload(fileArr,currCount);
                        };
                    };
                    successEvent(data);  //成功处理事件
                },
                errorEvent:errorEvent,
                timeoutEvent:timeoutEvent
            };
            ajax.common(ajaxParam);
        }
    }

如果想要看文件上传具体内容和测试各种结果，请转到这片博客：http://www.cnblogs.com/GerryOfZhong/p/6295211.html

备注：ajax的上传技术，在es5+之后支持，浏览器的兼容性就是除了IE10以下，大部分都支持了       

####具体代码已封装成一个js库，下面为API库
  * 异步get请求          --  ajax.get
  * 异步post请求         --  ajax.post
  * 同步post请求         --  ajax.postSync
  * 同步postForm请求     --  ajax.postFormData
  * 轮询请求             --  ajax.longPolling
  * 上传文件请求         --  ajax.upload
  * 大文件切割上传请求   --  ajax.upload_big
  * 通用配置请求         --  ajax.common

####最近在研究原声js的ajax的技术和设计方案，总体说来还是有很大的收获的，对浏览器的了解，js的了解，服务器技术的了解，后端的温习还是有很大的进步的，特别是解决问题的能力，感觉又上了一个level。技术的未来，不会远...

###版本更新介绍
  1. 跨域不需要在前端设置跨域请求报文头，现已删除   ==>author:keepfool from cnblog
  2. 更新tool一些方法，拥抱es5+新技术				==>author:pod4g from github  
  3. 删除头部参数中的跨域参数设置					==>author:wYhooo from github
  4. 集成ajax的轮询技术            
  5. 集成ajax的上传文件技术，也更新了一些原来的代码     
        a. 增加FormData数据传输方法         
        b. 新增各种类型判断方法判断类型       
        c. 更新each方法，判断如果传入参数obj为数组而且浏览器支持es5的新特性直接用数组的forEach方法     
  5. 更新bug，更细ajax默认值相互影响问题，调试ajax长轮询bug         
        
####程序员的小笑话
![](http://images2015.cnblogs.com/blog/801930/201612/801930-20161210143609882-1515246004.gif)       
  
####个人介绍
  * 性别：男
  * 爱好：女
  * 近期目标：前端架构师
  * 职业目标：全栈架构师
  * 博客:http://www.cnblogs.com/GerryOfZhong
