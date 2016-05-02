/**
 * Created by msi on 20-04-16.
 */
var usersDb = require('../db/users.json');

module.exports = {
    checkLogin: function(username, password){
        if(usersDb[username] != null && usersDb[username].password == password)
            return usersDb[username].id;

        return -1;
    }
};