var express = require("express");
const config = require('config');  // config module
var axios = require('axios');   // axios module
var BuildStatusJson =require("../domain/statuscalculator");
var BuildStatusJson2 =require("../domain/statuscalculator2");
var AnyLevelStatusJson =require("../domain/stepcalculator");
var db = require("../db/database");
const routerFlowable = express.Router();
const oatHost = config.get('deploy.host');  
const flow_username = config.get('flowable.username');  const flow_password = config.get('flowable.password'); // should come from config module

//get Build Status JSON by master pid
routerFlowable.get("/get/buildStatusJson/:mpid", async (req, res, next) => {
	let mid = new BuildStatusJson(req.params.mpid);
	let statusJSON = await mid.outputjson();
	res.status(200).json(statusJSON);
});

//get Build Status JSON by master pid
routerFlowable.get("/get/buildStatusJson2/:mpid", async (req, res, next) => {
	let mid = new BuildStatusJson2(req.params.mpid);
	let statusJSON = await mid.outputjson();
	res.status(200).json(statusJSON);
});

//get Build Status JSON by master pid
routerFlowable.get("/get/levelStatusJson/:pid/:level", async (req, res, next) => {
	// level is acronymn like C for C step, S for Scenario step, P for Process step
	let stepStatusGenerator = new AnyLevelStatusJson(req.params.pid,req.params.level);
	let levelJSON = await stepStatusGenerator.outputjson();
	res.status(200).json(levelJSON);
});

//get Build Status JSON by master build_id
routerFlowable.get("/get/buildJsonStatus/:buildId", async (req, res, next) => {
	let buildID = req.params.buildId;
	let sqlQry1 = `SELECT * FROM <build status table> WHERE build_id = '${buildID}'`;
	db.query(sqlQry1, (err, data)=> {
		if(!err){
			console.log("Data:" + data);
			if (data.length == 1)
			{
				var dataJson = data[0];
				dataJson["Result_API"] = "Success";
				res.status(200).json(dataJson.status_JSON); 
			}
		}
	});
	res.status(200).json({"Result_API" : "Failure"});
});

//start a Build process from scratch
routerFlowable.get("/startBuild/:proDefName/:ecs_key/:SID", (req, res, next) => {
	let procDefKey = req.params.proDefName;
	let ecsKey = "" + req.params.ecs_key;

	let sid = req.params.SID;
	let busKey = sid+"_" + ecsKey;
	var ret = {};
	var proStartURL = oatHost + "/flowable-task/process-api/runtime/process-instances/";
	var startPostData ={ "processDefinitionKey":procDefKey,
			"businessKey": busKey,
			"startFormVariables":[	
				{
					"id": "ECS_KEY",
					"name": "ECS_KEY",
					"type":"string",
					"value": ecsKey  
				}
				]};
	if (ecsKey == "null")
	{
		startPostData ={ "processDefinitionKey":procDefKey,
				"businessKey": busKey,
		};
	}

	//Axios post call
	return axios.post(proStartURL, startPostData,{ auth: {username: flow_username , password: flow_password}})
	.then(function (response) {
		ret=response.data;
		ret["Result_API"] = "Success";
		res.status(200).json(ret);
	})
	.catch(function (error) {
		ret["error_message"] = error.message;
		ret["Result_API"] = "Failure";
		res.status(200).json(ret);
	});
	//}
});

//start a C-step process -- scratch case -- start form data comes as POST Json object
routerFlowable.post("/startCModel", (req, res, next) => {
	//let procDefKey = req.params.proDefName;
	let startPostData = {}; 
	if (req.body)
		startPostData = req.body; // json object to be posted in call
	let proStartURL = oatHost + "/flowable-task/process-api/runtime/process-instances";
	return axios.post(proStartURL, startPostData,{ auth: {username: flow_username , password: flow_password}})
	.then(function (response) {
		let ret=response.data;
		ret["Result_API"] = "Success";
		res.status(200).json(ret);
	})
	.catch(function (error) {
		let ret = {};
		ret["error_message"] = error.message;
		ret["Result_API"] = "Failure";
		res.status(200).json(ret);
	});
});

