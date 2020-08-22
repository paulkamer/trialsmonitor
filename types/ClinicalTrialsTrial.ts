import { TrialId } from './TrialId';

export type ClinicalTrialsTrial = {
  NCTId: string[];
  LastUpdateSubmitDate: string[];
  Study: {
    ProtocolSection: {
      IdentificationModule: any;
      StatusModule: any;
      DesignModule: any;
    };
  };
};
