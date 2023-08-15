import DB from '../src';

const testDB = new DB('pis', 1, [
  { name: 'test', options: { keyPath: 'name' } },
]);

/**
 * search数据库
 * @class
 */
export default class DBExtend {
  constructor(name) {
    this.tableName = name;
  }

  add(value, key) {
    return testDB.add(this.tableName, value, key);
  }

  put(value, key) {
    return testDB.put(this.tableName, value, key);
  }

  addOrPut(value, searchKey, key) {
    return testDB.addOrPut(this.tableName, value, searchKey, key);
  }

  clear() {
    return testDB.clear(this.tableName);
  }

  remove(key) {
    return testDB.remove(this.tableName, key);
  }

  count(key) {
    return testDB.count(this.tableName, key);
  }

  getIndex(indexName, key) {
    return testDB.getIndex(this.tableName, indexName, key);
  }

  getIndexCount(indexName, key) {
    return testDB.getIndexCount(this.tableName, indexName, key);
  }

  removeIndex(indexName, key) {
    return testDB.removeIndex(this.tableName, indexName, key);
  }

  getKey(name) {
    return testDB.getKey(this.tableName, name);
  }

  get(key) {
    return testDB.get(this.tableName, key);
  }

  getAll(query, count) {
    return testDB.getAll(this.tableName, query, count);
  }

  getAllKeys(query, count) {
    return testDB.getAllKeys(this.tableName, query, count);
  }

  close() {
    return testDB.close();
  }
}
