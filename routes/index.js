var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var daemonStatus = require('../db/status.json');

  if(daemonStatus.daemon == "update"){
    res.render('update', {title: 'CBX Pi is updating the daemon'});
  } else {
    if (typeof req.session.userid === 'undefined' || req.session.userid === null || req.session.userid <= 0) {
      res.render('login', {title: 'CBX Pi: Login'});
    } else {
      res.render('index', {title: 'CBX Pi Wallet'});
    }
  }
});

module.exports = router;
