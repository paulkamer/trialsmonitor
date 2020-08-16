const expect = require('chai').expect;
const sinon = require('sinon');

const MongoDbHelper = require('../../../src/lib/Db/MongoDb');
const UpdatesNotifier = require('../../../src/UpdatesNotifier');

describe('UpdatesNotifier', () => {
  const testTrialIds = ['NCT001'];

  const testTrials = [
    {
      trialId: 'NTC001',
      title: null,
      acronym: 'T1',
      phase: 'Phase 2',
      studyStatus: 'Active, not recruiting',
    },
  ];

  let notifier;
  let dbHelperStub;

  const db = new MongoDbHelper();

  context('notify()', () => {
    before(() => {
      dbHelperStub = sinon.stub(db, 'fetchTrialsByTrialId').returns(Promise.resolve(false));
    });

    it('Abort sending when trials cannot be found', async () => {
      notifier = new UpdatesNotifier(db, testTrialIds);
      const result = await notifier.notify();

      expect(result).to.eq(false);
    });

    after(() => {
      dbHelperStub.restore();
    });
  });

  context('prepareEmailParameters', () => {
    it('formats email parameters', async () => {
      notifier = new UpdatesNotifier(null, testTrialIds);
      const result = await notifier.prepareEmailParameters(testTrials);

      expect(result).to.have.property('subject');
      expect(result).to.have.property('htmlBody');

      expect(result.htmlBody).to.include(testTrials[0].trialId);
    });

    it('formats lines of updated trials', () => {
      notifier = new UpdatesNotifier(null, testTrialIds);
      const result = notifier.formatTrialLines({ trials: testTrials, lineEnd: '\n' });

      expect(result[0][0], 'Missing title should be replaced by question mark').to.eq('?');
    });
  });
});
