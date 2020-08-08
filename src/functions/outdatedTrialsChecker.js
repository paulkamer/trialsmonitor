const OutdatedTrialsChecker = require('../OutdatedTrialsChecker');
const { logger } = require('../lib/logger');
const DbHelper = require('../helpers/Db');

/**
 * Check for outdated Clinical Trials.
 * Schedules follow-up Lambda for each stale/new Trial.
 */
const handle = async () => {
  const db = new DbHelper();

  let outdatedTrials;
  try {
    await db.connect();

    const checker = new OutdatedTrialsChecker(db);
    outdatedTrials = await checker.listOutdatedTrials();
  } catch (e) {
    logger.error(e);
  } finally {
    await db.disconnect();
  }

  logger.debug('outdatedTrials', outdatedTrials);

  return outdatedTrials;
};

module.exports = { handle };
