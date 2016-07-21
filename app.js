var express = require('express'),
    app = express(),
    mongoose = require('mongoose'),
    http = require('http').Server(app);
    io = require('socket.io')(http);

mongoose.connect('mongodb://localhost/school_love');

var Schema = mongoose.Schema;

var peopleMod = Schema({
    name: String,
    age: Number
})

var Info = mongoose.model('people', peopleMod);

var OnlinePeople = Schema({
    name: String
})

var Online = mongoose.model('onlinepeo', OnlinePeople)

var peopleNum = 0, people = {};
app.set("view engine", "ejs");

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

app.get('/register', (req, res) => {
    var name = req.query.name
    new Info({
        name: name,
        age: req.query.age
    }).save()
    req.session.userName = name;
    // peopleNum++;
    // people.push(name);
    // new Online({
    //     name: name
    // }).save()
    res.redirect('/')
});

app.get('/loginPage', (req, res) => {
    res.render('login/index');
})

app.get('/login', (req, res) => {
    var name = req.query.name
    console.log(name)
    Info.find({
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
    Online.remove({
        name: name
    }, (err, temp) => {})
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
            socket.name = name;
            people[name] = 1;
            peopleNum++;
            io.emit('people', Object.keys(people), peopleNum);
            console.log('login ' + name);
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
