# 原声js的ajax设计方案
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
    //创建xhr对象
    var xhr = tool.createXhrObject();

    //针对某些特定版本的mozillar浏览器的BUG进行修正
    xhr.overrideMimeType?(xhr.overrideMimeType("text/javascript")):(null);

    //针对IE8的xhr做处理    PS：ie8下的xhr无xhr.onload事件，所以这里做判断
    xhr.onload===undefined?(xhr.xhr_ie8=true):(xhr.xhr_ie8=false);

    //参数处理（get和post）,包括xhr.open     get:拼接好url再open   post:先open，再设置其他参数
    ajaxSetting.data === ""?(null):(xhr = tool.dealWithParam(ajaxSetting,this,xhr));

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

####轮询技术的实现（需要后台接口支持）
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
               var timer = setTimeout(
                   function(){
                       tempObj.longPolling(url,data,successEvent,isAll,error,timeoutEvent);
                   },timeFrequency);
               //业务需求判断，是否只需要得到一次结果
               if (!isAll) clearTimeout(timer);
           },
           //如果走了error说明该接口有问题，没必要继续下去了
           error:errorEvent,
           timeout:function(){
               timeoutEvent();
               setTimeout(function(){
                   tempObj.longPolling(url,data,successEvent,isAll,error,timeoutEvent)
               },timeFrequency);
           }
       };
       ajax.common(ajaxParam);
    }
> 考虑到业务需求，集成了一次isAll参数有2个意义
  >> 聊天系统会要一直需求轮询，不间断的向后台使用数据，所以isAll = true        
  >> 等待付款业务只需要得到后台一次响应是否支付成功，所以isAll = false

####具体代码已封装成一个js库，供大家根据项目需求，自己开发定制，不过我已经封装了一些常用请求
  * 异步get请求  --  ajax.get
  * 异步post请求  --  ajax.post
  * 同步post请求  --  ajax.postSync
  * 轮询请求      --  ajax.longPolling
  * 通用配置请求  --  ajax.common
PS：该方法为方便使用，不用的可以直接使用生产版本，只有common方法 

####连续搞了半个月的研究，研究ajax的设计方案，总体说来还是有很大的收获的，对浏览器的了解，js的了解，服务器技术的了解，后端的温习还是有很大的进步的，特别是解决问题的能力，感觉又上了一个level，虽然暂时还没去大公司，还在小公司游荡，但是从没有放弃对技术执着的追求。下一个目标bat，希望可以通过我的努力，进去，再接受一番洗礼。不过到时候有人内推就好了，哎。为了前端架构师的梦想，为了自己的前端架构，继续加油努力下去。技术的未来，不会远...

###版本更新介绍
  1. 跨域不需要在前端设置跨域请求报文头，现已删除   ==>author:keepfool from cnblog
  2. 更新tool一些方法，拥抱es5+新技术				==>author:pod4g from github  
  3. 删除头部参数中的跨域参数设置					==>author:wYhooo from github
  4. 集成ajax的轮询技术        
  
####程序员的小笑话
![](http://images2015.cnblogs.com/blog/801930/201612/801930-20161210143609882-1515246004.gif)       
  
####个人介绍
  * 性别：男
  * 爱好：女
  * 近期目标：前端架构师
  * 职业目标：全栈架构师
  * 博客:http://www.cnblogs.com/GerryOfZhong
