/**
 * Created by jorten on 16/7/24.
 */
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/school_love');

var Schema = mongoose.Schema;

var peopleMod = Schema({
    id: Number,
    username: String,
    password: String,
    name: String,
    sex: Number,
    age: Number,
    lastMatch: Date,
    matchTimes: Number,
    matched: Object
});

var Info = mongoose.model('people', peopleMod);

var OnlinePeople = Schema({
    name: String,
    id: String
})

module.exports.Info = Info;
module.exports.OnlinePeople = OnlinePeople;
