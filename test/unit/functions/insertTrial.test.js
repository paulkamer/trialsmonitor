const expect = require('chai').expect;
const sinon = require('sinon');

const trialsFunction = require('../../../src/functions/api/trials');
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
        results_count: trialIds.length,
        results: [true, true],
      });

      const response = await trialsFunction.createTrial(event, context, callback);

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

      const response = await trialsFunction.createTrial(event, context);

      expect(response.statusCode).to.eq(400);
      expect(response.body).to.eq(
        JSON.stringify({
          results_count: 0,
          results: [],
        })
      );
    });
  });
});
