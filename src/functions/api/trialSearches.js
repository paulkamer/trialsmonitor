const DbHelper = require('../../lib/Db');
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
const createTrialSearch = async event => {
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
    return formatResponse([]);
  }
  logger.debug(`trialSearches#create - searchQuery: ${searchQuery}`);

  const db = new DbHelper();

  let insertResult;
  try {
    await db.connect();
    insertResult = await db.insertSearchQuery(searchQuery);
  } finally {
    db.disconnect();
  }

  const results = [];
  if (insertResult) results.push(searchQuery);

  return formatResponse(results);
};

/**
 * Delete a trial search record from the DB
 * @param {*} event
 */
const deleteTrialSearch = async event => {
  logger.info('trialSearches#deleteTrialSearch');

  const id = event.pathParameters.id;

  if (!id) {
    logger.error(new Error('No id found'));
    return formatResponse();
  }

  const db = new DbHelper();

  let deleteResult;
  try {
    await db.connect();
    deleteResult = await db.deleteSearchQuery(id);
  } finally {
    db.disconnect();
  }

  const results = [];
  if (deleteResult) results.push(id);

  return formatResponse(results);
};

/**
 * Fetch trials from the DB
 */
async function fetchAllSearches() {
  const db = new DbHelper();

  let searches;
  try {
    await db.connect();
    searches = await db.listSearchQueries();
  } finally {
    db.disconnect();
  }

  return searches;
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
