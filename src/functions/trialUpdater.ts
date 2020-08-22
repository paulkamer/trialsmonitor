import TrialUpdater from '../TrialUpdater';
import logger from '../lib/logger';
import { TrialId } from '../../types';

/**
 * Fetch the lastest version of the given trial from the ClinicalTrials.gov API and update the trial in the DB.
 */
const handle = async (trialId: TrialId) => {
  logger.debug('[functionTrialUpdater.handle] trialId:', trialId);

  const updater = new TrialUpdater();
  const result = await updater.updateTrial(trialId);

  if (!result) {
    logger.debug(`[functionTrialUpdater] Saving trial ${trialId} failed`);
    return false;
  }

  return trialId;
};

module.exports = { handle };
