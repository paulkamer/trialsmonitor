import { APIGatewayEvent } from 'aws-lambda';

import TrialIdsInserter from '../../TrialIdsInserter';
import logger from '../../lib/logger';
import config from '../../config';
import db from '../../lib/Db';
import { Trial } from '../../../types';

/**
 * Get a single trial
 */
const get = async (event: APIGatewayEvent) => {
  logger.log('info', 'trials.get');

  const trialId = event.pathParameters?.id;

  const results: Trial[] = [];

  if (trialId) {
    await db.connect();

    let trial: Trial;

    try {
      trial = await db.fetchTrial(trialId);
    } finally {
      db.disconnect();
    }

    if (trial) results.push(trial);
  }

  return formatResponse(results);
};

/**
 * List trials
 *
 * @todo support requesting specific attributes of trials
 * @param {*} event
 */
const getAll = async (event: APIGatewayEvent) => {
  logger.log('info', 'trials.getAll');

  let limit: number | null = null;
  let pageNumber = 1;
  try {
    if (event.queryStringParameters?.limit) {
      limit = Number(event.queryStringParameters.limit);
      if (limit <= 0) limit = null;
    }

    if (event.queryStringParameters?.pageNumber) {
      pageNumber = Number(event.queryStringParameters.pageNumber);
      if (pageNumber <= 1) pageNumber = 1;
    }
  } catch (e) {
    logger.error(e);
  }

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
 * Insert new trialId(s) to start monitoring them.
 *
 * @param {*} event
 */
const createTrial = async (event: APIGatewayEvent) => {
  let trialIds = [];

  // Determine the trialIds to insert.
  try {
    if (typeof event.body === 'string') {
      trialIds = JSON.parse(event.body).trialIds || [];
    } else {
      throw new Error('Cannot parse event body');
    }
  } catch (e) {
    logger.error(e);
  }

  let results: Array<boolean> = [];
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

const updateTrial = async (event: APIGatewayEvent) => {
  let trial: Trial | null = null;

  const trialId = event.pathParameters?.id;

  // Determine the trialIds to update.
  try {
    if (typeof event.body === 'string') {
      trial = JSON.parse(event.body).trial;
    } else {
      throw new Error('Cannot parse event body');
    }
  } catch (e) {
    logger.error(e);
  }

  const results: Array<boolean> = [];
  if (!trial || !trialId) {
    logger.debug('[functionInsertTrial] No trial IDs received');
  } else {
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
const deleteTrial = async (event: APIGatewayEvent) => {
  const trialId = extractTrialIdFromEvent(event);

  let results = 0;
  if (trialId) {
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
function extractTrialIdFromEvent(event: APIGatewayEvent) {
  let trialId;
  try {
    if (typeof event.body === 'string') {
      trialId = JSON.parse(event.body).trialId;
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
function formatResponse(results: any[], metadata = {}) {
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

export { get, getAll, createTrial, updateTrial, deleteTrial };
