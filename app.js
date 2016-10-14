"use strict";
var express = require('express'),
    app = express(),
    AVLTree = require('./avl'),
    http = require('http').createServer(app),
    crypto = require('crypto'),
    sha1 = crypto.createHash('sha1'),
    request = require('request'),
    parseString = require('xml2js').parseString,
    xml2js = require('xml2js'),
    builder = new xml2js.Builder(),
    mysql = require('mysql'),
    token = "";
    // jsapi_ticket = "";

var session = require('express-session');
var bodyParser = require('body-parser');
var TopClient = require('./topClient').TopClient;
var client = new TopClient({
    'appkey': '23472001',
    'appsecret': '65a8de9a0eff2c590f9ba4856dcb3947',
    'REST_URL': 'http://gw.api.taobao.com/router/rest'
});
var formidable = require('formidable');

var askp = {}, recep = {}, matchList = {};

app.use(session({
    secret: 'zuizui-lianyi',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 180000
    }
}))

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'zuizui',
    dateStrings: true
})
app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/public'));

app.use(bodyParser());


class People {
    constructor(status, actid) {
        this.man1 = [];
        this.man2 = [];
        this.girl1 = [];
        this.girl2 = [];
        this.flag = 0;
        this.matched = {};
        this.status = status;
        if(status === 0) {
            this.limit = 3;
            this.matchedTimes = {};
        } else {
            this.contactList = {}
            this.actid = actid;
        }
    }
    matchCheck() {
        if(this.flag === 0) {
            for(var i in this.man1) {
                for(var j in this.girl1) {
                    if(!this.man1[i] || !this.girl1[j] || (this.matched[this.man1[i]] && this.matched[this.man1[i]].findEle(this.girl1[j]))) {

                    } else {
                        if(this.status == 0) {
                            console.log(new Date().toLocaleString() + "   '" + this.man1[i] + "'" + " matches '" + this.girl1[j] + "'");
                        } else {
                            console.log(new Date().toLocaleString() + "   '" + this.man1[i] + "'" + " matches '" + this.girl1[j] + "'  actid: " + this.actid);
                        }
                        this.match(this.man1[i], this.girl1[j]);
                        this.man1[i] = "";
                        this.girl1[j] = "";
                    }
                }
            }
            var i = 0, j = 0;
            this.man1.map((dataMan) => {
                if(dataMan) {
                    this.man2[i] = dataMan;
                    i++;
                }
            })
            this.girl1.map((dataGirl) => {
                if(dataGirl) {
                    this.girl2[j] = dataGirl;
                }
            });
            this.man1 = [];
            this.girl1 = [];
            this.flag = 1;
        } else {
            for(var i in this.man2) {
                for(var j in this.girl2) {
                    if(!this.man2[i] || !this.girl2[j] || (this.matched[this.man2[i]] && this.matched[this.man2[i]].findEle(this.girl2[j]))) {

                    } else {
                        if(this.status == 0) {
                            console.log(new Date().toLocaleString() + "   '" + this.man2[i] + "'" + " matches '" + this.girl2[j] + "'");
                        } else {
                            console.log(new Date().toLocaleString() + "   '" + this.man2[i] + "'" + " matches '" + this.girl2[j] + "'  actid: " + this.actid);
                        }
                        this.match(this.man2[i], this.girl2[j]);
                        this.man2[i] = "";
                        this.girl2[j] = "";
                    }
                }
            }
            var i = 0, j = 0;
            this.man2.map((dataMan) => {
                if(dataMan) {
                    this.man1[i] = dataMan;
                    i++;
                }
            })
            this.girl2.map((dataGirl) => {
                if(dataGirl) {
                    this.girl1[j] = dataGirl;
                }
            });
            this.man2 = [];
            this.girl2 = [];
            this.flag = 0;
        }
    }
    startInterval() {
        setInterval(this.matchCheck.bind(this), 10000);
    }
    insertMan(id) {
        if(this.flag) {
            this.man2.push(id);
        } else {
            this.man1.push(id);
        }
    }
    insertGirl(id) {
        if(this.flag) {
            this.girl2.push(id);
        } else {
            this.girl1.push(id);
        }
    }
    match(man, girl) {
        if(this.matched[man]) {
            this.matched[man].insertNode(this.matched[man].tree, girl);
        } else {
            this.matched[man] = new AVLTree();
            this.matched[man].createTree([girl]);
        }
        if(this.status === 0) {
            matchList[man] = {
                user: girl,
                changeTime: Date.now() + 8 * 1000,
                endTime: Date.now() + 20 * 1000,
                canChange: false
            }
            matchList[girl] = {
                user: man,
                changeTime: Date.now() + 8 * 1000,
                endTime: Date.now() + 20 * 1000,
                canChange: false
            }
            if(!this.matchedTimes[man]) {
                this.matchedTimes[man] = 1;
            } else {
                this.matchedTimes[man]++;
            }
            if(!this.matchedTimes[girl]) {
                this.matchedTimes[girl] = 1;
            } else {
                this.matchedTimes[girl]++;
            }
        } else {
            matchList[man] = {
                user: girl,
                endTime: Date.now() + 6 * 60 * 1000
            }
            matchList[girl] = {
                user: man,
                endTime: Date.now() + 6 * 60 * 1000
            }
        }
        send(man, "匹配成功, 现在可以开始聊天了");
        send(girl, "匹配成功, 现在可以开始聊天了");
    }
}
    // upload =

