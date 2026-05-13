import { InMemoryQueryBus } from "@/modules/shared";
import {
  createAnalysisChatModule,
  registerAnalysisChatQueries,
} from "@/modules/analysis-chat";

const queryBus = new InMemoryQueryBus();
registerAnalysisChatQueries(queryBus);

export const analysisChatModule = createAnalysisChatModule(queryBus);
