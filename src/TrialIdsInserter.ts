import logger from './lib/logger';
import IDbHelper from './lib/Db/IDbHelper';
import { TrialId } from '../types';

/**
 * Handler for inserting trial IDs, for new trials to monitor
 */
class TrialIdsInserter {
  db: IDbHelper;

  constructor(db: IDbHelper) {
    this.db = db;
  }

  async insertTrials(trialIds: Array<TrialId>): Promise<Array<boolean>> {
    let results: Array<boolean> = [];
    try {
      results = await Promise.all(trialIds.map((trialId) => this.db.insertTrialId(trialId)));
    } catch (e) {
      logger.error(e);
    }

    return results;
  }
}

export default TrialIdsInserter;
