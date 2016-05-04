/**
 * Created by Alex4J on 13-03-16.
 */
var express = require('express');
var router = express.Router();
var daemonConfig = require('../configs/daemon.json');
var daemonManagerClass = require('../daemonManager');
var daemonManager = new daemonManagerClass();
var fs = require('fs');
var os = require('os');
var http = require('http');

var cbx = require('bitcoin');
var client = new cbx.Client({
    host: '127.0.0.1',
    port: daemonConfig.port,
    user: daemonConfig.user,
    pass: daemonConfig.password,
    timeout: 30000
});

router.get('/', function(req, res, next) {

    if(typeof req.session.userid === 'undefined' || req.session.userid  === null || req.session.userid <= 0){
        res.status(501);
        res.send("");
        return;
    }

    var response = {};
    response.status = "success";
    response.message = "";
    response.response = {};

    switch(req.query.command){
        case 'getinfo':
        case 'info':

            client.cmd('getinfo', function(err, rep, resHeaders) {
                if (err) {
                    response.status = "error";
                    response.message = err;
                    res.send(JSON.stringify(response));
                    return;
                }

                response.response = rep;
                response.response.rpiwallet = "v0.1";
                res.send(JSON.stringify(response));
                return;
            });
            break;
        case 'balance':
        case 'getbalance':

            client.getBalance('*', 6, function(err, balance, resHeaders) {
                if (err){
                    response.status = "error";
                    response.message = err;
                    res.send(JSON.stringify(response));
                    return;
                }
                response.response.balance = balance;

                res.send(JSON.stringify(response));
                return;
            });

            break;

        case 'sendto':
        case 'send':
        case 'sendtoaddress':

            client.cmd('sendtoaddress', req.query.address, req.query.amount, function(err, rep, resHeaders) {
                if (err) {
                    response.status = "error";
                    response.message = err;
                    res.send(JSON.stringify(response));
                    return;
                }

                if(rep.code != null && rep.code < 0){
                    response.status = "error";
                    response.message = rep.message;
                }
                else
                    response.message = "Your payment has been send successfully, TX ID: "+rep;
                response.response = rep;
                res.send(JSON.stringify(response));
                return;
            });
            break;

        case 'gettransactions':
        case 'transactions':
        case 'listtransactions':

            if(req.query.limit === 'undefined' || req.query.limit == null || req.query.limit < 0)
                req.query.limit = 20;

            client.cmd('listtransactions', "", req.query.limit, function(err, rep, resHeaders) {
                if (err) {
                    response.status = "error";
                    response.message = err;
                    res.send(JSON.stringify(response));
                    return;
                }

                response.response = rep;
                res.send(JSON.stringify(response));
                return;
            });

            break;

        case 'listaddresses':
        case 'addresses':
        case 'getaddresses':
        case 'getaddressesbyaccount':

            var account = "";

            /*if(typeof req.query.account !== 'undefined' || req.query.account  !== null)
                account = req.query.account;*/


            client.cmd('getaddressesbyaccount', account, function(err, rep, resHeaders) {
                if (err) {
                    response.status = "error";
                    response.message = err;
                    res.send(JSON.stringify(response));
                    return;
                }

                response.response = rep;
                res.send(JSON.stringify(response));
                return;
            });

            break;

        case 'getbackup':
        case 'backup':
            var path = daemonConfig.dataDir + "/wallet.dat";
            if(path[0] == "~")
                path = os.homedir() + path.substr(1);
            res.sendFile(path);
            break;

        case 'daemonstatus':
        case 'getdaemonstatus':
            response.status = 'success';
            response.response = daemonManager.getStatus();

            res.send(JSON.stringify(response));
            break;

        case 'totalblock':
        case 'gettotalblock':
            var options = {
                host: 'chainz.cryptoid.info',
                port: 80,
                path: '/cbx/api.dws?q=getblockcount'
            };

            http.get(options, function(resp){
                resp.on('data', function(chunk){
                    response.status = 'success';
                    response.response.totalBlock = chunk.toString();
                    res.send(JSON.stringify(response));
                });
            }).on("error", function(e){
                response.status = 'error';
                response.message = e.message;
                console.log("Got error: " + e.message);
                res.send(JSON.stringify(response));
            });
            break;

        case 'checkdaemonupdate':

            daemonManager.checkLastVersion(function(result){
                response.status = 'success';
                response.response = result;
                res.send(JSON.stringify(response));
            });

            break;

        case 'updatedaemon':
            daemonManager.updateAndCompile(function(){
                response.status = 'success';
                response.response = "";
                res.send(JSON.stringify(response));
            });
            break;

        case 'getaddressbook':
            response.status = 'success';
            response.response = require('../db/book.json');

            res.send(JSON.stringify(response));
            return;
            break;

        case 'delete':
        case 'deleteaddress':

            client.cmd('validateaddress', req.query.address, function(err, rep, resHeaders) {
                if (err) {
                    response.status = "error";
                    response.message = err;
                    res.send(JSON.stringify(response));
                    return;
                }

                if(!rep.isvalid){
                    response.status = "error";
                    response.message = "Invalid CBX Address";

                    res.send(JSON.stringify(response));
                    return;
                }else{
                    response.status = 'success';
                    var book = require('../db/book.json');
                    if(book[req.query.address] != null)
                        delete book[req.query.address];

                    fs.writeFile('../db/book.json', JSON.stringify(book), function (err) {
                        if (err) return console.log(err);
                    });
                }
            });


            break;

        case 'addaddresstobook':
        case 'addaddress':

            client.cmd('validateaddress', req.query.address, function(err, rep, resHeaders) {
                if (err) {
                    response.status = "error";
                    response.message = err;
                    res.send(JSON.stringify(response));
                    return;
                }

                if(!rep.isvalid){
                    response.status = "error";
                    response.message = "Invalid CBX Address";

                    res.send(JSON.stringify(response));
                    return;
                }else{
                    response.status = 'success';
                    var book = require('../db/book.json');
                    if(book[req.query.address] != null)
                        delete book[req.query.address];

                    book[req.query.address] = req.query.description == null ? "" : req.query.description;

                    fs.writeFile('../db/book.json', JSON.stringify(book), function (err) {
                        if (err) return console.log(err);
                    });
                }
            });

            break;

        case 'deleteaddress':
            response.status = 'success';
            var book = require('../db/book.json');
            if(book[req.query.address] != null)
                delete book[req.query.address];

            fs.writeFile('../db/book.json', JSON.stringify(book), function (err) {
                if (err) return console.log(err);
            });
            break;

        case 'generatenewaddress':
        case 'getnewaddress':
        case 'newaddress':
            client.cmd('getnewaddress', function(err, rep, resHeaders) {
                if (err) {
                    response.status = "error";
                    response.message = err;
                    res.send(JSON.stringify(response));
                    return;
                }

                response.response = rep;
                res.send(JSON.stringify(response));
                return;
            });
            break;

        case 'logout':
            req.session.userid = -1;
            response.status = 'success';
            res.send(JSON.stringify(response));
            break;

        default:
            response.status = "error";
            response.message = "Unknown command";

            res.send(JSON.stringify(response));
            return;
            break;

    }

});

module.exports = router;