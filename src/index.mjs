import CustomLog from './utils/log.mjs';

const dbLog = new CustomLog('DB');

/**
 * 数据库
 * @class
 */
export default class DB {
  /**
   * 初始化数据
   * @param {string} name 数据库名称
   * @param {number} [version=1] 数据库版本
   * @param {object[]=} [tables=[]] 初始化数据库参数
   * @param {string} tables[].name 表名称
   * @param {object=} tables[].options 初始化表参数
   * @param {object[]=} [tables[].indexList=[]] 索引列表
   * @param {string} tables[].indexList[].name 索引名称
   * @param {object=} tables[].indexList[].options 索引参数
   */
  constructor(name, version = 1, tables = []) {
    this.name = name;
    this.version = version;
    this.tables = tables;
  }

  init({
    debug = false,
  }) {
    this.debug = debug;
    return new Promise((res, rej) => {
      const request = window.indexedDB.open(this.name, this.version);
      request.onerror = (event) => {
        rej(event);
        this.debug && dbLog.danger(`${this.name}数据库打开报错`);
        this.deleteDB(this.name).then(() => {
          this.init();
        });
      };
      request.onsuccess = () => {
        res(request.result);
        this.db = request.result;
        this.debug && dbLog.success(`${this.name}数据库打开成功`);
      };
      request.onupgradeneeded = (event) => {
        this.debug && dbLog.primary(`数据库升级，名称：${this.name}， 版本: ${this.version}`);
        const db = event.target.result;
        this.tables.forEach(({ name, options, indexList = [] }) => {
          let objectStore;
          if (!db.objectStoreNames.contains(name)) {
            objectStore = db.createObjectStore(name, options); // 生成主键 {keyPath: 'id'}
            indexList.forEach(({ name: indexName, options: indexOptions }) => {
              objectStore.createIndex(indexName, indexName, indexOptions);
            });
          }
        });
        // 尝试加载对象存储之前检查版本更改事务是否完成
        const { transaction } = event.target;
        transaction.oncomplete = (event) => {
          this.db = event.target.result;
          res(event.target.result);
        };
      };
    });
  }

  add(storeName, value, key) {
    return new Promise((res, rej) => {
      if (!this.db) rej();
      const request = this.db
        .transaction([storeName], 'readwrite')
        .objectStore(storeName)
        .add(value, key);
      request.onsuccess = (event) => {
        res(value, key);
        this.debug && dbLog.success(`${storeName}_${key}:${JSON.stringify(value)}写入成功`);
      };
      request.onerror = (event) => {
        rej(event);
        this.debug && dbLog.danger(`${storeName}_${key}:${JSON.stringify(value)}写入失败`);
      };
    });
  }

  put(storeName, value, key) {
    return new Promise((res, rej) => {
      if (!this.db) rej();
      const request = this.db
        .transaction([storeName], 'readwrite')
        .objectStore(storeName)
        .put(value, key);
      request.onsuccess = (event) => {
        res(value, key);
        this.debug && dbLog.success(`${storeName}_${key}:${JSON.stringify(value)}更新成功`);
      };
      request.onerror = (event) => {
        rej(event);
        this.debug && dbLog.danger(`${storeName}_${key}:${JSON.stringify(value)}更新失败`);
      };
    });
  }

  addOrPut(storeName, value, searchKey, key) {
    return (searchKey ? this.get(storeName, searchKey) : this.get(storeName))
      .then((data) => {
        if (data !== undefined) {
          return this.put(storeName, value, key);
        }
        return this.add(storeName, value, key);
      }).catch((err) => {
        console.log(err);
        return this.add(storeName, value, key);
      });
  }

  clear(storeName) {
    return new Promise((res, rej) => {
      if (!this.db) rej();
      const objectStore = this.db.transaction(storeName, 'readwrite').objectStore(storeName);
      const request = objectStore.clear();
      request.onsuccess = (event) => {
        res(event);
        this.debug && dbLog.success(`${objectStore.name}数据清除成功`);
      };
      request.onerror = (event) => {
        rej(event);
        this.debug && dbLog.danger(`${objectStore.name}数据清除失败`);
      };
    });
  }

  remove(storeName, key) {
    return new Promise((res, rej) => {
      if (!this.db) rej();
      const request = this.db
        .transaction([storeName], 'readwrite')
        .objectStore(storeName)
        .delete(key);
      request.onsuccess = (event) => {
        res(event);
        this.debug && dbLog.success(`${storeName}_${key}:删除成功`);
      };
      request.onerror = (event) => {
        rej(event);
        this.debug && dbLog.danger(`${storeName}_${key}:删除失败`);
      };
    });
  }

