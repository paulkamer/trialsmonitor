import config from '../../config';

import MongoDbHelper from './MongoDb';
import IDbHelper from './IDbHelper';

let dbHelper: IDbHelper;
switch (config.dbType) {
  case 'mongodb': {
    dbHelper = new MongoDbHelper();
    break;
  }
  default: {
    throw new Error(`Unsupported dbType: ${config.dbType}`);
  }
}

export default dbHelper;
