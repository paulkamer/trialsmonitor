import logger from '../lib/logger';
import NewTrialsChecker from '../NewTrialsChecker';

import db from '../lib/Db';

/**
 * Find new trials, using the stored search queries in the "seaches_<env>"
 * table, and insert new ones in the trials DB
 */
const handle = async () => {
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

export { handle };
