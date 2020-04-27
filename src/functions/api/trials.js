const TrialIdsInserter = require('../../TrialIdsInserter');
const DbHelper = require('../../DbHelper');
const { logger } = require('../../lib/logger');

/**
 * Get a single trial
 *
 * @param {*} event
 */
const get = async (event) => {
  logger.log('info', 'trials.get');

  const trialId = event.pathParameters.id;

  const results = [];

  if (trialId) {
    const db = new DbHelper();
    const trial = await db.fetchTrial(trialId);
    if (trial) results.push(db.normalizeTrial(trial));
  }

  return formatResponse(results);
};

/**
 * List trials
 *
 * @todo support requesting specific attributes of trials
 * @param {*} event
 */
const getAll = async (event) => {
  logger.log('info', 'trials.getAll');

  let limit = null;
  try {
    if (event.query && event.query.limit) {
      limit = Number(event.query.limit);
      if (limit <= 0) limit = null;
    }
  } catch (e) {
    console.error(e);
  }

  const trials = await new DbHelper().listTrials(['id','title','lastUpdated','phase'], { orderBy: 'lastUpdated', sortDirection: 'desc', limit });

  // Format & send response
  return formatResponse(trials);
};

/**
 * Insert a new trialId(s) into the trials table in DynamoDB, to start monitoring it.
 *
 * @param {*} event
 */
const createTrial = async event => {
  let trialIds = [];

  // Determine the trialIds to insert.
  try {
    if (typeof event.body === 'string') {
      trialIds = JSON.parse(event.body).trialIds;
    } else if (event.body && Array.isArray(event.body.trialIds)) {
      trialIds = event.body.trialIds;
    } else {
      throw new Error('Cannot parse event body');
    }
  } catch (e) {
    logger.error(e);
  }

  let results = [];
  if (trialIds.length === 0) {
    logger.debug('[functionInsertTrial] No trial IDs received');
  } else {
    // Insert the trial IDs
    const inserter = new TrialIdsInserter();
    results = await inserter.insertTrials(trialIds);
  }

  // Format & send response
  return formatResponse(results);
};

/**
 * Delete a trial
 *
 * @param {*} event
 */
const deleteTrial = async (event) => {
  const trialId = extractTrialIdFromEvent(event);

  let results = [];

  if (trialId) {
    const db = new DbHelper();

    results = await db.deleteTrials([trialId]);
  }

  // Format & send response
  return formatResponse(results);
};

/**
 * Extract the trial ID from the event.
 *
 * @param {Object|String} event
 */
function extractTrialIdFromEvent(event) {
  let trialId;
  try {
    if (typeof event.body === 'string') {
      trialId = JSON.parse(event.body).trialId;
    } else if (event.body && event.body.trialId) {
      trialId = event.body.trialId;
    } else {
      throw new Error('Cannot parse event body');
    }
  } catch (e) {
    logger.error(e);
  }

  return trialId;
}

/**
 * Format response; determine if/how many failed.
 */
function formatResponse(results) {
  let statusCode = 200;

  if (results.length === 0) statusCode = 400;

  const response = {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      results_count: Object.keys(results).length,
      results: Object.values(results),
    }),
  };

  return response;
}

module.exports = { get, getAll, createTrial, deleteTrial };
