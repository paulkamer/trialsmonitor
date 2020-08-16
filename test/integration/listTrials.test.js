require('dotenv').config({ path: `${__dirname}/../../test.env` });

const expect = require('chai').expect;

const { seedDb } = require('./dbHelper');

const trialsFunction = require('../../src/functions/api/trials');
const DbHelper = require('../../src/lib/Db');

describe('trialsFunction', async () => {
  // (re-)seed the local DB
  beforeEach(async () => {
    await seedDb();
  });

  context('getAll', async () => {
    it('Lists the trials that are in the DB', async () => {
      const response = await trialsFunction.getAll({});

      expect(response.statusCode).to.eq(200);

      const parsedBody = JSON.parse(response.body);
      expect(parsedBody.results_count).to.be.at.least(
        2,
        'At least 2 trials should be in the database'
      );
    });
  });
});

describe('deleteTrialFunction', async () => {
  // (re-)seed the local DB
  beforeEach(async () => {
    await seedDb();
  });

  const testTrialId = 'bbbbbbbbbbbbbbbbbbbbbbbb';

  context('deleteTrialFunction', async () => {
    it('Successfully deletes a trial', async () => {
      const db = new DbHelper();
      await db.connect();

      const trialsBefore = await db.listTrials();
      const numberOfTrialsBefore = trialsBefore.length;

      const event = { body: { trialId: testTrialId } };
      const context = {};
      const callback = () => {};
      const expectedResponseBody = JSON.stringify({
        results_count: 1,
        results: [true],
      });

      const response = await trialsFunction.deleteTrial(event, context, callback);

      expect(response.statusCode).to.eq(200);
      expect(response.body).to.eq(expectedResponseBody);

      const trialsAfter = await db.listTrials();
      const numberOfTrialsAfter = trialsAfter.length;

      expect(numberOfTrialsBefore).to.be.above(numberOfTrialsAfter);

      await db.disconnect();
    });
  });
});
