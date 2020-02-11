const TrialIdsInserter = require('../src/TrialIdsInserter');

/**
 * Insert a new trialId(s) into the trials table in DynamoDB, to start monitoring it.
 *
 * @param {*} event
 */
const handle = async (event) => {
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
    console.error(e);
  }

  let results = [];
  if (trialIds.length === 0) {
    console.debug('[functionInsertTrial] No trial IDs received');
  } else {
    // Insert the trial IDs
    const inserter = new TrialIdsInserter();
    results = await inserter.insertTrials(trialIds);
  }

  // Format & send response
  return formatResponse(trialIds.length, results);
};

/**
 * Format response; determine if/how many failed.
 */
function formatResponse (numTrialsReceived, results) {
  let numFailed = 0;

  let statusCode = 200;
  if (!results || !results.length) {
    numFailed = numTrialsReceived;
  } else {
    numFailed = results.filter(res => res === false).length;
  }

  if (numTrialsReceived === 0 || numFailed > 0) statusCode = 400;

  if (numFailed > 0) console.debug(`[functionInsertTrial] ${numFailed} failed to insert`);

  const response = {
    statusCode,
    body: JSON.stringify({
      trialsReceived: numTrialsReceived,
      trialsInserted: (numTrialsReceived - numFailed),
    }),
    isBase64Encoded: false,
  };

  return response;
};

module.exports = { handle };
