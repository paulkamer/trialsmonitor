import { expect } from 'chai';
import sinon from 'sinon';

import TrialIdsInserter from '../../../src/TrialIdsInserter';
import * as trialsFunction from '../../../src/functions/api/trials';

describe('insertTrial', () => {
  let trialIdsInserterStub;

  /**
   * Test the function with valid input
   */
  context('Valid input', () => {
    const trialIds = ['NTC001', 'NCT002'];
    const result = [true, true];

    before(() => {
      trialIdsInserterStub = sinon.stub(TrialIdsInserter.prototype, 'insertTrials');
      trialIdsInserterStub.callsFake((input) => {
        expect(input[0]).to.eq(trialIds[0]);
        expect(input[1]).to.eq(trialIds[1]);

        return Promise.resolve(result);
      });
    });

    it('success', async () => {
      const event: any = { body: JSON.stringify({ trialIds }) };
      const expectedResponseBody = JSON.stringify({
        results_count: trialIds.length,
        results: [true, true],
      });

      const response = await trialsFunction.createTrial(event);

      expect(response.statusCode).to.eq(200);
      expect(response.body).to.eq(expectedResponseBody);
    });

    after(() => {
      trialIdsInserterStub.restore();
    });
  });

  context('Invalid input', () => {
    it('failure', async () => {
      const event: any = { body: JSON.stringify({}) };

      const response = await trialsFunction.createTrial(event);

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
