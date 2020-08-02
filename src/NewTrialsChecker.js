const ClinicalTrialsApi = require('./ClinicalTrialsApi');
const TrialIdsInserter = require('./TrialIdsInserter');
const { logger } = require('../src/lib/logger');

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
  constructor(db) {
    this.db = db;

    this.clinicalTrialsApi = new ClinicalTrialsApi();
    this.trialIdsInserter = new TrialIdsInserter();
  }

  async findAndAddNewTrials() {
    const searchQueries = await this.fetchSearchQueries();
    if (!searchQueries.length) return false;

    // Fetch NCT id's from ClinicalTrials.gov API for the given search queries
    const allNctIdsForSearchQueries = await this.findNctIdsByQueries(searchQueries);
    if (!allNctIdsForSearchQueries.length) {
      logger.debug('No NCT IDs were found for the search queries');
      return false;
    }

    // Make list of trial IDs unique
    const allUniqueNctIds = this.uniqueNctIds(allNctIdsForSearchQueries);

    // Fetch all trials we have
    const trials = await this.db.listTrials();

    const currentNctIds = trials.map(t => t.trialId);

    // Check if there are new trials
    const newNctIds = this.determineMissingNctIds(allUniqueNctIds, currentNctIds);

    let insertResult;
    if (newNctIds.length) {
      // Insert new trial IDs into our DB
      insertResult = await this.trialIdsInserter.insertTrials(newNctIds);
    } else {
      logger.debug('No new trials were found');
    }

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
  async fetchSearchQueries() {
    return await this.db.listSearchQueries();
  }

  /**
   * Fetch all NCTId's for the given search queries from the ClinicalTrials.gov API.
   *
   * @param {Array} searchQueries
   */
  async findNctIdsByQueries(searchQueries) {
    let nctIds = [];

    const results = await Promise.all(
      searchQueries.map(async searchQuery => {
        return await this.clinicalTrialsApi.findTrials(searchQuery.query, ['NCTId']);
      })
    );
    results.forEach(searchQueryResults => {
      nctIds = nctIds.concat(searchQueryResults.map(trial => trial.NCTId[0]));
    });

    return nctIds;
  }

  /**
   * Return unique list of NCTId's
   * @param {Array} nctIds
   */
  uniqueNctIds(nctIds) {
    return [...new Set(nctIds)];
  }

  /**
   * Filter out trial IDs we already have from the list of trial Ids we found for
   * our search queries.
   *
   * @param {Array} allUniqueNctIds
   * @param {Array} currentNctIds
   */
  determineMissingNctIds(allUniqueNctIds, currentNctIds) {
    return allUniqueNctIds.filter(id => !currentNctIds.includes(id));
  }
}

module.exports = NewTrialsChecker;
