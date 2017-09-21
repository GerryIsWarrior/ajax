using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;

namespace ajaxCore.Controllers
{
    [RoutePrefix("api/cores")]
    public class apiCoresController : ApiController
    {
        //get请求
        [Route("getAjax")]
        public personModel GetAjax(String name,Int32 age)
        {
            var a = new personModel();
            a.name = name;
            a.age = age;
            return a;
        }

        //post请求
        [Route("postAjax")]
        public personModel PostAjax([FromBody]personModel obj)
        {
            return obj;
        }

        //post form请求
        [Route("postForm")]
        public personModel FormReq()
        {
            var name = HttpContext.Current.Request["name"];
            var age = HttpContext.Current.Request["age"];
            var a = new personModel();
            a.name = name;
            a.age = Int32.Parse(age);
            return a;
        }

        //post 高延迟请求
        [Route("postReqSleep")]
        public personModel postReqSleep([FromBody]personModel obj)
        {
            Thread.Sleep(5000);   //挂起5s 做延迟
            return obj;
        }

        [Route("upload")]
        public async Task<HttpResponseMessage> PostFormData()
        {
            // Check if the request contains multipart/form-data.
            // 检查该请求是否含有multipart/form-data
            if (!Request.Content.IsMimeMultipartContent())
            {
                throw new HttpResponseException(HttpStatusCode.UnsupportedMediaType);
            }

            string root = HttpContext.Current.Server.MapPath("~/uploadfile");
            var provider = new ReNameMultipartFormDataStreamProvider(root);

            try
            {
                // Read the form data.
                // 读取表单数据
                var task = await Request.Content.ReadAsMultipartAsync(provider).ContinueWith(t =>
                {
                    if (t.IsFaulted || t.IsCanceled)
                    {
                        Request.CreateErrorResponse(HttpStatusCode.InternalServerError, t.Exception);
                    }
                    string fileName = string.Empty;
                    foreach (MultipartFileData file in provider.FileData)
                    {
                        fileName = file.LocalFileName;
                    }
                    //返回上传后的文件全路径
                    return new HttpResponseMessage() { Content = new StringContent(fileName) };
                });
                return Request.CreateResponse(HttpStatusCode.OK);
            }
            catch (System.Exception e)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, e);
            }
        }
        
        // 重命名上传的文件
        public class ReNameMultipartFormDataStreamProvider : MultipartFormDataStreamProvider
        {
            public ReNameMultipartFormDataStreamProvider(string root)
                : base(root)
            { }
            public override string GetLocalFileName(System.Net.Http.Headers.HttpContentHeaders headers)
            {
                //截取文件扩展名
                string exp = Path.GetExtension(headers.ContentDisposition.FileName.TrimStart('"').TrimEnd('"'));
                string name = base.GetLocalFileName(headers);
                return name + exp;
            }
        }

        [Route("uploadBig")]
        public int Post_bigFile1()
        {
            HttpContext.Current.Response.AddHeader("Content-Type", "application/json; charset=utf-8");
            //前端传输是否为切割文件最后一个小文件
            var isLast = HttpContext.Current.Request["isLast"];
            //前端传输的切割大小和真实文件的大小
            var cutSize = HttpContext.Current.Request["cutSize"];
            //前端传输当前为第几次切割小文件
            var count = HttpContext.Current.Request["count"];
            //获取前端处理过的传输文件名
            string fileName = HttpContext.Current.Request["name"];
            //存储接受到的切割文件
            HttpPostedFile file = HttpContext.Current.Request.Files[0];

            //处理文件名称(去除.part*，还原真实文件名称)

            string newFileName = fileName.Substring(0, fileName.LastIndexOf('.'));
            //判断指定目录是否存在临时存储文件夹，没有就创建
            if (!System.IO.Directory.Exists(@"D:\\bigFileUpload\\part\\" + newFileName))
            {
                //不存在就创建目录 
                System.IO.Directory.CreateDirectory(@"D:\\bigFileUpload\\part\\" + newFileName);
            }
            //存储文件
            file.SaveAs("D:\\bigFileUpload\\part\\" + newFileName + "\\" + HttpContext.Current.Request["name"]);
            if (isLast!="true"&&file.ContentLength < Int32.Parse(cutSize))
            {
                file.SaveAs("D:\\bigFileUpload\\merge\\" + HttpContext.Current.Request["name"]);
            }
            //判断是否为最后一次切割文件传输
            if (isLast == "true")
            {
                //判断组合的文件是否存在
                if (File.Exists(@"D:\\bigFileUpload\\merge\\" + newFileName))//如果文件存在
                {
                    File.Delete(@"D:\\bigFileUpload\\merge\\" + newFileName);//先删除,否则新文件就不能创建
                }
                //创建空的文件流
                FileStream FileOut = new FileStream(@"D:\\bigFileUpload\\merge\\" + newFileName, FileMode.CreateNew, FileAccess.ReadWrite);
                BinaryWriter bw = new BinaryWriter(FileOut);
                //获取临时存储目录下的所有切割文件
                string[] allFile = Directory.GetFiles("D:\\bigFileUpload\\part\\" + newFileName);
                //将文件进行排序拼接
                allFile = allFile.OrderBy(s => int.Parse(Regex.Match(s, @"\d+$").Value)).ToArray();
                //allFile.OrderBy();
                for (int i = 0; i < allFile.Length; i++)
                {
                    FileStream FileIn = new FileStream(allFile[i], FileMode.Open);
                    BinaryReader br = new BinaryReader(FileIn);
                    byte[] data = new byte[1048576];   //流读取,缓存空间
                    int readLen = 0;                //每次实际读取的字节大小
                    readLen = br.Read(data, 0, data.Length);
                    bw.Write(data, 0, readLen);
                    //关闭输入流
                    FileIn.Close();
                };
                //关闭二进制写入
                bw.Close();
                FileOut.Close();
            }
            return int.Parse(count) + 1;
        }

        // POST api/Account/Logout
        [Route("testError")]
        public errorModel ErrorT([FromBody]errorModel obj)
        {
            return obj;
        }
    }

    public class personModel
    {
        public String name { set; get; }
        public Int32 age { set; get; }
    }

    public class errorModel
    {
        public String errInfo { set; get; }
        public String errUrl { set; get; }
        public String errLine { set; get; }
        public String Browser { set; get; }

    }

}
