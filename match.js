/**
 * Created by jorten on 16/7/24.
 */
"use strict"
var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    man = [], girl = [], man_socket = [], girl_socket = [], waited = [];
app.use('/', express.static(__dirname + '/www'));

server.listen(3000);

io.on('connection', function(socket) {
    console.log('a new user connected');
    socket.matched = new AVLTree();
    socket.user_id = Math.floor(Math.random() * 100000000000)
    socket.sex = Math.random() > 0.5 ? 1 : 0;
    console.log(socket.sex > 0 ? '男' : '女');
    console.log(socket.user_id);
    socket.emit('display', socket.sex > 0 ? '男' : '女', socket.user_id);
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
                man.emit('finish', girl[0], girl[1], girl[2], girl[3], girl[4]);
            });
            girl_socket.map(function(girl) {
                man.map((temp) => {
                    girl.matched.insertNode(girl.matched.tree, temp)
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
})

//    AVL 树
class Node {
    constructor() {
        this.data = -1;
        this.lChild = null;
        this.rChild = null;
        this.height = 0;
    }
}

class AVLTree {
    constructor() {
        this.tree = null;
    }
    getHeight(node) {
        return node === null ? 0 : node.height;
    }
    createTree(arr) {
        for(var i = 0, j = arr.length; i < j; i++) {
            this.tree = this.insertNode(this.tree, arr[i]);
        }
    }
    insertNode(tree, data) {
        var temp = new Node();
        temp.data = data;
        temp.height = 1;
        if(tree === null) {
            tree = temp;
            return tree;
        }
        if(data < tree.data) {
            tree.lChild = this.insertNode(tree.lChild, data);
            if(this.getHeight(tree.lChild) - this.getHeight(tree.rChild) > 1) {
                if(data < tree.lChild.data) {
                    tree = this.singleRightRotate(tree);
                } else {
                    tree = this.doubleRightRotate(tree)
                }
            }
        } else {
            tree.rChild = this.insertNode(tree.rChild, data);
            if(this.getHeight(tree.rChild) - this.getHeight(tree.lChild) > 1) {
                if(data > tree.rChild.data) {
                    tree = this.singleLeftRotate(tree);
                } else {
                    tree = this.doubleLeftRotate(tree)
                }
            }
        }
        tree.height = Math.max(this.getHeight(tree.lChild), this.getHeight(tree.rChild)) + 1;
        return tree;
    }
    singleLeftRotate(node) {
        var xNode = node;
        var yNode = node.rChild;
        xNode.rChild = yNode.lChild;
        yNode.lChild = xNode;
        xNode.height = Math.max(this.getHeight(xNode.lChild), this.getHeight(xNode.rChild)) + 1;
        yNode.height = Math.max(this.getHeight(yNode.lChild), this.getHeight(yNode.rChild)) + 1;
        return yNode
    }
    singleRightRotate(node) {      //  左左不平衡
        var xNode = node;
        var yNode = node.lChild;
        xNode.lChild = yNode.rChild;
        yNode.rChild = xNode;
        xNode.height = Math.max(this.getHeight(xNode.lChild), this.getHeight(xNode.rChild)) + 1;
        yNode.height = Math.max(this.getHeight(yNode.lChild), this.getHeight(yNode.rChild)) + 1;
        return yNode
    }
    doubleLeftRotate(node) {
        node.rChild = this.singleRightRotate(node.rChild);
        return this.singleLeftRotate(node);
    }
    doubleRightRotate() {
        node.lChild = this.singleLeftRotate(node.lChild);
        return this.singleRightRotate(node);
    }
    findEle(data) {
        var temp = this.tree;
        while(temp) {
            if(data === temp.data) {
                return 1;
            } else if(data < temp.data) {
                temp = temp.lChild;
            } else {
                temp = temp.rChild;
            }
        }
        return 0;
    }
}
