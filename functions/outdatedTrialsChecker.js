const OutdatedTrialsChecker = require('../src/OutdatedTrialsChecker');

/**
 * Check for outdated Clinical Trials.
 * Schedules follow-up Lambda for each stale/new Trial.
 */
const handle = async () => {
  const checker = new OutdatedTrialsChecker();
  const outdatedTrials = await checker.listOutdatedTrials();

  console.debug('outdatedTrials', outdatedTrials);

  return outdatedTrials;
};

module.exports = { handle };
