var https = require("https");
var fs = require("fs");
var options = {  
    key: fs.readFileSync('../sso/vlgspe7471.key'),  
    cert: fs.readFileSync('../sso/vlgspe7471.crt')  
}; 
var app = require("./app");
 
//Use system configuration for port or use 6001 by default.
const port = process.env.port || 6001;
 
//Create server with exported express app
const server = https.createServer(options,app);
server.listen(port);
