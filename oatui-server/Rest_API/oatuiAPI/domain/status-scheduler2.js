var db = require("../db/database");
const child_process = require('child_process');
const dbCache = require("../domain/db-cache-class");
var express = require("express");
const routerScheduler = express.Router();
//var dataCache = require("../domain/db-cache-class"); //make a nodejs cache
var cron = require('node-cron');
console.log("Starting status generator");
//runScheduler();

//	  // what to do ??
//	  
//	  // update the cache
//	  // process the totalArr here .. & update the cache
//	  
//	  // never to exit from here..

// pull up a rest api for starting cron job
//
//

// pull up a rest for stopping cron job
//
//

// pull up a rest to fetch cache JSON runtime
//
//

//async function runScheduler() {
//	await periodicStatusGenerator();  // run the function here
	//console.log("Exiting status-scheduler parent process");
	//process.exit(); // Finally exit of parent process
//}


// cron task and status generator/child fork parent function
var task = cron.schedule('*/5 * * * * *', async () =>  {

let sqlQuery1 = `SELECT * FROM OATUI.OAT_UI_BUILD_STATUS`;
	db.query(sqlQuery1, (err, data)=> {
		if(!err){
			var storedBuildIdsInStatusTable = [];
			for (var i=0;i<data.length;i++)
			{
				storedBuildIdsInStatusTable.push(data[i]["build_id"]);
			}
			console.log("Stored builds in Status Table:" + JSON.stringify(storedBuildIdsInStatusTable));

			// Now check for running builds
			let sqlMaster = `SELECT * FROM OATUI.OAT_UI_BUILD_MASTER`;
			var cacheArray = [];
			var forkedInstancesArr = [];
			var totalArr = [];
			db.query(sqlMaster, (err1, data1)=> {
				if(!err1) {
					var childProcess;
					// we get the array 'data1'
					for (var k=0;k<data1.length;k++)
					{
						if (data1[k]["build_status"] == "running")
						{
							console.log("Running mpid found",JSON.stringify(data1[k]["build_status"]));
							let messageObj = {"mpid":data1[k]["mpid"], "build_id":data1[k]["build_id"], 
									"cache": cacheArray, "ifUpdate":"false"};
							if (storedBuildIdsInStatusTable.includes(data1[k]["build_id"]))
								messageObj = {"mpid":data1[k]["mpid"], "build_id":data1[k]["build_id"], 
									"cache": cacheArray, "ifUpdate":"true"};
							childProcess = child_process.fork("status-calculator-child.js", {cwd:"/opt/nodejs_oatui/oatuiAPI/domain/"});
							childProcess.send(messageObj);
							forkedInstancesArr.push(childProcess);
						}
					}
					// loop forked Array and listen on 'mesage' for all
					for (var p=0;p < forkedInstancesArr.length;p++)
					{
						var childRef = forkedInstancesArr[p];
						if (childRef) {
							childRef.on('message', (messageObject) => {
								//console.log("Message received from child index:" + p + " Data:"+ JSON.stringify(messageObject));
								totalArr.push(messageObject);
								//console.log("MPID Check:"+p);
								//dbCache.setCache(totalArr["mpid"],totalArr);
								//console.log("Total Array:"+ JSON.stringify(totalArr));
							})
							.on('close', function (code) {  
								console.log("Child process with index:" + p + " exited with code " + code);
								//process.exit(); //dont exit here
							});
						}
					}
					if (childProcess) {
						//childProcess.on('message', (messageObject) => {
						//	console.log("Message received from child:"+ JSON.stringify(messageObject));
						//})
						childProcess.on('close', function (code) {  
							console.log('last child process exited with code ' + code);
							//var cacheKeys = await dataCache.keys();
							//console.log('DB Cache as in parent:' + cacheArray);
							//console.log("Total Array:"+ JSON.stringify(totalArr));
							   console.log("DB cache updated");
							 //for (var i=0;i<totalArr.length;i++){		-----> for-loop required if we list of mpid keys instead of full array json
                                   dbCache.setCache("mpid",totalArr);
                                   //console.log("MPID Check:"+JSON.stringify(totalArr[i][0].mpid));}
							//process.exit(); //dont exit here
						});
					}
				}
			});    
		}
	});

});

//start cron task 
routerScheduler.get("/start/scheduler/", async (req,res,next) =>{

	task.start();
	res.status(200).json({Result:"Success"});

});

//stop cron task
routerScheduler.get("/stop/scheduler", async (req,res,next) =>{

	task.stop();
	res.status(200).json({Result:"Success"});

});

// storing whole array cache as per key "mpid"
routerScheduler.get("/getCache", (req,res,next) =>{
	let statuscache=dbCache.getCache("mpid");
	res.status(200).json({Result:"Success",
			      		  Dataset: statuscache});
	//console.log("CacheArray:"+ JSON.stringify(statuscache));

});

// to flush whole cache
routerScheduler.get("/flushCache", (req,res,next) =>{
        let statuscache=dbCache.flushCache();
        res.status(200).json({Result:"Success"});
        //console.log("CacheArray:"+ JSON.stringify(statuscache));

});

module.exports = routerScheduler;
