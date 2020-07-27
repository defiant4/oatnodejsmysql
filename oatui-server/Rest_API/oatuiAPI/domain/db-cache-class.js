// node cache
const NodeCache = require("node-cache");
//const dbCache1 = new NodeCache({stdTTL: 0, checkperiod: 0 });
// A single in-memory cache pattern for storing specific data in memory
class DataCache {
  constructor() {
	  this.dbCache1 = new NodeCache({ stdTTL: 0, checkperiod: 0});
  }
  getCache(key) {
	  return this.dbCache1.get(key);
  }
  setCache(key,dataJson) {
	  this.dbCache1.set(key, dataJson);
  }
  delCache(keys) {
	  this.dbCache1.del(keys);
  }
  dumpCache() {
	  return this.dbCache1.keys();
  }
  flushCache() {
	  return this.dbCache1.flushAll();
  }
}
const DBCache = new DataCache();
console.log("DB cache initialized");

module.exports = DBCache;