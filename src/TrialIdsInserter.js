const { logger } = require('../src/lib/logger');

/**
 * Handler for inserting trial IDs, for new trials to monitor
 */
class TrialIdsInserter {
  constructor(db) {
    this.db = db;
  }

  async insertTrials(trialIds) {
    let results = [];
    try {
      results = await Promise.all(trialIds.map(trialId => this.db.insertTrialId(trialId)));
    } catch (e) {
      logger.error(e);
    }

    return results;
  }
}

module.exports = TrialIdsInserter;
