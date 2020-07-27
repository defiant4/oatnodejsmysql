process.env['NODE_CONFIG_DIR'] ='/opt/nodejs_oatui/config';
const config=require("config");
var https = require("https");
var fs = require("fs");
var options = {  
    key: fs.readFileSync('../sso/vlgspe2020.key'),  
    cert: fs.readFileSync('../sso/vlgspe2020.crt')  
}; 
var app = require("./app");
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';			//to get rid of error-self signed certificate in certificate chain 
//Use system configuration for port or use 6001 by default.
//const port = process.env.port || 6001;
const port= config.get('app.port');
 
//Create server with exported express app
const server = https.createServer(options,app);
server.listen(port);
