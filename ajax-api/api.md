## ajax-js 1.9.1 文档

### 目录

 *  [common(options, isCreatePoll)](#common)
 *  [config(options)](#config)
 *  [get(url, data, successEvent, errorEvent, timeoutEvent)](#get)
 *  [post(url, data, successEvent, errorEvent, timeoutEvent)](#post)
 *  [postJSON(url, data, successEvent, errorEvent, timeoutEvent)](#postJSON)
 *  [postFormData(url, formData, successEvent, errorEvent, timeoutEvent)](#postFormData)
 *  [obtainBlob(type, url, data, successEvent, errorEvent, timeoutEvent)](#obtainBlob)
 *  [promiseAjax(url, data, type)](#promiseAjax)
 *  [longPolling(type, url, data, successEvent, timeFrequency, errorEvent, timeoutEvent)](#longPolling)
 *  [upload(url, file, size, fileType, successEvent, errorEvent, timeoutEvent)](#upload)
 *  [upload_big(url, file, cutSize, fileType, successEvent, progressEvent, errorEvent, timeoutEvent)](#upload_big)
 
### <span id=common> common(options, isCreatePoll)</span>
参数:  
 * options&nbsp;&nbsp;&nbsp;&nbsp;\<object\>&nbsp;&nbsp;&nbsp;&nbsp;请求参数，指定请求的各种参数，[具体参数设置](#detail)
 * isCreatePoll&nbsp;&nbsp;&nbsp;&nbsp;\<boolean\>&nbsp;&nbsp;&nbsp;&nbsp;是否创建请求连接池子（内部使用，不对外，下一期迭代修改）
 
描述：  
　　ajax-js库核心api，其他暴露方法都是对该方法的封装  
<br/><br/>

### <span id=config> config(options)</span>
参数:  
 * options&nbsp;&nbsp;&nbsp;&nbsp;\<object\>&nbsp;&nbsp;&nbsp;&nbsp;全局参数，[具体参数设置](#detail)
 
描述：  
　　设置请求的全局参数
<br/><br/>

### <span id=get> get(url, data, successEvent, errorEvent, timeoutEvent)</span>
参数:  
 * url&nbsp;&nbsp;&nbsp;&nbsp;\<string\>&nbsp;&nbsp;&nbsp;&nbsp;请求地址
 * data&nbsp;&nbsp;&nbsp;&nbsp;\<object\>&nbsp;&nbsp;&nbsp;&nbsp;请求参数
 * successEvent&nbsp;&nbsp;&nbsp;&nbsp;\<function\>&nbsp;&nbsp;&nbsp;&nbsp;成功回调
 * errorEvent&nbsp;&nbsp;&nbsp;&nbsp;\<function\>&nbsp;&nbsp;&nbsp;&nbsp;失败回调&nbsp;&nbsp;&nbsp;&nbsp;[__可选__]
 * timeoutEvent&nbsp;&nbsp;&nbsp;&nbsp;\<function\>&nbsp;&nbsp;&nbsp;&nbsp;超时回调&nbsp;&nbsp;&nbsp;&nbsp;[__可选__]
 
描述：  
　　get请求
<br/><br/>

### <span id=post> post(url, data, successEvent, errorEvent, timeoutEvent)</span>
参数:  
 * url&nbsp;&nbsp;&nbsp;&nbsp;\<string\>&nbsp;&nbsp;&nbsp;&nbsp;请求地址
 * data&nbsp;&nbsp;&nbsp;&nbsp;\<object\>&nbsp;&nbsp;&nbsp;&nbsp;请求参数
 * successEvent&nbsp;&nbsp;&nbsp;&nbsp;\<function\>&nbsp;&nbsp;&nbsp;&nbsp;成功回调
 * errorEvent&nbsp;&nbsp;&nbsp;&nbsp;\<function\>&nbsp;&nbsp;&nbsp;&nbsp;失败回调&nbsp;&nbsp;&nbsp;&nbsp;[__可选__]
 * timeoutEvent&nbsp;&nbsp;&nbsp;&nbsp;\<function\>&nbsp;&nbsp;&nbsp;&nbsp;超时回调&nbsp;&nbsp;&nbsp;&nbsp;[__可选__]
 
描述：  
　　post请求，默认contentType = ''的请求
<br/><br/>

### <span id=postJSON> postJSON(url, data, successEvent, errorEvent, timeoutEvent)</span>
参数:  
 * url&nbsp;&nbsp;&nbsp;&nbsp;\<string\>&nbsp;&nbsp;&nbsp;&nbsp;请求地址
 * data&nbsp;&nbsp;&nbsp;&nbsp;\<object\>&nbsp;&nbsp;&nbsp;&nbsp;请求参数
 * successEvent&nbsp;&nbsp;&nbsp;&nbsp;\<function\>&nbsp;&nbsp;&nbsp;&nbsp;成功回调
 * errorEvent&nbsp;&nbsp;&nbsp;&nbsp;\<function\>&nbsp;&nbsp;&nbsp;&nbsp;失败回调&nbsp;&nbsp;&nbsp;&nbsp;[__可选__]
 * timeoutEvent&nbsp;&nbsp;&nbsp;&nbsp;\<function\>&nbsp;&nbsp;&nbsp;&nbsp;超时回调&nbsp;&nbsp;&nbsp;&nbsp;[__可选__]
 
描述：  
　　post请求，默认contentType = 'json'的请求
<br/><br/>

### <span id=postFormData> postFormData(url, formData, successEvent, errorEvent, timeoutEvent)</span>
参数:  
 * url&nbsp;&nbsp;&nbsp;&nbsp;\<string\>&nbsp;&nbsp;&nbsp;&nbsp;请求地址
 * formData&nbsp;&nbsp;&nbsp;&nbsp;\<formData\>&nbsp;&nbsp;&nbsp;&nbsp;请求参数，formData对象
 * successEvent&nbsp;&nbsp;&nbsp;&nbsp;\<function\>&nbsp;&nbsp;&nbsp;&nbsp;成功回调
 * errorEvent&nbsp;&nbsp;&nbsp;&nbsp;\<function\>&nbsp;&nbsp;&nbsp;&nbsp;失败回调&nbsp;&nbsp;&nbsp;&nbsp;[__可选__]
 * timeoutEvent&nbsp;&nbsp;&nbsp;&nbsp;\<function\>&nbsp;&nbsp;&nbsp;&nbsp;超时回调&nbsp;&nbsp;&nbsp;&nbsp;[__可选__]
 
描述：  
　　post请求，发送formData对象
<br/><br/>

### <span id=obtainBlob> obtainBlob(type, url, data, successEvent, errorEvent, timeoutEvent)</span>
参数:  
 * type&nbsp;&nbsp;&nbsp;&nbsp;\<string\>&nbsp;&nbsp;&nbsp;&nbsp;请求类型（默认post）
 * url&nbsp;&nbsp;&nbsp;&nbsp;\<string\>&nbsp;&nbsp;&nbsp;&nbsp;请求地址
 * data&nbsp;&nbsp;&nbsp;&nbsp;\<object\>&nbsp;&nbsp;&nbsp;&nbsp;请求参数
 * successEvent&nbsp;&nbsp;&nbsp;&nbsp;\<function\>&nbsp;&nbsp;&nbsp;&nbsp;成功回调
 * errorEvent&nbsp;&nbsp;&nbsp;&nbsp;\<function\>&nbsp;&nbsp;&nbsp;&nbsp;失败回调&nbsp;&nbsp;&nbsp;&nbsp;[__可选__]
 * timeoutEvent&nbsp;&nbsp;&nbsp;&nbsp;\<function\>&nbsp;&nbsp;&nbsp;&nbsp;超时回调&nbsp;&nbsp;&nbsp;&nbsp;[__可选__]
 
描述：  
　　发送请求，获取blob二进制的数据流
<br/><br/>

### <span id=promiseAjax> promiseAjax(url, data, type)</span>
参数:  
 * url&nbsp;&nbsp;&nbsp;&nbsp;\<string\>&nbsp;&nbsp;&nbsp;&nbsp;请求地址
 * data&nbsp;&nbsp;&nbsp;&nbsp;\<object\>&nbsp;&nbsp;&nbsp;&nbsp;请求参数
 * type&nbsp;&nbsp;&nbsp;&nbsp;\<string\>&nbsp;&nbsp;&nbsp;&nbsp;请求类型
 
描述：  
　　封装promise，处理请求    

注意：
    在后面迭代将完善promise模型实现，然后把该方法去除，让所有对外暴露方法直接接入promise
<br/><br/>

### <span id=longPolling> longPolling(type, url, data, successEvent, timeFrequency, errorEvent, timeoutEvent)</span>
参数:  
 * type&nbsp;&nbsp;&nbsp;&nbsp;\<string\>&nbsp;&nbsp;&nbsp;&nbsp;请求类型
 * url&nbsp;&nbsp;&nbsp;&nbsp;\<string\>&nbsp;&nbsp;&nbsp;&nbsp;请求地址
 * data&nbsp;&nbsp;&nbsp;&nbsp;\<object\>&nbsp;&nbsp;&nbsp;&nbsp;请求参数
 * successEvent&nbsp;&nbsp;&nbsp;&nbsp;\<function\>&nbsp;&nbsp;&nbsp;&nbsp;成功事件处理，如果让轮询停止，则在第二个回调参数设置stop属性就好
 * timeFrequency&nbsp;&nbsp;&nbsp;&nbsp;\<function\>&nbsp;&nbsp;&nbsp;&nbsp;轮询时间
 * errorEvent&nbsp;&nbsp;&nbsp;&nbsp;\<function\>&nbsp;&nbsp;&nbsp;&nbsp;失败回调&nbsp;&nbsp;&nbsp;&nbsp;[__可选__]
 * timeoutEvent&nbsp;&nbsp;&nbsp;&nbsp;\<function\>&nbsp;&nbsp;&nbsp;&nbsp;超时回调&nbsp;&nbsp;&nbsp;&nbsp;[__可选__]
 
描述：  
　　长轮询请求，支持无限轮询和可控制式的轮询    

注意：
    successEvent(data,that)回调中，可以设置that.stop = true让轮询停止
<br/><br/>

### <span id=upload> upload(url, file, size, fileType, successEvent, errorEvent, timeoutEvent)</span>
参数:  
 * url&nbsp;&nbsp;&nbsp;&nbsp;\<string\>&nbsp;&nbsp;&nbsp;&nbsp;文件上传地址
 * file&nbsp;&nbsp;&nbsp;&nbsp;\<blob\>&nbsp;&nbsp;&nbsp;&nbsp;input=file 选择的文件
 * size&nbsp;&nbsp;&nbsp;&nbsp;\<number\>&nbsp;&nbsp;&nbsp;&nbsp;文件限制大小
 * fileType&nbsp;&nbsp;&nbsp;&nbsp;\<string/array\>&nbsp;&nbsp;&nbsp;&nbsp;文件限制类型 mime类型。所有类型设置：'*'，否则其他类型，每个类型都用数组包括进去
 * successEvent&nbsp;&nbsp;&nbsp;&nbsp;\<function\>&nbsp;&nbsp;&nbsp;&nbsp;成功事件处理，如果让轮询停止，则在第二个回调参数设置stop属性就好
 * errorEvent&nbsp;&nbsp;&nbsp;&nbsp;\<function\>&nbsp;&nbsp;&nbsp;&nbsp;失败回调&nbsp;&nbsp;&nbsp;&nbsp;[__可选__]
 * timeoutEvent&nbsp;&nbsp;&nbsp;&nbsp;\<function\>&nbsp;&nbsp;&nbsp;&nbsp;超时回调&nbsp;&nbsp;&nbsp;&nbsp;[__可选__]
 
返回：
 * status
  * 0&nbsp;&nbsp;&nbsp;&nbsp;请选择文件
  * 1&nbsp;&nbsp;&nbsp;&nbsp;超出文件限制大小
  * 2&nbsp;&nbsp;&nbsp;&nbsp;非允许文件格式
 
描述：  
　　上传文件请求    

注意：
    浏览器和服务器对上传文件都有大小限制的
<br/><br/>

### <span id=upload_big> upload(url, file, cutSize, fileType, successEvent, progressEvent, errorEvent, timeoutEvent)</span>
参数:  
 * url&nbsp;&nbsp;&nbsp;&nbsp;\<string\>&nbsp;&nbsp;&nbsp;&nbsp;文件上传地址
 * file&nbsp;&nbsp;&nbsp;&nbsp;\<blob\>&nbsp;&nbsp;&nbsp;&nbsp;input=file 选择的文件
 * cutSize&nbsp;&nbsp;&nbsp;&nbsp;\<number\>&nbsp;&nbsp;&nbsp;&nbsp;切割文件大小
 * fileType&nbsp;&nbsp;&nbsp;&nbsp;\<string/array\>&nbsp;&nbsp;&nbsp;&nbsp;文件限制类型 mime类型。所有类型设置：'*'，否则其他类型，每个类型都用数组包括进去
 * successEvent&nbsp;&nbsp;&nbsp;&nbsp;\<function\>&nbsp;&nbsp;&nbsp;&nbsp;成功事件处理，如果让轮询停止，则在第二个回调参数设置stop属性就好
 * errorEvent&nbsp;&nbsp;&nbsp;&nbsp;\<function\>&nbsp;&nbsp;&nbsp;&nbsp;失败回调&nbsp;&nbsp;&nbsp;&nbsp;[__可选__]
 * timeoutEvent&nbsp;&nbsp;&nbsp;&nbsp;\<function\>&nbsp;&nbsp;&nbsp;&nbsp;超时回调&nbsp;&nbsp;&nbsp;&nbsp;[__可选__]
 
返回：
 * status
  * 0&nbsp;&nbsp;&nbsp;&nbsp;请选择文件
  * 1&nbsp;&nbsp;&nbsp;&nbsp;非允许文件格式
 
描述：  
　　超大文件切割上传    

注意：
    该方法规避了浏览器和服务器对上传文件大小的限制，但是对于后端处理每个分片文件最后组合有一定的要求
<br/><br/>

### <span id=detail>全局参数含义</span>
options可设置参数：
 * url 
    * 描述： 接口请求地址    
    * 默认值：''
    
 * type 
    * 描述： 接口请求类型，现支持get、post，往后迭代完善符合RESTfull的规则    
    * 默认值：'post'
     
 * baseURL 
    * 描述：  统一追加前缀
    * 默认值：'post'
    * demo：所有接口请求都有/api或者https:\/\/xxx，就可以进行设置，会在每个请求时候统一追加到完整url中   
      
 * data 
    * 描述： 接口传输的数据，默认{}，get请求会追加到url中，post正常在请求体中
    * 默认值：{}
      
 * async 
    * 描述： 是否异步请求
    * 默认值：true
    * 注意： 在新规范中，浏览器已经将false进行警告，这是影响用户体验的操作，因为同步请求会阻塞页面
      
 * requestHeader
    * 描述： 接口请求中设置的http的header数据    
    * 默认值：{}
      
 * publicData
    * 描述： 接口请求中的公共数据，功能类似baseURL一样，最后会合并的
    * 默认值：{}
      
 * timeout
    * 描述： 接口请求超时时间
    * 默认值：5000
    * 注意： 这是浏览器侧的超时时间，超过时间浏览器会主动断开连接，做超时响应事件
      
 * responseType
    * 描述： 希望获得的接口响应数据类型
    * 默认值：'json'
    * 注意： 这是XMLHTTPRequest level 2的规范，支持''、'text'、'document'、'json'、'blob'、'arrayBuffer'
    
 * contentType
    * 描述： 接口请求中可以发送的数据类型
    * 默认值：''
    * 注意： 内置可设置的值''、'json'、'form'，如有其它需求，可在requestHeader中设置content-Type的值
    
 * withCredentials
    * 描述： 在跨域接口请求中是否发送跨域凭证（cookie）
    * 跨域方案： CORS跨域
    * 默认值：false
    * 注意： 内置可设置的值''、'json'、'form'，如有其它需求，可在requestHeader中设置content-Type的值
    
 * errStatus
    * isOpenErr ：是否开启功能
    * errURL： 搜集错误上报接口
    * 
    * 描述：是否设置错误搜集机制
    * 默认值：isOpenErr = false、errURL = ''
    
 * loadBalancing
    * isOpen： 是否开启功能
    * cluster： 负载服务器地址，可以配置多活地址
    * 
    * 描述：提供前端请求分发功能
    * 默认值：isOpenErr = false、cluster = []
    
 * serviceSwitching
    * isOpen： 是否开启功能
    * strategies：服务切换策略
    * backupUrl：服务切换地址
    * 
    * 描述：宕机切换功能，在特定策略中，能够使前端有能力进行服务切换
    * 默认值：isOpen = false、strategies = function(){}、backupUrl = ''
    
 * pool
    * isOpen： 是否开启功能
    * requestNumber： 请求池等待连接的请求数量
    * 
    * 描述：请求池优化请求速度
    * 默认值：isOpen = true、requestNumber = 6
    
 * transformRequest
    * 描述：请求前参数处理
    * 默认值：function(data){ return data }
    * 注意： data为需要处理参数
    
 * transformResponse
    * 描述：请求后参数处理
    * 默认值：function(data){ return data }
    * 注意： data为需要处理参数
    
 * successEvent
    * 描述： 请求成功的回调处理
    * 默认值：function(res){}
    * PS： res为请求成功返回的数据
    
 * errorEvent
    * 描述： 请求错误的回调处理
    * 默认值：function(err){}
    * PS： err为请求错误的消息
    
 * timeoutEvent
    * 描述： 请求超时的回调处理
    * 默认值：function(timeout){}
    * PS： timeout为请求超时的消息
