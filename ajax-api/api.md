### ajax-js 1.9.1 文档

#### 目录

 *  [common(options, isCreatePoll)](#common)
 *  [config(options)](#config)
 *  [get(url, data, successEvent, errorEvent, timeoutEvent)](#get)
 *  [post(url, data, successEvent, errorEvent, timeoutEvent)](#post)
 *  [postJSON(url, data, successEvent, errorEvent, timeoutEvent)](#postJSON)
 *  [postFormData(url, formData, successEvent, errorEvent, timeoutEvent)](#postFormData)
 *  [obtainBlob(type, url, data, successEvent, errorEvent, timeoutEvent)](#obtainBlob)
 *  [promiseAjax](#promiseAjax)
 *  [longPolling](#longPolling)
 *  [upload](#upload)
 *  [upload_big](#upload_big)
 
#### <span id=common> common(options, isCreatePoll)</span>
格式:  
 * options  \<object\>  请求参数，指定请求的各种参数
 * isCreatePoll  \<boolean\>  是否创建请求连接池子（内部使用，不对外，下一期迭代修改）
 
描述：  
　　ajax-js库核心api，其他暴露方法都是对该方法的封装  

options可设置参数：
 * url
 * type
 * baseURL
 * data
 * async
 * requestHeader
 * publicData
 * timeout
 * responseType
 * contentType
 * withCredentials
 * errStatus
    * isOpenErr
    * errURL
 * loadBalancing
    * isOpen
    * cluster
 * serviceSwitching
    * isOpen
    * strategies
    * backupUrl
 * pool
    * isOpen
    * requestNumber
 * transformRequest
 * transformResponse
 * successEvent
 * errorEvent
 * timeoutEvent
    
