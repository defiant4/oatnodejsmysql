var express = require("express");
var db = require("../db/database");
var {BuildMaster,BuildActivity,BuildStatus,BuildComment} =require("../domain/build");
var BuildStatusJson =require("../domain/statuscalculator");
var axios = require('axios');
const router = express.Router();
const numCPUs = require('os').cpus().length;
const child_process = require('child_process');  

//handles url http://localhost:6001/builds
router.get("/get/buildmaster", (req, res, next) => {

	db.query(BuildMaster.getAllBuildSQL(), (err, data)=> {
		if(!err) {
			res.status(200).json({
				Result:"Success",
				"Record Count": data.length,
				Dataset:data
			});
		}
	});    
});

//handles POST for BuildMaster table
router.post("/post/buildmaster", (req, res, next) => {

	//read build information from request
	let build = new BuildMaster(req.body.build_id, req.body.ECS_key, req.body.SID, req.body.build_status,req.body.mpid);
	db.query(build.getAddBuildSQL(), (err, data)=> {

		if(!err){ 
			res.status(200).json({
				Result: "Success"
			});
		}
		else {
			res.status(200).json({
				Result:"Failure",
				error_message: err.sqlMessage
			});
		}
	});
});

//handles GET for BuildMaster table
router.get("/get/buildmaster/:build_id", (req, res, next) => {
	let eid = req.params.build_id;

	db.query(BuildMaster.getBuildByIdSQL(eid), (err, data)=> {
		if(!err) {
			if(data && data.length > 0) {

				res.status(200).json({
					Result:"Success",
					"Record Count": data.length,
					Dataset: data
				});
			} else {
				res.status(200).json({
					Result:"Failure"
				});
			}
		} 
	});    
});
/* 
//handles url http://localhost:6001/builds/delete
router.post("/delete/buildmaster", (req, res, next) => {

    var bid = req.body.build_id;

    db.query(BuildMaster.deleteBuildByIdSQL(bid), (err, data)=> {
        if(!err) {
            if(data && data.affectedRows > 0) {
                res.status(200).json({
                    message:`Build deleted with build_id = ${build_id}.`,
                    affectedRows: data.affectedRows
                });
            } else {
                res.status(200).json({
                    message:"Build Not found."
                });
            }
        } 
    });   
});
 */

//update buildMaster table 
router.put('/put/buildmaster/:build_id',(req, res, next) => {
	let bid = req.params.build_id;
	let eid = req.body.ECS_key;
	let sid = req.body.SID;
	let bs = req.body.build_status;
	let mid=req.body.mpid;

	db.query(BuildMaster.updateBuildByIdSQL(bid,eid,sid,bs,mid), (err, data)=>{
		if(!err) {
			res.status(200).json({
				Result:"Success",	
				Dataset: data
			});
		} else {
			res.status(200).json({
				Result: "Failure",
				error_message: err.sqlMessage
			});

		}
	});
});


//handles url http://localhost:6001/builds
router.get("/get/buildactivity", (req, res, next) => {

	db.query(BuildActivity.getAllBuildSQL(), (err, data)=> {
		if(!err) {
			res.status(200).json({
				Result:"Success",
				"Record Count": data.length,
				Dataset:data
			});
		}
	});
});

//handles POST (insert) for buildctivity table
router.post("/post/buildactivity", (req, res, next) => {

	//read build information from request
	let build = new BuildActivity(req.body.build_id,req.body.Activity,req.body.Step,req.body.Phase,req.body.Subphase,req.body.Scenario,req.body.Timestamp_CET,req.body.Result,req.body.processInstanceId,req.body.processDefName,req.body.processStartTime,req.body.UserId,req.body.UserFullName);
	db.query(build.getAddBuildSQL(), (err, data)=> {
		if(!err){
			res.status(200).json({
				Result: "Success"
			});
		}
		else {
			res.status(200).json({
				Result:"Failure",
				error_message: err.sqlMessage 
			});
		}
	});
});

//handles url http://localhost:6001/builds/1001
router.get("/get/buildactivity/:build_id", (req, res, next) => {
	let bid = req.params.build_id;

	db.query(BuildActivity.getBuildByIdSQL(bid), (err, data)=> {
		if(!err) {
			if(data && data.length > 0) {

				res.status(200).json({
					Result:"Success",
					"Record Count": data.length,
					Dataset: data
				});
			} else {
				res.status(200).json({
					Result:"Failure"
				});
			}
		}
	});
});

