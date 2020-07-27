const config = require('config');  // config module
var axios = require('axios'); 
/*Class to access status calculator hierarchy and related data*/
class BuildStatusJson2
{
	constructor(webParamWInstanceId)
	{
		this.webParamWInstanceId=webParamWInstanceId;
		this.WJSON={};
		this.cachedJSON = null;
		this.oatHost = config.get('deploy.host');   // fetch Node config parameter
		this.criticalRunStati = ["Stopped_with_error","Stopped_manual_intervention"];
		this.P_anyCritError = false;
		this.S_anyCritError = false;
		this.A_anyCritError=false;
		this.flowCallCounter = 0;
	}
	/*calls the first M level/W-level,main function invoked from the router api and returns the final json*/
	async outputjson()
	{	
		/* GET data from cache if mpid status is already cache-available */		
		var cachedStatus = await this.queryStatusCacheData(this.webParamWInstanceId);
		if (cachedStatus && cachedStatus["Result_API"] == "Success") {
			console.log("previous cache found for mpid:" + this.webParamWInstanceId);
			this.cachedJSON = JSON.parse(JSON.stringify(cachedStatus["Dataset"]));
		}
		//this.cachedJSON = {"Master_Info":{"name":"Test Master Build","FlowableDefinitionName":"M_API_TEST_INSTALLATION1","mpid":"bfff481b-7fe8-11ea-bdc6-42010aeec524","FlowableInstanceId":"bfff481b-7fe8-11ea-bdc6-42010aeec524","processDefinitionId":"M_API_TEST_INSTALLATION1:15:4b0bc353-7d7c-11ea-811a-42010aeec524","Start Time":"2020-04-16T15:47:01.854+02:00","End Time":"2020-04-20T11:52:12.501+02:00","Run Status":"Running_fine","BusinessKey":"ZZZ_005056A508801ED9B8EC4AEE3BD717AD","durationInMillis":"331510647","Timestamp_JSON":"2020-05-26 09:33:03","FlowableCallsCount":73},"Phases_Array":[{"name":"Test  E2E Installation","FlowableDefinitionName":"W_API_TEST_INSTALLATION","FlowableInstanceId":"c149a314-7fe8-11ea-bdc6-42010aeec524","processDefinitionId":"W_API_TEST_INSTALLATION:18:4b0bea6a-7d7c-11ea-811a-42010aeec524","Start Time":"2020-04-16T15:47:04.019+02:00","End Time":"2020-04-20T11:27:01.706+02:00","Run Status":"Completed","BusinessKey":"ZZZ_005056A508801ED9B8EC4AEE3BD717AD","durationInMillis":"329997687"}],"Test  E2E Installation":{"Phase_Data":{"name":"Test  E2E Installation","FlowableDefinitionName":"W_API_TEST_INSTALLATION","FlowableInstanceId":"c149a314-7fe8-11ea-bdc6-42010aeec524","processDefinitionId":"W_API_TEST_INSTALLATION:18:4b0bea6a-7d7c-11ea-811a-42010aeec524","Start Time":"2020-04-16T15:47:04.019+02:00","End Time":"2020-04-20T11:27:01.706+02:00","Run Status":"Completed","BusinessKey":"ZZZ_005056A508801ED9B8EC4AEE3BD717AD","durationInMillis":"329997687"},"Sub_Phase_Data":[{"name":"A_CheckUserExists1","FlowableDefinitionName":"A_CHECK_USER_EXISTS1","FlowableInstanceId":"c288644b-7fe8-11ea-bdc6-42010aeec524","processDefinitionId":"A_CHECK_USER_EXISTS1:14:4b0bc346-7d7c-11ea-811a-42010aeec524","Run Status":"Completed"},{"name":"A_CheckUserExists12","FlowableDefinitionName":"A_CHECK_USER_EXISTS12","FlowableInstanceId":"ed85701b-82e8-11ea-96f4-42010aeec524","processDefinitionId":"A_CHECK_USER_EXISTS12:9:4b0bc348-7d7c-11ea-811a-42010aeec524","Run Status":"Completed"}],"A_CheckUserExists1":{"name":"A_CheckUserExists1","FlowableDefinitionName":"A_CHECK_USER_EXISTS1","FlowableInstanceId":"c288644b-7fe8-11ea-bdc6-42010aeec524","processDefinitionId":"A_CHECK_USER_EXISTS1:14:4b0bc346-7d7c-11ea-811a-42010aeec524","Start Time":"2020-04-16T15:47:06.108+02:00","End Time":"2020-04-20T11:25:51.715+02:00","Run Status":"Completed","BusinessKey":"ZZZ_005056A508801ED9B8EC4AEE3BD717AD","durationInMillis":"329925607","hierarchyData":[{"name":"Check user exists or not 1","FlowableDefinitionName":"S_CHECK_USER1","FlowableInstanceId":"c3dc8257-7fe8-11ea-bdc6-42010aeec524","processDefinitionId":"S_CHECK_USER1:15:4b0bea64-7d7c-11ea-811a-42010aeec524","level":"Scenario","Start Time":"2020-04-16T15:47:08.337+02:00","End Time":"2020-04-20T11:25:51.644+02:00","Run Status":"Completed","BusinessKey":"ZZZ_005056A508801ED9B8EC4AEE3BD717AD","durationInMillis":"329923307","nodes":[{"name":"Check user exists or not 1","FlowableDefinitionName":"P_CHECK_USER1","FlowableInstanceId":"c3dd1e51-7fe8-11ea-bdc6-42010aeec524","processDefinitionId":"P_CHECK_USER1:15:4b0bc344-7d7c-11ea-811a-42010aeec524","level":"Process","parent":"Check user exists or not 1","Start Time":"2020-04-16T15:47:08.341+02:00","End Time":"2020-04-20T11:25:51.622+02:00","Run Status":"Completed","BusinessKey":"ZZZ_005056A508801ED9B8EC4AEE3BD717AD","durationInMillis":"329923281","ExecuteSteps":[{"Step":"Template model for executing a single configuration step Execution: User&Auth","FlowableDefinitionName":"C_USER_AUTH_REDO_FIRST","FlowableInstanceId":"c3ddbb4b-7fe8-11ea-bdc6-42010aeec524","processDefinitionId":"C_USER_AUTH_REDO_FIRST:88:4b0bc343-7d7c-11ea-811a-42010aeec524","Start Time":"2020-04-16T15:47:08.345+02:00","End Time":"2020-04-16T15:47:11.908+02:00","Run Status":"Completed","Step Status":"Log","Last Executor":"flowable","level":"ExecuteStep","Last Run":"2020-04-16T15:47:08.345+02:00","BusinessKey":"ZZZ_005056A508801ED9B8EC4AEE3BD717AD","durationInMillis":"3563"},{"Step":"Common model for reading inputs before performing the single configuration step (Live or Build phase).","FlowableDefinitionName":"C_Read_Input_api_test","FlowableInstanceId":"c3e29d1d-7fe8-11ea-bdc6-42010aeec524","processDefinitionId":"C_Read_Input_api_test:59:4b0bc351-7d7c-11ea-811a-42010aeec524","Start Time":"2020-04-16T15:47:08.377+02:00","End Time":"2020-04-16T15:47:10.462+02:00","Run Status":"Completed","Step Status":"Log","Last Executor":"flowable","level":"ExecuteStep","Last Run":"2020-04-16T15:47:08.377+02:00","BusinessKey":"ZZZ_005056A508801ED9B8EC4AEE3BD717AD","durationInMillis":"2085"},{"Step":"Template model for executing a single configuration step Execution: User&Auth","FlowableDefinitionName":"C_USER_AUTH_REDO_SECOND","FlowableInstanceId":"c5fd8ddb-7fe8-11ea-bdc6-42010aeec524","processDefinitionId":"C_USER_AUTH_REDO_SECOND:90:4b0bc34a-7d7c-11ea-811a-42010aeec524","Start Time":"2020-04-16T15:47:11.909+02:00","End Time":"2020-04-20T11:24:47.815+02:00","Run Status":"Completed","Step Status":"Log","Last Executor":"flowable","level":"ExecuteStep","Last Run":"2020-04-16T15:47:11.909+02:00","BusinessKey":"ZZZ_005056A508801ED9B8EC4AEE3BD717AD","durationInMillis":"329855906"},{"Step":"Common model for reading inputs before performing the single configuration step (Live or Build phase).","FlowableDefinitionName":"C_Read_Input_api_test","FlowableInstanceId":"c601d36d-7fe8-11ea-bdc6-42010aeec524","processDefinitionId":"C_Read_Input_api_test:59:4b0bc351-7d7c-11ea-811a-42010aeec524","Start Time":"2020-04-16T15:47:11.937+02:00","End Time":"2020-04-16T15:47:14.042+02:00","Run Status":"Completed","Step Status":"Log","Last Executor":"flowable","level":"ExecuteStep","Last Run":"2020-04-16T15:47:11.937+02:00","BusinessKey":"ZZZ_005056A508801ED9B8EC4AEE3BD717AD","durationInMillis":"2105"},{"Step":"API Model : Send email updates for manual intervention step","FlowableDefinitionName":"API_C_SEND_EMAIL_MANUAL_INTERVENTION","FlowableInstanceId":"c81d3961-7fe8-11ea-bdc6-42010aeec524","processDefinitionId":"4b0bea68-7d7c-11ea-811a-42010aeec524","Start Time":"2020-04-16T15:47:15.472+02:00","End Time":"2020-04-20T11:24:47.650+02:00","Run Status":"Completed","Step Status":"Log","Last Executor":"flowable","level":"ExecuteStep","Last Run":"2020-04-16T15:47:15.472+02:00","BusinessKey":"ZZZ_005056A508801ED9B8EC4AEE3BD717AD","durationInMillis":"329852178"},{"Step":"Template model for executing a single configuration step Execution: User&Auth","FlowableDefinitionName":"C_USER_AUTH_REDO_THIRD","FlowableInstanceId":"c76eeb77-82e8-11ea-96f4-42010aeec524","processDefinitionId":"C_USER_AUTH_REDO_THIRD:80:4b0bc349-7d7c-11ea-811a-42010aeec524","Start Time":"2020-04-20T11:24:47.818+02:00","End Time":"2020-04-20T11:25:51.608+02:00","Run Status":"Completed","Step Status":"Log","Last Executor":"flowable","level":"ExecuteStep","Last Run":"2020-04-20T11:24:47.818+02:00","BusinessKey":"ZZZ_005056A508801ED9B8EC4AEE3BD717AD","durationInMillis":"63790"},{"Step":"Common model for reading inputs before performing the single configuration step (Live or Build phase).","FlowableDefinitionName":"C_Read_Input_api_test","FlowableInstanceId":"c7757af9-82e8-11ea-96f4-42010aeec524","processDefinitionId":"C_Read_Input_api_test:59:4b0bc351-7d7c-11ea-811a-42010aeec524","Start Time":"2020-04-20T11:24:47.861+02:00","End Time":"2020-04-20T11:24:49.667+02:00","Run Status":"Completed","Step Status":"Log","Last Executor":"flowable","level":"ExecuteStep","Last Run":"2020-04-20T11:24:47.861+02:00","BusinessKey":"ZZZ_005056A508801ED9B8EC4AEE3BD717AD","durationInMillis":"1806"}]}]}]},"A_CheckUserExists12":{"name":"A_CheckUserExists12","FlowableDefinitionName":"A_CHECK_USER_EXISTS12","FlowableInstanceId":"ed85701b-82e8-11ea-96f4-42010aeec524","processDefinitionId":"A_CHECK_USER_EXISTS12:9:4b0bc348-7d7c-11ea-811a-42010aeec524","Start Time":"2020-04-20T11:25:51.719+02:00","End Time":"2020-04-20T11:27:01.697+02:00","Run Status":"Completed","BusinessKey":"ZZZ_005056A508801ED9B8EC4AEE3BD717AD","durationInMillis":"69978","hierarchyData":[{"name":"Check user exists or not 12","FlowableDefinitionName":"S_CHECK_USER12","FlowableInstanceId":"ee879d96-82e8-11ea-96f4-42010aeec524","processDefinitionId":"S_CHECK_USER12:10:4b0bc350-7d7c-11ea-811a-42010aeec524","level":"Scenario","Start Time":"2020-04-20T11:25:53.411+02:00","End Time":"2020-04-20T11:27:01.627+02:00","Run Status":"Completed","BusinessKey":"ZZZ_005056A508801ED9B8EC4AEE3BD717AD","durationInMillis":"68216","nodes":[{"name":"Check user exists or not 12","FlowableDefinitionName":"P_CHECK_USER12","FlowableInstanceId":"ee8887af-82e8-11ea-96f4-42010aeec524","processDefinitionId":"P_CHECK_USER12:10:4b0bc352-7d7c-11ea-811a-42010aeec524","level":"Process","parent":"Check user exists or not 12","Start Time":"2020-04-20T11:25:53.417+02:00","End Time":"2020-04-20T11:27:01.612+02:00","Run Status":"Completed","BusinessKey":"ZZZ_005056A508801ED9B8EC4AEE3BD717AD","durationInMillis":"68195","ExecuteSteps":[{"Step":"Template model for executing a single configuration step Execution: User&Auth","FlowableDefinitionName":"C_USER_AUTH_REDO_FIRST","FlowableInstanceId":"ee894bb8-82e8-11ea-96f4-42010aeec524","processDefinitionId":"C_USER_AUTH_REDO_FIRST:88:4b0bc343-7d7c-11ea-811a-42010aeec524","Start Time":"2020-04-20T11:25:53.422+02:00","End Time":"2020-04-20T11:25:56.048+02:00","Run Status":"Completed","Step Status":"Log","Last Executor":"null","level":"ExecuteStep","Last Run":"2020-04-20T11:25:53.422+02:00","BusinessKey":"ZZZ_005056A508801ED9B8EC4AEE3BD717AD","durationInMillis":"2626"},{"Step":"Common model for reading inputs before performing the single configuration step (Live or Build phase).","FlowableDefinitionName":"C_Read_Input_api_test","FlowableInstanceId":"ee8d1c19-82e8-11ea-96f4-42010aeec524","processDefinitionId":"C_Read_Input_api_test:59:4b0bc351-7d7c-11ea-811a-42010aeec524","Start Time":"2020-04-20T11:25:53.447+02:00","End Time":"2020-04-20T11:25:55.087+02:00","Run Status":"Completed","Step Status":"Log","Last Executor":"null","level":"ExecuteStep","Last Run":"2020-04-20T11:25:53.447+02:00","BusinessKey":"ZZZ_005056A508801ED9B8EC4AEE3BD717AD","durationInMillis":"1640"},{"Step":"Template model for executing a single configuration step Execution: User&Auth","FlowableDefinitionName":"C_USER_AUTH_REDO_THIRD","FlowableInstanceId":"f01a24b6-82e8-11ea-96f4-42010aeec524","processDefinitionId":"C_USER_AUTH_REDO_THIRD:80:4b0bc349-7d7c-11ea-811a-42010aeec524","Start Time":"2020-04-20T11:25:56.049+02:00","End Time":"2020-04-20T11:27:01.602+02:00","Run Status":"Completed","Step Status":"Log","Last Executor":"null","level":"ExecuteStep","Last Run":"2020-04-20T11:25:56.049+02:00","BusinessKey":"ZZZ_005056A508801ED9B8EC4AEE3BD717AD","durationInMillis":"65553"},{"Step":"Common model for reading inputs before performing the single configuration step (Live or Build phase).","FlowableDefinitionName":"C_Read_Input_api_test","FlowableInstanceId":"f01ce3a7-82e8-11ea-96f4-42010aeec524","processDefinitionId":"C_Read_Input_api_test:59:4b0bc351-7d7c-11ea-811a-42010aeec524","Start Time":"2020-04-20T11:25:56.067+02:00","End Time":"2020-04-20T11:25:57.431+02:00","Run Status":"Completed","Step Status":"Log","Last Executor":"null","level":"ExecuteStep","Last Run":"2020-04-20T11:25:56.067+02:00","BusinessKey":"ZZZ_005056A508801ED9B8EC4AEE3BD717AD","durationInMillis":"1364"}]}]}]}}};
		return this.M_processTree(this.webParamWInstanceId); // for input M* parent id 
	}