  count(storeName, key) {
    return new Promise((res, rej) => {
      if (!this.db) rej();
      const transaction = this.db.transaction([storeName]);
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.count(key);

      request.onerror = (event) => {
        res(0);
        this.debug && dbLog.danger(`${storeName}_${key}:获取数量失败`);
      };

      request.onsuccess = (event) => {
        res(request.result);
      };
    });
  }

  getIndex(storeName, indexName, key) {
    const transaction = this.db.transaction([storeName]);
    const objectStore = transaction.objectStore(storeName);
    const index = objectStore.index(indexName);
    const request = index.getAll(key);
    return new Promise((res, rej) => {
      if (!this.db) rej();
      request.onerror = (event) => {
        rej(event);
        this.debug && dbLog.danger(`${storeName}_${indexName}:获取${key}失败`);
      };
      request.onsuccess = (event) => {
        if (request.result) {
          res(request.result);
          this.debug && dbLog.success(`${storeName}_${indexName}_${key}:${JSON.stringify(request.result)}`);
        } else {
          res(undefined);
          this.debug && dbLog.warning(`${storeName}_${indexName}_${key}:未获得数据记录`);
        }
      };
    });
  }

  getIndexCount(storeName, indexName, key) {
    const transaction = this.db.transaction([storeName]);
    const objectStore = transaction.objectStore(storeName);
    const index = objectStore.index(indexName);
    const request = index.count(key);
    return new Promise((res, rej) => {
      if (!this.db) rej();
      request.onerror = (event) => {
        res(0);
        this.debug && dbLog.danger(`${storeName}_${indexName}_${key}:获取数量失败`);
      };
      request.onsuccess = (event) => {
        res(request.result);
        this.debug && dbLog.success(`${storeName}_${indexName}_${key}:${request.result}`);
      };
    });
  }

  removeIndex(storeName, indexName, key) {
    const transaction = this.db.transaction([storeName], 'readwrite');
    const objectStore = transaction.objectStore(storeName);
    const index = objectStore.index(indexName);
    const request = index.openKeyCursor(IDBKeyRange.only(key));
    return new Promise((res, rej) => {
      if (!this.db) rej();
      request.onerror = (event) => {
        rej(event);
        this.debug && dbLog.danger(`${storeName}_${indexName}:获取${key}失败`);
      };
      request.onsuccess = async (event) => {
        if (request.result) {
          const cursor = request.result;
          if (cursor) {
            objectStore.delete(cursor.primaryKey);
            await cursor.continue();
            res(cursor);
          }
        } else {
          res(undefined);
          this.debug && dbLog.warning(`${storeName}_${indexName}_${key}:未获得数据记录`);
        }
      };
    });
  }

  getKey(storeName, value) {
    return new Promise((res, rej) => {
      if (!this.db) rej();
      const transaction = this.db.transaction([storeName]);
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.getKey(value);
      request.onerror = (event) => {
        rej(event);
      };
      request.onsuccess = (event) => {
        if (request.result) {
          res(request.result);
        } else {
          res(undefined);
        }
      };
    });
  }

  get(storeName, key) {
    return new Promise((res, rej) => {
      if (!this.db) rej();
      const transaction = this.db.transaction([storeName]);
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.get(key);

      request.onerror = (event) => {
        rej(event);
        this.debug && dbLog.danger(`获取${storeName}_${key}失败`);
      };

      request.onsuccess = (event) => {
        if (request.result !== undefined) {
          res(request.result);
        } else {
          res(undefined);
          this.debug && dbLog.warning(`${storeName}_${key}:未获得数据记录`);
        }
      };
    });
  }

  getAll(storeName, query, count) {
    return new Promise((res, rej) => {
      if (!this.db) rej();
      const objectStore = this.db.transaction(storeName).objectStore(storeName);
      const request = objectStore.getAll(query, count);
      request.onsuccess = (event) => {
        res(event.target.result);
      };
      request.onerror = (event) => {
        res([]);
      };
    });
  }

  getAllKeys(storeName, query, count) {
    return new Promise((res, rej) => {
      if (!this.db) rej();
      const objectStore = this.db.transaction(storeName).objectStore(storeName);
      const request = objectStore.getAllKeys(query, count);
      request.onsuccess = (event) => {
        res(event.target.result);
      };
      request.onerror = (event) => {
        res([]);
      };
    });
  }

  close() {
    return new Promise((res, rej) => {
      if (!this.db) rej();
      this.db.onclose = (event) => {
        res(event);
        this.debug && dbLog.danger(`${this.name}数据库关闭`);
      };
      this.db.close();
    });
  }

  deleteDB(name) {
    return new Promise((res, rej) => {
      const request = window.indexedDB.deleteDatabase(name);
      request.onerror = (event) => {
        rej(event);
        this.debug && dbLog.danger(`${name}数据库删除失败`);
      };

      request.onsuccess = (event) => {
        res(event);
        this.debug && dbLog.success(`${name}数据库删除成功`);
      };
    });
  }
}
