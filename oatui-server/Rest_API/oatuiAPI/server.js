var https = require("https");
var fs = require("fs");
var options = {  
    key: fs.readFileSync('<server key>'),  
    cert: fs.readFileSync('<server certificate>')  
}; 
var app = require("./app");
 
//Use system configuration for port or use 6001 by default.
const port = process.env.port || 6001;
 
//Create server with exported express app
const server = https.createServer(options,app);
server.listen(port);
