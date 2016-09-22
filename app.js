"use strict";
var express = require('express'),
    app = express(),
    AVLTree = require('./avl'),
    http = require('http').createServer(app),
    multer = require('multer'),
    crypto = require('crypto'),
    sha1 = crypto.createHash('sha1'),
    request = require('request'),
    parseString = require('xml2js').parseString,
    xml2js = require('xml2js'),
    builder = new xml2js.Builder(),
    mysql = require('mysql'),
    token = "",
    People = require('./match');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'zxc',
    database: 'zz'
})
    // upload =

getToken();

var peopleNum = 0, peopleAll = {}, waitVerify = {}, people = new People(0), spe = [];

function getToken() {
	var option = {
		url: 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx975cab4041fab87d&secret=08077c0f76eeec4184d8bd05e958689e'
	}
	request(option, (err, res1, body) => {
		if(err) {
			console.log(err)
		} 
		token = JSON.parse(body).access_token;
        global.setTimeout(getToken, 7200000);
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
                 "name": '菜单',
                 "sub_button": [
                 {
                     "type": "click",
                     "name": "验证",
                     "key": "verify"
                 },
                 {
                     "type": "click",
                     "name": "匹配",
                     "key": "match"
                 },
                 {
                     "type": "click",
                     "name": "换人",
                     "key": "change"
                 }]
             },
             {
                 "name": "页面",
                 "sub_button": [
                 {
                     "type": "click",
                     "name": "查看资料",
                     "key": "watch"
                 },
                 {
                     "type": "view",
                     "name": "注册",
                     "url": "http://www.baidu.com"
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
            console.log(result)
            result = result.xml;
            if(result.MsgType[0] === 'text') {
                if(people.match[result.FromUserName[0]]) {
                    send(people.match[result.FromUserName[0]].user, result.Content[0])
                    res.send('success')
                    return ;
                } else {
                   spe.map((data) => {
                       if(data.match[result.FromUserName[0]].user) {
                            send(data.match[result.FromUserName[0]].user, result.Content[0])
                            res.send('success');
                            return ;
                       }
                   })
                }
                if(waitVerify[result.FromUserName[0]]) {
                    var randomCode = result.Content[0]
                    var querySel = "select * from user where randomcode = " + randomCode;
                    connection.query(querySel, (err, res1) => {
                        if(res1.length) {
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
                            return ;
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
                            var querySel = "update user set weichatnum = " result.FromUserName[0] + " where randomcode = " + randomCode;
                            connection.query(querySel, (err, res2) => {
                                res.send(xml)
                                return ;
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
                        var querySel = "select * from user where weichatnum = " + result.FromUserName[0];
                        connection.query(querySel, (err, res1) => {
                            if(res1.length && res1[0].randomcode) {
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
                                 return ;
                            }
                        })
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
                    var querySel = "select * from user where weichatnum = " + result.FromUserName[0];
                    connection.query(querySel, (err, res1) => {
                        if(!res1.length) {
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
                            return ;
                        } else {
                            if(!res1.choseid && people.matchedTime[result.FromUserName[0] && people.matchedTime[result.FromUserName[0] > people.limit) {
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
                                if(!res1.choseId) {
                                    if(res1.gender === 0) {
                                        people.insertMan(result.FromUserName[0])
                                    } else {
                                        people.insertGirl(result.FromUserName[0])
                                    }
                                } else {
                                    var id = res1.choseId;
                                    if(id > spe.length) {
                                        spe.length = id;
                                        spe[id - 1] = new People(1);
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
                    if(people.match[result.FromUserName[0] && people.match[result.FromUserName[0]].canChange) {
                        var xml = returnXML(result.FromUserName, result.ToUserName, ['text'], ['换人成功, 正在重新匹配']);
                        var obj = people.match[result.FromUserName[0]].user;
                        send(obj, '对方已结束此次对话，请点击随机匹配继续此次联谊');
                        delete people.match[obj];
                        delete people.match[result.FromUserName[0];
                        var querySel = 'select * from user where weichatNum = ' + result.FromUserName[0];
                        connection.query(querySel, (err, res1) => {
                            if(err) {
                                console.log(err);
                            }
                            if(res1[0].gender === 0) {
                                people.insertMan(result.FromUserName[0];
                            } else {
                                people.insertGirl(result.FromUserName[0];)
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

http.listen(80, function() {
    console.log("Server listening on port 80");
});