getToken();

var peopleNum = 0, peopleAll = {}, waitVerify = {}, people = new People(0), spe = {};
global.setInterval(check, 10000);
people.startInterval();

function getToken() {
	var option = {
		url: 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx78c23473ba07e598&secret=bf7724fa0b5b6586263c362944d1ad5f'
	}
	request(option, (err, res1, body) => {
        if(err) {
            console.log(err)
        }
        token = JSON.parse(body).access_token;
        global.setTimeout(getToken, 7200000);
        // var opts = {
        //     url: 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=' + token + '&type=jsapi'
        // }
        // request(opts, (err, res1, body) => {
        //     jsapi_ticket = JSON.parse(body).ticket;
        //     global.setTimeout(getToken, 7200000);
        // });
    })
}

var urlencodedParser = require('body-parser').urlencoded({ extended: false })

app.get('/create', (req, res) => {
     var opts = {
         url: 'https://api.weixin.qq.com/cgi-bin/menu/create?access_token=' + token,
         method: 'POST',
         headers: {
             "Content-Type": 'application/x-www-form-urlencoded'
         },
         json: {
             "button": [
             {
                 "name": '匹配',
                 "sub_button": [
                 {
                     "type": "click",
                     "name": "验证",
                     "key": "verify"
                 },
                 {
                     "type": "click",
                     "name": "随机匹配",
                     "key": "match"
                 },
                 {
                     "type": "click",
                     "name": "换人",
                     "key": "change"
                 },
                 {
                     "type": "click",
                     "name": "话题卡",
                     "key": "card"
                 },
                 {
                     "type": "click",
                     "name": "对方信息页",
                     "key": "info"
                 }]
             },
             {
                 "name": "联谊活动",
                 "sub_button": [
                 {
                     "type": "click",
                     "name": "同意",
                     "key": "agree"
                 },
                 {
                     "type": "click",
                     "name": "不同意",
                     "key": "disagree"
                 },
                 {
                     "type": "view",
                     "name": "近期活动",
                     // "url": "https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx78c23473ba07e598&redirect_uri=http://www.campuslinker.com/weixin/activity&response_type=code&scope=snsapi_base&state=123#wechat_redirect"
                     url: "http://www.campuslinker.com/weixin/activity"
                 },
                 {
                     "type": "view",
                     "name": "个人设置",
                     "url": "http://www.campuslinker.com/weixin/regist"
                 }]
             },
             {
                 "name": "其他",
                 "sub_button": [
                     {
                         "type": "click",
                         "name": "使用说明",
                         "key": "explain"
                     },
                     {
                         "type": "click",
                         "name": "合作单位",
                         "key": "cooperate"
                     },
                     {
                         "type": "click",
                         "name": "联系我们",
                         "key": "contact"
                     },
                     {
                         "type": "view",
                         "name": "注册",
                         "url": "http://www.campuslinker.com/weixin/regist"
                     }]
             }
             ]
         }
     }
     request(opts, (err, res2, body) => {
         if(err) {
             console.log(err)
         }
         console.log(body)
         res.send('ok')
	})
})

