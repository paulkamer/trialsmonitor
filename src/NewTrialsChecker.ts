import IDbHelper from './lib/Db/IDbHelper';
import { TrialSearch, TrialId } from '../types';

import ClinicalTrialsApi from './lib/ClinicalTrialsApi';
import logger from '../src/lib/logger';
import { StudyFieldsResponse } from '../types/StudyFieldsResponse';

/**
 * Find new trials, using stored search queries in the searchqueries_<env> DB table.
 *
 * 1. Fetch all search queries from the DB
 * 2. For each search query, fetch all NCTId's
 * 3. Make list of found NCTId's unique
 * 4. Fetch all NCTId's from our database
 * 5. Determine which NCTId's are missing in our DB
 * 6. Add new NCTId's to our DB
 */
class NewTrialsChecker {
  db: IDbHelper;
  clinicalTrialsApi: ClinicalTrialsApi;

  constructor(db: IDbHelper) {
    this.db = db;

    this.clinicalTrialsApi = new ClinicalTrialsApi();
  }

  async findAndAddNewTrials() {
    const searchQueries = await this.fetchSearchQueries();
    if (!searchQueries.length) return {};

    // Fetch NCT id's from ClinicalTrials.gov API for the given search queries
    const nctIdsByQuery = await this.findNctIdsByQueries(searchQueries);
    if (!Object.keys(nctIdsByQuery).length) {
      logger.debug('No NCT IDs were found for the search queries');
      return {};
    }

    // Make list of trial IDs unique
    const allUniqueNctIds = this.uniqueNctIds(nctIdsByQuery);

    // Fetch all trials we have
    const trials = await this.db.listTrials();

    const currentNctIds = trials.map((t) => t.trialId);

    // Check if there are new trials
    const newNctIds = this.determineMissingNctIds(allUniqueNctIds, currentNctIds);

    let insertResult;
    if (newNctIds.length) {
      // Insert new trial IDs into our DB
      insertResult = await this.db.insertTrialIds(newNctIds);
    } else {
      logger.debug('No new trials were found');
    }

    // TODO: using nctIdsByQuery, update all trial.searchqueries to add missing search terms

    // Only return NCT ids when all new trial IDs were inserted successfully into the DB
    const results = insertResult && insertResult.length === newNctIds.length ? newNctIds : [];

    return {
      results,
      results_length: results.length, // Necessary for Choice state, which cant simply check the array length
    };
  }

  /**
   * Retrieve all search queries from the DB.
   */
  async fetchSearchQueries(): Promise<TrialSearch[]> {
    return await this.db.listSearchQueries();
  }

  /**
   * Fetch all NCTId's for the given search queries from the ClinicalTrials.gov API.
   */
  async findNctIdsByQueries(searchQueries: TrialSearch[]): Promise<{ [key: string]: TrialId[] }> {
    const nctIdsByQuery: { [key: string]: TrialId[] } = {};

    const results = await Promise.all(
      searchQueries.map(async (searchQuery) => {
        const searchResult = await this.clinicalTrialsApi.findTrials(searchQuery.query, 'NCTId');

        if (searchResult) return searchResult;
      })
    );

    results.forEach((r: StudyFieldsResponse | undefined) => {
      if (r) nctIdsByQuery[r.Expression] = r.StudyFields.map((s) => s.NCTId[0]);
    });

    return nctIdsByQuery;
  }

  /**
   * Return unique list of NCTId's
   */
  uniqueNctIds(nctIdsByQuery: { [key: string]: TrialId[] }): string[] {
    let nctIds: TrialId[] = [];

    Object.keys(nctIdsByQuery).forEach((k) => {
      nctIds = nctIds.concat(nctIdsByQuery[k]);
    });

    return [...new Set(nctIds)];
  }

  /**
   * Filter out trial IDs we already have from the list of trial Ids we found for
   * our search queries.
   */
  determineMissingNctIds(allUniqueNctIds: string[], currentNctIds: string[]): string[] {
    return allUniqueNctIds.filter((id) => !currentNctIds.includes(id));
  }
}

export default NewTrialsChecker;
