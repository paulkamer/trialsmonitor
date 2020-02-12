// eslint-disable-next-line import/no-extraneous-dependencies
const AWS = require('aws-sdk');

const TABLE_TRIALS = process.env.TRIALS_TABLE;

/**
 * Database helper
 */
class DbHelper {
  /**
   * Initialize the DB connection
   */
  constructor() {
    const dynamoDbConfig = {
      region: process.env.DYNAMODB_REGION,
      apiVersion: process.env.DYNAMODB_API_VERSION,
    };

    if (process.env.STAGE === 'dev') dynamoDbConfig.endpoint = process.env.DYNAMODB_DEV_ENDPOINT;

    this.db = new AWS.DynamoDB(dynamoDbConfig);
  }

  /**
   * Insert a new trialId into the trials table.
   */
  insertTrialId(trialId) {
    const params = {
      TableName: TABLE_TRIALS,
      Item: {
        id: { S: trialId },
        lastUpdated: { N: '0' }, // Ensures lastUpdated attribute is present
      },
      ConditionExpression: 'attribute_not_exists(id)',
    };

    return new Promise(resolve => {
      this.db
        .putItem(params)
        .promise()
        .then(() => {
          resolve(true);
        })
        .catch(() => {
          resolve(false);
        });
    });
  }

  /**
   * Returns all trialId's stored in the "trials" table
   */
  async listTrials() {
    const queryParams = {
      TableName: TABLE_TRIALS,
      Select: 'SPECIFIC_ATTRIBUTES',
      AttributesToGet: ['id', 'lastUpdated'],
    };

    try {
      const data = await this.db.scan(queryParams).promise();

      const trialsById = {};
      data.Items.forEach(trial => {
        trialsById[trial.id.S] = {
          id: trial.id.S,
          lastUpdated: Number(trial.lastUpdated.N) || 0,
        };
      });

      return trialsById;
    } catch (e) {
      console.error(e);

      return [];
    }
  }

  /**
   * Fetch a single trial record
   * @param {String} trialId
   */
  async fetchTrial(trialId) {
    try {
      const params = {
        TableName: TABLE_TRIALS,
        Key: {
          id: { S: trialId },
        },
      };

      const result = await this.db.getItem(params).promise();

      return result.Item;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  /**
   * Fetch trial records by id
   * @param {Array} List of trialIds
   * @param {Array} List of attribute names to return; all by default
   */
  async fetchTrials(trialIds, attributesToReturn = []) {
    let result;
    try {
      const params = {
        RequestItems: {
          [TABLE_TRIALS]: {
            Keys: trialIds.map(trialId => ({ id: { S: trialId } })),
            ProjectionExpression: attributesToReturn.join(','),
          },
        },
      };

      result = await this.db.batchGetItem(params).promise();
    } catch (e) {
      console.error(e);
      return false;
    }

    try {
      return result.Responses[TABLE_TRIALS];
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  /**
   * Update a Trial document in the "trials" DynamoDb table.
   * Copies the existing 'trial' attribute over to 'prevTrial' for the purpose of
   * defining a DIFF later on.
   *
   * @param {String} trialId
   * @param {Object}
   */
  async updateTrial(trialId, { trial, title, acronym, phase, studyStatus, lastUpdated, diff }) {
    const params = {
      TableName: TABLE_TRIALS,
      Key: {
        id: { S: trialId },
      },
      UpdateExpression:
        'SET title = :title, acronym = :acronym, phase = :phase, studyStatus = :studyStatus, trial = :trial, prevTrial = if_not_exists(trial, :prevTrialFallback), diff = :diff, lastUpdated = :lastUpdated',
      ExpressionAttributeValues: {
        ':title': { S: title },
        ':acronym': { S: acronym },
        ':phase': { S: phase },
        ':studyStatus': { S: studyStatus },
        ':trial': { S: JSON.stringify(trial) },
        ':lastUpdated': { N: String(lastUpdated) },
        ':diff': { S: diff },
        ':prevTrialFallback': { S: '{}' },
      },
    };

    try {
      await this.db.updateItem(params).promise();
    } catch (e) {
      console.error(e);
      return false;
    }

    return true;
  }
}

module.exports = DbHelper;
