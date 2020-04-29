//var dbCache = require("../domain/db-cache-class"); //make a nodejs cache
var db = require("../db/database");
var BuildStatusJson = require("../domain/statuscalculator");
process.on('message', async (messageObj) => {

	try{
	console.log('Message from parent:' + JSON.stringify(messageObj));
	//process.send('Greetings');
	// process JSON from mpids and store in dbCache
	var mid = new BuildStatusJson(messageObj["mpid"]);
	var computedJSON = await mid.outputjson();
	var cacheArr = messageObj["cache"];
	cacheArr.push({mpid : messageObj["mpid"], JSONtree : computedJSON});
	process.send(cacheArr);
	//await dbCache.set(messageObj["mpid"],computedJSON);
	//console.log("DB cache updated");
	var finalJSON = JSON.stringify(computedJSON);
	
	console.log("Timestamp:" + computedJSON["Master_Info"]["Timestamp_JSON"]);
	// update in status Table
	var tmStamp = "" + computedJSON["Master_Info"]["Timestamp_JSON"];
	var buildId = messageObj["build_id"];
	var update = messageObj["ifUpdate"] == "false" ? false : true ;
	
	let sqlStatus = `SELECT * FROM OATUI.OAT_UI_BUILD_STATUS`;
	if (update) {
		let sqlUpdate = `UPDATE OATUI.OAT_UI_BUILD_STATUS SET status_JSON='${finalJSON}',Timestamp_CET='${tmStamp}' WHERE build_id='${buildId}'`;
		db.query(sqlUpdate, (err, data)=> {
			if(!err){
				console.log("Update in statusTable successfull");
			}
			else {
				console.log("Update error_message:"+ err.sqlMessage);
			}
			console.log("Exit child after update");
			process.exit();
		});
	}
	else 
	{
		let sqlInsert = `INSERT INTO OATUI.OAT_UI_BUILD_STATUS(build_id,status_JSON,Timestamp_CET) VALUES ('${buildId}','${finalJSON}','${tmStamp}')`;
		db.query(sqlInsert, (err, data)=> {
			if(!err){
				console.log("Insert in statusTable successfull");
			}
			else {
				console.log("Insert error_message:"+ err.sqlMessage);
			}
			console.log("Exit child after insert");
			process.exit();
		});
	}
	}
	catch(err){
	console.log("ERROR:"+err.message);
	process.exit();
}
 
});

