const UpdatesNotifier = require('../UpdatesNotifier');
const DbHelper = require('../lib/Db');
const { logger } = require('../lib/logger');

/**
 * Email a summary of the updated trials
 *
 * @param {String[]} input A list of updated trial IDs
 */
const handle = async trialIds => {
  logger.debug('[functionUpdatesNotifier.handle] event:', JSON.stringify(trialIds, null, 2));

  const db = new DbHelper();

  try {
    await db.connect();
    const notifier = new UpdatesNotifier(db, trialIds);

    await notifier.notify();
  } finally {
    db.disconnect();
  }

  return true;
};

module.exports = { handle };
