const NewTrialsChecker = require('../NewTrialsChecker');
const { logger } = require('../lib/logger');

const DbHelper = require('../helpers/Db');

/**
 * Find new trials, using the stored search queries in the "seaches_<env>"
 * table, and insert new ones in the trials DB
 */
const handle = async () => {
  const db = new DbHelper();
  await db.connect();

  const searcher = new NewTrialsChecker(db);
  const result = await searcher.findAndAddNewTrials();

  db.disconnect();

  logger.debug('NewTrialsChecker result', result);

  return result;
};

module.exports = { handle };