//update C-step manual intervention value
routerFlowable.get("/handleManualIntervention/:proInstanceId/:manual_intervention", (req, res, next) => {
	//merge pieces and handle 3 options -- use cases
	let procInstanceId =req.params.proInstanceId;
	let mi="" + req.params.manual_intervention;
	//if (mi.trim() != "Repeat after eliminating root cause"){
		let ret = {};
		let proStartURL2 = oatHost + "/flowable-task/process-api/runtime/process-instances/"+ procInstanceId + "/variables";
		let manualPutData =[
			{
				"name": "manualIntervention",
				"type": "string",
				"value": mi
			}
			];

		//Axios put call for updating variable value first
		return axios.put(proStartURL2, manualPutData,{ auth: {username: flow_username , password: flow_password}})
		.then(function (response) {
			var proStartURL1 = oatHost + "/flowable-task/process-api/runtime/tasks?processInstanceId="+ procInstanceId;
			//Axios post call
			return axios.get(proStartURL1,{ auth: {username: flow_username , password: flow_password}})
			.then(function (response) {
				var taskId=response.data.data[0].id;
				var ret = {};
				var proStartURL = oatHost + "/flowable-task/process-api/runtime/tasks/"+ taskId;
				var completePostData ={"action" : "complete"};

				//Axios post call
				return axios.post(proStartURL, completePostData,{ auth: {username: flow_username , password: flow_password}})
				.then(function (response) {
					//ret=response.data;
					ret["Result_API"] = "Success";
					res.status(200).json(ret);
				})
				.catch(function (error) {
					ret["error_message"] = error.message;
					ret["Result_API"] = "Failure for POST";
					res.status(200).json(ret);
				});

			})
			.catch(function (error) {
				ret1["error_message"] = error.message;
				ret1["Result_API"] = "Failure for GET";
				res.status(200).json(ret1);
			});

		})
		.catch(function (error) {
			ret["error_message"] = error.message;
			ret["Result_API"] = "Failure for Updation";
			res.status(200).json(ret);
		});
//	}
//	else{
//
//		let ret = {};
//		let proStartURL1 = oatHost + "/flowable-task/process-api/runtime/process-instances/"+ procInstanceId + "/variables";
//		let manualPutData =[
//			{
//				"name": "manualIntervention",
//				"type": "string",
//				"value": mi
//			}
//			];
//
//		//Axios post call
//		return axios.put(proStartURL1, manualPutData,{ auth: {username: flow_username , password: flow_password}})
//		.then(function (response) {
//			//ret=response.data;
//			ret["Result_API"] = "Success";
//			//console.log("Check:"+ JSON.stringify(ret));
//			res.status(200).json(ret);
//		})
//		.catch(function (error) {
//			ret["error_message"] = error.message;
//			ret["Result_API"] = "Failure for Updation";
//			res.status(200).json(ret);
//		});
//	}

});

//update C-step manual intervention value
routerFlowable.get("/updateCStepManualIntervention/:proInstanceId/:manual_intervention", (req, res, next) => {
	let procInstanceId =req.params.proInstanceId;
	let mi="" + req.params.manual_intervention;
	var ret = {};
	var proStartURL = oatHost + "/flowable-task/process-api/runtime/process-instances/"+ procInstanceId + "/variables";
	var manualPutData =[
		{
			"name": "manualIntervention",
			"type": "string",
			"value": mi
		}
		];

	//Axios PUT call
	return axios.put(proStartURL, manualPutData,{ auth: {username: flow_username , password: flow_password}})
	.then(function (response) {
		//ret=response.data;
		ret["Result_API"] = "Success";
		//console.log("Check:"+ JSON.stringify(ret));
		res.status(200).json(ret);
	})
	.catch(function (error) {
		ret["error_message"] = error.message;
		ret["Result_API"] = "Failure";
		res.status(200).json(ret);
	});
});

