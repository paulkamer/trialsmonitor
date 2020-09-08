import { expect } from 'chai';
import sinon, { SinonStub } from 'sinon';

import db from '../../../src/lib/Db';
import * as trialsFunction from '../../../src/functions/api/trials';

describe('insertTrial', () => {
  let dbStub: SinonStub;

  /**
   * Test the function with valid input
   */
  context('Valid input', () => {
    const trialIds = ['NTC001', 'NCT002'];
    const result = [true, true];

    before(() => {
      dbStub = sinon.stub(db, 'insertTrialIds');
      dbStub.callsFake((input) => {
        trialIds.forEach((id, i) => {
          expect(input[i]).to.eq(id);
        });

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
      dbStub.restore();
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
