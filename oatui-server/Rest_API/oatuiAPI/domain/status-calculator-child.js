var db = require("../db/database");
//var BuildStatusJson = require("../domain/statuscalculator");
var BuildStatusJson2 = require("../domain/statuscalculator2");
process.on('message', async (messageObj) => {
	try{
		console.log('Message from parent:' + JSON.stringify(messageObj));
		// process JSON from mpids and store in dbCache
		var computedJSON = {};
		var mid = new BuildStatusJson2(messageObj["mpid"]);
		computedJSON = await mid.outputjson();
		var cacheObj = {"mpid" : messageObj["mpid"], "build_id": messageObj["build_id"], "buildJSON" : computedJSON};
		process.send(cacheObj);
		
		let doDBUpdate = false;  // currently disable it
		// update in status Table -- to be discontinued -- needs to be handled by 
		if (doDBUpdate)
		{
			var finalJSON = JSON.stringify(computedJSON);
			var tmStamp = "" + computedJSON["Master_Info"]["Timestamp_JSON"];
			var buildId = messageObj["build_id"];
			var update = messageObj["ifUpdate"] == "false" ? false : true ;
	
			let sqlStatus = `SELECT * FROM <build status table>`;
			if (update) {
				let sqlUpdate = `UPDATE <build status table> SET status_JSON='${finalJSON}',Timestamp_CET='${tmStamp}' WHERE build_id='${buildId}'`;
				db.query(sqlUpdate, (err, data)=> {
					if(!err){
						console.log("Update in statusTable successfull");
					}
					else
						console.log("Update error_message:"+ err.sqlMessage);
					
					console.log("Exit child after update");
				});
			}
			else 
			{
				let sqlInsert = `INSERT INTO <build status table>(build_id,status_JSON,Timestamp_CET) VALUES ('${buildId}','${finalJSON}','${tmStamp}')`;
				db.query(sqlInsert, (err, data)=> {
					if(!err){
						console.log("Insert in statusTable successfull");
					}
					else
						console.log("Insert error_message:"+ err.sqlMessage);
					
					console.log("Exit child after insert");
				});
			}
		}
		process.exit();  // exit finally
	}
	catch(err){
		console.log("Exception in status-calculator-child:"+err.message);
		process.exit();
	}
});
