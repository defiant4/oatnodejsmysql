class BuildMaster {
	//BuildMaster DB table
	constructor(build_id,ECS_key,SID,build_status,mpid) {
		this.build_id=build_id;
		this.ECS_key=ECS_key;
		this.SID=SID;
		this.build_status=build_status;
		this.mpid = mpid;
	}
	getAddBuildSQL() {
		let sql = `INSERT INTO OATUI.OAT_UI_BUILD_MASTER(build_id, ECS_key, SID, build_status,mpid) VALUES ('${this.build_id}','${this.ECS_key}','${this.SID}','${this.build_status}','${this.mpid}')`;
		return sql;           
	}
	static getBuildByIdSQL(build_id) {
		let sql = `SELECT * FROM OATUI.OAT_UI_BUILD_MASTER WHERE build_id = '${build_id}'`;
		return sql;           
	}
	//static deleteBuildByIdSQL(build_id) {
	//  let sql = `DELETE FROM OATUI.OAT_UI_BUILD_MASTER WHERE (build_id = '${build_id}')`;
	//return sql;           
	// }
	static getAllBuildSQL() {
		let sql = `SELECT * FROM OATUI.OAT_UI_BUILD_MASTER`;
		return sql;           
	}   

	static updateBuildByIdSQL(build_id, ECS_key, SID, build_status, mpid){
		let sql = `UPDATE OATUI.OAT_UI_BUILD_MASTER SET ECS_key='${ECS_key}', SID='${SID}', build_status='${build_status}', mpid='${mpid}' WHERE build_id='${build_id}'`;
		return sql;
	}
};
//BuildActivity DB table
class BuildActivity {

	constructor(build_id,Activity,Step,Phase,Subphase,Scenario,Timestamp_CET,Result,processInstanceId,processDefName,processStartTime,UserId,UserFullName) {
		this.build_id=build_id;
		this.Activity=Activity;
		this.Step=Step;
		this.Phase=Phase;
		this.Subphase=Subphase;
		this.Scenario=Scenario;
		this.Timestamp_CET=Timestamp_CET;
		this.Result=Result;
		this.processInstanceId=processInstanceId;
		this.processDefName=processDefName;
		this.processStartTime=processStartTime;
		this.UserId=UserId;
		this.UserFullName = UserFullName;
	}
	getAddBuildSQL() {
		let sql = `INSERT INTO OATUI.OAT_UI_BUILD_ACTIVITY(build_id,Activity,Step,Phase,Subphase,Scenario,Timestamp_CET,Result,processInstanceId,processDefName,processStartTime,UserId,UserFullName) VALUES ('${this.build_id}','${this.Activity}','${this.Step}','${this.Phase}','${this.Subphase}','${this.Scenario}','${this.Timestamp_CET}','${this.Result}','${this.processInstanceId}','${this.processDefName}','${this.processStartTime}','${this.UserId}','${this.UserFullName}')`;
		return sql;
	}
	static getBuildByIdSQL(build_id) {
		let sql = `SELECT * FROM OATUI.OAT_UI_BUILD_ACTIVITY WHERE build_id = '${build_id}'`;
		return sql;
	}
	// static deleteBuildByIdSQL(build_id) {
	// let sql = `DELETE FROM OATUI.OAT_UI_BUILD_MASTER WHERE (build_id = '${build_id}')`;
	// return sql;
	// }
	static getAllBuildSQL() {
		let sql = `SELECT * FROM OATUI.OAT_UI_BUILD_ACTIVITY`;
		return sql;
	}

	static updateBuildByIdSQL(id,Activity,Step,Phase,Subphase,Scenario,Timestamp_CET,Result,processInstanceId,processDefName,processStartTime,UserId,UserFullName){
		let sql = `UPDATE OATUI.OAT_UI_BUILD_ACTIVITY SET build_id='${build_id}',Activity='${Activity}',Step='${Step}',Phase='${Phase}',Subphase='${Subphase}',Scenario='${Scenario}',Timestamp_CET='${Timestamp_CET}',Result='${Result}',processInstanceId='${processInstanceId}',processDefName='${processDefName}',processStartTime='${processStartTime}',UserId='${UserId}', UserFullName='${UserFullName}' WHERE id='${id}'`;
		return sql;
	}
};

