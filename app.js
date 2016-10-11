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
    password: '',
    database: 'zuizui',
    dateStrings: true
})
app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/public'));

app.use(bodyParser());


class People {
    constructor(status) {
        this.man1 = [];
        this.man2 = [];
        this.girl1 = [];
        this.girl2 = [];
        this.flag = 0;
        this.matched = {};
        this.matchList = {};
        this.status = status;
        if(status === 0) {
            this.limit = 3;
            this.matchedTimes = {};
        }
    }
    matchCheck() {
        if(this.flag === 0) {
            this.man1.map((dataMan, i) => {
                this.girl1.map((dataGirl, j) => {
                    if(this.matched[dataMan] && this.matched[dataMan].findEle(dataGirl)) {

                    } else {
                        this.match(dataMan, dataGirl);
                        dataMan = "";
                        dataGirl = "";
                    }
                })
            })
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
            this.man2.map((dataMan, i) => {
                this.girl2.map((dataGirl, j) => {
                    if(this.matched[dataMan] && this.matched[dataMan].findEle(dataGirl)) {

                    } else {
                        this.match(dataMan, dataGirl);
                        dataMan = "";
                        dataGirl = "";
                    }
                })
            })
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
    check() {
        if(this.status === 0) {
            for(var i in this.matchList) {
                if(this.matchList[i].endTime < Date.now()) {
                    send(this.matchList[i].user, '聊天时间结束')
                    delete this.matchList[i]
                }
                if(this.matchList[i].changeTime < Date.now()) {
                    this.matchList[i].canChange = true;
                }
            }
        } else {
            for(var i in this.matchList) {
                if(this.matchList[i].endTime < Date.now()) {
                    send(this.matchList[i].user, '聊天时间结束')
                    delete this.matchList[i]
                }
            }
        }
    }
    startInterval() {
        setInterval(this.matchCheck.bind(this), 20000);
        setInterval(this.check.bind(this), 20000);
    }
    insertMan(id) {
        if(flag) {
            this.man2.push(id);
        } else {
            this.man1.push(id);
        }
    }
    insertGirl(id) {
        if(flag) {
            this.girl2.push(id);
        } else {
            this.girl1.push(id);
        }
    }
    match(man, girl) {
        if(this.matched[man]) {
            this.matched[man].insertNode(girl);
        } else {
            this.matched[man] = new AVLTree();
            this.matched[man].insertNode(girl);
        }
        if(this.status === 0) {
            this.matchList[man] = {
                user: girl,
                changeTime: Date.now() + 3 * 60 * 1000,
                endTime: Date.now() + 8 * 60 * 1000,
                canChange: false
            }
            this.matchList[girl] = {
                user: man,
                changeTime: Date.now() + 3 * 60 * 1000,
                endTime: Date.now() + 8 * 60 * 1000,
                canChange: false
            }
            if(this.matchedTimes[man]) {
                this.matchedTimes[man] = 1;
            } else {
                this.matchedTimes[man]++;
            }
            if(this.matchedTimes[girl]) {
                this.matchedTimes[girl] = 1;
            } else {
                this.matchedTimes[girl]++;
            }
        } else {
            this.matchList[man] = {
                user: girl,
                endTime: Date.now() + 6 * 60 * 1000
            }
            this.matchList[girl] = {
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

var peopleNum = 0, peopleAll = {}, waitVerify = {}, people = new People(0), spe = [];
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
                if(people.matchList[result.FromUserName[0]]) {
                    send(people.matchList[result.FromUserName[0]].user, result.Content[0])
                    res.send('success')
                    return ;
                } else {
                   var has = spe.some((data) => {
                       return data.matchList[result.FromUserName[0]].user
                   })
                   if(has) {
                       spe.map((data) => {
                           if (data.matchList[result.FromUserName[0]].user) {
                               send(data.matchList[result.FromUserName[0]].user, result.Content[0])
                               res.send('success');
                           }
                       })
                       return ;
                   }
                }
                if(waitVerify[result.FromUserName[0]]) {
                    var randomCode = result.Content[0]
                    var querySel = "select * from user where randomcode = '" + randomCode + "'";
                    connection.query(querySel, (err, res1) => {
                        if(err) {
                            console.log(err)
                            return;
                        }
                        if(!res1.length) {
                            var msg = {
                                xml: {
                                    ToUserName: result.FromUserName,
                                    FromUserName: result.ToUserName,
                                    CreateTime: [String(+new Date())],
                                    MsgType: ['text'],
                                    Content: ['验证码错误']
                                }
                            }
                            var xml = builder.buildObject(msg);
                            res.send(xml);
                        } else {
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
                            var querySel = "update user set weichatnum = '" + result.FromUserName[0] + "', allow = 1 where randomcode = '" + randomCode + "'";
                            connection.query(querySel, (err, res2) => {
                                res.send(xml)
                            });
                        }
                    })
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
                        var querySel = "select * from user where weichatnum = '" + result.FromUserName[0] + "'";
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
                            }
                        })
                        return ;
                    }
                    waitVerify[wechatnum] = true;
                    var msg = {
                        xml: {
                            ToUserName: result.FromUserName,
                            FromUserName: result.ToUserName,
                            CreateTime: [String(+new Date())],
                            MsgType: ['text'],
                            Content: ['请输入您的验证码']
                        }
                    }
                    var xml = builder.buildObject(msg);
                    res.send(xml);
                    return ;
                }
                if(result.EventKey[0] === 'match') {
                    var querySel = "select * from user where weichatnum = '" + result.FromUserName[0] + "'";
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
                            if(!res1.choseid && people.matchedTime[result.FromUserName[0]] && people.matchedTime[result.FromUserName[0]] > people.limit) {
                                var xml = returnXML(result.FromUserName, result.ToUserName, ['text'], ['今日匹配次数已超过上限,匹配失败']);
                                res.send(xml);
                                return ;
                            } else {
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
                                if(!res1.activity || Date.now() < res1.starttime || Date.now() > res1.endtime) {
                                    if(res1.gender === 0) {
                                        people.insertMan(result.FromUserName[0])
                                    } else {
                                        people.insertGirl(result.FromUserName[0])
                                    }
                                } else {
                                    var id = res1.activity;
                                    if(id > spe.length) {
                                        spe.length = id;
                                        spe[id - 1] = new People(1);
                                        spe[id - 1].startInterval();
                                    }
                                    if(res1.gender === 0) {
                                        spe[id - 1].insertMan(result.FromUserName[0])
                                    } else {
                                        spe[id - 1].insertGirl(result.FromUserName[0])
                                    }
                                }
                                res.send(xml);
                                return ;
                            }
                        }
                    })
                }
                if(result.EventKey[0] === 'change') {
                    if(people.matchList[result.FromUserName[0]] && people.matchList[result.FromUserName[0]].canChange) {
                        var xml = returnXML(result.FromUserName, result.ToUserName, ['text'], ['换人成功, 正在重新匹配']);
                        var obj = people.matchList[result.FromUserName[0]].user;
                        send(obj, '对方已结束此次对话，请点击随机匹配继续此次联谊');
                        delete people.matchList[obj];
                        delete people.matchList[result.FromUserName[0]];
                        var querySel = 'select * from user where weichatNum = ' + result.FromUserName[0];
                        connection.query(querySel, (err, res1) => {
                            if(err) {
                                console.log(err);
                            }
                            if(res1[0].gender === 0) {
                                people.insertMan(result.FromUserName[0]);
                            } else {
                                people.insertGirl(result.FromUserName[0]);
                            }
                            res.send(xml);
                            return ;
                        });
                    } else {
                        var xml = returnXML(result.FromUserName, result.ToUserName, ['text'], ['不满足条件, 换人失败']);
                        res.send(xml);
                        return ;
                    }
                }
             }
         })
    })
})

