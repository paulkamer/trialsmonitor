import UpdatesNotifier from '../UpdatesNotifier';
import db from '../lib/Db';
import logger from '../lib/logger';
import { TrialId } from '../../types';

/**
 * Email a summary of the updated trials
 *
 * @param {TrialId[]} input A list of updated trial IDs
 */
const handle = async (trialIds: TrialId[]) => {
  logger.debug('[functionUpdatesNotifier.handle] event:', JSON.stringify(trialIds, null, 2));

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
