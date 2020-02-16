const expect = require('chai').expect;
const sinon = require('sinon');

const DbHelper = require('./../../../src/DbHelper');
const UpdatesNotifier = require('../../../src/UpdatesNotifier');

describe('UpdatesNotifier', () => {
  const testTrialIds = ['NCT001'];

  const testTrials = [
    {
      id: { S: 'NTC001' },
      title: { S: null },
      acronym: { S: 'T1' },
      phase: { S: 'Phase 2' },
      studyStatus: { S: 'Active, not recruiting' },
    },
  ];

  let notifier;
  let dbHelperStub;

  context('notify()', () => {
    before(() => {
      dbHelperStub = sinon.stub(DbHelper.prototype, 'fetchTrials');
      dbHelperStub.callsFake(() => {
        return Promise.resolve(false);
      });
    });

    it('Abort sending when trials cannot be found', async () => {
      notifier = new UpdatesNotifier(testTrialIds);
      const result = await notifier.notify();

      expect(result).to.eq(false);
    });

    after(() => {
      dbHelperStub.restore();
    });
  });

  context('prepareEmailParameters', () => {
    it('formats email parameters', async () => {
      notifier = new UpdatesNotifier(testTrialIds);
      const result = await notifier.prepareEmailParameters(testTrials);

      expect(result).to.have.property('subject');
      expect(result).to.have.property('htmlBody');

      expect(result.htmlBody).to.include(testTrials[0].id.S);
    });

    it('formats lines of updated trials', () => {
      notifier = new UpdatesNotifier(testTrialIds);
      const result = notifier.formatTrialLines({ trials: testTrials, lineEnd: '\n' });

      expect(result[0][0], 'Missing title should be replaced by question mark').to.eq('?');
    });
  });
});
