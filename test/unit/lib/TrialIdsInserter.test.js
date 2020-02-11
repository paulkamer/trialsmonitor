const expect = require('chai').expect;
const sinon = require('sinon');

const DbHelper = require('./../../../src/DbHelper');
const TrialIdsInserter = require('../../../src/TrialIdsInserter');

describe('TrialIdsInserter', () => {
  const trialIds = ['NTC001', 'NCT002'];

  let dbHelperStub;
  let inserter;

  context('Valid input', () => {
    // Stub the DbHelper so there is no dependency on DynamoDB
    before(() => {
      dbHelperStub = sinon.stub(DbHelper.prototype, 'insertTrialId');
      dbHelperStub.callsFake(() => {
        return Promise.resolve(true);
      });
    });

    it('inserts trials', async () => {
      inserter = new TrialIdsInserter();
      const result = await inserter.insertTrials(trialIds);

      expect(result).to.eql([true,true]);
    });

    after(() => {
      dbHelperStub.restore();
    });
  });


  context('Invalid input', () => {
    const invalidTrialIds = [{}, 12345];

    // Stub the DbHelper so there is no dependency on DynamoDB
    before(() => {
      dbHelperStub = sinon.stub(DbHelper.prototype, 'insertTrialId');
      dbHelperStub.callsFake(() => {
        return Promise.resolve(false);
      });
    });

    // Test invalid trials.
    it('Handles invalid trials', async () => {
      inserter = new TrialIdsInserter();
      const result = await inserter.insertTrials(invalidTrialIds);

      expect(result).to.eql([false,false]);
    });

    after(() => {
      dbHelperStub.restore();
    });
  });
});