//update buildactivity table
//build_id,Activity,Step,Phase,Subphase,Scenario,Timestamp_CET,Result,processInstanceId,processDefName,processStartTime,UserId,UserFullName
router.put('/put/buildactivity/:id',(req, res, next) => {
	let id = req.params.id;
	let bid = req.body.build_id;
	let au = req.body.Activity;
	let step = req.body.Step;
	let phase = req.body.Phase;
	let sp = req.body.Subphase;
	let sc = req.body.Scenario;
	let ts = req.body.Timestamp_CET;
	let ar = req.body.Result;
	let pII = req.body.build_processInstanceId;
	let pDN = req.body.processDefName;
	let pST = req.body.build_processStartTime;
	let buid = req.body.UserId;
	let bun= req.body.UserFullName;

	db.query(BuildActivity.updateBuildByIdSQL(id,bid,au,step,phase,sp,sc,ts,ar,pII,pDN,pST,bsi,buid,bun), (err, data)=>{
		if(!err) {
			res.status(200).json({
				Result:"Success",
				Dataset: data
			});
		} else {
			res.status(200).json({
				Result: "Failure",
				error_message: err.sqlMessage
			});
		}
	});
});


//handles url http://localhost:6001/builds
router.get("/get/buildstatus", (req, res, next) => {

	db.query(BuildStatus.getAllBuildSQL(), (err, data)=> {
		if(!err) {
			res.status(200).json({
				Result:"Success",
				"Record Count": data.length,
				Dataset:data
			});
		}
	});
});

//handles url http://localhost:6001/builds/add
//build_id,status_JSON,Timestamp_CET
router.post("/post/buildstatus", (req, res, next) => {

	//read build information from request
	let build = new BuildStatus(req.body.build_id,req.body.status_JSON, req.body.Timestamp_CET);
	db.query(build.getAddBuildSQL(), (err, data)=> {
		if(!err){
			res.status(200).json({
				Result: "Success"
			});
		}
		else {
			res.status(200).json({
				Result:"Failure",
				error_message: err.sqlMessage 
			});
		}
	});
});

//get BuildStatus by build_id
router.get("/get/buildstatus/:build_id", (req, res, next) => {
	let bid = req.params.build_id;

	db.query(BuildStatus.getBuildByIdSQL(bid), (err, data)=> {
		if(!err) {
			if(data && data.length > 0) {

				res.status(200).json({
					Result:"Success",
					"Record Count": data.length,
					Dataset: data
				});
			} else {
				res.status(200).json({
					Result:"Failure"
				});
			}
		}
	});
});
//update buildStatus
router.put('/put/buildstatus/:id',(req, res, next) => {
	let id = req.params.id;
	let bid = req.body.build_id;
	let st = req.body.status_JSON;
	let lu = req.body.Timestamp_CET;
	db.query(BuildStatus.updateBuildByIdSQL(id,bid,st,lu), (err, data)=>{
		if(!err) {
			res.status(200).json({
				Result:"Success",
				Dataset: data
			});
		} else {
			res.status(200).json({
				Result: "Failure",
				error_message: err.sqlMessage
			});

		}
	});
});

//handles get all for buildComment table
router.get("/get/buildcomment", (req, res, next) => {

	db.query(BuildComment.getAllBuildSQL(), (err, data)=> {
		if(!err) {
			res.status(200).json({
				Result:"Success",
				"Record Count": data.length,
				Dataset:data
			});
		}
	});
});

//handles post for buildComment table
//build_id,Comment,Step,Phase,Subphase,Scenario,processDefName,Timestamp_CET,UserId,UserFullName
router.post("/post/buildcomment", (req, res, next) => {

	//read build information from request
	let build = new BuildComment(req.body.build_id,req.body.Comment,req.body.Step,req.body.Phase,req.body.Subphase,req.body.Scenario,req.body.processInstanceId,req.body.Timestamp_CET,req.body.UserId,req.body.UserFullName);
	db.query(build.getAddBuildSQL(), (err, data)=> {
		if(!err){
			res.status(200).json({
				Result: "Success"
			});
		}
		else {
			res.status(200).json({
				Result:"Failure",
				error_message: err.sqlMessage 
			});
		}
	});
});

