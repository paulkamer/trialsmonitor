const expect = require('chai').expect;

const OutdatedTrialsChecker = require('../../../src/OutdatedTrialsChecker');

describe('OutdatedTrialsChecker', () => {
  const testTrials = {
    'NTC001': {
      current: (new Date('2020-01-31').getTime() / 1000),
      new: '2020-02-01' // Newer, so should be returned as an outdated trial
    },
    'NTC002': {
      current: (new Date('2020-02-01').getTime() / 1000),
      new: '2020-02-01' // Same date. Should not be returned as outdated
    },
    // The 'new' date is older that the current date. Should not be returned as outdated.
    // This *should* never happen as/ ClinicalTrials will always publish a new
    //  version, if, for example, a previous version contains an error
    'NTC003': {
      current: (new Date('2020-02-01').getTime() / 1000),
      new: '2020-01-01'
    },
    // Invalid 'new' date; Should not be returned as outdated
    'NTC004': {
      current: (new Date('2020-02-01').getTime() / 1000),
      new: null
    },
    // Invalid 'current' date; Should not be returned as outdated. we must have a
    //   record in our DB for a trial already
    'NTC005': {
      current: null,
      new: '2020-01-01'
    },
  };

  const trialsToCheck = Object.entries(testTrials)
                              .reduce((o, [trialId, trial]) => ({ ...o, [trialId]: { lastUpdated: trial.current } }), {});

  const trials = [
    {
      NCTId: Object.keys(testTrials),
      LastUpdatePostDate: Object.entries(testTrials).map(([, trial]) => trial.new)
    }
  ];


  let checker;

  context('Determining outdated trials', () => {
    it('determines outdated trials', async () => {
      checker = new OutdatedTrialsChecker();
      const result = checker.determineOutdatedTrials(trialsToCheck, trials);

      // Only one trial, the first, is outdated.
      expect(result).to.eql([Object.keys(testTrials)[0]]);
    });
  });
});