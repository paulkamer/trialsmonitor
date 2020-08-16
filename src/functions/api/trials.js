const TrialIdsInserter = require('../../TrialIdsInserter');
const DbHelper = require('../../lib/Db');
const { logger } = require('../../lib/logger');
const config = require('../../config');

/**
 * Get a single trial
 *
 * @param {*} event
 */
const get = async event => {
  logger.log('info', 'trials.get');

  const trialId = event.pathParameters.id;

  const results = [];

  if (trialId) {
    const db = new DbHelper();
    await db.connect();

    let trial;

    try {
      trial = await db.fetchTrial(trialId);
    } finally {
      db.disconnect();
    }

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
const getAll = async event => {
  logger.log('info', 'trials.getAll');

  let limit = null;
  let pageNumber = 1;
  try {
    if (event.query && event.query.limit) {
      limit = Number(event.query.limit);
      if (limit <= 0) limit = null;
    }

    if (event.query && event.query.pageNumber) {
      pageNumber = Number(event.query.pageNumber);
      if (pageNumber <= 1) pageNumber = 1;
    }
  } catch (e) {
    logger.error(e);
  }

  const db = new DbHelper();
  await db.connect();

  const trials = await db.listTrials(['trialId', 'title', 'lastUpdated', 'phase', 'acronym'], {
    orderBy: 'lastUpdated',
    sortDirection: 'desc',
    limit,
    pageNumber,
  });

  const totalTrials = await db.countTrials();

  db.disconnect();

  // Format & send response
  return formatResponse(trials, { totalTrials, limit, pageNumber });
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

  const db = new DbHelper();

  let results = [];
  try {
    await db.connect();

    if (trialIds.length === 0) {
      logger.debug('[functionInsertTrial] No trial IDs received');
    } else {
      // Insert the trial IDs
      const inserter = new TrialIdsInserter(db);
      results = await inserter.insertTrials(trialIds);
    }
  } finally {
    db.disconnect();
  }

  // Format & send response
  return formatResponse(results);
};

/**
 * Insert a new trialId(s) into the trials table in DynamoDB, to start monitoring it.
 *
 * @param {*} event
 */
const updateTrial = async event => {
  let trial;

  const trialId = event.pathParameters.id;

  // Determine the trialIds to update.
  try {
    if (typeof event.body === 'string') {
      trial = JSON.parse(event.body).trial;
    } else if (event.body && event.body.trial) {
      trial = event.body.trial;
    } else {
      throw new Error('Cannot parse event body');
    }
  } catch (e) {
    logger.error(e);
  }

  const results = [];
  if (!trial) {
    logger.debug('[functionInsertTrial] No trial IDs received');
  } else {
    const db = new DbHelper();
    await db.connect();

    const result = await db.updateTrial(trialId, trial);

    db.disconnect();

    results.push(result);
  }

  // Format & send response
  return formatResponse(results);
};

/**
 * Delete a trial
 *
 * @param {*} event
 */
const deleteTrial = async event => {
  const trialId = extractTrialIdFromEvent(event);

  let results = 0;
  if (trialId) {
    const db = new DbHelper();

    try {
      await db.connect();

      results = await db.deleteTrials([trialId]);
    } finally {
      db.disconnect();
    }
  }

  // Format & send response
  return formatResponse(Array(results).fill(true));
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
function formatResponse(results, metadata = {}) {
  let statusCode = 200;

  if (results.length === 0) statusCode = 400;

  const body = {
    results_count: Object.keys(results).length,
    results: Object.values(results),
    ...metadata,
  };

  const response = {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': config.accessControlAllowOrigin,
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(body),
  };

  return response;
}

module.exports = { get, getAll, createTrial, updateTrial, deleteTrial };
