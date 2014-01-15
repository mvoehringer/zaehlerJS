Attention: ZählerJs is in alpha stage and not ready for production.

## Install on raspberryPI
### Install NodeJs
  * sudo aptitude install nodejs npm
  * wget http://nodejs.org/dist/v0.10.22/node-v0.10.22-linux-arm-pi.tar.gz
  * tar xvzf node-v0.10.22-linux-arm-pi.tar.gz
  * sudo cp -r node-v0.10.22-linux-arm-pi/* /opt/node
  * sudo nano /etc/profile 

```sh
NODE_JS_HOME="/opt/node"
PATH="$PATH:$NODE_JS_HOME/bin"
export PATH
```

http://blog.rueedlinger.ch/2013/03/raspberry-pi-and-nodejs-basic-setup/ for more infos

### Install MongoDB
see http://c-mobberley.com/wordpress/index.php/2013/10/14/raspberry-pi-mongodb-installation-the-working-guide/ for more infos how to install MongoDB on the RaspberryPI.


### Install ZählerJS
  * cd /opt/
  * git clone  https://github.com/mvoehringer/zaehlerjs
  * cd zaehlerjs
  * npm config set registry http://registry.npmjs.org/
  * npm install

####  On Raspberry PI /Debian
  * sudo cp -a debian/zaehlerjs.init.sh /etc/init.d/zaehlerjs
  * sudo chmod +x /etc/init.d/zaehlerjs
  * sudo mkdir /usr/local/var
  * sudo mkdir /usr/local/var/run
  * sudo update-rc.d zaehlerjs defaults
  * sudo chmod +x bin/run.sh

  * sudo iptables -A PREROUTING -t nat -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 3000 
    OR 
    authbind node myscript (see http://www.debian-administration.org/articles/386)


## Running unit test
http://www.heise.de/developer/artikel/Unit-Tests-mit-Node-js-1823265.html
```
npm test 
```
or 
``` 
mocha 
```


## TODOs
 * Tests für alles
 * Als Zähler anzeigen
 * Grafen mit Zomm-In/Zoom-Out 