app.get('/token', (req, res) => {
    var signature = req.query.signature;
    var string = "";
    var obj = {
        token: 'xw1996721222',
        timestamp: req.query.timestamp,
        nonce: req.query.nonce
    }
    var arr = Object.keys(obj)
    arr.sort();
    arr.map((temp) => {
        string += obj[temp];
    });
    sha1.update(string);
    var hex = sha1.digest('hex');
    if(signature === hex) {
        res.send(req.query.echostr);
    } else {
        res.send('fail')
    }
})

app.post('/token', urlencodedParser, (req, res) => {
    var str = "";
    req.on('data', (chunk) => {
        str += chunk
    })
    req.on('end', (chunk) => {
        parseString(str, (err, result) => {
            result = result.xml;
            if(result.MsgType[0] === 'text') {
                if(askp[result.FromUserName[0]] && result.Content[0] == "1") {
                    console.log(new Date().toLocaleString() + "   '" + result.FromUserName[0] + "'" + " 向 '" + askp[result.FromUserName[0]] + "' 索要联系方式");
                    send(askp[result.FromUserName[0]], '对方想向您索要联系方式,点击下方同意或者不同意按钮给予回复');
                    recep[askp[result.FromUserName[0]]] = result.FromUserName[0];
                    var xml = returnXML(result.FromUserName, result.ToUserName, ['text'], ['已向对方发送您的请求']);
                    delete askp[result.FromUserName[0]];
                    res.send(xml);
                    return ;
                }
                if(matchList[result.FromUserName[0]]) {
                    console.log(new Date().toLocaleString() + "   '" + result.FromUserName[0] + "'" + " -> '" + matchList[result.FromUserName[0]].user + "': " + result.Content[0]);
                    send(matchList[result.FromUserName[0]].user, result.Content[0])
                    res.send('success')
                    return;
                }
                if(waitVerify[result.FromUserName[0]]) {
                    var randomCode = result.Content[0]
                    // var querySel = "select * from user where randomCode = '" + randomCode + "'";
                    // connection.query(querySel, (err, res1) => {
                    //     if(err) {
                    //         console.log(err)
                    //         return;
                    //     }
                    //     if(!res1.length) {
                    //         var msg = {
                    //             xml: {
                    //                 ToUserName: result.FromUserName,
                    //                 FromUserName: result.ToUserName,
                    //                 CreateTime: [String(+new Date())],
                    //                 MsgType: ['text'],
                    //                 Content: ['验证码错误']
                    //             }
                    //         }
                    //         var xml = builder.buildObject(msg);
                    //         res.send(xml);
                    //     } else {
                    if(randomCode == 1) {
                         var msg = {
                            xml: {
                                ToUserName: result.FromUserName,
                                FromUserName: result.ToUserName,
                                CreateTime: [String(+new Date())],
                                MsgType: ['text'],
                                Content: ['验证成功']
                            }
                        }
                        var xml = builder.buildObject(msg);
                        var querySel = "insert into user (gender, weichatNum, phoneNum, password, Name, valiPhoto, contact, allow, activity, starttime, endtime) values (1, '" + result.FromUserName[0] + "', '1', '223', 'a', '1', '11', '1', 1, '2016-10-13 00:00:00', '2016-10-16 00:00:00')";
                        connection.query(querySel, (err, res2) => {
                            if(err) {
                                console.log(err);
                                return;
                            }
                            delete waitVerify[result.FromUserName[0]];
                            res.send(xml)
                        });
                    } else if(randomCode == 0) {
                        var msg = {
                            xml: {
                                ToUserName: result.FromUserName,
                                FromUserName: result.ToUserName,
                                CreateTime: [String(+new Date())],
                                MsgType: ['text'],
                                Content: ['验证成功']
                            }
                        }
                        var xml = builder.buildObject(msg);
                        var querySel = "insert into user (gender, weichatNum, phoneNum, password, Name, valiPhoto, contact, allow, activity, starttime, endtime) values (0, '" + result.FromUserName[0] + "', '1', '223', 'a', '1', '11', '1', 1, '2016-10-13 00:00:00', '2016-10-16 00:00:00')";
                        connection.query(querySel, (err, res2) => {
                            if(err) {
                                console.log(err);
                                return;
                            }
                            delete waitVerify[result.FromUserName[0]];
                            res.send(xml);
                        });
                    } else {
                        var xml = returnXML(result.FromUserName, result.ToUserName, ['text'], ['验证码错误']);
                        res.send(xml);
                        return ;
                    }
                    // })
                } else {
                    var msg = {
                        xml: {
                            ToUserName: result.FromUserName,
                            FromUserName: result.ToUserName,
                            CreateTime: [String(+new Date())],
                            MsgType: ['text'],
                            Content: ['您未有匹配的ID']
                        }
                    }
                    var xml = builder.buildObject(msg);
                    res.send(xml)
                    return ;
                }
            }
            if(result.MsgType[0] === "image") {
                if(matchList[result.FromUserName[0]]) {
                    console.log(new Date().toLocaleString() + "   '" + result.FromUserName[0] + "'" + " 向 '" + matchList[result.FromUserName[0]] + "' 发送图片");
                    send(matchList[result.FromUserName[0]].user, result.MediaId[0], 1);
                    res.send('success');
                    return;
                } else {
                    var msg = {
                        xml: {
                            ToUserName: result.FromUserName,
                            FromUserName: result.ToUserName,
                            CreateTime: [String(+new Date())],
                            MsgType: ['text'],
                            Content: ['您未有匹配的ID']
                        }
                    }
                    var xml = builder.buildObject(msg);
                    res.send(xml)
                    return ;
                }
            }
            if(result.MsgType[0] === 'event') {
                if(result.EventKey[0] === 'verify') {
                    var wechatnum = result.FromUserName[0];
                    if(waitVerify[wechatnum]) {

                    } else {
                        var querySel = "select * from user where weichatNum = '" + result.FromUserName[0] + "'";
                        connection.query(querySel, (err, res1) => {
                            if(err) {
                                console.log(err);
                                return;
                            }
                            if(res1.length && res1[0].allow == '1') {
                                var msg = {
                                     xml: {
                                         ToUserName: result.FromUserName,
                                         FromUserName: result.ToUserName,
                                         CreateTime: [String(+new Date())],
                                         MsgType: ['text'],
                                         Content: ['您已通过验证']
                                     }
                                 }
                                 var xml = builder.buildObject(msg);
                                 res.send(xml)
                            } else {
                                waitVerify[wechatnum] = true;
                                var msg = {
                                    xml: {
                                        ToUserName: result.FromUserName,
                                        FromUserName: result.ToUserName,
                                        CreateTime: [String(+new Date())],
                                        MsgType: ['text'],
                                        Content: ['请在输入框发送您的验证码']
                                    }
                                }
                                var xml = builder.buildObject(msg);
                                res.send(xml);
                            }
                        })
                    }
                }
                if(result.EventKey[0] === 'match') {
                    if(matchList[result.FromUserName[0]]) {
                        var xml = returnXML(result.FromUserName, result.ToUserName, ['text'], ['您已有匹配对象,匹配失败']);
                        res.send(xml);
                        return ;
                    }
                    var querySel = "select * from user where weichatNum = '" + result.FromUserName[0] + "'";
                    connection.query(querySel, (err, res1) => {
                        if(err) {
                            console.log(err);
                            return;
                        }
                        if(!res1.length || res1[0].allow == "0") {
                            var msg = {
                                xml: {
                                    ToUserName: result.FromUserName,
                                    FromUserName: result.ToUserName,
                                    CreateTime: [String(+new Date())],
                                    MsgType: ['text'],
                                    Content: ['账号未通过验证']
                                }
                            }
                            var xml = builder.buildObject(msg);
                            res.send(xml);
                        } else {
                            if(!res1[0].activity && people.matchedTimes[result.FromUserName[0]] && people.matchedTimes[result.FromUserName[0]] > people.limit) {
                                var xml = returnXML(result.FromUserName, result.ToUserName, ['text'], ['今日匹配次数已超过上限,匹配失败']);
                                res.send(xml);
                                return ;
                            } else {
                                if(askp[result.FromUserName[0]]) {
                                    delete askp[result.FromUserName[0]];
                                }
                                var msg = {
                                    xml: {
                                        ToUserName: result.FromUserName,
                                        FromUserName: result.ToUserName,
                                        CreateTime: [String(+new Date())],
                                        MsgType: ['text'],
                                        Content: ['正在为您匹配中,请稍等......']
                                    }
                                }
                                var xml = builder.buildObject(msg);
                                if(!res1[0].activity || Date.now() < +new Date(res1[0].starttime) || Date.now() > +new Date(res1[0].endtime)) {
                                    if(res1[0].gender == '0') {
                                        people.insertMan(result.FromUserName[0])
                                    } else {
                                        people.insertGirl(result.FromUserName[0])
                                    }
                                } else {
                                    var id = res1[0].activity;
                                    if(!spe[id]) {
                                        spe[id] = new People(1, id);
                                        spe[id].startInterval();
                                    }
                                    if(res1[0].gender == '0') {
                                        spe[id].insertMan(result.FromUserName[0])
                                    } else {
                                        spe[id].insertGirl(result.FromUserName[0])
                                    }
                                }
                                res.send(xml);
                                return ;
                            }
                        }
                    })
                }
                if(result.EventKey[0] === 'change') {
                    if(matchList[result.FromUserName[0]] && matchList[result.FromUserName[0]].canChange) {
                        if(people.matchedTimes[result.FromUserName[0]] > people.limit) {
                            var xml = returnXML(result.FromUserName, result.ToUserName, ['text'], ['换人成功, 您今日已达匹配次数上限, 匹配失败']);
                            var obj = matchList[result.FromUserName[0]].user;
                            send(obj, '对方已结束此次对话，请点击随机匹配继续此次联谊');
                            console.log(new Date().toLocaleString() + "   '" + result.FromUserName[0] + "'" + " 换人对象: '" + obj + "'" );
                            delete matchList[obj];
                            delete matchList[result.FromUserName[0]];
                            res.send(xml);
                            return ;
                        } else {
                            var xml = returnXML(result.FromUserName, result.ToUserName, ['text'], ['换人成功, 正在重新匹配']);
                            var obj = matchList[result.FromUserName[0]].user;
                            send(obj, '对方已结束此次对话，请点击随机匹配继续此次联谊');
                            console.log(new Date().toLocaleString() + "   '" + result.FromUserName[0] + "'" + " 换人对象: '" + obj + "'" );
                            delete matchList[obj];
                            delete matchList[result.FromUserName[0]];
                            var querySel = "select * from user where weichatNum = '" + result.FromUserName[0] + "'";
                            connection.query(querySel, (err, res1) => {
                                if(err) {
                                    console.log(err);
                                }
                                if(res1[0].gender == '0') {
                                    people.insertMan(result.FromUserName[0]);
                                } else {
                                    people.insertGirl(result.FromUserName[0]);
                                }
                                res.send(xml);
                                return ;
                            });
                        }
                    } else {
                        var xml = returnXML(result.FromUserName, result.ToUserName, ['text'], ['不满足条件, 换人失败']);
                        res.send(xml);
                        return ;
                    }
                }
                if(result.EventKey[0] === 'agree') {
                    if(recep[result.FromUserName[0]]) {
                        var rece = result.FromUserName[0];
                        var ask = recep[result.FromUserName[0]];
                        var querySel = "select contact from user where weichatNum = '" + rece + "'";
                        connection.query(querySel, (err, res1) => {
                            if(err) {
                                console.log(err);
                                return;
                            }
                            var contact = res1[0].contact;
                            console.log(new Date().toLocaleString() + "   '" + rece + "'" + " 同意给予 '" + ask + "' 联系方式" );
                            send(ask, '对方同意您的请求, 他/她的预留联系方式是' + contact);
                            var xml = returnXML(result.FromUserName, result.ToUserName, ['text'], ['已向对方发送']);
                            delete recep[result.FromUserName[0]]
                            res.send(xml);
                            return ;
                        })
                    } else {
                        var xml = returnXML(result.FromUserName, result.ToUserName, ['text'], ['不满足条件']);
                        res.send(xml);
                        return ;
                    }
                }
                if(result.EventKey[0] === 'disagree') {
                    if(recep[result.FromUserName[0]]) {
                        var rece = result.FromUserName[0];
                        var ask = recep[result.FromUserName[0]];
                        console.log(new Date().toLocaleString() + "   '" + rece + "'" + " 不同意给予 '" + ask + "' 联系方式" );
                        send(ask, '对方不同意您的请求');
                        var xml = returnXML(result.FromUserName, result.ToUserName, ['text'], ['已向对方发送']);
                        delete recep[result.FromUserName[0]]
                        res.send(xml);
                        return ;
                    } else {
                        var xml = returnXML(result.FromUserName, result.ToUserName, ['text'], ['不满足条件']);
                        res.send(xml);
                        return ;
                    }
                }
            }
        })
    })
})

