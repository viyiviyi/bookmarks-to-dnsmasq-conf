const fs = require("fs");
const cheerio = require("cheerio");
const { join } = require("path");
const { URL } = require("url");
const { Resolver } = require('dns');
const { get } = require("http");

const dns = "180.76.76.76";
const fileName = "bookmarks";

// DNS解析实例
const resolver = new Resolver();
resolver.setServers([dns]);

// resolver.resolve4("www.pixiv.net",true,(err,addresses) => {
//     console.log(addresses);
// })

// 读取文件内容格式为cheerio对象
const $ = cheerio.load(fs.readFileSync(join(__dirname,fileName+".html"),'utf8',(err,data) =>{
    if(err) throw err;
    return data;
}));

// 获取 去重
const arr = new Set();
$("a").each((i ,v) => {
    let myUrl = new URL(v.attribs.href).host;
    if(myUrl) arr.add(myUrl);
});

// DNS解析检测可用
new Promise((res,rej) => {
    let nArr = Array.from(arr);
    let aHosts = new Set();
    let errList = new Set();
    let oHost = "";
    console.log("网址可用检测");

    /* 循环生成新的 Resolver 实例并解析地址 */
    for(let i = 0,len = nArr.length; i < len; i++) {
        const resolver = new Resolver();
        resolver.setServers([dns]);
        resolver.resolve4(nArr[i],true,(err,addresses) => {
            if(err) {
                console.log("err");
                console.log(err);
                errList.add(nArr[i]);
            }
            if(addresses) {
                console.log(addresses);
                console.log(nArr[i]);
                oHost = nArr[i].match(/\w+.[a-z]+$/)
                if(oHost) aHosts.add(oHost[0]);
            }
        });
    }
    console.log("loading...");
    setTimeout(() =>{return res({aHosts,errList});},5000);// 两秒等待时间

    /*同一个 Resolver 实例递归解析 浪费时间*/
    // function arrforEach(arr,a) {
    //     let i = a -1;
    //     resolver.resolve4(arr[i],true,(err,addresses) => {
    //         if(err) {
    //             errList.add(arr[i]);
    //         }
    //         if(addresses) {
    //             console.log(arr[i]);
    //             oHost = arr[i].match(/\w+.[a-z]+$/)
    //             if(oHost) aHosts.add(oHost[0]);
    //         }
    //         if(i==0) return res({aHosts,errList});
    //         arrforEach(arr,i);
    //     });
    // }
    // arrforEach(nArr,nArr.length);

    /*不可用 */
    // arr.forEach(v => {
    //     resolver.resolve4(v,true,(err,addresses) => {
    //         if(err) {
    //             errList.add(v);
    //         }
    //         if(addresses) {
    //             oHost = v.match(/\w+.[a-z]+$/)
    //             if(oHost) aHosts.add(oHost[0]);
    //         }
    //     });
    // });
    // setTimeout(() =>{return res({aHosts,errList});},2000);

}).then(data => {
    let str = "";
    // 处理结果对象得到字符串
    Array.from(data.aHosts).sort().forEach(v => {
        str += "server=/"+v+"/"+dns+"\n";
    });
    // 字符串写入文件
    fs.writeFileSync(join(__dirname,fileName+".conf"),str,String);

    console.log("结果已经储存在 "+fileName+".conf")
    process.exit();
    // console.log("不可用网址列表: ");
    // console.log(data.errList);
    // console.log("可用网址列表: ");
    // console.log(data.aHosts);
    
});




// 处理结果对象得到字符串
// Array.from(arr).sort().forEach(v => {
//     str += "server=/"+v+"/"+dns+"\n";
// });

// 字符串写入文件
// fs.writeFileSync(join(__dirname,fileName+".conf"),str,String);


