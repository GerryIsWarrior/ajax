var express = require('express');
var router = express.Router();

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();


router.get('/get', function(req, res) {
  let temp = req.query.data
  res.send({data:temp})
});


router.post('/post', function(req, res) {
  let temp = req.body
  console.log(temp)
  res.send(temp);
});

router.post('/postJSON', function(req, res) {
  let temp = req.body
  console.log(temp)
  res.send(temp);
});

router.post('/postFormData',multipartMiddleware, function(req, res) {
  let temp = req.body
  console.log(temp)
  res.send(temp);
});

router.post('/postBlob', function(req, res) {
  var fs = require("fs");
  fs.readFile('./public/aixin.jpg',function(err,data){
    if(err){
      console.log(err);
    }else{
      console.log(data.toString());
      res.send(data);
    }
  });
});

module.exports = router;
