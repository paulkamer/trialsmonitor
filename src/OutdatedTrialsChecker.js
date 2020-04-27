const DbHelper = require('./DbHelper');
const ClinicalTrialsApi = require('./ClinicalTrialsApi');
const { logger } = require('../src/lib/logger');

class OutdatedTrialsChecker {
  /**
   * Returns a list of trialIds that are outdated in our DB. i.e. they were updated on
   * ClinicalTrials.gov
   */
  async listOutdatedTrials() {
    const db = new DbHelper();
    const api = new ClinicalTrialsApi();

    // Fetch all trials, grouped by id, with the lastUpdated timestamp from dynamodb
    const trialsById = await db.listTrials();

    // Fetch the LastUpdateSubmitDate for all trials
    const trials = await api.listTrialsForUpdateCheck(Object.keys(trialsById));

    return this.determineOutdatedTrials(trialsById, trials);
  }

  /**
   * Determine which trials are outdated in our database.
   *
   * @param {*} trialsById Trials in our database indexed by id
   * @param {Array} trials list of trials from clinicaltrials.gov with their LastUpdatePostDate
   */
  determineOutdatedTrials(trialsById, trials) {
    const outdatedTrials = [];

    trials.forEach(trial => {
      let trialId;
      let isOutdated = false;
      try {
        trialId = trial.NCTId[0];

        // Convert 'LastUpdatePostDate' (format "January 23, 2020") to UNIX timestamp
        const lastUpdatePosted = new Date(trial.LastUpdatePostDate[0]).getTime() / 1000;

        isOutdated = trialsById[trialId].lastUpdated < lastUpdatePosted;
      } catch (e) {
        logger.error('Failed to determine isOutdated', trial, e);
      }

      if (isOutdated) outdatedTrials.push(trialId);
    });

    return {
      results: outdatedTrials,
      results_length: outdatedTrials.length, // Necessary for Choice state, which cant simply check the array length
    };
  }
}

module.exports = OutdatedTrialsChecker;