	/*Method to do GET call from /api/getCache */
	async queryStatusCacheData(mpidVal)
	{
		// A generic method to GET call for Cache
		var url = this.oatHost + ":6001/api/getStatusCache/" + mpidVal;
		var ret = {};
		return axios.get(url)
		.then(function(response){
			ret=response.data;
			ret["Result_API"] = "Success";
			return ret;
		})
		.catch(function(error){
			ret["data"] = error.message;
			ret["Result_API"] = "Failure";
			return ret;
		});
	}


	async M_processTree(mpid)  // would call internally for Installation, Configuration & Quality
	{	
		// pid is the super parent ID -- M level ID
		if (this.cachedJSON != null)   // check from cache is already available
		{
			if (this.cachedJSON["Master_Info"] && this.cachedJSON["Master_Info"]["Run Status"] == "Completed") {
				this.cachedJSON["Master_Info"]["Timestamp_JSON"] = await this.getFormattedTimestamp(); // timestamp value
				this.cachedJSON["Master_Info"]["FlowableCallsCount"] = this.flowCallCounter; // total Flowable calls made
				return this.cachedJSON;
			}
		}
		var url = this.oatHost + "/flowable-rest/service/history/historic-process-instances?processInstanceId=" + mpid;
		var data=await this.queryFlowableInstance(url);
		++this.flowCallCounter;
		if (data["Result_API"] == "Success")
		{		
			if(data.total == 1){	    //if no data is available for the respective wpid 	
				var phaseName = "" + data.data[0].processDefinitionsDescription; phaseName = this.getRefinedProName(phaseName);
				var pDefName =  ""+data.data[0].processDefinitionName; var dRson = ""+data.data[0].deleteReason;
				var beginTime = ""+data.data[0].startTime;  var endTime = ""+data.data[0].endTime;
				var rStatus = await this.computeRunStatus(dRson,endTime,pDefName);

				this.WJSON["Master_Info"]={};
				this.WJSON["Master_Info"] = {"name":phaseName, "FlowableDefinitionName" : pDefName, "mpid":data.data[0].id,
						"FlowableInstanceId" : data.data[0].id,"processDefinitionId" : data.data[0].processDefinitionId, 
						"Start Time": beginTime,"End Time": endTime, "Run Status" : rStatus,"BusinessKey": ""+data.data[0].businessKey, "durationInMillis": ""+data.data[0].durationInMillis};

				// check for W* process childs
				var url2 = this.oatHost + "/flowable-rest/service/history/historic-process-instances?superProcessInstanceId="+mpid + "&sort=startTime&order=asc&size=500";
				var data2 = await this.queryFlowableInstance(url2);
				++this.flowCallCounter;
				if (data2["Result_API"] == "Success" && data2.total > 0)
				{
					this.WJSON["Phases_Array"] = [];
					for (var p=0; p<data2.total; p++)
					{
						var wInstanceId =  ""+data2.data[p].id; // W* process IDs
						await this.W_processTree(wInstanceId); // call W* hierarchies here
					}
					// when all W* are computed fine
					this.WJSON["Master_Info"]["Timestamp_JSON"] = await this.getFormattedTimestamp(); // timestamp value
					this.WJSON["Master_Info"]["FlowableCallsCount"] = this.flowCallCounter; // total Flowable calls made
					return this.WJSON;
				}
			}
			else {	
				this.WJSON["data"]=data.data;
				this.WJSON["Result_API"]="Failure";
				return this.WJSON;
			}	
		}
		else {	
			//this.WJSON["data"]=data.data;
			this.WJSON["Result_API"]="Failure";
			return this.WJSON;
		}	
	}
	// call in loop for 3 W* cases
	async W_processTree(pid)  // would be called for Installation, Configuration & Quality individually
	{	
		
		// pid is the super parent ID -- W* instance ID
		var url = this.oatHost + "/flowable-rest/service/history/historic-process-instances?processInstanceId=" + pid;
		var data=await this.queryFlowableInstance(url);
		++this.flowCallCounter;
		if (data["Result_API"] == "Success")
		{		
			if(data.total == 1){	    //if no data is available for the respective wpid 	
				// processDefinitionName   //processDefinitionDescription  //processDefinitionId
				var phaseName = "" + data.data[0].processDefinitionDescription; phaseName = this.getRefinedProName(phaseName);
				var pDefName =  ""+data.data[0].processDefinitionName; var dRson = ""+data.data[0].deleteReason;
				var beginTime = ""+data.data[0].startTime;  var endTime = ""+data.data[0].endTime;
				var rStatus = await this.computeRunStatus(dRson,endTime,pDefName);

				this.WJSON[phaseName]={};
				var phaseInfoObj = {"name":phaseName, "FlowableDefinitionName" : data.data[0].processDefinitionName, 
						"FlowableInstanceId" : data.data[0].id,"processDefinitionId" : data.data[0].processDefinitionId, 
						"Start Time": beginTime,"End Time": endTime, "Run Status" : rStatus,"BusinessKey": ""+data.data[0].businessKey, "durationInMillis": ""+data.data[0].durationInMillis};
				
				if (this.cachedJSON != null)  // check from previous cache for completed W process
				{
					if (this.cachedJSON[phaseName] && this.cachedJSON[phaseName]["Phase_Data"] && 
							this.cachedJSON[phaseName]["Phase_Data"]["Run Status"] == "Completed")
					{
						this.WJSON["Phases_Array"].push(JSON.parse(JSON.stringify(phaseInfoObj)));
						this.WJSON[phaseName] =  this.cachedJSON[phaseName];  // copy entire W phase branch itself
						return; // no need to process sections beneath
					}
				}
				
				this.WJSON[phaseName]["Phase_Data"] = phaseInfoObj;
				this.WJSON["Phases_Array"].push(JSON.parse(JSON.stringify(phaseInfoObj)));
				await this.A_processTree(pid,phaseName); // linear call
			}
		}
	}
	async A_processTree(pid,phaseName)
	{
		// think about startTime & endTime and mark as 'Completed' if applicable -- check for 'deleteReason'
		var url = this.oatHost + "/flowable-rest/service/history/historic-process-instances?superProcessInstanceId="+pid + "&sort=startTime&order=asc&size=500";
		var data = await this.queryFlowableInstance(url);
		++this.flowCallCounter;
		if (data["Result_API"] == "Success")
		{
			var AJSON_Arr = [];
			this.WJSON[phaseName]["Sub_Phase_Data"]=AJSON_Arr; // attaching sub-phases array here

			for (var j=0; j<data.total; j++) {
				var AJSON = {};
				var aName = "" + data.data[j].processDefinitionDescription; aName = this.getRefinedProName(aName);
				var pDefName =  ""+data.data[j].processDefinitionName; var dRson = ""+data.data[j].deleteReason;
				var beginTime = ""+data.data[j].startTime;  var endTime = ""+data.data[j].endTime;
				var rStatus = await this.computeRunStatus(dRson,endTime,pDefName);

				AJSON = {"name": aName, "FlowableDefinitionName" : "" + data.data[j].processDefinitionName,
						"FlowableInstanceId" : data.data[j].id, "processDefinitionId" : data.data[j].processDefinitionId, 
						"Start Time": beginTime,"End Time": endTime, "Run Status" : rStatus,"BusinessKey": ""+data.data[j].businessKey, "durationInMillis": ""+data.data[j].durationInMillis};
				if (this.cachedJSON != null)  // check if previous cache for completed A process is present
				{
					if (this.cachedJSON[phaseName] && this.cachedJSON[phaseName][aName] && this.cachedJSON[phaseName][aName]["Run Status"] && 
							this.cachedJSON[phaseName][aName]["Run Status"] == "Completed")
					{
						AJSON_Arr.push({"name": aName, "FlowableDefinitionName" : "" + data.data[j].processDefinitionName,
							"FlowableInstanceId" : data.data[j].id, "processDefinitionId" : data.data[j].processDefinitionId, "Run Status" : "Completed" });
						this.WJSON[phaseName][aName] =  this.cachedJSON[phaseName][aName];  // copy entire A subphase branch itself
						return; // no need to process tree beneath
					}
				}
				
				this.A_anyCritError = false;
				AJSON["hierarchyData"] = await this.S_processTree(data.data[j].id,phaseName,aName); // call returns an array

				if (this.A_anyCritError) {
					AJSON["Run Status"] = "Running_with_error";
					AJSON_Arr.push({"name": aName, "FlowableDefinitionName" : "" + data.data[j].processDefinitionName,
						"FlowableInstanceId" : data.data[j].id, "processDefinitionId" : data.data[j].processDefinitionId, "Run Status" : "Running_with_error" });
				} else {
					AJSON_Arr.push({"name": aName, "FlowableDefinitionName" : "" + data.data[j].processDefinitionName,
						"FlowableInstanceId" : data.data[j].id, "processDefinitionId" : data.data[j].processDefinitionId, "Run Status" : rStatus });
				}

				this.WJSON[phaseName][aName] = AJSON;
			}
		}

	}
	async checkIfPExists(pid)
	{
		// check if P* processes exists
		var url = this.oatHost + "/flowable-rest/service/history/historic-process-instances?superProcessInstanceId="+pid + "&sort=startTime&order=asc&size=500";
		var data = await this.queryFlowableInstance(url);
		++this.flowCallCounter;
		var ret = false;
		if (data["Result_API"] == "Success")
		{
			for (var j=0; j<data.total; j++)
			{
				var defName = "" + data.data[j].processDefinitionName;
				if (defName.startsWith("P_"))   //if any P_ text matched
				{
					ret = true;
					break;
				}
			}
		}
		return ret;
	}  
	async S_processTree(pid,phaseName,subPhaseName)        
	{
		// pid is Area/subphase process id  --  returns an array for hierarchyData" Node
		var url = this.oatHost + "/flowable-rest/service/history/historic-process-instances?superProcessInstanceId="+pid + "&sort=startTime&order=asc&size=500";
		var data = await this.queryFlowableInstance(url);
		++this.flowCallCounter;
		var ret = []; // empty array initialize
		if (data["Result_API"] == "Success")
		{
			for (var j=0; j<data.total; j++) // looping through S* instances
			{
				var SJSON = {};
				var sName = ""+data.data[j].processDefinitionDescription; sName = this.getRefinedProName(sName);
				if (this.cachedJSON != null)  // check if previous cache for completed A process is present
				{
					if (this.cachedJSON[phaseName] && this.cachedJSON[phaseName][subPhaseName] && this.cachedJSON[phaseName][subPhaseName]["hierarchyData"] 
						&& this.cachedJSON[phaseName][subPhaseName]["hierarchyData"][j]
						&& this.cachedJSON[phaseName][subPhaseName]["hierarchyData"][j]["Run Status"] == "Completed")
					{
						ret.push(this.cachedJSON[phaseName][subPhaseName]["hierarchyData"][j]); // copy & push entire Scenario branch itself
						continue; // no need to process P* or C* processes beneath
					}
				}
				
				var pDefName =  ""+data.data[j].processDefinitionName; var dRson = ""+data.data[j].deleteReason;
				var beginTime = ""+data.data[j].startTime;  var endTime = ""+data.data[j].endTime;
				var rStatus = await this.computeRunStatus(dRson,endTime,pDefName);
				
				SJSON={"name" : sName, "FlowableDefinitionName" : pDefName, 
						"FlowableInstanceId" : data.data[j].id, "processDefinitionId" : data.data[j].processDefinitionId, 
						"level":"Scenario", "Start Time": beginTime,"End Time": endTime, "Run Status" : rStatus,"BusinessKey": ""+data.data[j].businessKey, "durationInMillis": ""+data.data[j].durationInMillis};

				// check if P* processes inside or direct C*steps
				if (await this.checkIfPExists(data.data[j].id))
				{
					this.S_anyCritError = false;this.A_anyCritError= false;
					SJSON["nodes"] = await this.P_processTree(data.data[j].id,sName,"Process"); // call returns a JS array
					if (this.S_anyCritError) {
						SJSON["Run Status"] = "Stopped_with_error";
						this.A_anyCritError = true; // propagate upwards
					}
				}
				else {
					// direct C* steps array
					var CArray = []; // initialize empty array
					this.P_anyCritError = false;
					await this.C_processTree(data.data[j].id,CArray); // call keeps appending elements in CArray
					SJSON["ExecuteSteps"] = CArray;
					if (this.P_anyCritError) {
						SJSON["Run Status"] = "Stopped_with_error";
						this.A_anyCritError = true;
					}
				}
				ret.push(SJSON);
			}
		}
		return ret;
	}
	async P_processTree(pid,sceName,proLevel)
	{
		// pid is Scenario process id or in a recursive cycle parent P* process
		var url = this.oatHost + "/flowable-rest/service/history/historic-process-instances?superProcessInstanceId="+pid + "&sort=startTime&order=asc&size=500";
		var data = await this.queryFlowableInstance(url);
		++this.flowCallCounter;
		var ret = []; // empty the array initialize
		if (data["Result_API"] == "Success")
		{
			for (var j=0; j<data.total; j++)   // looping through P* instances
			{
				var PJSON = {};
				var pDefName =  ""+data.data[j].processDefinitionName; var dRson = ""+data.data[j].deleteReason;
				var beginTime = ""+data.data[j].startTime;  var endTime = ""+data.data[j].endTime;
				var rStatus = await this.computeRunStatus(dRson,endTime,pDefName);
				var scnarioName = "" + sceName;
				var pName = ""+data.data[j].processDefinitionDescription;pName = this.getRefinedProName(pName);
				PJSON={"name" : pName, "FlowableDefinitionName" : pDefName, 
						"FlowableInstanceId" : data.data[j].id, "processDefinitionId" : data.data[j].processDefinitionId,
						"level":proLevel,"parent":scnarioName, "Start Time": beginTime,"End Time":endTime,
						"Run Status":rStatus,"BusinessKey": ""+data.data[j].businessKey, "durationInMillis": ""+data.data[j].durationInMillis};

				// check if P* processes inside or direct C*steps
				if (await this.checkIfPExists(data.data[j].id))     // futuristic case ???
				{
					PJSON["nodes"] = await this.P_processTree(data.data[j].id,pName,"Sub-" + proLevel); // call returns a JS array -- recursive call
				}
				else {
					// direct C* steps
					var CArray = []; // empty initialize the array
					this.P_anyCritError = false; this.S_anyCritError = false;
					await this.C_processTree(data.data[j].id, CArray); // call keeps appending elements in CArray
					PJSON["ExecuteSteps"] = CArray;
					if (this.P_anyCritError) {
						PJSON["Run Status"] = "Stopped_with_error";
						this.S_anyCritError = true; // propagate error upwards
					}
				}
				ret.push(PJSON);
			}
		}
		return ret;
	}
	async C_processTree(pid, CArray)
	{
		// pid is PROCESS id or SCENARIO id OR in a recursive cycle parent C* process
		// keep appending CJSONs in input field -> CArray
		var url = this.oatHost + "/flowable-rest/service/history/historic-process-instances?superProcessInstanceId="+pid + "&sort=startTime&order=asc&size=500";
		var data = await this.queryFlowableInstance(url);
		++this.flowCallCounter;
		if (data["Result_API"] == "Success")
		{
			if(data.total != 0){
				for (var j =0; j<data.total; j++){
					var pDefName =  ""+data.data[j].processDefinitionName; var dRson = ""+data.data[j].deleteReason;
					var beginTime = ""+data.data[j].startTime;  var endTime = ""+data.data[j].endTime;
					var cName = ""+data.data[j].processDefinitionDescription; cName = this.getRefinedProName(cName);
					var rStatus = await this.computeRunStatus(dRson,endTime,pDefName);
					if (this.criticalRunStati.includes(rStatus))
					{
						this.P_anyCritError = true;
					}
					var CJSON={"Step": cName,"FlowableDefinitionName" : pDefName, 
							"FlowableInstanceId" : data.data[j].id,"processDefinitionId" : data.data[j].processDefinitionId,
							"Start Time": beginTime,"End Time": endTime,"Run Status" : rStatus, "Step Status":"Log", "Last Executor" : ""+data.data[j].startUserId, 
							"level": "ExecuteStep", "Last Run" : data.data[j].startTime,"BusinessKey": ""+data.data[j].businessKey, "durationInMillis": ""+data.data[j].durationInMillis};
					CArray.push(CJSON);
					await this.C_processTree(data.data[j].id,CArray);  // call recursively
				}
			}
		}
	}
	async computeRunStatus(dReason,endTime,pDefName, criticalStatiLower)
	{
		// calculate Run status of higher level or Config step
		var runStatus = "Running_fine";
		if (dReason == "null") { // no delete reason
			if (endTime == "null")
			{
				if (pDefName.includes("MANUAL_INTERVENTION"))
					runStatus = "Stopped_manual_intervention";
				else
					runStatus = "Running_fine";
			} 
			else {
				runStatus = "Completed";
			}
		} else {
			runStatus = "Cancelled";
		}
		return runStatus;
	}
	queryFlowableInstance(url)
	{
		// A generic method to GET call for Flowable historic APIs
		var ret = {};
		var flow_username = "flowable";  var flow_password = "flowable";
		return axios.get(url,{ auth: {username: flow_username , password: flow_password}
		})
		.then(function(response){
			ret=response.data;
			ret["Result_API"] = "Success";
			return ret;
		})
		.catch(function(error){
			ret["data"] = error.message;
			ret["Result_API"] = "Failure";
			return ret;
		});
	}
	getRefinedProName(inpName)
	{
		var retVal = inpName;
		if (inpName)
		{
			let quoteCount = (inpName.match(/"/g) || []).length;
			if (quoteCount == 2)
			{
				var parts = inpName.split('"');
				retVal=parts[1];
			}
		}
		return retVal;
	}
	async getMySQLTimestamp()
	{
		// store in MySQL like "YYYY-MM-DD hh:mm:ss" but in German timezone
		var now = new Date();
		//  convert to msec -- add local time zone offset  -- get UTC time in msec
		var utc = now.getTime() + (now.getTimezoneOffset() * 60000);
		// create new Date object for Germany using supplied European offset
		var offset = 2;
		var d = new Date(utc + (3600000*offset));
		var ret = d.getFullYear() +"-"+('0' + (d.getMonth() + 1)).slice(-2)+"-"+('0' + d.getDate()).slice(-2) +" " + ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' + d.getSeconds()).slice(-2);
		return ret;
	}
	async getFormattedTimestamp(){
		var d = new Date();
		var ret1 = d.getFullYear() +"-"+('0' + (d.getMonth() + 1)).slice(-2)+"-"+('0' + d.getDate()).slice(-2) +" " + ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' + d.getSeconds()).slice(-2);
		return ret1;
	}
};

module.exports=BuildStatusJson2;
