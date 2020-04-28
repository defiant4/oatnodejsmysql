var express = require("express");
var db = require("../db/database");
var {BuildMaster,BuildActivity,BuildStatus,BuildComment} =require("../domain/oatuidb-manager");
var dbCache = require("../domain/db-cache-class"); //make a nodejs cache
var routerDB = express.Router();

//handles url http://localhost:6001/builds
routerDB.get("/get/showcache", (req, res, next) => {
	// dump the current cache
	if (!dbCache)
		res.status(200).json({"CachePresent":"Failure"}); // return from here itself
	let cacheData = {"CachePresent":"Success", "Cache":dbCache.dumpCache()}; // its an array
	//cacheCopy["CachePresent"] = "Success";
	res.status(200).json(cacheData);
});    

//handles url http://localhost:6001/builds
routerDB.get("/get/buildmaster", (req, res, next) => {
	// read it from cache if available and applicable
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
routerDB.post("/post/buildmaster", (req, res, next) => {

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
routerDB.get("/get/buildmaster/:build_id", (req, res, next) => {
	let eid = req.params.build_id;
	// read it from cache if available
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
routerDB.post("/delete/buildmaster", (req, res, next) => {

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
routerDB.put('/put/buildmaster/:build_id',(req, res, next) => {
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
routerDB.get("/get/buildactivity", (req, res, next) => {

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
routerDB.post("/post/buildactivity", (req, res, next) => {

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
routerDB.get("/get/buildactivity/:build_id", (req, res, next) => {
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
routerDB.put('/put/buildactivity/:id',(req, res, next) => {
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
routerDB.get("/get/buildstatus", (req, res, next) => {

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
routerDB.post("/post/buildstatus", (req, res, next) => {

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
routerDB.get("/get/buildstatus/:build_id", (req, res, next) => {
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
routerDB.put('/put/buildstatus/:id',(req, res, next) => {
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
routerDB.get("/get/buildcomment", (req, res, next) => {

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
routerDB.post("/post/buildcomment", (req, res, next) => {

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
routerDB.get("/get/buildcomment/:build_id", (req, res, next) => {
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
routerDB.get("/get/buildcomment/:build_id/:processInstanceId", (req, res, next) => {
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
routerDB.put('/put/buildcomment/:id',(req, res, next) => {
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

module.exports = routerDB;
