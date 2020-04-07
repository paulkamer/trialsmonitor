const TrialIdsInserter = require('../../src/TrialIdsInserter');
const DbHelper = require('../../src/DbHelper');
const { logger } = require('../../lib/logger');

/**
 * List trials
 *
 * @todo support requesting specific attributes of trials
 * @param {*} event
 */
const getAll = async () => {
  logger.log('info', 'trials.getAll');

  const trials = await new DbHelper().listTrials(['id','title','lastUpdated','phase']);

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
    body: JSON.stringify({
      results_count: Object.keys(results).length,
      results: Object.values(results),
    }),
  };

  return response;
}

module.exports = { getAll, createTrial, deleteTrial };
