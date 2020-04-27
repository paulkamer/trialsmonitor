const DbHelper = require('./DbHelper');
const { logger } = require('../src/lib/logger');

/**
 * Handler for inserting trial IDs, for new trials to monitor
 */
class TrialIdsInserter {
  async insertTrials(trialIds) {
    const db = new DbHelper();

    let results = [];
    try {
      results = await Promise.all(trialIds.map(trialId => db.insertTrialId(trialId)));
    } catch (e) {
      logger.error(e);
    }

    return results;
  }
}

module.exports = TrialIdsInserter;
