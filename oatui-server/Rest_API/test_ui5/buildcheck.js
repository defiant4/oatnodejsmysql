var axios = require('axios');

class BuildStatusJson
{
	constructor(webParamWInstanceId)
	{
	this.webParamWInstanceId=webParamWInstanceId;this.phaseName1="";
	 this.WJSON={};this.check=false;this.P_id="";this.ret=[];this.Pret=[];this.CArray1 = []; this.PJSON1=[];
        this.oatHost = "<server host url>";  // for test server
         this.criticalRunStati = ["Stopped_with_error","Stopped_manual_intervention"];
          this.P_anyCritError = false;
	this.S_anyCritError = false;
	this.A_anyCritError=false;
	}
	resultjson(WJSON,res)
	{
	console.log("Arnab:"+JSON.stringify(WJSON));
       //console.log("RES:"+ res);
	res.status(200).json(WJSON);
	
	}
	P_existcheck(check)
	{
	//console.log("CHECKTRUE:"+check);
	return check;
	}
	S_processTree1(ret)
	{	
	return ret;
	}
	P_processTree1(Pret)
         {
	//	console.log("PJSON:"+JSON.stringify(Pret));
         return Pret;
         }
	C_ProcessTree1(CArray1){
	return CArray1;
	}
	 outputjson(res)
	{
  	//console.log("RES:"+ res);
   	this.W_processTree(this.webParamWInstanceId,res); // for input W* parent id
	}
   	// call in loop for 3 W* cases
	 W_processTree(pid,res)  // would be called for Installation, Configuration & Quality individually
	{
		var self=this;
    	// pid is the super parent ID -- W* instance ID
		var url = this.oatHost + "/flowable-rest/service/history/historic-process-instances?processInstanceId=" + pid;
		this.queryFlowableInstance(url,this.callback1,self,res);
	}
	 A_processTree(pid,phaseName,res)
        {this.phaseName1=phaseName;
        // think about startTime & endTime and mark as 'Completed' if applicable -- check for 'deleteReason'
		var self=this;
		var url = this.oatHost + "/flowable-rest/service/history/historic-process-instances?superProcessInstanceId="+pid + "&sort=startTime&order=asc&size=500";
       		this.queryFlowableInstance(url,this.callback2,self,res);
	}
	 checkIfPExists(pid,res)
        {
	
		// check if P* processes exists
    	var self=this;
	this.P_id=pid;
	var url = this.oatHost + "/flowable-rest/service/history/historic-process-instances?superProcessInstanceId="+pid + "&sort=startTime&order=asc&size=500";
       	this.queryFlowableInstance(url,this.callback3,self,res);
    }  
     S_processTree(pid,res)        
	{
		// pid is Area/subphase process id  --  returns an array for hierarchyData" Node
		var self=this;
		var url = this.oatHost + "/flowable-rest/service/history/historic-process-instances?superProcessInstanceId="+pid + "&sort=startTime&order=asc&size=500";
       		this.queryFlowableInstance(url,this.callback4,self,res);
     	}
	P_processTree(pid,res)
    {//console.log("HELLO:"+pid);
		// pid is Scenario process id or in a recursive cycle parent P* process
	var self=this;
	var url = this.oatHost + "/flowable-rest/service/history/historic-process-instances?superProcessInstanceId="+pid + "&sort=startTime&order=asc&size=500";
       	this.queryFlowableInstance(url,this.callback5,self,res);
    }
 C_processTree(pid, CArray,res)
    {this.CArray1=CArray;
		// pid is PROCESS id or SCENARIO id OR in a recursive cycle parent C* process
		// keep appending CJSONs in input field -> CArray
	var self=this;
	var url = this.oatHost + "/flowable-rest/service/history/historic-process-instances?superProcessInstanceId="+pid + "&sort=startTime&order=asc&size=500";
       	this.queryFlowableInstance(url,this.callback6,self,res);
	}
 computeRunStatus(dReason,endTime,pDefName, criticalStatiLower)
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
 queryFlowableInstance(url,callback,self,res)
	{console.log("RES1:"+ res);
		// A generic method to GET call for Flowable historic APIs
		//var self = this;
		var ret = {};
		var flow_username = "<username>";  var flow_password = "<password>";
		axios.get(url,{ auth: {username: flow_username , password: flow_password}
		})
		.then(function(response){
		//console.log("222:" + self.name);
		//self.name=JSON.parse(JSON.stringify(response.data));
		//console.log("888:" + JSON.stringify(self.name));
		//this.name2=self.name;
		//self2.name1 = "arnab";
		ret=response.data;
		callback(ret,self,res);//console.log(ret);
		})
		.catch(function(error){
		ret = error;
                ret["Result_API"] = "Failure";
		});
	//	console.log("Check2:"+JSON.stringify(ret));
		//return data;
	}

callback1(data,self,res){
//console.log("Check1:"+JSON.stringify(data));
//this.queryret=JSON.parse(JSON.stringify(data));
data["Result_API"] = "Success";
if (data["Result_API"] == "Success")
{
//console.log("Check20:"+JSON.stringify(data));
	// processDefinitionName   //processDefinitionDescription  //processDefinitionId
	var phaseName = "" + data.data[0].processDefinitionDescription;
	var pDefName =  ""+data.data[0].processDefinitionName; var dRson = ""+data.data[0].deleteReason;
	var beginTime = ""+data.data[0].startTime;  var endTime = ""+data.data[0].endTime;
	var rStatus = self.computeRunStatus(dRson,endTime,pDefName);
	//console.log("PHASE:"+phaseName);	//console.log("RUNNING:"+rStatus);
	self.WJSON[phaseName]={};
	self.WJSON[phaseName]["Phase_Data"]={"name":phaseName, "FlowableDefinitionName" : data.data[0].processDefinitionName, 
			"FlowableInstanceId" : data.data[0].id,"processDefinitionId" : data.data[0].processDefinitionId, "Run Status" : rStatus};
	//console.log("check30:"+JSON.stringify(self.WJSON));
	self.A_processTree(self.webParamWInstanceId,phaseName,res); // linear call
}
//console.log("check30:"+JSON.stringify(self.WJSON));
//self.resultjson(self.WJSON,res);
}


callback2(data,self,res){
data["Result_API"] = "Success";
if (data["Result_API"] == "Success")
       	{
    		var AJSON_Arr = [];
   			self.WJSON[self.phaseName1]["Sub_Phase_Data"]=AJSON_Arr; // attaching sub-phases array here
   		//	console.log("AJSON array:" + JSON.stringify(self.WJSON));
   			for (var j=0; j<data.total; j++) {
  				var AJSON = {};
          		var aName = "" + data.data[0].processDefinitionDescription;  // only hard coded here ???
          		var pDefName =  ""+data.data[j].processDefinitionName; var dRson = ""+data.data[j].deleteReason;
        		var beginTime = ""+data.data[j].startTime;  var endTime = ""+data.data[j].endTime;
        		var rStatus = self.computeRunStatus(dRson,endTime,pDefName);
        		AJSON = {"name": aName, "FlowableDefinitionName" : "" + data.data[j].processDefinitionName,
					"FlowableInstanceId" : data.data[j].id, "processDefinitionId" : data.data[j].processDefinitionId, "Run Status" : rStatus };
        		self.A_anyCritError = false;
        		AJSON["hierarchyData"] = self.S_processTree(data.data[j].id,res); // call returns an array
        		if (self.A_anyCritError) {
  					AJSON["Run Status"] = "Running_with_error";
  					AJSON_Arr.push({"name": aName, "FlowableDefinitionName" : "" + data.data[j].processDefinitionName,
  						"FlowableInstanceId" : data.data[j].id, "processDefinitionId" : data.data[j].processDefinitionId, "Run Status" : "Running_with_error" });
  				} else {
        			AJSON_Arr.push({"name": aName, "FlowableDefinitionName" : "" + data.data[j].processDefinitionName,
					"FlowableInstanceId" : data.data[j].id, "processDefinitionId" : data.data[j].processDefinitionId, "Run Status" : rStatus });
  				}
        		
          		self.WJSON[phaseName][aName] = AJSON;
   			}
		}
	self.resultjson(self.WJSON,res);
	}

callback3(data,self,res){
data["Result_API"] = "Success";
if (data["Result_API"] == "Success"){
for (var j=0; j<data.total; j++)
      		{
      			var defName = "" + data.data[j].processDefinitionName;
      			if (defName.startsWith("P_"))   //if any P_ text matched
      			{
      				self.check = true;
      				break;
      			}
      		}
	}
self.P_existcheck(self.check);
}

callback4(data,self,res){
data["Result_API"] = "Success";
if (data["Result_API"] == "Success")
       	{
      		for (var j=0; j<data.total; j++) // looping through S* instances
      		{
      			var SJSON = {};var check1=false;
      			var pDefName =  ""+data.data[j].processDefinitionName; var dRson = ""+data.data[j].deleteReason;
        		var beginTime = ""+data.data[j].startTime;  var endTime = ""+data.data[j].endTime;
        		var rStatus = self.computeRunStatus(dRson,endTime,pDefName);
        		SJSON={"name" : ""+data.data[j].processDefinitionDescription, "FlowableDefinitionName" : pDefName, 
      					"FlowableInstanceId" : data.data[j].id, "processDefinitionId" : data.data[j].processDefinitionId, "Run Status" : rStatus};
      			// check if P* processes inside or direct C*steps
      			if (self.checkIfPExists(data.data[j].id,res) == undefined){
      				self.S_anyCritError = false;self.A_anyCritError= false;
      				SJSON["nodes"] = self.P_processTree(data.data[j].id,res); // call returns a JS array
				//console.log("NODES:"+JSON.stringify(SJSON));
      				if (self.S_anyCritError) {
      					SJSON["Run Status"] = "Stopped_with_error";
      					self.A_anyCritError = true; // propagate upwards
      				}
      			}
      			else {
      				// direct C* steps array
      				var CArray = []; // initialize empty array
      				self.P_anyCritError = false;
      				self.C_processTree(data.data[j].id,CArray,res); // call keeps appending elements in CArray
      				SJSON["ExecuteSteps"] = CArray;
      				if (self.P_anyCritError) {
      					SJSON["Run Status"] = "Stopped_with_error";
      					self.A_anyCritError = true;
      				}
      			}
      			self.ret.push(SJSON);
      		}
       	}
	self.S_processTree1(self.ret);
}


callback5(data,self,res){
data["Result_API"] = "Success";
if (data["Result_API"] == "Success")
       	{
		//console.log("Check20:"+JSON.stringify(data));
      		for (var j=0; j<data.total; j++)   // looping through P* instances
      		{
      			var PJSON = {};
      			var pDefName =  ""+data.data[j].processDefinitionName; var dRson = ""+data.data[j].deleteReason;
        		var beginTime = ""+data.data[j].startTime;  var endTime = ""+data.data[j].endTime;
        		var rStatus = self.computeRunStatus(dRson,endTime,pDefName);
        		PJSON={"name" : ""+data.data[j].processDefinitionDescription, "FlowableDefinitionName" : pDefName, 
      					"FlowableInstanceId" : data.data[j].id, "processDefinitionId" : data.data[j].processDefinitionId, "Run Status" : rStatus};
      	///	console.log("Check20:"+JSON.stringify(PJSON));	
      			// check if P* processes inside or direct C*steps
			//var test1=self.checkIfPExists(data.data[j].id,res);
      			if (self.checkIfPExists(data.data[j].id,res) != undefined)     // futuristic case ???
      			{
      				PJSON["nodes"] = self.P_processTree(data.data[j].id,res); // call returns a JS array -- recursive call
      			}
      			else {
      				// direct C* steps
      				var CArray = []; // empty initialize the array
      				self.P_anyCritError = false; self.S_anyCritError = false;
      				self.C_processTree(data.data[j].id, CArray,res); // call keeps appending elements in CArray
      				callback_Ptree(self.PJSON1,res);
      				//PJSON["ExecuteSteps"] = self.C_ProcessTree1(self.CArray1);
      				//console.log("CPJSON:"+JSON.stringify(PJSON));
      				if (self.P_anyCritError) {
      					PJSON["Run Status"] = "Stopped_with_error";
      					self.S_anyCritError = true; // propagate error upwards
      				}
      			}
      			self.Pret.push(PJSON);
      		}
       	}
	self.P_processTree1(self.Pret);

}



callback_Ptree(PJSON1,res)
{
	PJSON1["ExecuteSteps"] = self.C_ProcessTree1(self.CArray1);	
	console.log("CPJSON:"+JSON.stringify(PJSON));
	

}


callback6(data,self,res){
data["Result_API"] = "Success";
if (data["Result_API"] == "Success")
       	{
		//console.log("Check20:"+JSON.stringify(data));
    		if(data.total != 0){
	        	for (var j =0; j<data.total; j++){
	        		var pDefName =  ""+data.data[j].processDefinitionName; var dRson = ""+data.data[j].deleteReason;
	        		var beginTime = ""+data.data[j].startTime;  var endTime = ""+data.data[j].endTime;
	        		var rStatus = self.computeRunStatus(dRson,endTime,pDefName);
	        		if (self.criticalRunStati.includes(rStatus))
	        		{
	        			self.P_anyCritError = true;
	        			//alert("critical Error in C* step");
	        		}
	 				var CJSON={"Step": ""+data.data[j].processDefinitionDescription,"FlowableDefinitionName" : pDefName, 
	 					"FlowableInstanceId" : data.data[j].id,"processDefinitionId" : data.data[j].processDefinitionId, 
	 					"Run Status" : rStatus, "Last Executor" : data.data[j].startUserId, "Last Run" : data.data[j].startTime};
	 				self.CArray1.push(CJSON);
					console.log("Check20:"+JSON.stringify(self.CArray1));self.C_ProcessTree1(self.CArray1);
	 				self.C_processTree(data.data[j].id,self.CArray1,res);  // call recursively
                }
        	}
       	}

}

};

module.exports=BuildStatusJson;
