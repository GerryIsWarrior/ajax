var fs = require('fs');

fs.readFile('../test.txt', 'utf8', function(err, data){

  // 非IE系列需要精确到微秒级别的清洗
  // let temp =data.match(/:\s.+ms/g).join(',').replace(/(:\s)|(ms)/g,'').split(',').map(x=>{ return x*1000})

  // IE系列需要精确到毫秒级别的清洗
  let temp =data.match(/:\s.+毫秒/g).join(',').replace(/(:\s)|(毫秒)/g,'').split(',')

  fs.writeFileSync('../get.txt',`[${temp}]`);
});


