import TrialUpdater from '../TrialUpdater';
import db from '../lib/Db';
import { TrialId } from '../../types';
import logger from '../lib/logger';

/**
 * Fetch the lastest version of the given trial from the ClinicalTrials.gov API and update the trial in the DB.
 */
const handle = async (trialId: TrialId) => {
  logger.debug('[functionTrialUpdater.handle] trialId:', trialId);

  await db.connect();

  const updater = new TrialUpdater(db);
  const result = await updater.updateTrial(trialId);

  await db.disconnect();

  if (!result) {
    logger.debug(`[functionTrialUpdater] Saving trial ${trialId} failed`);
    return false;
  }

  return trialId;
};

module.exports = { handle };