//complete C-step task after updation of manual intervention, then fetching taskid from task API  
routerFlowable.get("/completeCStep/:procInstanceId", (req, res, next) => {

	let procInstanceId =req.params.procInstanceId;
	var ret1 = {};
	var proStartURL1 = oatHost + "/flowable-task/process-api/runtime/tasks?processInstanceId="+ procInstanceId;
	
	return axios.get(proStartURL1,{ auth: {username: flow_username , password: flow_password}})
	.then(function (response) {
		var taskId=response.data.data[0].id;
		var ret = {};
		var proStartURL = oatHost + "/flowable-task/process-api/runtime/tasks/"+ taskId;
		var completePostData ={"action" : "complete"};

		//Axios POST call
		return axios.post(proStartURL, completePostData,{ auth: {username: flow_username , password: flow_password}})
		.then(function (response) {
			//ret=response.data;
			ret["Result_API"] = "Success";
			res.status(200).json(ret);
		})
		.catch(function (error) {
			ret["error_message"] = error.message;
			ret["Result_API"] = "Failure for POST";
			res.status(200).json(ret);
		});

	})
	.catch(function (error) {
		ret1["error_message"] = error.message;
		ret1["Result_API"] = "Failure for GET";
		res.status(200).json(ret1);
	});
});	

//cancel(stop) a parent process -- particularly W* or M* process
routerFlowable.get("/cancelParentProcess/:procInstanceId", (req, res, next) => {

	let proInstanceId = req.params.procInstanceId;
	var ret = {};
	var proDeleteURL = oatHost+ "/flowable-task/process-api/runtime/process-instances/" + proInstanceId;
	// Axios delete call
	return axios.delete(proDeleteURL,{ auth: {username: flow_username , password: flow_password}})
	.then(function (response) {
		//ret=response.data; // returns nothing for delete
		ret["Result_API"] = "Success";
		res.status(200).json(ret);
	})
	.catch(function (error) {
		ret["error_message"] = error.message;
		ret["Result_API"] = "Failure";
		res.status(200).json(ret);
	});
});
//make a flowable GET call
routerFlowable.get("/readFlowableTable/:tableName", (req, res, next) => {

	let flowTable = req.params.tableName;
	var ret = {};
	var readTableURL = oatHost + "flowable-rest/service/management/tables/" + flowTable + "/data";

	return axios.get(readTableURL,{ auth: {username: flow_username , password: flow_password}})
	.then(function (response) {
		ret=response.data; // returns nothing for delete
		ret["Result_API"] = "Success";
		res.status(200).json(ret);
	})
	.catch(function (error) {
		ret["error_message"] = error.message;
		ret["Result_API"] = "Failure";
		res.status(200).json(ret);
	});
});
routerFlowable.get("/suspendParentProcess/:procInstanceId", (req, res, next) => {
	// suspend a process
	let proInstanceId = req.params.procInstanceId;
	var ret = {};
	var proSuspendURL = oatHost + "/flowable-task/process-api/runtime/process-instances/" + proInstanceId;
	var taskPutData = {"action":"suspend"};
	// Axios put call
	return axios.put(proSuspendURL,taskPutData, { auth: {username: flow_username , password: flow_password}})
	.then(function (response) {
		//ret=response.data; // returns nothing for delete
		ret["Result_API"] = "Success";
		res.status(200).json(ret);
	})
	.catch(function (error) {
		ret["error_message"] = error.message;
		ret["Result_API"] = "Failure";
		res.status(200).json(ret);
	});
});
routerFlowable.get("/reactivateParentProcess/:procInstanceId", (req, res, next) => {
	// resume a suspended process
	let proInstanceId = req.params.procInstanceId;
	var ret = {};
	var proActivateURL = oatHost + "/flowable-task/process-api/runtime/process-instances/" + proInstanceId;
	var taskPutData = {"action":"activate"};
	// Axios put call
	return axios.put(proSuspendURL,taskPutData, { auth: {username: flow_username , password: flow_password}})
	.then(function (response) {
		//ret=response.data; // returns nothing for delete
		ret["Result_API"] = "Success";
		res.status(200).json(ret);
	})
	.catch(function (error) {
		ret["error_message"] = error.message;
		ret["Result_API"] = "Failure";
		res.status(200).json(ret);
	});
});

