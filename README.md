# CryptoChat (proof of concept)
Node.js P2P Chat with a web GUI


## Installation
1. Run the following commands to install
```
git clone https://github.com/DatOneLefty/CryptoChat-node
cd CryptoChat-node
sudo apt install nodejs npm
./install-deps.sh
```
2. to create an ID, run:
```
node app.js -n
```
This command will generate your username and your public and private keys

3. To connect to the network, you will need a node to connect to. Whoever told you about this program, ask them for their ip and port they are running on
*if you dont know what node to connect to, a list of nodes will be added to this repo soon*

4. to add a node, create a file called `nodes.json` and put `["http://their ip:port"]` in the file

## Running the program
1. make sure you have created an ID and your keys shown above
2. make sure you have at least one node in your `nodes.json` file
3. if you want to connect to a global network, you need to open the port for the server on your router, the default is `55555`
3. run `node app.js` to start the app, the listener, and the web ui
*if you are running a local node for a local network, run with the `-l` option*
4. To access the web gui, go to `http://localhost:8080`

## TODO
- [ ] anti-spam
- [ ] better web UI
- [ ] web ui password
- [ ] encryption
- [ ] usernames without allowing people to act as others
- [ ] better way of saving nodes
- [ ] node list
- [ ] maximum message content
- [ ] DMs
- [ ] a way to pass more than just strings to allow for more options

## Credit
DatOneLefty
Bitcoin: `3JSDL3ZNnkA2kUXb29mtQvHNJb87mkTmyC`
Discord: `MozzarellaFlameDoggo#8302`
