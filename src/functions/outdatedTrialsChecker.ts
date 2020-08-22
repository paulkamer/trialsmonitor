import OutdatedTrialsChecker from '../OutdatedTrialsChecker';
import logger from '../lib/logger';
import db from '../lib/Db';

/**
 * Check for outdated Clinical Trials.
 * Schedules follow-up Lambda for each stale/new Trial.
 */
const handle = async () => {
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
