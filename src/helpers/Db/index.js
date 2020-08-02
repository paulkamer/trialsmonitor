const DynamoDbHelper = require('./DynamoDb');
const MongoDbHelper = require('./MongoDb');
const { dbType } = require('../../config');

let dbHelper;
switch (dbType) {
  case 'mongodb': {
    dbHelper = MongoDbHelper;
    break;
  }
  default: {
    dbHelper = DynamoDbHelper;
  }
}

module.exports = dbHelper;
