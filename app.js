var express = require('express'),
    app = express(),
    mongoose = require('mongoose');

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

var peopleNum = 0, people = [];
app.set("view engine", "ejs");

app.use(require('cookie-parser')('secret'));
app.use(require('express-session')({
    cookie: {
        maxAge: 4000
    }
}));

app.use(express.static('public'));

app.get('/', (req, res) => {
    var isLogin = false;
    if(req.session.userName) {
        isLogin = true;
    }
    Online.find({}, (err, onlinePeos) => {
        peopleNum = onlinePeos.length;
        people = [];
        onlinePeos.map((temp) => {
            people.push(temp.name)
        })
        res.render('home/index', {
            isLogin: isLogin,
            peopleNum: peopleNum,
            people: people
        });
    });
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
    new Online({
        name: name
    }).save()
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
            new Online({
                name: name
            }).save()
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

app.listen(3000, function() {
    console.log("Server listening on port 3000");
});
