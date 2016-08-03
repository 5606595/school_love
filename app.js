"use strict";
var express = require('express'),
    app = express(),
    mongoose = require('mongoose'),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    Schema = require('./schema'),
    man = [], girl = [], man_socket = [], girl_socket = [], waited = [],
    AVLTree = require('./avl'),
    fs = require('fs'),
    multer = require('multer');
    // upload =

var peopleNum = 0, people = {};
app.set("view engine", "ejs");


// app.use(require('body-parser').urlencoded({ extended: false }));
app.use(require('cookie-parser')('secret'));
app.use(require('express-session')());

app.use(express.static('public'));

app.get('/', (req, res) => {
    var isLogin = false;
    if(req.session.userName) {
        isLogin = true;
    }
    // Online.find({}, (err, onlinePeos) => {
    //     peopleNum = onlinePeos.length;
    //     people = [];
    //     onlinePeos.map((temp) => {
    //         people.push(temp.name)
    //     })
    res.render('home/index', {
        isLogin: isLogin,
        name: req.session.userName
        // peopleNum: peopleNum,
        // people: people
    });
    // });
});

app.get('/registerPage', (req, res) => {
    res.render('register/index')
})

app.post('/register', multer({
    storage: multer.diskStorage({
        destination: (req, res, cb) => {
            cb(null, __dirname + '/uploads')
        },
        filename: (req, res, cb) => {
            cb(null, req.body.username + Date.now())
        }
    })
}).single('fileImg'), (req, res) => {
    // var storage = multer.diskStorage({
    //     destination: (req, res, cb) => {
    //         cb(null, __dirname + '/uploads')
    //     },
    //     filename: (req, res, cb) => {
    //         cb(null, Date.now())
    //     }
    // }),
    // upload = multer({
    //     storage: storage
    // });
    // console.log(req.body)
    // var name = req.query.name
    // Schema.Info.find({
    //     username: req.query.username
    // }, (err, infos) => {
    //     if(infos.length) {
    //         res.send('exists');
    //     } else {
    //         new Schema.Info({
    //             id: Math.floor(Math.random() * 100000000000),
    //             sex: req.query.sex,
    //             username: req.query.username,
    //             password: req.query.password,
    //             name: name,
    //             age: req.query.age,
    //             matched: new AVLTree()
    //         }).save()
    //         req.session.userName = name;
    //         res.send('OK');
    //     }
    // })

    // peopleNum++;
    // people.push(name);
    // new Online({
    //     name: name
    // }).save()
});

app.get('/loginPage', (req, res) => {
    res.render('login/index');
})

app.get('/login', (req, res) => {
    var name = req.query.name
    console.log(name)
    Schema.Info.find({
        name: name
    }, function(err, infos) {
        console.log(infos)
        if(infos.length) {
            req.session.userName = name;
            // peopleNum++;
            // people.push(req.session.userName);
            // new Online({
            //     name: name
            // }).save()
            res.send("OK");
        } else {
            res.send("false")
        }
    })
})

app.get('/logout', (req, res) => {
    var name = req.session.userName;
    // Schema.Online.remove({
    //     name: name
    // }, (err, temp) => {})
    delete req.session.userName;
    // peopleNum--;
    // people.splice(0, 1);
    res.redirect('/');
})

io.on('connection', (socket) => {
    console.log('a new user connected')
    io.emit('people', Object.keys(people), peopleNum);
    socket.on('login', (name) => {
        if(!people[name]) {
            Schema.Info.find({
                name: name
            }, (err, infos) => {
                socket.id = infos[0].id
                socket.sex = infos[0].sex
                socket.matched = infos[0].matched
            });
            socket.name = name;
            people[name] = 1;
            peopleNum++;
            io.emit('people', Object.keys(people), peopleNum);
            console.log('login ' + name);
        }
    })
    socket.on('match', function() {
        if(socket.sex > 0) {
            if(man.length < 5) {
                var flag = 1;
                girl.map((temp) => {
                    if(socket.matched.findEle(temp) === 1) {
                        flag = 0
                    }
                })
                if(flag) {
                    man.push(socket.user_id);
                    man_socket.push(socket);
                } else {
                    waited.push(socket);
                }
            } else {
                waited.push(socket);
            }
        } else {
            if(girl.length < 5) {
                man.map((temp) => {
                    if(socket.matched.findEle(temp) === 1) {
                        flag = 0
                    }
                })
                if(flag) {
                    girl.push(socket.user_id);
                    girl_socket.push(socket);
                } else {
                    waited.push(socket);
                }
            } else {
                waited.push(socket);
            }
        }
        if(man.length === 5 && girl.length === 5) {
            man_socket.map(function(man) {
                girl.map((temp) => {
                    man.matched.insertNode(man.matched.tree, temp)
                })
                Schema.Info.find({
                    id: man.id
                }, (err, temp) => {
                    temp.matched = man.matched;
                    temp.save();
                })
                man.emit('finish', girl[0], girl[1], girl[2], girl[3], girl[4]);
            });
            girl_socket.map(function(girl) {
                man.map((temp) => {
                    girl.matched.insertNode(girl.matched.tree, temp)
                })
                Schema.Info.find({
                    id: girl.id
                }, (err, temp) => {
                    temp.matched = girl.matched;
                    temp.save();
                })
                girl.emit('finish', man[0], man[1], man[2], man[3], man[4]);
            });
            man = [];
            girl = [];
            man_socket = [];
            girl_socket = [];
            for(var i = 0,j = waited.length; i < j; i++) {
                var temp = waited.shift();
                if(temp.sex > 0) {
                    if(man.length < 5) {
                        var flag = 1;
                        girl.map((temp1) => {
                            if(temp.matched.findEle(temp1) === 1) {
                                flag = 0
                            }
                        })
                        if(flag) {
                            man.push(temp.user_id);
                            man_socket.push(temp);
                        } else {
                            waited.push(temp);
                        }
                    } else {
                        waited.push(temp);
                    }
                } else {
                    if(girl.length < 5) {
                        man.map((temp1) => {
                            if(temp.matched.findEle(temp1) === 1) {
                                flag = 0
                            }
                        })
                        if(flag) {
                            girl.push(temp.user_id);
                            girl_socket.push(temp);
                        } else {
                            waited.push(temp);
                        }
                    } else {
                        waited.push(temp);
                    }
                }
            }
            console.log('finish')
        }
    })
    socket.on('disconnect', () => {
        if(socket.name) {
            console.log(socket.name + 'disconnected')
            peopleNum--;
            delete people[socket.name];
        }
    })
})

http.listen(3000, function() {
    console.log("Server listening on port 3000");
});
