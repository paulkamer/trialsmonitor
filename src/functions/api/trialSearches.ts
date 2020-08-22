import { APIGatewayEvent } from 'aws-lambda';

import config from '../../config';
import db from '../../lib/Db';
import logger from '../../lib/logger';

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
const createTrialSearch = async (event: APIGatewayEvent) => {
  logger.info('trialSearches#create');

  let searchQuery: string;

  // Determine the trialIds to insert.
  try {
    if (typeof event.body === 'string') {
      searchQuery = JSON.parse(event.body).query;
    } else {
      throw new Error('Cannot parse event body');
    }
  } catch (e) {
    logger.error(e);
    return formatResponse([]);
  }
  logger.debug(`trialSearches#create - searchQuery: ${searchQuery}`);

  let insertResult;
  try {
    await db.connect();
    insertResult = await db.insertSearchQuery(searchQuery);
  } finally {
    db.disconnect();
  }

  const results: string[] = [];
  if (insertResult) results.push(searchQuery);

  return formatResponse(results);
};

/**
 * Delete a trial search record from the DB
 * @param {*} event
 */
const deleteTrialSearch = async (event: APIGatewayEvent) => {
  logger.info('trialSearches#deleteTrialSearch');

  const id = event.pathParameters?.id;

  if (!id) {
    logger.error(new Error('No id found'));
    return formatResponse();
  }

  let deleteResult;
  try {
    await db.connect();
    deleteResult = await db.deleteSearchQuery(id);
  } finally {
    db.disconnect();
  }

  const results: string[] = [];
  if (deleteResult) results.push(id);

  return formatResponse(results);
};

/**
 * Fetch trials from the DB
 */
async function fetchAllSearches() {
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
function formatResponse(results: any[] = []) {
  let statusCode = 200;

  if (results.length === 0) statusCode = 400;

  const response = {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': config.accessControlAllowOrigin,
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      results_count: results.length,
      results,
    }),
  };

  return response;
}

export { getAll, createTrialSearch, deleteTrialSearch };