//get BuildComment by build_id
router.get("/get/buildcomment/:build_id", (req, res, next) => {
	let bid = req.params.build_id;

	db.query(BuildComment.getBuildByIdSQL(bid), (err, data)=> {
		if(!err) {
			if(data && data.length > 0) {

				res.status(200).json({
					Result:"Success",
					"Record Count": data.length,
					Dataset: data
				});
			} else {
				res.status(200).json({
					Result:"Failure"
				});
			}
		}
	});
});
//get BuildComment by build_id + ProcessDefName
router.get("/get/buildcomment/:build_id/:processInstanceId", (req, res, next) => {
	let bid = req.params.build_id;
	let pdid = req.params.processInstanceId;
	db.query(BuildComment.getBy_BuildId_instIdSQL(bid,pdid), (err, data)=> {
		if(!err) {
			if(data && data.length > 0) {
				res.status(200).json({
					Result:"Success",
					"Record Count": data.length,
					Dataset: data
				});
			} else {
				res.status(200).json({
					Result:"Failure"
				});
			}
		}
	});
});

//handle PUT for buildComment -- Update statement
//build_id,Comment,Step,Phase,Subphase,Scenario,processDefName,Timestamp_CET,UserId,UserFullName
router.put('/put/buildcomment/:id',(req, res, next) => {
	let id = req.params.id;
	let bid = req.body.build_id;
	let comm= req.body.Comment;
	let step= req.body.Step;
	let ph= req.body.Phase;
	let sph= req.body.Subphase;
	let scn= req.body.Scenario;
	let pdid= req.body.processInstanceId;
	let tcet= req.body.Timestamp_CET;
	let uid= req.body.UserId;
	let ufn = req.body.UserFullName;

	db.query(BuildComment.updateBuildByIdSQL(id,bid,comm,step,ph,sph,scn,pdid,tcet,uid,ufn), (err, data)=>{
		if(!err) {
			res.status(200).json({
				Result:"Success",
				Dataset: data
			});
		} else {
			res.status(200).json({
				Result: "Failure",
				error_message: err.sqlMessage
			});

		}
	});
});

//get Build Status JSON by master build_id
router.get("/get/buildStatusJson/:wpid", (req, res, next) => {
	let wid = new BuildStatusJson(req.params.wpid);
	wid.outputjson(res);
});

//start a Build process from scratch
router.get("/startBuild/:proDefName/:ecs_key", (req, res, next) => {
	let procDefKey = req.params.proDefName;
	let ecsKey = req.params.ecs_key;
	var ret = {};
	var flow_username = "flowable";  var flow_password = "flowable";
	var proStartURL = "https://dlmoattst.wdf.sap.corp/flowable-task/process-api/runtime/process-instances/";
	var startPostData ={ "processDefinitionKey":procDefKey,
			"businessKey": ecsKey,
			"startFormVariables":[	
				{
					"id": "ECS_KEY",
					"name": "ECS_KEY",
					"type":"string",
					"value": ecsKey  //"005056A508801ED9B8EC4AEE3BD717AD"
				}
				]};
	//Axios post call
	return axios.post(proStartURL, startPostData,{ auth: {username: flow_username , password: flow_password}})
	.then(function (response) {
		ret=response.data;
		ret["Result_API"] = "Success";
		res.status(200).json(ret);
	})
	.catch(function (error) {
		ret["data"] = error.message;
		ret["Result_API"] = "Failure";
		res.status(200).json(ret);
	});
	//}
});
//cancel(stop) a parent process -- particularly W* or M* process
router.get("/cancelParentProcess/:procInstanceId", (req, res, next) => {

	let proInstanceId = req.params.procInstanceId;
	var ret = {};
	var flow_username = "flowable";  var flow_password = "flowable";
	var proDeleteURL = "https://dlmoattst.wdf.sap.corp/flowable-task/process-api/runtime/process-instances/" + proInstanceId;

	// Axios delete call
	return axios.delete(proDeleteURL,{ auth: {username: flow_username , password: flow_password}})
	.then(function (response) {
		//ret=response.data; // returns nothing for delete
		ret["Result_API"] = "Success";
		res.status(200).json(ret);
	})
	.catch(function (error) {
		ret["Result_API"] = "Failure";
		res.status(200).json(ret);
	});
});
router.get("/suspendParentProcess/:procInstanceId", (req, res, next) => {
	// suspend a process
	let proInstanceId = req.params.procInstanceId;
	var ret = {};
	var flow_username = "flowable";  var flow_password = "flowable";
	var proSuspendURL = "https://dlmoattst.wdf.sap.corp/flowable-task/process-api/runtime/process-instances/" + proInstanceId;
	var taskPutData = {"action":"suspend"};
	// Axios put call
	return axios.put(proSuspendURL,taskPutData, { auth: {username: flow_username , password: flow_password}})
	.then(function (response) {
		//ret=response.data; // returns nothing for delete
		ret["Result_API"] = "Success";
		res.status(200).json(ret);
	})
	.catch(function (error) {
		ret["Result_API"] = "Failure";
		res.status(200).json(ret);
	});
});
router.get("/reactivateParentProcess/:procInstanceId", (req, res, next) => {
	// resume a suspended process
	let proInstanceId = req.params.procInstanceId;
	var ret = {};
	var flow_username = "flowable";  var flow_password = "flowable";
	var proActivateURL = "https://dlmoattst.wdf.sap.corp/flowable-task/process-api/runtime/process-instances/" + proInstanceId;
	var taskPutData = {"action":"activate"};
	// Axios put call
	return axios.put(proSuspendURL,taskPutData, { auth: {username: flow_username , password: flow_password}})
	.then(function (response) {
		//ret=response.data; // returns nothing for delete
		ret["Result_API"] = "Success";
		res.status(200).json(ret);
	})
	.catch(function (error) {
		ret["Result_API"] = "Failure";
		res.status(200).json(ret);
	});
});

