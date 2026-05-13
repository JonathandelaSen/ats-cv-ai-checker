import { InMemoryQueryBus } from "@/modules/shared";
import {
  createAnalysisChatModule,
  registerAnalysisChatQueries,
} from "@/modules/analysis-chat";
import { createCVAnalysisModule } from "@/modules/cv-analysis";
import { createCVLibraryModule } from "@/modules/cv-library";
import { createCommitmentsModule } from "@/modules/commitments";
import { createFeedbackNotesModule } from "@/modules/feedback-notes";
import { createJobMatchAnalysisModule } from "@/modules/job-match-analysis";
import { createReceivedFeedbackModule } from "@/modules/received-feedback";
import { createSelectionProcessModule } from "@/modules/selection-process";
import { createWorkJournalModule } from "@/modules/work-journal";

const queryBus = new InMemoryQueryBus();
registerAnalysisChatQueries(queryBus);

export const analysisChatModule = createAnalysisChatModule(queryBus);
export const cvAnalysisModule = createCVAnalysisModule();
export const cvLibraryModule = createCVLibraryModule();
export const commitmentsModule = createCommitmentsModule();
export const feedbackNotesModule = createFeedbackNotesModule();
export const jobMatchAnalysisModule = createJobMatchAnalysisModule();
export const receivedFeedbackModule = createReceivedFeedbackModule();
export const selectionProcessModule = createSelectionProcessModule();
export const workJournalModule = createWorkJournalModule();
