const DbHelper = require('./helpers/Db');
const { logger } = require('../src/lib/logger');

/**
 * Handler for inserting trial IDs, for new trials to monitor
 */
class TrialIdsInserter {
  async insertTrials(trialIds) {
    const db = new DbHelper();
    await db.connect();

    let results = [];
    try {
      results = await Promise.all(trialIds.map(trialId => db.insertTrialId(trialId)));
    } catch (e) {
      logger.error(e);
    } finally {
      await db.disconnect();
    }

    return results;
  }
}

module.exports = TrialIdsInserter;
