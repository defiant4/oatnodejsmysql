const config = require('config');  // central config module
var axios = require('axios');      // axios module
const flow_username = config.get('flowable.username');  const flow_password = config.get('flowable.password');

/*Class to access only C level status calculator hierarchy   */
class BuildLevelJson
{
	constructor(webParamInstanceId, stepLevelVal)  // stepLevel indicates whether C step or P level or S level
	{
		this.webParamInstanceId=webParamInstanceId;
		this.retJSON={};  // return JSON dependent on level executed
		this.oatHost = config.get('deploy.host');  // get from central Node config
		// “Run Status” in tree options 1)Running_fine 2)Running_with_error 3)Stopped_with_error  4)Completed 
		// 5)Pending  6)Cancelled  7) Stopped_manual_intervention
		this.executedBaseModel = "";
		this.criticalRunStati = ["Stopped_with_error","Stopped_manual_intervention"];
		this.P_anyCritError = false;
		this.S_anyCritError = false;
		this.stepLevel = stepLevelVal;
		this.flowCallCounter = 0;
	}
	/*main function invoked from the router api and returns the final json*/
	outputjson()
	{
		return this.generateJSONStatus();
	}
	async generateJSONStatus()
	{
		if (this.stepLevel.toUpperCase() == 'S')  // // input can be C step OR Process step or Scenario step
			this.retJSON["data"] = await this.S_processTree_fromCurrent(this.webParamInstanceId); // call returns an array for 'hierarchyData'
		if (this.stepLevel.toUpperCase() == 'P')
			this.retJSON["data"] = await this.P_processTree_fromCurrent(this.webParamInstanceId,"Build Scenario","Process"); // returns an array for 'nodes'
		if (this.stepLevel.toUpperCase() == 'C') {
			var CArray = [];
			await this.C_processTree_fromCurrent(this.webParamInstanceId,CArray); // call keeps appending elements in CArray // returns array for 'executeSteps'
			this.retJSON["data"] = CArray // returns an array
		}
		this.retJSON["Master_Info"]= {}; // initialize
		this.retJSON["Master_Info"]["Timestamp_JSON"] = await this.getFormattedTimestamp(); // timestamp value
		this.retJSON["Master_Info"]["ExecutedModelName"] = this.executedBaseModel;
		this.retJSON["Master_Info"]["FlowableCallsCount"] = this.flowCallCounter; // total Flowable calls made
		return this.retJSON;
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
				var defName = await this.extractModelKey("" + data.data[j].processDefinitionId);
				if (defName.startsWith("P_"))   //if any P_ text matched
				{
					ret = true;
					break;
				}
			}
		}
		return ret;
	}  
	async S_processTree_fromParent(pid)        
	{
		// pid is Area/subphase process id  --  returns an array for hierarchyData" Node
		var url = this.oatHost + "/flowable-rest/service/history/historic-process-instances?superProcessInstanceId="+pid + "&sort=startTime&order=asc&size=500"
			+ "&includeProcessVariables=true";
		var data = await this.queryFlowableInstance(url);
		++this.flowCallCounter;
		var ret = []; // empty array initialize
		if (data["Result_API"] == "Success")
		{
			for (var j=0; j<data.total; j++) // looping through S* instances
			{
				let SJSON = {};
				let pDefName =  await this.extractModelKey(""+data.data[j].processDefinitionId); // to be extracted from proDefinitionId 
				let dRson = ""+data.data[j].deleteReason;
				let beginTime = ""+data.data[j].startTime;  let endTime = ""+data.data[j].endTime;
				let rStatus = await this.computeRunStatus(dRson,endTime,pDefName);
				let sName = ""+data.data[j].processDefinitionName; sName = this.getRefinedProName(sName);
				let wikiLink = ""+data.data[j].processDefinitionDescription;
				// FlowableDefinitionName below is the model Key !!
				SJSON={"name" : sName, "FlowableDefinitionName" : pDefName, "wikiLink" : wikiLink,
						"FlowableInstanceId" : data.data[j].id, "processDefinitionId" : data.data[j].processDefinitionId, 
						"level":"Scenario", "Start Time": beginTime,"End Time": endTime, "Run Status" : rStatus,"BusinessKey": ""+data.data[j].businessKey, "durationInMillis": ""+data.data[j].durationInMillis};

				// check if P* processes inside or direct C*steps
				if (await this.checkIfPExists(data.data[j].id))
				{
					this.S_anyCritError = false;this.A_anyCritError= false;
					SJSON["nodes"] = await this.P_processTree_fromParent(data.data[j].id,sName,"Process"); // call returns a JS array
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
	async S_processTree_fromCurrent(pid)        
	{
		// pid is current pid
		let url = this.oatHost + "/flowable-rest/service/history/historic-process-instances?processInstanceId=" + pid
		     + "&includeProcessVariables=true";
		let data = await this.queryFlowableInstance(url);
		++this.flowCallCounter;
		var ret = []; // empty array initialize
		if (data["Result_API"] == "Success")
		{
			if(data.total == 1)
			{
				let SJSON = {};
				let pDefName =  await this.extractModelKey(""+data.data[0].processDefinitionId); 
				let dRson = ""+data.data[0].deleteReason;
				let beginTime = ""+data.data[0].startTime;  let endTime = ""+data.data[0].endTime;
				let rStatus = await this.computeRunStatus(dRson,endTime,pDefName);
				let sName = ""+data.data[0].processDefinitionName; sName = this.getRefinedProName(sName);
				this.executedBaseModel = sName; // Parent Model name
				let wikiLink = ""+data.data[0].processDefinitionDescription;
				SJSON={"name" : sName, "FlowableDefinitionName" : pDefName, "wikiLink" : wikiLink,
						"FlowableInstanceId" : data.data[0].id, "processDefinitionId" : data.data[0].processDefinitionId, 
						"level":"Scenario", "Start Time": beginTime,"End Time": endTime, "Run Status" : rStatus,
						"BusinessKey": ""+data.data[0].businessKey, "durationInMillis": ""+data.data[0].durationInMillis};

				// check if P* processes inside or direct C*steps
				if (await this.checkIfPExists(data.data[0].id))
				{
					this.S_anyCritError = false;this.A_anyCritError= false;
					SJSON["nodes"] = await this.P_processTree_fromParent(data.data[0].id,sName,"Process"); // call returns a JS array
					if (this.S_anyCritError) {
						SJSON["Run Status"] = "Stopped_with_error";
						this.A_anyCritError = true; // propagate upwards
					}
				}
				else {
					// direct C* steps array
					var CArray = []; // initialize empty array
					this.P_anyCritError = false;
					await this.C_processTree_fromParent(data.data[0].id,CArray); // call keeps appending elements in CArray
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
	async P_processTree_fromParent(pid,sceName,proLevel)
	{
		// pid is Scenario process id or in a recursive cycle parent P* process
		let url = this.oatHost + "/flowable-rest/service/history/historic-process-instances?superProcessInstanceId="+pid + 
		"&sort=startTime&order=asc&size=500&includeProcessVariables=true";
		let data = await this.queryFlowableInstance(url);
		++this.flowCallCounter;
		var ret = []; // empty the array initialize
		if (data["Result_API"] == "Success")
		{
			for (var j=0; j<data.total; j++)   // looping through P* instances
			{
				let PJSON = {};
				let pDefName =  await this.extractModelKey(""+data.data[j].processDefinitionId);
				let dRson = ""+data.data[j].deleteReason;
				let beginTime = ""+data.data[j].startTime;  let endTime = ""+data.data[j].endTime;
				let rStatus = await this.computeRunStatus(dRson,endTime,pDefName);
				let scnarioName = "" + sceName;
				let pName = ""+data.data[j].processDefinitionName;pName = this.getRefinedProName(pName);
				let wikiLink = ""+data.data[j].processDefinitionDescription;
				PJSON={"name" : pName, "FlowableDefinitionName" : pDefName, "wikiLink" : wikiLink,
						"FlowableInstanceId" : data.data[j].id, "processDefinitionId" : data.data[j].processDefinitionId,
						"level":proLevel,"parent":scnarioName, "Start Time": beginTime,"End Time":endTime,
						"Run Status":rStatus,"BusinessKey": ""+data.data[j].businessKey, "durationInMillis": ""+data.data[j].durationInMillis};

				// check if P* processes inside or direct C*steps
				if (await this.checkIfPExists(data.data[j].id))     // futuristic case ???
				{
					PJSON["nodes"] = await this.P_processTree_fromParent(data.data[j].id,pName,"Sub-" + proLevel); // call returns a JS array -- recursive call
				}
				else {
					// direct C* steps
					var CArray = []; // empty initialize the array
					this.P_anyCritError = false; this.S_anyCritError = false;
					await this.C_processTree_fromParent(data.data[j].id, CArray); // call keeps appending elements in CArray
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
	async P_processTree_fromCurrent(pid,sceName,proLevel)
	{
		// pid is current Process Id
		var url = this.oatHost + "/flowable-rest/service/history/historic-process-instances?processInstanceId=" + pid
			+ "&includeProcessVariables=true";
		let data = await this.queryFlowableInstance(url);
		if(!sceName) 
			sceName = "Build Scenario";
		++this.flowCallCounter;
		let ret = []; // empty the array initialize
		if (data["Result_API"] == "Success")
		{
			if(data.total == 1)   // looping through P* instances
			{
				let PJSON = {};
				let pDefName =  await this.extractModelKey(""+data.data[0].processDefinitionId);
				let dRson = ""+data.data[0].deleteReason;
				let beginTime = ""+data.data[0].startTime;  let endTime = ""+data.data[0].endTime;
				let rStatus = await this.computeRunStatus(dRson,endTime,pDefName);
				let scnarioName = "" + sceName;
				let pName = ""+data.data[0].processDefinitionName;pName = this.getRefinedProName(pName);
				this.executedBaseModel = pName; // Parent Model name
				let wikiLink = ""+data.data[0].processDefinitionDescription;
				PJSON={"name" : pName, "FlowableDefinitionName" : pDefName, "wikiLink" : wikiLink,
						"FlowableInstanceId" : data.data[0].id, "processDefinitionId" : data.data[0].processDefinitionId,
						"level":proLevel,"parent":scnarioName, "Start Time": beginTime,"End Time":endTime,
						"Run Status":rStatus,"BusinessKey": ""+data.data[0].businessKey, "durationInMillis": ""+data.data[0].durationInMillis};

				// check if P* processes inside or direct C*steps
				if (await this.checkIfPExists(data.data[0].id))     // futuristic case ???
				{
					PJSON["nodes"] = await this.P_processTree_fromParent(data.data[0].id,pName,"Sub-" + proLevel); // call returns a JS array -- recursive call
				}
				else {
					// direct C* steps
					var CArray = []; // empty initialize the array
					this.P_anyCritError = false; this.S_anyCritError = false;
					await this.C_processTree_fromParent(data.data[0].id, CArray); // call keeps appending elements in CArray
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
	async C_processTree_fromParent(pid, CArray)
	{
		// pid is PROCESS id or SCENARIO id OR in a recursive cycle parent C* process
		// keep appending CJSONs in input field -> CArray
		var url = this.oatHost + "/flowable-rest/service/history/historic-process-instances?superProcessInstanceId="+pid + 
				"&sort=startTime&order=asc&size=500&includeProcessVariables=true";
		var data = await this.queryFlowableInstance(url);
		++this.flowCallCounter;
		if (data["Result_API"] == "Success")
		{
			if(data.total > 0){
				for (var j =0; j<data.total; j++){
					let pDefName = await this.extractModelKey(""+data.data[j].processDefinitionId); 
					let dRson = ""+data.data[j].deleteReason;
					let beginTime = ""+data.data[j].startTime;  let endTime = ""+data.data[j].endTime;
					let cName = ""+data.data[j].processDefinitionName; cName = this.getRefinedProName(cName);
					let wikiLink = ""+data.data[j].processDefinitionDescription;
					let proVars = data.data[j].variables;
					let busStatusText = "Initial";
					if (proVars)  {
						for (var m=0; m<proVars.length; m++)
						{
							if (proVars[m].name == 'businessStatusText')
								busStatusText = "" + proVars[m].value;
						}
					}
					let rStatus = await this.computeRunStatusFromBusinessStatus(dRson,endTime,proVars);
					//let rStatus = await this.computeRunStatus(dRson,endTime,pDefName);
					if (this.criticalRunStati.includes(rStatus))
					{
						this.P_anyCritError = true;
					}
					let CJSON={"Step": cName,"FlowableDefinitionName" : pDefName, "BusinessStatus" : busStatusText, "wikiLink" : wikiLink,
							"FlowableInstanceId" : data.data[j].id,"processDefinitionId" : data.data[j].processDefinitionId,
							"Start Time": beginTime,"End Time": endTime,"Run Status" : rStatus, "Step Log":"Log", "Last Executor" : ""+data.data[j].startUserId, 
							"level": "ExecuteStep", "Last Run" : data.data[j].startTime,"BusinessKey": ""+data.data[j].businessKey, "durationInMillis": ""+data.data[j].durationInMillis};
					CArray.push(CJSON);
					await this.C_processTree_fromParent(data.data[j].id,CArray);  // call recursively
				}
			}
		}
	}
	async C_processTree_fromCurrent(pid, CArray)
	{
		// pid is Current C step id
		// keep appending CJSONs in input field -> CArray
		let url = this.oatHost + "/flowable-rest/service/history/historic-process-instances?processInstanceId=" + pid
		+ "&includeProcessVariables=true";
		let data = await this.queryFlowableInstance(url);
		++this.flowCallCounter;
		if (data["Result_API"] == "Success")
		{
			if(data.total == 1){
				let pDefName =  await this.extractModelKey(""+data.data[0].processDefinitionId);
				let dRson = ""+data.data[0].deleteReason;
				let beginTime = ""+data.data[0].startTime;  let endTime = ""+data.data[0].endTime;
				let cName = ""+data.data[0].processDefinitionName; cName = this.getRefinedProName(cName);
				this.executedBaseModel = cName; // Parent Model name
				let wikiLink = ""+data.data[0].processDefinitionDescription;
				let proVars = data.data[0].variables;
				let busStatusText = "Initial";
				if (proVars)  {
					for (var m=0; m<proVars.length; m++)
					{
						if (proVars[m].name.toLowerCase() == 'businessstatustext')
							busStatusText = "" + proVars[m].value;
					}
				}
				let rStatus = await this.computeRunStatusFromBusinessStatus(dRson,endTime,proVars);
				//let rStatus = await this.computeRunStatus(dRson,endTime,pDefName);
				if (this.criticalRunStati.includes(rStatus))
				{
					this.P_anyCritError = true;
				}
				let CJSON={"Step": cName,"FlowableDefinitionName" : pDefName, "BusinessStatus" : busStatusText, "wikiLink" : wikiLink,
						"FlowableInstanceId" : data.data[0].id,"processDefinitionId" : data.data[0].processDefinitionId, 
						"Start Time": beginTime,"End Time": endTime,"Run Status" : rStatus, "Step Log":"Log", "Last Executor" : ""+data.data[0].startUserId, 
						"level": "ExecuteStep", "Last Run" : data.data[0].startTime,"BusinessKey": ""+data.data[0].businessKey, "durationInMillis": ""+data.data[0].durationInMillis};
				CArray.push(CJSON);
				await this.C_processTree_fromParent(data.data[0].id,CArray);  // call recursively
			}
		}
	}
	async extractModelKey(prDefId)
	{
		// extract processModelKey from proDefId -- pattern "<Model Key>:<version No>:<GUID>"
		return "" + prDefId.substring(0,prDefId.indexOf(':'));
	}
	async computeRunStatusFromBusinessStatus(dReason,endTime,processVars)   // for the C level
	{
		let runStatus = "Running_fine";
		if (dReason == "null") { // no delete reason -- means not cancelled
			if (endTime == "null") {
				let busStatCode=0, busStatCons=0, fatalStep=true;
				if (processVars)  {
					for (var q=0; q<processVars.length; q++)
					{
						if (processVars[q].name == 'businessStatusCode')
							busStatCode = processVars[q].value;
						if (processVars[q].name == 'businessStatusConsolidated')
							busStatCons = processVars[q].value;
						if (processVars[q].name == 'continueOnError') {
							if (processVars[q].value === true)
								fatalStep = false;
						}
					}
				}
				// proceed further
				if (busStatCons === 1)
					return "Completed";
				if (busStatCons === 2 && busStatCode === 6)
					return "Running_fine" ;
				if (busStatCons === 2 && busStatCode > 7) {
					if (fatalStep === true )
						return "Stopped_manual_intervention";
					else
						return "Running_with_error";
				}
				if (busStatCons === 3)
					return "Stopped_with_error";
			}
			else 
				runStatus = "Completed";
		} 
		else 
			runStatus = "Cancelled";
		return runStatus;
	}
	async computeRunStatus(dReason,endTime,pDefName, criticalStatiLower)  // can still work for higher levels above C step
	{
		// calculate Run status of higher level or Config step 
		let runStatus = "Running_fine";
		if (dReason == "null") { // no delete reason
			if (endTime == "null")
			{
				//if (pDefName.includes("MANUAL_INTERVENTION"))  // former concept stopped from May 2020 !!
					//runStatus = "Stopped_manual_intervention";
				//else
					runStatus = "Running_fine";
			} 
			else
				runStatus = "Completed";
		} 
		else 
			runStatus = "Cancelled";
		return runStatus;
	}
	queryFlowableInstance(url)
	{
		// A generic method to GET call for Flowable historic APIs
		var ret = {};
		return axios.get(url,{ auth: {username: flow_username , password: flow_password} })
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

module.exports=BuildLevelJson;
