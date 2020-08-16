const NewTrialsChecker = require('../NewTrialsChecker');
const { logger } = require('../lib/logger');

const DbHelper = require('../lib/Db');

/**
 * Find new trials, using the stored search queries in the "seaches_<env>"
 * table, and insert new ones in the trials DB
 */
const handle = async () => {
  const db = new DbHelper();

  let result;
  try {
    await db.connect();
    const newTrialsChecker = new NewTrialsChecker(db);

    result = await newTrialsChecker.findAndAddNewTrials();
  } finally {
    db.disconnect();
  }

  logger.debug('NewTrialsChecker result', result);

  return result;
};

module.exports = { handle };
