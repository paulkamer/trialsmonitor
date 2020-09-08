require('dotenv').config({ path: `${__dirname}/../../test.env` });

import { expect } from 'chai';
import { seedDb } from './dbHelper';
import db from '../../src/lib/Db';

import * as trialsFunction from '../../src/functions/api/trials';
import { APIGatewayEvent } from 'aws-lambda';

describe('trialsFunction', async () => {
  beforeEach(async () => {
    await seedDb();
  });

  describe('getAll', async () => {
    it('Lists the trials that are in the DB', async () => {
      const response = await trialsFunction.getAll();

      expect(response.statusCode).to.eq(200);

      const parsedBody = JSON.parse(response.body);
      expect(parsedBody.results_count).to.be.at.least(
        2,
        'At least 2 trials should be in the database'
      );
    });
  });

  describe('deleteTrialFunction', async () => {
    const testTrialId = 'bbbbbbbbbbbbbbbbbbbbbbbb';

    describe('deleteTrialFunction', async () => {
      it('Successfully deletes a trial', async () => {
        await db.connect();
        const trialsBefore = await db.listTrials();
        await db.disconnect();

        const numberOfTrialsBefore = trialsBefore.length;

        const event: any = { body: JSON.stringify({ trialId: testTrialId }) };
        const expectedResponseBody = JSON.stringify({
          results_count: 1,
          results: [true],
        });

        const response = await trialsFunction.deleteTrial(event);

        expect(response.statusCode).to.eq(200);
        expect(response.body).to.eq(expectedResponseBody);

        await db.connect();
        const trialsAfter = await db.listTrials();
        await db.disconnect();

        const numberOfTrialsAfter = trialsAfter.length;

        expect(numberOfTrialsBefore).to.be.above(numberOfTrialsAfter);
      });
    });
  });
});