//start a task form for manual intervention
//inputs would be C_MANUAL_INTERVENTION instanceID and 0/1 option for task form
router.get("/beginTaskForm/:procInstanceId/:option?", (req, res, next) => {
	let proInstanceId = req.params.procInstanceId;
	var taskOption = req.params.option;
	var possibleOptions = ["0","1"];
	if (taskOption == undefined || !possibleOptions.includes(taskOption))
		taskOption = "0"; // initialize if not sent
	var ret = {};
	var flow_username = "flowable";  var flow_password = "flowable";
	var runtimeTaskURL = "https://dlmoattst.wdf.sap.corp/flowable-task/process-api/runtime/tasks?processInstanceId=" + proInstanceId;
	// first call C step instance and get Task id 
	return axios.get(runtimeTaskURL,{ auth: {username: flow_username , password: flow_password} 
	})
	.then(function(response){
		ret=response.data.data[0];
		let taskInstanceId = ret.id; // id should be the task id
		let taskPostURL = "https://dlmoattst.wdf.sap.corp/flowable-task/process-api/form/form-data";
		var flow_username1 = "flowable";  var flow_password1 = "flowable";
		var taskPostData = {
				"taskId" : taskInstanceId,
				"properties" : [
					{
						"id": "manual_action",
						"name": "What you want to do next ????      0--> Completed Manual or Skipped   // .   1 -->  Root Cause Eliminated",
						"type": "radio-buttons",
						"value": taskOption 
					}
					] 
		};
		callbackTaskForm(taskPostURL,taskPostData);
	})
	.catch(function(error){
		ret["data"] = error.message;
		ret["Result_API"] = "Failure1";
		res.status(200).json(ret);
	});

	function callbackTaskForm(taskPostURL,taskPostData){
		var ret1 ={};
		// now call task POST api and pass boolean 0 or 1
		return axios.post(taskPostURL, taskPostData,{ auth: {username: flow_username, password: flow_password}})
		.then(function (response1) {
			ret1["data"]=response1.data;
			ret1["Result_API"] = "Success";
			res.status(200).json(ret1);
		}) 
		.catch(function(error1){
			ret1["data"] = error1.message;
			ret1["Result_API"] = "Failure2";
			res.status(200).json(ret1);
		});
	}
});

router.get("/test", (req, res, next) => {
	var m=["038e6f09-6ff8-11ea-8b3e-42010aeec524","34bb4943-6f99-11ea-8852-42010aeec524","4b850c74-6ff6-11ea-8b3e-42010aeec524"];
	for (var i=0;i<3;i++)
	{
		var child = child_process.fork("/opt/nodejs_oatui/oatuiAPI/api/status-calculator-child.js");
		child.send(m[i]);
	}
	child.on('close', function (code) {  
		console.log('child process exited with code ' + code);  
	});  
});

module.exports = router;
