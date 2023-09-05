# indexDBjs
A simple, lightweight JavaScript API for handling browser indexDB

## 使用

#### 初始化数据库
- dbName 数据名称
- version 数据库版本
- tables 表
  - name 表名
  - options 表设置
  - indexList 索引列表
~~~js
  import IndexDB from 'indexDBjs'

  const db = new IndexDB('test', 2, [
    { name: 'test', options: { keyPath: 'id' }  },
  ]);
  db.init({
    debug: true // 控制台打印
  })
~~~

### 操作数据
#### add新增数据
- tableName 表名
- value 数据
- [key] 可选
~~~js
db.add('test', {
  name: 'foo',
  gender: 'male',
  id: new Date().getTime()
})
~~~

#### put 更新或插入数据
- tableName 表名
- value 数据
- [key] 可选
~~~js
db.put('test', {
  name: 'foo',
  gender: 'male',
  id: new Date().getTime()
})
~~~

#### get 获取表数据

#### addOrPut

#### clear 清除表数据

#### remove 删除表

#### deleteDB 删除数据库