//start a task form for manual intervention
//inputs would be C_MANUAL_INTERVENTION instanceID and 0/1 option for task form -- for older style modelling
routerFlowable.get("/beginTaskForm/:procInstanceId/:option?", (req, res, next) => {
	let proInstanceId = req.params.procInstanceId;
	var taskOption = req.params.option;
	var possibleOptions = ["0","1"];
	if (taskOption == undefined || !possibleOptions.includes(taskOption))
		taskOption = "0"; // initialize if not sent
	var ret = {};
	var runtimeTaskURL = oatHost + "/flowable-task/process-api/runtime/tasks?processInstanceId=" + proInstanceId;
	// first call C step instance and get Task id 
	return axios.get(runtimeTaskURL,{ auth: {username: flow_username , password: flow_password} })
	.then(function(response){
		ret=response.data.data[0];
		let taskInstanceId = ret.id; // id should be the task id
		let taskPostURL = oatHost + "/flowable-task/process-api/form/form-data";
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
		ret["error_message"] = error.message;
		ret["Result_API"] = "Failure";
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
			ret1["error_message"] = error.message;
			ret1["Result_API"] = "Failure";
			res.status(200).json(ret1);
		});
	}
});
//fetch input parameters for attached start form WHEN processDefId is known !! for repeats
routerFlowable.get("/fetchStartFormParams/:procDefinitionId", (req, res, next) => {
	let processDefinitionId = req.params.procDefinitionId;
	var ret = {};
	var proStartFormURL = oatHost + "/flowable-rest/service/repository/process-definitions/"+processDefinitionId+"/start-form";

	return axios.get(proStartFormURL,{ auth: {username: flow_username , password: flow_password}})
	.then(function (response) {
		ret=response.data; // returns nothing for delete
		ret["Result_API"] = "Success";
		res.status(200).json(ret);
	})
	.catch(function (error) {
		ret["error_message"] = error.message;
		ret["Result_API"] = "Failure";
		res.status(200).json(ret);
	});
});
//fetch start parameters from processDefKey (model key) WHEN processDefId is NOT known! 1st time execute model from scratch
routerFlowable.get("/fetchStartFormParamsScratch/:proDefinitionKey", (req, res, next) => {
	let modelKeyVal = req.params.proDefinitionKey;
	var ret = [];
	//let proHistApiURL = oatHost + "/flowable-rest/service/history/historic-process-instances?processDefinitionKey=" + modelKeyVal + "&size=1&sort=startTime&order=desc";
	let proDefinitionApiURL = oatHost + "/flowable-rest/service/repository/process-definitions?key=" + modelKeyVal + "&latest=true";
	return axios.get(proDefinitionApiURL,{ auth: {username: flow_username , password: flow_password}})
	.then(function (response) {
		ret=response.data; // get data from response
		if (ret.size == 1 )
		{
			let proDefId = ret.data[0].id;
			let proStartFormURL = oatHost + "/flowable-rest/service/repository/process-definitions/"+proDefId+"/start-form";
			return axios.get(proStartFormURL,{ auth: {username: flow_username , password: flow_password}})
			.then(function (response2) {
				let ret2 =response2.data; // returns nothing for delete
				ret2["Result_API"] = "Success";
				res.status(200).json(ret2);
			})
			.catch(function (error2) {
				let ret2 = {};
				ret2["error_message"] = error2.message;
				ret2["Result_API"] = "Failure";
				res.status(200).json(ret2);
			});
		} 
		else
		{
			let ret3 = {};
			ret3["error_message"] = "No such model exists by Key:" + modelKeyVal;
			ret3["Result_API"] = "Failure";
			res.status(200).json(ret3);
		}
	})
	.catch(function (error) {
		ret["error_message"] = error.message;
		ret["Result_API"] = "Failure";
		res.status(200).json(ret);
	});
});

module.exports = routerFlowable;
