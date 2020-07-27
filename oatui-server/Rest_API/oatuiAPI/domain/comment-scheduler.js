var db = require("../db/database");
const commentCache = require("../domain/db-cache-class");  // key is the mpid
var express = require("express");
const commentScheduler = express.Router();
var cron = require('node-cron');
console.log("Initializing Comment scheduler");

var task;var taskflag=0;

commentScheduler.get("/start/commentScheduler/", async (req,res,next) =>{
	//cron task and status generator/child fork parent function every 10 seconds
	task = cron.schedule('*/5 * * * * *', async () =>  {		
		var storedBuildIdsInMasterTable = [];
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
						//storedBuildIdsInMasterTable.push(data1[k]["build_id"]);
						let currBuildId = data1[k]["build_id"];
						console.log("Running mpid found",JSON.stringify(data1[k]["build_id"]));
						// for running buildIds, we need to get comments from comments table and update comments' cache
						// what needs to be done ??
						let sqlComment= `SELECT * FROM <build comment table> WHERE build_id = '${currBuildId}'`;  // where build_id=ABCD
						db.query(sqlComment, (err, data)=> {
							if(!err){
								// put the db output data against the build_id as JSON in the cache
								commentCache.setCache(currBuildId,data);
							}
						});

					}
				}
			}

		});

	});
	task.start();
	taskflag=1;
	res.status(200).json({Result_API:"Success"});
});
//stop cron task
commentScheduler.get("/stop/commentScheduler", async (req,res,next) =>{
	if(taskflag==0)
	{ 
		res.status(200).json({"Result_API":"Failure -- No scheduler found running !!"});
		return;
	}
	task.stop();taskflag=0;
	//task.destroy();taskflag=0;
	res.status(200).json({"Result_API":"Success -- Scheduler stopped successfully !!"}); 
});
//storing whole array cache as per key "mpid"
commentScheduler.get("/getCommentCache/:build_id", (req,res,next) =>{

	// read from cache 
	let buildid = req.params.build_id;
	let statuscache=commentCache.getCache(buildid);
	if (statuscache) {
		console.log("Existing cache found for mpid:"+buildid);
		res.status(200).json({"Result_API":"Success", "Dataset": statuscache});
		return;
	}
	res.status(200).json({"Result_API":"Failure", "Dataset": {}});
});

module.exports = commentScheduler;
