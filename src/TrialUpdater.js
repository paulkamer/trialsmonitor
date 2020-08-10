const jsonDiff = require('json-diff');

const DbHelper = require('./helpers/Db');
const ClinicalTrialsApi = require('./ClinicalTrialsApi');
const { logger } = require('../src/lib/logger');

class TrialUpdater {
  async updateTrial(trialId) {
    const db = new DbHelper();
    await db.connect();
    const api = new ClinicalTrialsApi();

    // Fetch the full version of the updated trial from ClinicalTrials.gov
    const newTrial = await api.fetchTrial(trialId);
    if (!newTrial || !newTrial.Study) {
      await db.disconnect();

      return false;
    }

    const currentTrial = await db.fetchTrial(trialId);
    if (!currentTrial) return false;

    let currentTrialJson;
    try {
      currentTrialJson = JSON.parse(currentTrial.trial.S);
    } catch (e) {
      logger.error(e);
    }

    const attributesToUpdate = this.extractAttributes(newTrial);
    attributesToUpdate.trial = newTrial;
    attributesToUpdate.diff = this.determineDiff(currentTrialJson, newTrial);

    // Rely on last submit date on Trial when available. Otherwise use current date.
    if (!attributesToUpdate.lastUpdated || attributesToUpdate.lastUpdated === '?') {
      attributesToUpdate.lastUpdated = Math.round(new Date().getTime() / 1000);
    }

    // Update the record in the DB & return result.
    const result = await db.updateTrial(trialId, attributesToUpdate);

    await db.disconnect();

    return result;
  }

  /**
   * Extract the attributes that we are interested in from the trial we fetched from
   * clinicaltrials.gov
   *
   * @param {Object} newTrial JSON object
   */
  extractAttributes(newTrial) {
    // Default to '?' because DynamoDB doesnt allow null values.
    let [title, acronym, phase, studyStatus, lastUpdated] = Array(4).fill('?');

    try {
      title = newTrial.Study.ProtocolSection.IdentificationModule.BriefTitle || '?';
      acronym = newTrial.Study.ProtocolSection.IdentificationModule.Acronym || '?';
      phase = newTrial.Study.ProtocolSection.DesignModule.PhaseList.Phase[0] || '?';
      studyStatus = newTrial.Study.ProtocolSection.StatusModule.OverallStatus || '?';
      lastUpdated = newTrial.Study.ProtocolSection.StatusModule.LastUpdateSubmitDate || '?';

      // Attempt to parse last submit date of Trial (format: "April 7, 2020")
      if (lastUpdated !== '?') {
        try {
          lastUpdated = new Date(lastUpdated).getTime() / 1000;
        } catch (e) {
          lastUpdated = '?';
        }
      }
    } catch (e) {
      logger.debug(e);
    }

    return { title, acronym, phase, studyStatus, lastUpdated };
  }

  /**
   * Determine the diff between the current and new version of the trial, using
   * json-diff
   *
   * @param {*} currentTrial
   * @param {*} newTrial
   */
  determineDiff(currentTrial, newTrial) {
    let diff = '-';

    try {
      diff = jsonDiff.diffString(currentTrial, newTrial) || '-';
    } catch (e) {
      logger.error(e);
    }

    return diff;
  }
}

module.exports = TrialUpdater;
