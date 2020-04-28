var axios = require('axios');
/*Class to access status calculator hierarchy and related data*/
class BuildStatusJson
{
	constructor(webParamWInstanceId)
	{
		this.webParamWInstanceId=webParamWInstanceId;
		this.WJSON={};
		this.oatHost = "https://dlmoattst.wdf.sap.corp";  // for test server
		this.criticalRunStati = ["Stopped_with_error","Stopped_manual_intervention"];
		this.P_anyCritError = false;
		this.S_anyCritError = false;
		this.A_anyCritError=false;
	}
	/*calls the first M level/W-level,main function invoked from the router api and returns the final json*/
	 outputjson()
	{
		return this.M_processTree(this.webParamWInstanceId); // for input M* parent id
	}
	 async M_processTree(mpid)  // would call internally for Installation, Configuration & Quality
	{	
		// pid is the super parent ID -- M level ID
		var url = this.oatHost + "/flowable-rest/service/history/historic-process-instances?processInstanceId=" + mpid;
		var data=await this.queryFlowableInstance(url);
		if (data["Result_API"] == "Success")
		{		
			if(data.total == 1){	    //if no data is available for the respective wpid 	
				var phaseName = "" + data.data[0].processDefinitionDescription; phaseName = this.getRefinedProName(phaseName);
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
				this.WJSON[phaseName]["Phase_Data"] = phaseInfoObj;
				this.WJSON["Phases_Array"].push(JSON.parse(JSON.stringify(phaseInfoObj)));
				await this.A_processTree(pid,phaseName); // linear call
			}
		}
	}
	async A_processTree(pid,phaseName)
	{
		// https://dlmoattst.wdf.sap.corp/flowable-rest/service/history/historic-process-instances?superProcessInstanceId=be66bf6c-62c7-11ea-843a-42010aeec524&sort=startTime&order=desc&size=1000
		// think about startTime & endTime and mark as 'Completed' if applicable -- check for 'deleteReason'
		var url = this.oatHost + "/flowable-rest/service/history/historic-process-instances?superProcessInstanceId="+pid + "&sort=startTime&order=asc&size=500";
		var data = await this.queryFlowableInstance(url);
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
				this.A_anyCritError = false;
				AJSON["hierarchyData"] = await this.S_processTree(data.data[j].id); // call returns an array
				
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
	async S_processTree(pid)        
	{
		// pid is Area/subphase process id  --  returns an array for hierarchyData" Node
		var url = this.oatHost + "/flowable-rest/service/history/historic-process-instances?superProcessInstanceId="+pid + "&sort=startTime&order=asc&size=500";
		var data = await this.queryFlowableInstance(url);
		var ret = []; // empty array initialize
		if (data["Result_API"] == "Success")
		{
			for (var j=0; j<data.total; j++) // looping through S* instances
			{
				var SJSON = {};
				var pDefName =  ""+data.data[j].processDefinitionName; var dRson = ""+data.data[j].deleteReason;
				var beginTime = ""+data.data[j].startTime;  var endTime = ""+data.data[j].endTime;
				var rStatus = await this.computeRunStatus(dRson,endTime,pDefName);
				var sName = ""+data.data[j].processDefinitionDescription; sName = this.getRefinedProName(sName);
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

module.exports=BuildStatusJson;

