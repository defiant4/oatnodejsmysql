var db = require("../db/database");
const child_process = require('child_process');
var NodeCache = require("node-cache");
//var dataCache = require("../domain/db-cache-class"); //make a nodejs cache
var dataCache = new NodeCache({ stdTTL: 0, checkperiod: 0});

console.log("Starting status generator");
runScheduler();

async function runScheduler() {
	await periodicStatusGenerator();  // run the function here
	//console.log("Exiting status-scheduler parent process");
	//process.exit(); // Finally exit of parent process
}

async function periodicStatusGenerator() {
	// with db.query find out all master pids like below
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
								console.log("Message received from child index:" + p + " Data:"+ JSON.stringify(messageObject));
								totalArr.push(messageObject);
//								console.log("Total Array:"+ JSON.stringify(totalArr));
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
							console.log("Total Array:"+ JSON.stringify(totalArr));
							process.exit(); //dont exit here
						});
					}
				}
			});    
		}
	});
}

module.exports = periodicStatusGenerator;
