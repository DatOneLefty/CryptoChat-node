var fs = require("fs");
var NodeRSA = require('node-rsa');
var sha256 = require("sha256");


var logger = new Object();

logger.log = function(message) {
  console.log(message);
}

logger.log("\nDatOneLefty's CryptoChat (Proof of Concept) (c) 2018\n");

var readFrom = "nodes.json";

var configFile = "keys.json";


var port = 55555;

var nodes;
var STClients = []

var you;
var ac = 0;
var webport = 8080;
var local = false;
var RFNode = "nodes.json";
process.argv.forEach(function(arg) {
ac++;

if (arg == "-h" || arg == "--help") {
  console.log("help:");
  var helps = String(fs.readFileSync("help.txt"));
  console.log(helps);
  process.exit(0);
}


if (arg == "--from-globals" || arg == "-g") {
  globals = JSON.parse(fs.readFileSync(process.argv[ac]));
  configFile = globals.config
  nodes = JSON.parse(fs.readFileSync(globals.nodes));
  port = globals.port
  local = "none";

}

if (arg == "--web" || arg == "-w") {
  webport = process.argv[ac]
}


if (arg == "--config" || arg == "-c") {
  configFile = process.argv[ac];
}
if (arg == "--you" || arg == "-y") {
  you = process.argv[ac];
  local = "none"
}
  if(arg == "-n"  || arg == "--new") {
    logger.log("Generating new 1024 bit key");
    var key = new NodeRSA({b: 1024});
    var c = new Object();
    c.public = key.exportKey("public")
    c.private = key.exportKey("private")
    c.username = new Object()
    c.username.name = sha256(c.private);
    logger.log("Generated username: " + c.username.name);
    fs.writeFileSync(configFile, JSON.stringify(c));
    process.exit(0);
  }

  if (arg == "-x" || arg == "--node") {
    RFNode = process.argv[ac]
  }

  if (arg == "--force" || arg == "-f") {
    nodes.push(process.argv[ac]);
    console.warn("the system will save the entered node's NodeChain")
  }
  if (arg == "-p" || arg == "--port") {
  port = process.argv[ac];
  }
  if (arg == "-l" || arg == "--local") {
    console.log("Running locally...");
    local = true;
  }
});

if (local == false) {
  const publicIp = require('public-ip');
  publicIp.v4().then(ip => {
    you = "http://" + ip + ":" + port;
    console.log("you are known as " + you);

});
} else {
  if (local != "none") {
    const internalIp = require('internal-ip');
  you = "http://" + internalIp.v4.sync() + ":" + port;
  console.log("you are known as " + you);

}
}



if (nodes == null) {
  nodes = JSON.parse(fs.readFileSync(RFNode));
}

if (nodes.length == 0) {
  console.error("WARNING: you have no nodes in your nodes.json file, you will not have a node unless you add one or someone connects to you!");
}
var keys = JSON.parse(fs.readFileSync(configFile));



var key = new NodeRSA();
key.importKey(keys.public, 'public');
key.importKey(keys.private, "private");
logger.log("Signed in as " + keys.username.name);
logger.log("starting daemon...");


// init is complete, start running the service


var app = require('express')();
var http = require('http').Server(app);

app.get('/', function(req, res){
  res.send("");
});





var client = new Object();
var node = new Object();
client.prepare = function(message, channel) {
  var m = new Object();
  m.e = you;
  m.i = message;
  m.o = nodes;
  m.s = keys.username.name;
  m.p = keys.public;
  m.t = new Date();
  m.v = key.sign(message, "hex");
  m.n = channel;
  //key.verify(m.i+m.t, m.v, "utf8", "hex")
  return m;
} // A LITTLE IMPORTANT: key.verify(m.i+m.t, m.v, "utf8", "hex")


client.sendMessage = function(message, channel) {
  STClients.forEach(function(n) {
    var socket = require('socket.io-client')(n);
    socket.on('connect', function(){
      socket.on("passed", function(r) {
        logger.log("message passed successfully to " + n);
      })
      socket.emit("message", client.prepare(message, channel));
    });
});
}
client.getOtherNodes = function() {
  nodes.forEach(function(n) {
    var socket = require('socket.io-client')(n);
    socket.on('connect', function(){
      socket.on("otherNodes", function(r) {
        client.saveNodes(r);
      })
      socket.emit("getOtherNodes", {"f": keys.username.name});
    });
  });
}

client.saveNodes = function(node) {
  logger.log("adding " + node.length + " nodes");
  node.forEach(function(n) {
    nodes.push(n);
  });
  fs.writeFileSync(RFNode, JSON.stringify(node));
}


client.checkNode = function(n,s) {
  var socket = require('socket.io-client')(n);
  socket.on('connect', function(){
    socket.on("roundtrip", function(r) {
      if (STClients.indexOf(n) != 0) {
      STClients.push(n);
      if (s == false) {
      logger.log(n + " is online");
    }
      if (s == true) {
        console.log("new node found at " + n);
        client.saveNodes([n]);
      }
    }
    });
    socket.emit("roundtrip", you);
  });
}

client.checkForNodes = function() {
  a = 0;
  nodes.forEach(function(n) {
client.checkNode(n, false);
  });
}

client.passOnMessage = function(m) {
  var a = [];
  STClients.forEach(function(n) {
    if (m.o.indexOf(n) == -1 && n != m.e) {
      m.o.push(n);
      a.push(n)
    } else {

    }
  });
  client.passOn(m, a);
}


client.passOn = function(m, a) {
  a.forEach(function(n) {
    var socket = require('socket.io-client')(n);
    socket.on('connect', function(){
      socket.on("passed", function(r) {
      })
      socket.emit("message", m);
    });
  });
}








var io = require('socket.io')(http); // node-side daemon

io.on('connection', function(socket){


  socket.on("getOtherNodes", function(res) {
    socket.emit("otherNodes", nodes)
  });

  socket.on("roundtrip", function(res) {
    socket.emit("roundtrip", res);
    if (STClients.indexOf(res) == -1) {
    client.checkNode(res, true);
  }
  })

  socket.on("message", function(m) {
    var keyX = new NodeRSA();
    keyX.importKey(m.p, 'public');
    if(keyX.verify(m.i, m.v, "utf8", "hex")) {
      console.log(m.s + ": " + m.i);
      client.passOnMessage(m);
      iow.emit("newmessage", [m.n, m.s, m.i])
      socket.emit("passed", 0);
    } else {
      console.log("verification failed!");
    }
  });
});











// web server needs to be made for client work



var appw = require('express')();
var httpw = require('http').Server(appw);
var iow = require('socket.io')(httpw); // node-side daemon


var pass = "password123";
iow.on('connection', function(socket){

socket.on("ready", function(p) {
  if (p == pass) {
    socket.emit("info", you);
    socket.emit("clientsonline", STClients);
  } else {
    socket.emit("info", 0);
  }
})

socket.on("send", function(r) {
  if (r[0] == pass) {
    client.sendMessage(r[1], r[2]);
  }

});
});
var web = __dirname + "/html/"
appw.get('/', function(req, res){
  res.sendFile(web + "index.html");
});


httpw.listen(webport, function(){
  logger.log("Web GUI started on port " + webport);
});






// end of the line, ready to run

if (nodes.length < 2) {
  //client.getOtherNodes()
}
client.checkForNodes();

http.listen(port, function(){
  logger.log("daemon started on port " + port);
});
