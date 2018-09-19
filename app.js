const fs = require("fs");
const cheerio = require("cheerio");
const { join } = require("path");
const { URL } = require("url");
const { Resolver } = require('dns');

const dns = "180.76.76.76";
const dns2 = "123.207.13.111";
const fileName = "bookmarks";

// DNS解析实例
const resolver = new Resolver();
resolver.setServers([dns]);

// 读取文件内容格式为cheerio对象
const $ = cheerio.load(fs.readFileSync(join(__dirname, fileName + ".html"), 'utf8', (err, data) => {
    if (err) throw err;
    return data;
}));

// 获取 去重
const arr = new Set();
$("a").each((i, v) => {
    let myUrl = new URL(v.attribs.href).host;
    if (myUrl) arr.add(myUrl);
});

// DNS解析检测可用
new Promise((res, rej) => {
    let nArr = Array.from(arr);  // set -> Array
    let aHosts = new Set(); // 可用的网址列表
    let errList = new Set(); // 不可用的网址列表
    let oHost = "";
    let times = Date.now(); // 开始计时

    console.log("网址可用检测，稍等一会");
    let timeout = 0; // 超时退出定时器

    /* 循环生成新的 Resolver 实例并解析地址 */
    for (let i = 0, len = nArr.length; i < len; i++) {
        clearTimeout(timeout); // 清除超时定时器
        
        const resolver = new Resolver(); // 创建一个 DNS 解析实例
        // 通过设定的国内 DNS 解析网站
        resolver.setServers([dns]);
        resolver.resolve4(nArr[i], true, (err, addresses) => {
            if (err) {
                errList.add(nArr[i]);
            }
            if (addresses) {
                // 解析成功后用可用解析国外的 DNS 再解析验证
                resolver.setServers([dns2]);
                resolver.resolve4(nArr[i], true, (err, resses) => {
                    if (resses) {
                        resses.forEach(item => {
                            if (addresses.indexOf(item) != -1) {
                                oHost = nArr[i].match(/\w+.[a-z]+$/)
                                if (oHost) aHosts.add(oHost[0]);
                            }
                        });
                    }
                });
            }
        });
        timeout = setTimeout(() => {
            console.log('loading...');
            setTimeout(() => {
                times = Date.now() - times;
                console.log('耗时 ' + times / 1000 + ' s');
                return res({ aHosts, errList });
            }, 2000);
        }, 20000);
    }


}).then(data => {
    let str = "";
    console.log(data.aHosts.size);
    // 处理结果对象得到字符串
    Array.from(data.aHosts).sort().forEach(v => {
        str += "server=/" + v + "/" + dns + "\n";
    });
    // 字符串写入文件
    fs.writeFileSync(join(__dirname, fileName + ".conf"), str, String);

    console.log("结果已经储存在 " + fileName + ".conf")
    process.exit();

});

