import { InMemoryQueryBus } from "@/modules/shared";
import {
  createAnalysisChatModule,
  registerAnalysisChatQueries,
} from "@/modules/analysis-chat";
import { createCommitmentsModule } from "@/modules/commitments";
import { createFeedbackNotesModule } from "@/modules/feedback-notes";
import { createReceivedFeedbackModule } from "@/modules/received-feedback";
import { createWorkJournalModule } from "@/modules/work-journal";

const queryBus = new InMemoryQueryBus();
registerAnalysisChatQueries(queryBus);

export const analysisChatModule = createAnalysisChatModule(queryBus);
export const commitmentsModule = createCommitmentsModule();
export const feedbackNotesModule = createFeedbackNotesModule();
export const receivedFeedbackModule = createReceivedFeedbackModule();
export const workJournalModule = createWorkJournalModule();
