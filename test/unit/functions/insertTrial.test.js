const expect = require('chai').expect;
const sinon = require('sinon');

const insertTrial = require('../../../functions/insertTrial');
const TrialIdsInserter = require('../../../src/TrialIdsInserter');

describe('insertTrial', () => {
  let trialIdsInserterStub;

  /**
   * Test the function with valid input
   */
  context('Valid input', () => {
    const trialIds = ['NTC001', 'NCT002'];
    const result = [true, true];

    // Stub the TrialIdsInserter so there is no dependency on DynamoDB
    before(() => {
      trialIdsInserterStub = sinon.stub(TrialIdsInserter.prototype, 'insertTrials');
      trialIdsInserterStub.callsFake(input => {
        expect(input[0]).to.eq(trialIds[0]);
        expect(input[1]).to.eq(trialIds[1]);

        return Promise.resolve(result);
      });
    });

    it('success', async () => {
      const event = { body: { trialIds } };
      const context = {};
      const callback = () => {};
      const expectedResponseBody = JSON.stringify({
        trialsReceived: trialIds.length,
        trialsInserted: trialIds.length,
      });

      const response = await insertTrial.handle(event, context, callback);

      expect(response.statusCode).to.eq(200);
      expect(response.body).to.eq(expectedResponseBody);
    });

    after(() => {
      trialIdsInserterStub.restore();
    });
  });

  context('Invalid input', () => {
    it('failure', async () => {
      const event = {};
      const context = {};

      const response = await insertTrial.handle(event, context);

      expect(response.statusCode).to.eq(400);
      expect(response.body).to.eq(
        JSON.stringify({
          trialsReceived: 0,
          trialsInserted: 0,
        })
      );
    });
  });
});
