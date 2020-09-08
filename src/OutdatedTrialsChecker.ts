import ClinicalTrialsApi from './lib/ClinicalTrialsApi';
import logger from '../src/lib/logger';
import IDbHelper from './lib/Db/IDbHelper';
import { TrialId, Trial, ClinicalTrialsTrial } from '../types';

class OutdatedTrialsChecker {
  db: IDbHelper;

  constructor(db: IDbHelper) {
    this.db = db;
  }

  /**
   * Returns a list of trialIds that are outdated in our DB. i.e. they were updated on
   * ClinicalTrials.gov
   */
  async listOutdatedTrials() {
    const api = new ClinicalTrialsApi();

    // Fetch all trials, grouped by id
    const trials = await this.db.listTrials();

    const trialsById = trials.reduce<Record<TrialId, Trial>>((r, t) => {
      r[t.trialId] = t;
      return r;
    }, {});

    // Fetch the LastUpdateSubmitDate for all trials
    const trialRecords = await api.listTrialsForUpdateCheck(Object.keys(trialsById));

    return this.determineOutdatedTrials(trialsById, trialRecords?.StudyFields || []);
  }

  /**
   * Determine which trials are outdated in our database.
   *
   * @param {*} trialsById Trials in our database indexed by id
   * @param {Array} trials list of trials from clinicaltrials.gov with their LastUpdateSubmitDate
   */
  determineOutdatedTrials(trialsById: { [Key: string]: Trial }, trials: ClinicalTrialsTrial[]) {
    const outdatedTrials: TrialId[] = [];

    trials.forEach((trial) => {
      let trialId: TrialId;
      let isOutdated = false;
      try {
        trialId = trial.NCTId[0];

        // Convert 'LastUpdateSubmitDate' (format "January 23, 2020") to UNIX timestamp
        const lastUpdatePosted = new Date(trial.LastUpdateSubmitDate[0]).getTime() / 1000;

        isOutdated = trialsById[trialId]?.lastUpdated < lastUpdatePosted;

        if (isOutdated) outdatedTrials.push(trialId);
      } catch (e) {
        logger.error('Failed to determine isOutdated', e);
      }
    });

    return {
      results: outdatedTrials,
      results_length: outdatedTrials.length, // Necessary for Choice state, which cant simply check the array length
    };
  }
}

export default OutdatedTrialsChecker;
