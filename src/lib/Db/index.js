const MongoDbHelper = require('./MongoDb');
const { dbType } = require('../../config');

let dbHelper;
switch (dbType) {
  case 'mongodb': {
    dbHelper = MongoDbHelper;
    break;
  }
  default: {
    throw new Error(`Unsupported dbType: ${dbType}`);
  }
}

module.exports = dbHelper;