//BuildStatus DB table
class BuildStatus {

	constructor(build_id,status_JSON,Timestamp_CET) {
		this.build_id=build_id;
		this.status_JSON=status_JSON;
		this.Timestamp_CET=Timestamp_CET;
	}
	getAddBuildSQL() {
		let sql = `INSERT INTO OATUI.OAT_UI_BUILD_STATUS(build_id,status_JSON,Timestamp_CET) VALUES ('${this.build_id}','${this.status_JSON}','${this.Timestamp_CET}')`;
		return sql;
	}
	static getBuildByIdSQL(build_id) {
		let sql = `SELECT * FROM OATUI.OAT_UI_BUILD_STATUS WHERE build_id = '${build_id}'`;
		return sql;
	}
	// static deleteBuildByIdSQL(build_id) {
	//   let sql = `DELETE FROM OATUI.OAT_UI_BUILD_MASTER WHERE (build_id = '${build_id}')`;
	// return sql;
	// }

	static getAllBuildSQL() {
		let sql = `SELECT * FROM OATUI.OAT_UI_BUILD_STATUS`;
		return sql;
	}

	static updateBuildByIdSQL(id,build_id,status_json,Timestamp_CET){
		let sql = `UPDATE OATUI.OAT_UI_BUILD_STATUS SET build_id='${build_id}',status_JSON='${status_JSON}',Timestamp_CET='${Timestamp_CET}' WHERE id='${id}'`;
		return sql;
	}
};

//BuildComment DB table
class BuildComment {

	constructor(build_id,Comment,Step,Phase,Subphase,Scenario,processInstanceId,Timestamp_CET,UserId,UserFullName) {
		this.build_id=build_id;
		this.Comment=Comment;
		this.Step=Step;
		this.Phase=Phase;
		this.Subphase=Subphase;
		this.Scenario=Scenario;
		this.processInstanceId=processInstanceId;
		this.Timestamp_CET=Timestamp_CET;
		this.UserId=UserId;
		this.UserFullName = UserFullName;
	}
	getAddBuildSQL() {
		let sql = `INSERT INTO OATUI.OAT_UI_BUILD_COMMENT(build_id,Comment,Step,Phase,Subphase,Scenario,processInstanceId,Timestamp_CET,UserId,UserFullName) VALUES ('${this.build_id}','${this.Comment}','${this.Step}','${this.Phase}','${this.Subphase}','${this.Scenario}','${this.processInstanceId}','${this.Timestamp_CET}','${this.UserId}','${this.UserFullName}')`;
		return sql;
	}
	static getBuildByIdSQL(build_id) {
		let sql = `SELECT * FROM OATUI.OAT_UI_BUILD_COMMENT WHERE build_id = '${build_id}'`;
		return sql;
	}
	static getBy_BuildId_instIdSQL(build_id, processInstanceId) {
		let sql = `SELECT * FROM OATUI.OAT_UI_BUILD_COMMENT WHERE build_id = '${build_id}' and processInstanceId = '${processInstanceId}'`;
		return sql;
	}
	// static deleteBuildByIdSQL(build_id) {
	//   let sql = `DELETE FROM OATUI.OAT_UI_BUILD_COMMENT WHERE (build_id = '${build_id}')`;
	// return sql;
	// }
	static getAllBuildSQL() {
		let sql = `SELECT * FROM OATUI.OAT_UI_BUILD_COMMENT`;
		return sql;
	}

	static updateBuildByIdSQL(id,build_id,Comment,Step,Phase,Subphase,Scenario,processInstanceId,Timestamp_CET,UserId,UserFullName){
		let sql = `UPDATE OATUI.OAT_UI_BUILD_COMMENT SET build_id='${build_id}',Comment='${Comment}',Step='${Step}',Phase='${Phase}',Subphase='${Subphase}',Scenario='${Scenario}',processInstanceId='${processInstanceId}',Timestamp_CET='${Timestamp_CET}',UserId='${UserId}',UserFullName='${UserFullName}' WHERE id='${id}'`;
		return sql;
	}
};

module.exports= {BuildMaster,BuildActivity,BuildStatus,BuildComment};