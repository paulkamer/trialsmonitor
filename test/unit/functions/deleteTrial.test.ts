import sinon from 'sinon';
import { expect } from 'chai';
import { APIGatewayEvent } from 'aws-lambda';

import * as trialFunction from '../../../src/functions/api/trials';
import db from '../../../src/lib/Db';

describe('deleteTrial', () => {
  let deleteTrialsStub;

  /**
   * Test the function with valid input
   */
  context('Valid input', () => {
    const trialId = 'NTC001';
    const result = [true];

    before(() => {
      deleteTrialsStub = sinon.stub(db, 'deleteTrials');
      deleteTrialsStub.callsFake((input) => {
        expect(input[0]).to.eq(trialId);

        return Promise.resolve(result);
      });
    });

    it('success', async () => {
      const event: any = { body: JSON.stringify({ trialId }) };
      const expectedResponseBody = JSON.stringify({
        results_count: 1,
        results: [true],
      });

      const response = await trialFunction.deleteTrial(event);

      expect(response.statusCode).to.eq(200);
      expect(response.body).to.eq(expectedResponseBody);
    });

    after(() => {
      deleteTrialsStub.restore();
    });
  });

  context('Invalid input', () => {
    it('failure', async () => {
      const event: any = {};

      const response = await trialFunction.deleteTrial(event);

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

module.exports = {};
