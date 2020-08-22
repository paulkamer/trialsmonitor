import { Trial, ClinicalTrialsTrial, TrialId } from '../types';

import jsonDiff from 'json-diff';

import db from './lib/Db';
import ClinicalTrialsApi from './lib/ClinicalTrialsApi';
import logger from '../src/lib/logger';

class TrialUpdater {
  async updateTrial(trialId: TrialId) {
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
      currentTrialJson = JSON.parse(currentTrial.trial || '{}');
    } catch (e) {
      logger.error(e);
    }

    const attributesToUpdate = this.extractAttributes(newTrial);
    attributesToUpdate.trial = JSON.stringify(newTrial);
    attributesToUpdate.diff = this.determineDiff(currentTrialJson, newTrial);

    // Rely on last submit date on Trial when available. Otherwise use current date.
    if (!attributesToUpdate.lastUpdated) {
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
  extractAttributes(newTrial: ClinicalTrialsTrial): Partial<Trial> {
    let [trialId, title, acronym, phase, studyStatus, lastUpdated] = Array(5).fill('?');

    try {
      trialId = newTrial.Study.ProtocolSection.IdentificationModule.NCTId;
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

    return { trialId, title, acronym, phase, studyStatus, lastUpdated };
  }

  /**
   * Determine the diff between the current and new version of the trial, using
   * json-diff
   */
  determineDiff(currentTrial: Trial, newTrial: ClinicalTrialsTrial): string {
    const noDiff = '-';

    if (!currentTrial?.trial) return noDiff;

    try {
      return jsonDiff.diffString(currentTrial, newTrial) || noDiff;
    } catch (e) {
      logger.error(e);
    }

    return noDiff;
  }
}

export default TrialUpdater;
