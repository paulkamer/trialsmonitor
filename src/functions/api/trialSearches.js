const DbHelper = require('../../DbHelper');
const { logger } = require('../../lib/logger');

/**
 * List searches
 *
 * @param {*} event
 */
const getAll = async () => {
  logger.info('trialSearches#getAll');

  const searches = await fetchAllSearches();

  // Format & send response
  return formatResponse(searches);
};

/**
 * Add a new trial search query to the DB
 *
 * @param {*} event
 */
const createTrialSearch = async (event) => {
  logger.info('trialSearches#create');

  let searchQuery;

  // Determine the trialIds to insert.
  try {
    if (typeof event.body === 'string') {
      searchQuery = JSON.parse(event.body).query;
    } else if (event.body && event.body.query) {
      searchQuery = event.body.query;
    } else {
      throw new Error('Cannot parse event body');
    }
  } catch (e) {
    logger.error(e);
  }
  logger.debug(`trialSearches#create - searchQuery: ${searchQuery}`);

  const insertResult = await new DbHelper().insertSearchQuery(searchQuery);

  const results = [];
  if(insertResult) results.push(searchQuery);

  return formatResponse(results);
};

/**
 * Delete a trial search record from the DB
 * @param {*} event
 */
const deleteTrialSearch = async (event) => {
  logger.info('trialSearches#deleteTrialSearch');

  const id = event.pathParameters.id;

  if (!id) {
    logger.error(new Error('No id found'));
    return formatResponse();
  }

  const deleteResult = await new DbHelper().deleteSearchQuery(id);

  const results = [];
  if (deleteResult) results.push(id);

  return formatResponse(results);
};

/**
 * Fetch trials from the DB
 */
async function fetchAllSearches() {
  const db = new DbHelper();

  return await db.listSearchQueries();
}

/**
 * Format response
 */
function formatResponse(results = []) {
  let statusCode = 200;

  if (results.length === 0) statusCode = 400;

  const response = {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      results_count: results.length,
      results,
    }),
  };

  return response;
}

module.exports = { getAll, createTrialSearch, deleteTrialSearch };