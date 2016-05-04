nohup /usr/local/bin/node /home/pi/PersonalCloudVault/bin/www > /home/pi/pcv.log 2>&1&
echo $! > /home/pi/pcv.pid