app.get('/regist', (req, res) => {
    if(req.headers['user-agent'].match("MicroMessenger")) {
        res.render('regist');
    } else {
        res.send("请用微信浏览器打开")
    }
})

app.post('/getveri', (req, res) => {
    if(req.headers['user-agent'].match("MicroMessenger")) {
        var phoneNum = req.body.phoneNum;
        var querySel = "select * from user where phoneNum = '" + phoneNum + "'";
        connection.query(querySel, (err, res1) => {
            if (err) {
                console.log(err)
                res.send('0');
                return;
            }
            if (res1.length) {
                res.send('2');
            } else {
                var randomCode = Math.floor(Math.random() * 1000000);
                sendMS(String(randomCode), phoneNum);
                req.session.phoneNum = phoneNum;
                req.session.regCode = randomCode;
                res.send('1');
            }
        })
    }
})

app.post('/reg', (req, res) => {
    if(req.headers['user-agent'].match("MicroMessenger")) {
        var form = new formidable.IncomingForm();
        form.encoding = 'utf-8';
        form.uploadDir = "/home/ubuntu/zuizui/people";
        form.on('file', (name, file) => {
            var arr = file.path.split('/');
            file.name = arr.slice(arr.length - 1, arr.length)[0];
        })
        form.maxFieldsSize = 2 * 1024 * 1024;
        form.parse(req, (err, filed, file) => {
            req.body = filed;
            req.file = file;
            var photo = req.file.photo.name
            var phoneNum = req.body.phoneNum;
            var regCode = req.body.regCode;
            if (phoneNum == req.session.phoneNum && regCode == req.session.regCode) {
                var code = req.body.code;
                var name = req.body.name;
                var gender = req.body.gender;
                var school = req.body.school;
                var schema = req.body.schema;
                var contact = req.body.contact;
                if (!contact) {
                    contact = phoneNum;
                }
                if (code && school && schema) {
                    var reg = new RegExp(/^[\@A-Za-z0-9\!\#\$\%\^\&\*\.\~]{6,22}$/);
                    if (reg.test(code)) {
                        var querySel = "insert into user(phoneNum, password, Name, gender, school, contact, valiPhoto) values('" + phoneNum + "', '" + code + "', '" + name + "', '" + gender + "', '" + school + "', '" + contact + "', '" + photo + "');";
                        connection.query(querySel, (err, res1) => {
                            if (err) {
                                console.log(err)
                                return;
                            }
                            res.redirect('/weixin/success');
                        })
                    }
                }
            }
        })
    }
})

app.get('/activity', (req, res) => {
    if(req.headers['user-agent'].match("MicroMessenger")) {
        var querySel = 'select * from activity where display = 1';
        connection.query(querySel, (err, res1) => {
            if(err) {
                console.log(err);
            } else {
                res.render('activity', {
                    act: res1
                })
            }
        })
    } else {
        res.send("请用微信浏览器打开");
    }
})

app.post("/actenroll", (req, res) => {
    if(req.headers['user-agent'].match("MicroMessenger")) {
        var actid = req.body.id;
        var wxid = req.session.wxid;
        var querySel = "select * from user where weichatNum = " + wxid;
        connection.query(querySel, (err, res1) => {
            if(err) {
                console.log(err);
                res.send('0');
                return;
            }
            if(res1.length) {
                if(res1[0].activity) {
                    res.send('2')
                } else {
                    var querySel = "select * from activity where id = " + actid;
                    connection.query(querySel, (err, res2) => {
                        if(err) {
                            console.log(err);
                            res.send('0');
                            return;
                        }
                        if(res2.length) {
                            if(+new Date() >= +new Date(res2.deadline)) {
                                res.send('3')
                            } else if(res2.regnum >= res2.maxnum) {
                                res.send('4')
                            } else {
                                var querySel1 = "insert into record(userID, userName, activityID, activityName, school) values(" + res1.id + ", '" + res1.Name + "', " + actid + ", '" + res2.title + "', '" + res1.school + "');";
                                connection.query(querySel1, (err, res3) => {
                                    if(err) {
                                        console.log(err);
                                        res.send('0');
                                        return;
                                    }
                                    var regnum = Number(res2.regnum) + 1;
                                    var querySel2 = "update activity set regnum = " + regnum + " where id = " + actid;
                                    connection.query(querySel2, (err, res4) => {
                                        if(err) {
                                            console.log(err);
                                            res.send('0');
                                            return;
                                        }
                                        res.send('1');
                                    })
                                })

                            }
                        }
                    })
                }
            }
        })
    }
})


app.get('/reg', (req, res) => {
    res.render('success');
});

// app.get('/upload', (req, res) => {
//     res.render('upload')
// })

app.get('/success', (req, res) => {
    res.render('success')
})

app.get('/veri', (req, res) => {
    var phoneNum = req.query.phoneNum;
    var regCode = req.query.regCode;
    if(phoneNum == req.session.phoneNum && regCode == req.session.regCode) {
        res.send('1')
    } else {
        res.send('0')
    }
})

app.get('/personal', (req, res) => {

})


function send(to, msg, type) {
    if(arguments.length === 2) {
        var opts = {
            url: 'https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=' + token,
            method: 'POST',
            headers: {
                'Content-Type': 'Application/x-www-form-urlencoded'
            },
            json: {
                "touser": to,
                "msgtype": "text",
                "text": {
                    "content": msg
                }
            }
        }
        request(opts, (err, res2, body) => {

        })
    } else {
        var opts = {
            url: 'https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=' + token,
            method: 'POST',
            headers: {
                'Content-Type': 'Application/x-www-form-urlencoded'
            },
            json: {
                "touser": to,
                "msgtype": "image",
                "image": {
                    "media_id": "'" + msg + "'"
                }
            }
        }
        request(opts, (err, res2, body) => {

        })
    }
}

// app.get('/sha', (req, res) => {
//     var noncestr = 'Wm3WZYTPz0wzccnW';
//     var timestamp = 1414587457;
//     var url = 'http://zuizui.club/weixin/upload'
//     var timestamp = +new Date();
//     console.log(jsapi_ticket)
//     console.log(timestamp)
//     var string = "jsapi_ticket=" + jsapi_ticket + '&noncestr=' + noncestr + '&timestamp=' + timestamp + '&url=' + url;
//     sha1.update(string);
//     var hex = sha1.digest('hex');
//     console.log(hex)
//     res.send(JSON.stringify({
//         timestamp: timestamp,
//         hex: hex
//     }));
// })

function returnXML(to, from, type, content) {
    var msg = {
        xml: {
            ToUserName: to,
            FromUserName: from,
            CreateTime: [String(+new Date())],
            MsgType: type,
            Content: content
        }
    }
    var xml = builder.buildObject(msg);
    return xml;
}

function sendMS(num, phoneNum) {
    if(arguments.length === 2) {
        var sms_param = {
            code: num,
            product: "最最注册"
        }
        client.execute('alibaba.aliqin.fc.sms.num.send', {
            'sms_type':'normal',
            'sms_free_sign_name':'最最联谊',
            'sms_param': JSON.stringify(sms_param),
            'rec_num': phoneNum,
            'sms_template_code':'SMS_16696263'
        }, function(error, response) {
            if (!error) {
                return true;
            }
            else {
                console.log(error);
                return false;
            }
        })
    }
}

function check() {
    for(var i in matchList) {
        if(matchList[i].changeTime) {
            if(matchList[i].changeTime < Date.now()) {
                matchList[i].canChange = true;
            }
            if(matchList[i].endTime < Date.now()) {
                console.log(new Date().toLocaleString() + "   '" + i + "'" + " closes '" + matchList[i].user + "' ");
                send(matchList[i].user, '聊天时间结束')
                delete matchList[i]
            }
        } else {
            if(matchList[i].endTime < Date.now()) {
                // var querySel = "select matchUsers from record where userID = " + i + " and allow = 1";
                // connection.query(querySel, (err, res1) => {
                //     if(err) {
                //         console.log(err);
                //         return;
                //     }
                //     if(res1[0]) {
                //         res1 = JSON.stringify(JSON.parse(res1[0]).push(matchList[i]));
                //     } else {
                //         res1 = JSON.stringify([matchList[i]]);
                //     }
                //     var querySel = "update record set matchUsers = '" + res1 + "' where userID = " + i + " and allow = 1";
                //     connection.query(querySel, (err, res2) => {
                //         if(err) {
                //             console.log(err)
                //             return;
                //         }
                        console.log(new Date().toLocaleString() + "   '" + i + "'" + " closes '" + matchList[i].user + "'  activity!!!!");
                        send(matchList[i].user, '聊天时间结束, 回复1可向对方索要联系方式')
                        askp[i] = matchList[i].user;
                        delete matchList[i]
                    // })
                // })

            }
        }
    }
}

http.listen(3000, function() {
    console.log("Server listening on port 3000");
});
