require('dotenv').config({path: `${__dirname}/../../.env.test`});

const expect = require('chai').expect;
const { spawnSync } = require( 'child_process' );

const DbHelper = require('../../src/DbHelper');
const deleteTrialFunction = require('../../functions/deleteTrial');

describe('deleteTrialFunction', () => {
  // (re-)seed the local DB
  beforeEach(() =>{
    spawnSync( '/usr/bin/serverless', [ 'dynamodb', 'seed' ] );
  });

  const testTrialId = 'NCT01023321';

  context('deleteTrialFunction', async () => {
    it('Successfully deletes a trial', async () => {
      const db = new DbHelper();

      const trialsBefore = await db.listTrials();
      const numberOfTrialsBefore = Object.keys(trialsBefore).length;

      const event = { body: { trialId: testTrialId } };
      const context = {};
      const callback = () => {};
      const expectedResponseBody = JSON.stringify({
        results_count: 1,
      });

      const response = await deleteTrialFunction.handle(event, context, callback);

      expect(response.statusCode).to.eq(200);
      expect(response.body).to.eq(expectedResponseBody);

      const trialsAfter = await db.listTrials();
      const numberOfTrialsAfter = Object.keys(trialsAfter).length;

      expect(numberOfTrialsBefore).to.be.above(numberOfTrialsAfter);
    });
  });
});
