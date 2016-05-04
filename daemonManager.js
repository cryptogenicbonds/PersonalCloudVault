/**
 * Created by msi on 21-04-16.
 */
var fs = require('fs');
var ps = require('ps-node');
var daemonConfig = require('./configs/daemon.json');
var child_process = require('child_process');
var status = require('./db/status.json');
var os = require('os');

function checkCommand(command){
    var result = child_process.execSync("whereis "+command);

    return result.replace('command', '') != "";
}

function DaemonManager () {

}

DaemonManager.prototype.checkLastVersion = function(callback){
    child_process.exec("cd "+daemonConfig.bullionDir+" && git checkout master && git status", function (error, stdout, stderr) {

        var result = false;

        if(stdout != null && stdout.toString() != "" && stdout.toString().indexOf("branch is behind") < 0)
            result = true;

        if(stderr != null && stderr.toString() != "" && stderr.toString().indexOf("branch is behind") < 0)
            result = true;

        callback(result);

    });
}

DaemonManager.prototype.checkWalletLastVersionAndUpdate = function(callback){
    child_process.exec("cd "+daemonConfig.walletDirectory+" && git checkout master && git pull origin master", function (error, stdout, stderr) {

        var result = false;

        if(stdout != null && stdout.toString() != "" && stdout.toString().indexOf("branch is behind") < 0)
            result = true;

        if(stderr != null && stderr.toString() != "" && stderr.toString().indexOf("branch is behind") < 0)
            result = true;
        if(result){
            child_process.exec("service pcv restart", function (error, stdout, stderr) {
                callback(result);
            });
        }

    });
}

DaemonManager.prototype.updateAndCompile = function(callback){
    var clazz = this;

    this.checkSrcExists(function(){
        clazz.checkLastVersion(function(upToDate){
            if(!upToDate){
                clazz.updateDaemonStatus("update");
                callback(true);
                clazz.kill();
                child_process.exec("cd "+daemonConfig.bullionDir+" && git checkout master && git pull origin master && cd src/ && make -f makefile.pi "
                    +'BDB_INCLUDE_PATH="/usr/local/BerkeleyDB.4.8/include" '
                    +'BDB_LIB_PATH="/usr/local/BerkeleyDB.4.8/lib"', 
                    function (error, stdout, stderr) {
                    console.log(error);
                    console.log(stdout);
                    console.log(stderr);
                    clazz.checkAndLaunch();
                    setTimeout(function() {
                        clazz.updateDaemonStatus("ok");
                    }, 25000); // We just wait the daemon start before updating its status
                });
            }else
                callback(false);
        });
    });
}

DaemonManager.prototype.checkSrcExists = function(callback){
    try {
        var path = daemonConfig.bullionDir;
        if(path[0] == '~')
            path = os.homedir() + path.substr(1);
        stats = fs.lstatSync(path);

        if (!stats.isDirectory()) {
            child_process.exec("git clone https://github.com/cryptogenicbonds/CryptoBullion-CBX.git "+path, function (error, stdout, stderr) {
                console.log(error);
                console.log(stdout);
                console.log(stderr);

                callback();
            });
        }else
            callback();
    }
    catch (e) {

    }
}

DaemonManager.prototype.updateDaemonStatus = function(newStatus){
    status.daemon = newStatus;
    fs.writeFile('./db/status.json', JSON.stringify(status), function (err) {
        if (err) return console.log(err);
    });
}

DaemonManager.prototype.checkAndLaunch = function() {
    this.kill(); // Kill to be sure it's ok
    var tmp = this;
    setTimeout(function(){
        tmp.tryLaunch();
    }, 25000)

}

DaemonManager.prototype.tryLaunch = function() {
    child_process.exec(daemonConfig.bullionDir + "/src/cryptobulliond -daemon");
}

DaemonManager.prototype.kill = function() {
        var daemonConfig = require('./configs/daemon.json');
        var cbx = require('bitcoin');
        var client = new cbx.Client({
            host: '127.0.0.1',
            port: daemonConfig.port,
            user: daemonConfig.user,
            pass: daemonConfig.password,
            timeout: 30000
        });

        client.cmd('stop', function(err, rep, resHeaders) {
            if (err) {
                ps.lookup({
                    command: 'cryptobullion-s'
                }, function (err, resultList) {
                    if (err) {
                        throw new Error(err);
                    }

                    resultList.forEach(function (process) {
                        if (process) {
                            child_process.execSync("kill "+process.id);
                        }
                    });
                });
            }
        });
}

DaemonManager.prototype.getStatus = function(){
    return status;
}

module.exports = DaemonManager;