const TrialUpdater = require('../src/TrialUpdater');
const { logger } = require('../lib/logger');

/**
 * Fetch the lastest version of the given trial from the ClinicalTrials.gov API
 * and update the trial in DynamoDB.
 *
 * @param {String} trialId
 */
const handle = async trialId => {
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
