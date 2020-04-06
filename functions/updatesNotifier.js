const UpdatesNotifier = require('../src/UpdatesNotifier');
const { logger } = require('../lib/logger');

/**
 * Email a summary of the updated trials
 *
 * @param {String[]} input A list of updated trial IDs
 */
const handle = async trialIds => {
  logger.debug('[functionUpdatesNotifier.handle] event:', JSON.stringify(trialIds, null, 2));

  const notifier = new UpdatesNotifier(trialIds);

  return await notifier.notify();
};

module.exports = { handle };
