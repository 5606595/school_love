"use strict";
var express = require('express'),
    app = express(),
    man = [], girl = [], man_socket = [], girl_socket = [], waited = [],
    AVLTree = require('./avl'),
    http = require('http').createServer(app),
    multer = require('multer'),
    crypto = require('crypto'),
    sha1 = crypto.createHash('sha1'),
    request = require('request'),
    parseString = require('xml2js').parseString,
    xml2js = require('xml2js'),
    builder = new xml2js.Builder(),
    token = "";

    // upload =

getToken();

var peopleNum = 0, people = [], relation = {}, peopleAll = {};

var manList = [], girlList = [];



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

function checkMatch() {
    for(var i in relation) {
        if(relation[i].endTime < Date.now()) {
            send(relation[i].person, "匹配时间结束");
            delete relation[i]
        }
    }
}

global.setInterval(checkMatch, 10000);

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
                 "type": 'click',
                 "name": '在线匹配',
                 "key": 'match'
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

app.get('/createkf', (req, res) => {
    console.log(token)
    var opts = {
        url: 'https://api.weixin.qq.com/customservice/kfaccount/add?access_token=' + token,
        method: 'POST',
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        json: {
            "kf_account" : "test1",
            "nickname" : "客服1",
            "password" : "xiawei"
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
    //parseString(req.body, (err, result) => {
    //    console.log(result)
    //    res.send('success')
    //})
    var str = "";
    req.on('data', (chunk) => {
        str += chunk
    })
    req.on('end', (chunk) => {
        parseString(str, (err, result) => {
            console.log(result)
            result = result.xml;
            if(result.MsgType[0] === 'text') {
                if(relation[result.FromUserName[0]]) {
                    send(relation[result.FromUserName[0]].person, result.Content[0])
                    res.send('success')
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
            }
            if(result.MsgType[0] === 'event') {
                if(result.EventKey[0] === 'match') {
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
                    match(result.FromUserName[0]);
                    res.send(xml);
                }
            }
        })
    })
})


function match(id) {
    if(!peopleAll[id]) { 
        peopleAll[id] = {
            matched: new AVLTree()
        }
    }
    if(people.length === 1) {
        if(peopleAll[people[0]].matched.findEle(id)) {
            waited.push(id);
        } else {
            people.push(id);
        }
    }
    if(people.length === 2) {
        people.map((person) => {
            send(person,  "已为您匹配到用户,请发消息给公众号");
        })
        relation[people[0]] = {
            person: people[1],
            endTime: Date.now() + 60 * 1000 
        }
        relation[people[1]] = {
            person: people[0],
            endTime: Date.now() + 60 * 1000 
        }
        peopleAll[people[0]].matched.insertNode(peopleAll[people[0]].matched.tree, id);
        peopleAll[id].matched.insertNode(people[id].matched.tree, people[0]);
        people = [];
       // if(waited) {
            
    }
}

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
app.get('/verify', (req, res) => {
    res.send('Hello')
})

http.listen(80, function() {
    console.log("Server listening on port 80");
});
