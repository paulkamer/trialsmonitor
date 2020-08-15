const dotenv = require('dotenv');

dotenv.config();
dotenv.config({ path: 'dev.env' });

if (process.env.NODE_ENV === 'test') dotenv.config({ path: 'test.env' });

module.exports = {
  dbType: process.env.DB_TYPE,
  mongodbDbName: process.env.MONGODB_DB_NAME,
  mongodbTrialsCollection: process.env.TRIALS_COLL,
  mongodbTrialSearchesCollection: process.env.SEARCHES_COLL,

  mongdodbEndpointUri: process.env.MONGO_ENDPOINT_URI,

  accessControlAllowOrigin: process.env.ACCESS_CONTROL_ALLOW_ORIGIN,
};
