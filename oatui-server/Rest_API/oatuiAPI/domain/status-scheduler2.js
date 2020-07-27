var db = require("../db/database");
const child_process = require('child_process');
const buildStatusCache = require("../domain/db-cache-class");  // key is the mpid
var express = require("express");
const routerScheduler = express.Router();
var cron = require('node-cron');
console.log("Initializing status scheduler");

var task;var taskflag=0;
//add one more scheduler taskA which updates OAT status table" from the 'buildStatusCache'
//
//

routerScheduler.get("/start/statusScheduler/", async (req,res,next) =>{
	//	cron task and status generator/child fork parent function every 10 seconds
	task = cron.schedule('*/20 * * * * *', async () =>  {
		
		var storedBuildIdsInStatusTable = [];
		//let sqlQuery1 = `SELECT * FROM OATUI.OAT_UI_BUILD_STATUS`;
		/*db.query(sqlQuery1, (err, data)=> {
			if(!err){
				
				for (var i=0;i<data.length;i++)
				{
					storedBuildIdsInStatusTable.push(data[i]["build_id"]);
				}
				console.log("Stored builds in Status Table:" + JSON.stringify(storedBuildIdsInStatusTable));
			}*/
		
			// Now check for running builds
			let sqlMaster = `SELECT * FROM <build master table>`;
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
									"ifUpdate":"false"};
							if (storedBuildIdsInStatusTable.includes(data1[k]["build_id"]))
								messageObj = {"mpid":data1[k]["mpid"], "build_id":data1[k]["build_id"], 
									"ifUpdate":"true"};
							childProcess = child_process.fork("status-calculator-child.js", {cwd:"/opt/nodejs_oatui/oatuiAPI/domain/"});
							childProcess.send(messageObj);
							forkedInstancesArr.push(childProcess);
						}
					}
					// loop forked Array and listen on 'message' for all
					for (var p=0;p < forkedInstancesArr.length;p++)
					{
						var childRef = forkedInstancesArr[p];
						if (childRef) {
							childRef.on('message', (childMessageObject) => {
								//console.log("Message received from child index:" + p + " Data:"+ JSON.stringify(childMessageObject));
								if (("mpid" in childMessageObject) && ("buildJSON" in childMessageObject))
								{
									buildStatusCache.setCache(childMessageObject["mpid"],childMessageObject["buildJSON"]);
									console.log("Status cache updated for build_id:" +childMessageObject["build_id"] + 
										" Flowable calls:"+ childMessageObject["buildJSON"]["Master_Info"]["FlowableCallsCount"]);
								}
							})
							.on('close', function (code) {  
								console.log("Child process with index:" + p + " exited with code " + code);
							});
						}
					}
					if (childProcess) {
						childProcess.on('close', function (code) {  
							console.log('Last child process exited with code ' + code);
							console.log("Status Cache Updated");
						});
					}
				}
			}); 
	
	});
	task.start();
	taskflag=1;
	res.status(200).json({Result_API:"Success"});
});
//stop cron task
routerScheduler.get("/stop/scheduler", async (req,res,next) =>{
	if(taskflag==0)
	{ 
		res.status(200).json({"Result_API":"Failure -- No scheduler found running !!"});
		return;
	}
	//task.stop();taskflag=0;
	task.destroy();taskflag=0;
	res.status(200).json({"Result_API":"Success -- Scheduler stopped successfully !!"});
});
//storing whole array cache as per key "mpid"
routerScheduler.get("/getStatusCache/:mpid", (req,res,next) =>{
	let mlevelid = req.params.mpid;
	let statuscache=buildStatusCache.getCache(mlevelid);
	if (statuscache) {
		console.log("Existing cache found for mpid:"+mlevelid);
		res.status(200).json({"Result_API":"Success", "Dataset": statuscache});
		return;
	}
	res.status(200).json({"Result_API":"Failure", "Dataset": {}});
});

//to flush whole cache
routerScheduler.get("/flushStatusCache", (req,res,next) =>{
	let statuscache=buildStatusCache.flushCache();
	res.status(200).json({"Result_API":"Success"});
});

module.exports = routerScheduler;
