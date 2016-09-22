"use strict"
var AVLTree = require('./avl')
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
                    man1[i] = dataMan;
                    i++;
                }
            })
            this.girl2.map((dataGirl) => {
                if(dataGirl) {
                    girl1[j] = dataGirl;
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
            if(this.matchedTime[man]) {
                this.matchedTime[man] = 1;
            } else {
                this.matchedTime[man]++;
            }
            if(this.matchedTime[girl]) {
                this.matchedTime[girl] = 1;
            } else {
                this.matchedTime[girl]++;
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


module.exports = People
