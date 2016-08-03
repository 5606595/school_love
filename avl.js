"use strict"
/**
 * Created by jorten on 16/7/24.
 */
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

module.exports = AVLTree;