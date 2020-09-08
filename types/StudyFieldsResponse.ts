import { ClinicalTrialsTrial } from './ClinicalTrialsTrial';

export type StudyFieldsResponse = {
  Expression: string;
  NStudiesAvail: number;
  NStudiesFound: number;
  MinRank: number;
  MaxRank: number;
  NStudiesReturned: number;
  StudyFields: ClinicalTrialsTrial[];
};
