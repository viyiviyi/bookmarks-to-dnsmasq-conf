const fs = require("fs");
const cheerio = require("cheerio");
const { join } = require("path");
const { URL } = require("url");

const dns = "223.5.5.5";
const fileName = "bookmarks.conf";

const $ = cheerio.load(fs.readFileSync(join(__dirname,"bookmarks.html"),'utf8',(err,data) =>{
    if(err) throw err;
    return data;
}));

const arr = {};
let str = "";

$("a").each((i ,v) => {
    let myUrl = new URL(v.attribs.href).host;
    // if(myUrl.match(/^www/)) myUrl = myUrl.substr(4)

    myUrl = myUrl.match(/\w+.[a-z]+$/)

    if(myUrl) arr[myUrl] = myUrl[0];
});

for(let key of Object.keys(arr)){
    str += "server=/"+key+"/"+dns+"\n";
}

fs.writeFileSync(join(__dirname,fileName),str,String);
