const expect = require('chai').expect;
const sinon = require('sinon');

const deleteTrialFunction = require('../../../functions/deleteTrial');
const DbHelper = require('../../../src/DbHelper');

describe('deleteTrial', () => {
  let deleteTrialsStub;

  /**
   * Test the function with valid input
   */
  context('Valid input', () => {
    const trialId = 'NTC001';
    const result = [true];

    // Stub the deleteTrials method so there is no dependency on DynamoDB
    before(() => {
      deleteTrialsStub = sinon.stub(DbHelper.prototype, 'deleteTrials');
      deleteTrialsStub.callsFake(input => {
        expect(input[0]).to.eq(trialId);

        return Promise.resolve(result);
      });
    });

    it('success', async () => {
      const event = { body: { trialId } };
      const context = {};
      const callback = () => {};
      const expectedResponseBody = JSON.stringify({
        results_count: 1,
      });

      const response = await deleteTrialFunction.handle(event, context, callback);

      expect(response.statusCode).to.eq(200);
      expect(response.body).to.eq(expectedResponseBody);
    });

    after(() => {
      deleteTrialsStub.restore();
    });
  });

  context('Invalid input', () => {
    it('failure', async () => {
      const event = {};
      const context = {};

      const response = await deleteTrialFunction.handle(event, context);

      expect(response.statusCode).to.eq(400);
      expect(response.body).to.eq(
        JSON.stringify({
          results_count: 0,
        })
      );
    });
  });
});
