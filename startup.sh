/bin/su -c "nohup /usr/local/bin/node /home/pi/PersonalCloudVault/bin/www > /home/pi/pcv.log 2>&1&" -s /bin/sh pi
/bin/su -c "echo $! > /home/pi/pcv.pid" -s /bin/sh pi
