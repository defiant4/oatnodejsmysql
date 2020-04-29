var express = require("express");
var bodyParser = require("body-parser");
var cors =  require("cors");
 
var dbManager = require("./api/db-interaction");
var flowManager = require("./api/flowable-interaction");
var statusManager = require("./domain/status-scheduler2");
//var builds = require("./api/builds");
 
const app = express();
 
//app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));


//CORS Middleware
app.use(function (req, res, next) {
    //Enabling CORS 
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, contentType,Content-Type, Accept, Authorization");
    next();
});
 
//app.use("/api",builds);
app.use("/api",dbManager);
app.use("/api",flowManager);
app.use("/api",statusManager);
 
//if we are here then the specified request is not found
app.use((req,res,next)=> {
    const err = new Error("Not Found");
    err.status = 404;
    next(err);
});
 
//all other requests are not implemented.
app.use((err,req, res, next) => {
   res.status(err.status || 501);
   res.json({
       error: {
           code: err.status || 501,
           message: err.message
       }
   });
});
 
module.exports = app;
