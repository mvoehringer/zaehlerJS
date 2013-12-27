
## Install on raspberryPI

  * Install raspberry Debian
 ### Install RaspberryPI 
http://blog.rueedlinger.ch/2013/03/raspberry-pi-and-nodejs-basic-setup/ for more infos
  * sudo aptitude install nodejs npm
  * wget http://nodejs.org/dist/v0.10.22/node-v0.10.22-linux-arm-pi.tar.gz
  * tar xvzf node-v0.10.22-linux-arm-pi.tar.gz
  * sudo cp -r node-v0.10.22-linux-arm-pi/* /opt/node
  * sudo nano /etc/profile 
...
NODE_JS_HOME="/opt/node"
PATH="$PATH:$NODE_JS_HOME/bin"
export PATH
...


### Install MongoDB on pi 
see http://c-mobberley.com/wordpress/index.php/2013/10/14/raspberry-pi-mongodb-installation-the-working-guide/ for more infos about mongoDB on the R
  aspberryPi

 * sudo apt-get install build-essential libboost-filesystem-dev libboost-program-options-dev libboost-system-dev libboost-thread-dev scons libboost-all-dev python-pymongo git
 * cd ~
 * git clone https://github.com/skrabban/mongo-nonx86
 * cd mongo-nonx86
 
 * sudo scons
 * sudo scons --prefix=/opt/mongo install
 * sudo adduser --firstuid 100 --ingroup nogroup --shell /etc/false --disabled-password --gecos "" --no-create-home mongodb
 * sudo mkdir /var/log/mongodb/
 * sudo chown mongodb:nogroup /var/log/mongodb/
 * sudo mkdir /var/lib/mongodb
 * sudo cp debian/init.d /etc/init.d/mongod
 * sudo cp debian/mongodb.conf /etc/
 * sudo ln -s /opt/mongo/bin/mongod /usr/bin/mongod
 * sudo chmod u+x /etc/init.d/mongod
 * sudo update-rc.d mongod defaults

 * sudo /etc/init.d/mongod start


 ### Install ZählerJS
  * git clone  https://github.com/mvoehringer/zaehlerjs
  * cd zaehlerjs
  * npm config set registry http://registry.npmjs.org/
  * npm install
  * npm update

  * sudo iptables -A PREROUTING -t nat -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 3000