app.get('/regist', (req, res) => {
    res.render('regist');
})

app.post('/getveri', (req, res) => {
    var randomCode = Math.floor(Math.random() * 1000000);
    sendMS(String(randomCode), req.body.phoneNum);
    req.session.phoneNum = req.body.phoneNum;
    req.session.regCode = randomCode;
    console.log(req.session);
    res.send('ok');
})

app.post('/reg', (req, res) => {
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
        if(phoneNum == req.session.phoneNum && regCode == req.session.regCode) {
            var code = req.body.code;
            var name = req.body.name;
            var gender = req.body.gender;
            var school = req.body.school;
            var schema = req.body.schema;
            var contact = req.body.contact;
            if(!contact) {
                contact = phoneNum;
            }
            if(code && school && schema) {
                var querySel = "insert into user(phoneNum, password, Name, gender, school, contact, valiPhoto) values('" + phoneNum + "', '" + code + "', '" + name + "', '" + gender + "', '" + school + "', '" + contact + "', '" + photo + "');";
                connection.query(querySel, (err, res1) => {
                    if(err) {
                        console.log(err)
                        return;
                    }
                    res.redirect('/weixin/success');
                })
            }
        }
    })
})

app.get('/activity', (req, res) => {
    console.log(req.headers['user-agent']);
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
})

app.post("/actenroll", (req, res) => {
    var actid = req.body.id;
    console.log(req.headers['user-agent']);
    res.send('1');
})


app.get('/reg', (req, res) => {
    res.redirect('/weixin/success');
})

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


function send(to, msg) {
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
        console.log(body);
    })
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

http.listen(3000, function() {
    console.log("Server listening on port 3000");
});
