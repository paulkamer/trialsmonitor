const DbHelper = require('../src/DbHelper');
const { logger } = require('../lib/logger');

/**
 * Delete a trial
 *
 * @param {*} event
 */
const handle = async (event) => {
  const trialId = extractTrialIdFromEvent(event);

  let results = [];

  if (trialId) {
    results = await deleteTrial(trialId);
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
 * Delete a trial from the DB
 * @param {String} trialId
 */
async function deleteTrial(trialId) {
  const db = new DbHelper();

  return await db.deleteTrials([trialId]);
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
    }),
    isBase64Encoded: false,
  };

  return response;
}

module.exports = { handle };
