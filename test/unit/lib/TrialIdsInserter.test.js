const expect = require('chai').expect;
const sinon = require('sinon');

const MongoDbHelper = require('../../../src/lib/Db');
const TrialIdsInserter = require('../../../src/TrialIdsInserter');

describe('TrialIdsInserter', () => {
  const trialIds = ['NTC001', 'NCT002'];

  const db = new MongoDbHelper();
  let dbHelperStub;
  let inserter;

  context('Valid input', () => {
    before(() => {
      dbHelperStub = sinon.stub(db, 'insertTrialId').returns(Promise.resolve(true));
    });

    it('inserts trials', async () => {
      inserter = new TrialIdsInserter(db);
      const result = await inserter.insertTrials(trialIds);

      expect(result).to.eql([true, true]);
    });

    after(() => {
      dbHelperStub.restore();
    });
  });

  context('Invalid input', () => {
    const invalidTrialIds = [{}, 12345];

    before(() => {
      dbHelperStub = sinon.stub(db, 'insertTrialId').returns(Promise.resolve(false));
    });

    // Test invalid trials.
    it('Handles invalid trials', async () => {
      inserter = new TrialIdsInserter(db);
      const result = await inserter.insertTrials(invalidTrialIds);

      expect(result).to.eql([false, false]);
    });

    after(() => {
      dbHelperStub.restore();
    });
  });
});
