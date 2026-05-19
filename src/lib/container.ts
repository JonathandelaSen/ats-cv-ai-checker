import { InMemoryQueryBus } from "@/modules/shared";
import {
  createActivityContextsModule,
} from "@/modules/activity-context";
import {
  createAnalysisChatModule,
  registerAnalysisChatQueries,
} from "@/modules/analysis-chat";
import {
  createCVAnalysisModule,
  GetCVAnalysisByIdQuery,
  GetCVAnalysisByIdQueryHandler,
  ListCVAnalysesQuery,
  ListCVAnalysesQueryHandler,
  ListCVAnalysisUsageByDocumentQuery,
  ListCVAnalysisUsageByDocumentQueryHandler,
} from "@/modules/cv-analysis";
import { createCVLibraryModule } from "@/modules/cv-library";
import { createCommitmentsModule } from "@/modules/commitments";
import { createFeedbackNotesModule } from "@/modules/feedback-notes";
import {
  createJobMatchAnalysisModule,
  GetJobMatchAnalysisByIdQuery,
  GetJobMatchAnalysisByIdQueryHandler,
  ListJobMatchAnalysesQuery,
  ListJobMatchAnalysesQueryHandler,
  ListJobMatchAnalysisUsageByDocumentQuery,
  ListJobMatchAnalysisUsageByDocumentQueryHandler,
} from "@/modules/job-match-analysis";
import { createReceivedFeedbackModule } from "@/modules/received-feedback";
import { createSelectionProcessModule } from "@/modules/selection-process";
import { createWorkJournalModule } from "@/modules/work-journal";

const queryBus = new InMemoryQueryBus();

export const activityContextsModule = createActivityContextsModule();
export const cvAnalysisModule = createCVAnalysisModule();
export const cvLibraryModule = createCVLibraryModule(queryBus);
export const commitmentsModule = createCommitmentsModule();
export const feedbackNotesModule = createFeedbackNotesModule();
export const jobMatchAnalysisModule = createJobMatchAnalysisModule();
export const receivedFeedbackModule = createReceivedFeedbackModule();
export const selectionProcessModule = createSelectionProcessModule();
export const workJournalModule = createWorkJournalModule();

queryBus.register(
  GetCVAnalysisByIdQuery.queryName,
  new GetCVAnalysisByIdQueryHandler(cvAnalysisModule.getCVAnalysisById),
);
queryBus.register(
  ListCVAnalysesQuery.queryName,
  new ListCVAnalysesQueryHandler(cvAnalysisModule.listCVAnalyses),
);
queryBus.register(
  ListCVAnalysisUsageByDocumentQuery.queryName,
  new ListCVAnalysisUsageByDocumentQueryHandler(
    cvAnalysisModule.listCVAnalysisUsageByDocument,
  ),
);
queryBus.register(
  GetJobMatchAnalysisByIdQuery.queryName,
  new GetJobMatchAnalysisByIdQueryHandler(jobMatchAnalysisModule.getJobMatchAnalysisById),
);
queryBus.register(
  ListJobMatchAnalysesQuery.queryName,
  new ListJobMatchAnalysesQueryHandler(jobMatchAnalysisModule.listJobMatchAnalyses),
);
queryBus.register(
  ListJobMatchAnalysisUsageByDocumentQuery.queryName,
  new ListJobMatchAnalysisUsageByDocumentQueryHandler(
    jobMatchAnalysisModule.listJobMatchAnalysisUsageByDocument,
  ),
);

const _analysisChatModule = createAnalysisChatModule(queryBus);
const originalBind = _analysisChatModule.bindRequest.bind(_analysisChatModule);
_analysisChatModule.bindRequest = (client) => {
  cvAnalysisModule.bindRequest(client);
  jobMatchAnalysisModule.bindRequest(client);
  return originalBind(client);
};
export const analysisChatModule = _analysisChatModule;
registerAnalysisChatQueries(queryBus, analysisChatModule);
