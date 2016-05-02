var express = require('express');
var router = express.Router();
var user = require('../bin/user');

/* GET users listing. */
router.get('/', function(req, res, next) {

    res.render('login', { title: 'CBX-Pi Wallet: Login' });
});

router.post('/', function(req, res){
    var username = req.body.username;
    var password = req.body.password;

    var id = user.checkLogin(username, password);

    if(id < 0) {
        res.render('login', {title: 'CBX-Pi Wallet: Login'});
    }else {
        req.session.userid = id;
        res.redirect('/');
    }

});

module.exports = router;