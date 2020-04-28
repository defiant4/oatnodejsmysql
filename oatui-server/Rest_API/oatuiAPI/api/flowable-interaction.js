var express = require("express");
var BuildStatusJson =require("../domain/statuscalculator");
var axios = require('axios');
var db = require("../db/database");
const routerFlowable = express.Router();
const dbCache = require("../domain/db-cache-class"); //make a nodejs cache

//get Build Status JSON by master pid
routerFlowable.get("/get/buildStatusJson/:mpid", async (req, res, next) => {
	let mid = new BuildStatusJson(req.params.mpid);
	var statusJSON = await mid.outputjson();
	res.status(200).json(statusJSON);
});
//get Build Status JSON by master build_id
routerFlowable.get("/get/buildJsonStatus/:buildId", async (req, res, next) => {
	let buildID = req.params.buildId;
	let sqlQry1 = `SELECT * FROM OATUI.OAT_UI_BUILD_STATUS WHERE build_id = '${buildID}'`;
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

//	start a Build process from scratch
	routerFlowable.get("/startBuild/:proDefName/:ecs_key/:SID", (req, res, next) => {
		let procDefKey = req.params.proDefName;
		let ecsKey = req.params.ecs_key;
		let sid = req.params.SID;
		let busKey = sid+"_" + ecsKey;
		var ret = {};
		var flow_username = "flowable";  var flow_password = "flowable";
		var proStartURL = "https://dlmoattst.wdf.sap.corp/flowable-task/process-api/runtime/process-instances/";
		var startPostData ={ "processDefinitionKey":procDefKey,
				"businessKey": busKey,
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
			ret["error_message"] = error.message;
			ret["Result_API"] = "Failure";
			res.status(200).json(ret);
		});
		//}
	});
//	cancel(stop) a parent process -- particularly W* or M* process
	routerFlowable.get("/cancelParentProcess/:procInstanceId", (req, res, next) => {

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
			ret["error_message"] = error.message;
			ret["Result_API"] = "Failure";
			res.status(200).json(ret);
		});
	});
	routerFlowable.get("/suspendParentProcess/:procInstanceId", (req, res, next) => {
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
			ret["error_message"] = error.message;
			ret["Result_API"] = "Failure";
			res.status(200).json(ret);
		});
	});
	routerFlowable.get("/reactivateParentProcess/:procInstanceId", (req, res, next) => {
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
			ret["error_message"] = error.message;
			ret["Result_API"] = "Failure";
			res.status(200).json(ret);
		});
	});

	//start a task form for manual intervention
	//inputs would be C_MANUAL_INTERVENTION instanceID and 0/1 option for task form
	routerFlowable.get("/beginTaskForm/:procInstanceId/:option?", (req, res, next) => {
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
	//	fetch input parameters for attached start form, if applicable
	routerFlowable.get("/fetchStartFormParams/:procDefinitionId", (req, res, next) => {
		let processDefinitionId = req.params.procDefinitionId;
		var ret = {};
		var flow_username = "flowable";  var flow_password = "flowable";
		var proStartFormURL = "https://dlmoattst.wdf.sap.corp/flowable-rest/service/repository/process-definitions/"+processDefinitionId+"/start-form";
		
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
/*routerFlowable.get("/test", (req, res, next) => {
		var m=["038e6f09-6ff8-11ea-8b3e-42010aeec524","34bb4943-6f99-11ea-8852-42010aeec524","4b850c74-6ff6-11ea-8b3e-42010aeec524"];
		for (var i=0;i<3;i++)
		{
			var child = child_process.fork("/opt/nodejs_oatui/oatuiAPI/api/status-calculator-child.js");
			child.send(m[i]);
		}
		child.on('close', function (code) {  
			console.log('child process exited with code ' + code);  
		});  
	});*/

	module.exports = routerFlowable;
