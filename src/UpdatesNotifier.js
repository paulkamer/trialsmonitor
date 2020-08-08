// eslint-disable-next-line import/no-extraneous-dependencies
const aws = require('aws-sdk');

const { logger } = require('../src/lib/logger');

const LINE_END_TXT = '\n';
const LINE_END_HTML = '<br/>';

const CLINICALTRIALS_BASE_URL = 'https://clinicaltrials.gov/ct2';
const CLINICALTRIALS_SHOW_BASE_URL = `${CLINICALTRIALS_BASE_URL}/show`;
const CLINICALTRIALS_HISTORY_BASE_URL = `${CLINICALTRIALS_BASE_URL}/history`;

/**
 *
 */
class UpdatesNotifier {
  constructor(db, trialIds) {
    this.db = db;
    this.trialIds = trialIds;
  }

  async notify() {
    const trials = await this.fetchTrials();

    if (!trials || trials.length === 0) {
      logger.error('No trials were found');
      return false;
    }

    const emailParams = await this.prepareEmailParameters(trials);

    try {
      await this.sendEmail(emailParams);
    } catch (e) {
      logger.error(e);
      return false;
    }

    return true;
  }

  async fetchTrials() {
    const fetchAttributes = [
      'trialId',
      'title',
      'acronym',
      'phase',
      'studyStatus',
      'lastUpdated',
      'diff',
    ];

    return await this.db.fetchTrialsByTrialId(this.trialIds, fetchAttributes);
  }

  async prepareEmailParameters(trials) {
    const subject = `[TrialMonitor] ${this.trialIds.length} updates found`;
    const textBody = this.formatBody({ trials, lineEnd: LINE_END_TXT });
    const htmlBody = this.formatBody({ trials, lineEnd: LINE_END_HTML });

    return {
      toAddresses: [process.env.EMAIL_TO_ADDRESS],
      subject,
      textBody,
      htmlBody,
    };
  }

  /**
   * Format the email body
   *
   * @param {*} param
   */
  formatBody({ trials, lineEnd }) {
    let body = `Hello, we found ${trials.length} updated trials:${lineEnd.repeat(2)}`;

    body += `https://trialsmonitor.com/trials${lineEnd.repeat(2)}`;

    const formatTrialLines = this.formatTrialLines({ trials, lineEnd });

    body += formatTrialLines.join(lineEnd.repeat(2));

    return body;
  }

  /**
   * Format a line for each updated trial, for the email body
   */
  formatTrialLines({ trials, lineEnd }) {
    return trials.map(trial => {
      const phase = (trial.phase && trial.phase) || '?';
      const studyStatus = (trial.studyStatus && trial.studyStatus) || '?';

      let title = (trial.title && trial.title) || '?';
      if (trial.acronym && trial.acronym) {
        title += ` (${trial.acronym})`;
      }

      if (lineEnd === LINE_END_TXT) {
        return [
          `${title} ${phase} - ${studyStatus}`,
          `${CLINICALTRIALS_SHOW_BASE_URL}/${trial.trialId} | ${CLINICALTRIALS_HISTORY_BASE_URL}/${trial.trialId}`,
        ].join(lineEnd);
      }

      return [
        title,
        `${trial.trialId} <a href="${CLINICALTRIALS_SHOW_BASE_URL}/${trial.trialId}" target="_blank">ClinicalTrials.gov record</a> (<a href="${CLINICALTRIALS_HISTORY_BASE_URL}/${trial.trialId}" target="_blank">history</a>) - ${phase} - ${studyStatus}`,
      ].join(lineEnd);
    });
  }

  /**
   * Send email
   *
   * @param {*} param
   */
  async sendEmail({ toAddresses, subject, textBody, htmlBody }) {
    const fromAddress = process.env.EMAIL_FROM_ADDRESS;

    const emailParams = {
      Source: fromAddress,
      Destination: { ToAddresses: toAddresses },
      ReplyToAddresses: [fromAddress],
      Message: {
        Subject: { Charset: 'UTF-8', Data: subject },
        Body: {
          Text: { Charset: 'UTF-8', Data: textBody },
          Html: { Charset: 'UTF-8', Data: htmlBody },
        },
      },
    };

    const ses = new aws.SES();

    return await ses.sendEmail(emailParams).promise();
  }
}

module.exports = UpdatesNotifier;
