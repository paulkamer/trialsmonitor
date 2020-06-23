// eslint-disable-next-line import/no-extraneous-dependencies
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const { logger } = require('../src/lib/logger');

const TABLE_TRIALS = process.env.TRIALS_TABLE;
const TABLE_SEARCHES = process.env.SEARCHES_TABLE;

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

    // On localhost the 'endpoint' is a required config setting
    if (process.env.STAGE === 'dev') dynamoDbConfig.endpoint = process.env.DYNAMODB_DEV_ENDPOINT;

    this.db = new AWS.DynamoDB(dynamoDbConfig);
  }

  /**
   * Proxy for DynamoDB's putItem to prevent duplication
   *
   * @param {Object} params
   */
  putItem(params) {
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
   * Proxy for DynamoDB's batchWriteItem to prevent duplication
   * @todo return Promise like in putItem?
   *
   * @param {Object} params
   */
  async batchWriteItem(params) {
    let result;

    try {
      result = await this.db.batchWriteItem(params).promise();
    } catch(e) {
      logger.error(e);
      result = false;
    }

    return result;
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

    return this.putItem(params);
  }

  /**
   * Returns all trialId's stored in the "trials" table
   */
  async listTrials(attributesToGet = ['id', 'lastUpdated'], { orderBy, sortDirection, limit } = {}) {
    // query at most 100 objects per db.scan operation, because of response size limit of 1MB
    const batchLimit = Math.min(...[100, (limit || 100)]);

    const queryParams = {
      TableName: TABLE_TRIALS,
      Select: 'SPECIFIC_ATTRIBUTES',
      AttributesToGet: attributesToGet,
      Limit: batchLimit,
    };

    const trialsById = {};
    let items;
    try {
      // Loop until all items have been returned.
      do {
        items = await this.db.scan(queryParams).promise();
        items.Items.forEach(trial => {
          trialsById[trial.id.S] = this.normalizeTrial(trial);
        });

        queryParams.ExclusiveStartKey = items.LastEvaluatedKey;
      } while (typeof items.LastEvaluatedKey !== 'undefined' && (!limit || Object.keys(trialsById).length < limit));
    } catch (e) {
      logger.error(e);

      return {};
    }

    // Sort trials by orderBy column
    let sortedTrialsById;
    if (orderBy && attributesToGet.includes(orderBy)) {
      sortedTrialsById = {};
      const sortIndexA = (sortDirection === 'asc') ? -1 : 1;
      const sortIndexB = sortIndexA - (sortIndexA * 2); // inverse of sortIndexA

      const trials = Object.values(trialsById).sort((a, b) => {
        return a[orderBy] < b[orderBy] ? sortIndexA : sortIndexB;
      });

      trials.forEach(t => {
        sortedTrialsById[t.id] = t;
      });
    }

    return sortedTrialsById || trialsById;
  }

  /**
   * 'Normalize' the object properties of a trial.
   *
   *  Values are stored under the field type key, i.e. { "id": { "S": "<trial_id>" }}
   * @param {*} trial
   */
  normalizeTrial(trial) {
    const result = {};

    Object.entries(trial).forEach((e) => {
      result[e[0]] = Object.values(trial[e[0]])[0];
    });

    // Ensure the lastUpdated value is a Number
    if (trial.lastUpdated) result.lastUpdated = Number(trial.lastUpdated.N) || 0;

    return result;
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
      logger.error(e);
      return false;
    }
  }

  /**
   * Fetch trial records by id
   * @param {Array} List of trialIds
   * @param {Array} List of attribute names to return
   */
  async fetchTrials(trialIds, attributesToReturn) {
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
      logger.error(e);
      return false;
    }

    try {
      return result.Responses[TABLE_TRIALS];
    } catch (e) {
      logger.error(e);
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
  async updateTrial(trialId, { trial, title, acronym, phase, studyStatus, lastUpdated }) {
    const params = {
      TableName: TABLE_TRIALS,
      Key: {
        id: { S: trialId },
      },
      UpdateExpression:
        'SET title = :title, acronym = :acronym, phase = :phase, studyStatus = :studyStatus, lastUpdated = :lastUpdated',
      ExpressionAttributeValues: {
        ':title': { S: title },
        ':acronym': { S: acronym },
        ':phase': { S: phase },
        ':studyStatus': { S: studyStatus },
        ':lastUpdated': { N: String(lastUpdated) },
      },
    };

    try {
      await this.db.updateItem(params).promise();
    } catch (e) {
      logger.error(e);
      return false;
    }

    return true;
  }

  /**
   * Delete trial records by id
   * @param {Array} List of trialIds
   */
  async deleteTrials(trialIds) {
    const params = {
      RequestItems: {
        [TABLE_TRIALS]:
          trialIds.map(trialId => ({
            DeleteRequest: {
              Key: { id: { S: trialId } },
            }
          }))
      },
    };

    return this.batchWriteItem(params);
  }

  /**
   * Returns all trialId's stored in the "trials" table
   */
  async listSearchQueries(attributesToGet = ['id', 'query']) {
    const queryParams = {
      TableName: TABLE_SEARCHES,
      Select: 'SPECIFIC_ATTRIBUTES',
      AttributesToGet: attributesToGet,
      Limit: 100,
    };

    const searchQueries = [];
    let items;
    try {
      // Loop until all items have been returned.
      do {
        items = await this.db.scan(queryParams).promise();
        items.Items.forEach(searchQuery => {
          const result = {};

          Object.entries(searchQuery).forEach((e) => {
            if (!attributesToGet.includes(e[0])) return;

            result[e[0]] = Object.values(searchQuery[e[0]])[0];
          });

          searchQueries.push({
            ...result,
          });
        });

        queryParams.ExclusiveStartKey = items.LastEvaluatedKey;
      } while (typeof items.LastEvaluatedKey !== 'undefined');
    } catch (e) {
      logger.error(e);

      return [];
    }

    return searchQueries;
  }


  /**
   * Insert a new search query into the trialsearches table.
   */
  insertSearchQuery(searchQuery) {
    const params = {
      TableName: TABLE_SEARCHES,
      Item: {
        id: { S: uuidv4() },
        query: { S: searchQuery },
      },
      ConditionExpression: 'attribute_not_exists(id)',
    };

    return this.putItem(params);
  }

  /**
   * Delete trial search records by id
   * @param {Array} List of trial search Ids
   */
  async deleteSearchQueries(trialSearchIds) {
      const params = {
        RequestItems: {
          [TABLE_SEARCHES]:
          trialSearchIds.map(id => ({
              DeleteRequest: {
                Key: { id: { S: id } } ,
              }
            }))
        },
      };

      return this.batchWriteItem(params);
  }

  /**
   * Delete a trial search record by id
   * @param {String} trial search Ids
   */
  async deleteSearchQuery(trialSearchId) {
    return await this.deleteSearchQueries([trialSearchId]);
  }
}

module.exports = DbHelper;
