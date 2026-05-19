import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { faker } from "@faker-js/faker";
import { InMemoryQueryBus } from "@/modules/shared";
import { createActivityContextsModule } from "@/modules/activity";
import { createCVLibraryE2EModule } from "@/modules/cv-library/cv-library.e2e.module";
import {
  createCVAnalysisModule,
  GetCVAnalysisByIdQuery,
  GetCVAnalysisByIdQueryHandler,
} from "@/modules/cv-analysis";
import {
  createJobMatchAnalysisModule,
  GetJobMatchAnalysisByIdQuery,
  GetJobMatchAnalysisByIdQueryHandler,
} from "@/modules/job-match-analysis";
import {
  createAnalysisChatModule,
  registerAnalysisChatQueries,
} from "@/modules/analysis-chat";
import { createFeedbackNotesModule } from "@/modules/feedback-notes";
import { createReceivedFeedbackModule } from "@/modules/received-feedback";
import { createWorkJournalModule } from "@/modules/work-journal";
import { createCommitmentsModule } from "@/modules/commitments";
import { createSelectionProcessModule } from "@/modules/selection-process";
import { ActivityContextFixture } from "@/modules/activity/test-helpers/activity-context.fixture";
import { CVDocumentFixture } from "@/modules/cv-library/test-helpers/cv-document.fixture";
import { CVAnalysisFixture } from "@/modules/cv-analysis/test-helpers/cv-analysis.fixture";
import { JobMatchAnalysisFixture } from "@/modules/job-match-analysis/test-helpers/job-match-analysis.fixture";
import { FeedbackFixture } from "@/modules/feedback-notes/test-helpers/feedback.fixture";
import { ReceivedFeedbackFixture } from "@/modules/received-feedback/test-helpers/received-feedback.fixture";
import { WorkJournalEntryFixture } from "@/modules/work-journal/test-helpers/work-journal-entry.fixture";
import { CommitmentFixture } from "@/modules/commitments/test-helpers/commitment.fixture";
import { SelectionProcessFixture } from "@/modules/selection-process/test-helpers/selection-process.fixture";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const EMAIL = "agent-test@example.com";
const PASSWORD = "agent-test-password";

const COUNTS = {
  activityContexts: 8,
  cvs: 5,
  cvAnalysesPerCV: 2,
  jobOpportunities: 40,
  jobMatchAnalysesPerOpp: 1,
  feedbackNotes: 50,
  entriesPerFeedback: { min: 1, max: 5 },
  receivedFeedback: 15,
  workJournalEntries: 100,
  commitmentContexts: 3,
  commitmentsPerContext: { min: 2, max: 5 },
  itemsPerCommitment: { min: 2, max: 5 },
  outcomesPerCommitment: { min: 0, max: 2 },
  processQuestionsPerOpp: { min: 1, max: 4 },
};

// ---------------------------------------------------------------------------
// Modules (singleton, wired once)
// ---------------------------------------------------------------------------
const queryBus = new InMemoryQueryBus();
const activityModule = createActivityContextsModule();
const cvLibraryE2E = createCVLibraryE2EModule(queryBus);
const cvAnalysisModule = createCVAnalysisModule();
const jobMatchModule = createJobMatchAnalysisModule();
const analysisChatModule = createAnalysisChatModule(queryBus);
const feedbackNotesModule = createFeedbackNotesModule();
const receivedFeedbackModule = createReceivedFeedbackModule();
const workJournalModule = createWorkJournalModule();
const commitmentsModule = createCommitmentsModule();
const selectionProcessModule = createSelectionProcessModule();

// Register query handlers needed by analysis-chat
queryBus.register(
  GetCVAnalysisByIdQuery.queryName,
  new GetCVAnalysisByIdQueryHandler(cvAnalysisModule.getCVAnalysisById),
);
queryBus.register(
  GetJobMatchAnalysisByIdQuery.queryName,
  new GetJobMatchAnalysisByIdQueryHandler(jobMatchModule.getJobMatchAnalysisById),
);
registerAnalysisChatQueries(queryBus, analysisChatModule);

function bindAll(client: SupabaseClient) {
  activityModule.bindRequest(client);
  cvLibraryE2E.bindRequest(client);
  cvAnalysisModule.bindRequest(client);
  jobMatchModule.bindRequest(client);
  analysisChatModule.bindRequest(client);
  feedbackNotesModule.bindRequest(client);
  receivedFeedbackModule.bindRequest(client);
  workJournalModule.bindRequest(client);
  commitmentsModule.bindRequest(client);
  selectionProcessModule.bindRequest(client);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function log(step: string, msg: string) {
  console.log(`[${step}] ${msg}`);
}

function getFixtureCVPaths(): string[] {
  const dir = path.resolve(__dirname, "../.test-infra/fixtures/cvs");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".pdf"))
    .map((f) => path.join(dir, f));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !serviceRoleKey || !anonKey) {
    console.error(
      "Error: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) must be set.",
    );
    process.exit(1);
  }

  const adminClient = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // -----------------------------------------------------------------------
  // 1. Ensure test user
  // -----------------------------------------------------------------------
  log("1/9", `Ensuring test user: ${EMAIL}...`);
  let userId: string;
  {
    let foundUser = null;
    let page = 1;
    while (true) {
      const {
        data: { users },
        error,
      } = await adminClient.auth.admin.listUsers({ page, perPage: 100 });
      if (error) {
        console.error("Error listing users:", error.message);
        process.exit(1);
      }
      if (!users || users.length === 0) break;
      foundUser = users.find((u) => u.email === EMAIL);
      if (foundUser) break;
      page++;
    }

    if (!foundUser) {
      const { data, error } = await adminClient.auth.admin.createUser({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
      });
      if (error) {
        console.error("Error creating user:", error.message);
        process.exit(1);
      }
      foundUser = data.user;
      log("1/9", `User created: ${foundUser.id}`);
    } else {
      log("1/9", `User found: ${foundUser.id}`);
    }
    userId = foundUser.id;
  }

  // -----------------------------------------------------------------------
  // 2. Cleanup previous data
  // -----------------------------------------------------------------------
  log("2/9", "Cleaning up old data...");
  const deletionOrder = [
    "analysis_chat_messages",
    "analysis_chat_conversations",
    "process_questions",
    "follow_ups",
    "job_match_analyses",
    "job_opportunities",
    "cv_analyses",
    "cv_structured_profiles",
    "cvs",
    "work_journal_entries",
    "feedback_notes_entries",
    "feedback_notes_feedbacks",
    "received_feedback",
    "commitment_items",
    "commitment_outcomes",
    "commitments",
    "user_preferences",
    "activity_contexts",
  ];
  for (const table of deletionOrder) {
    await adminClient.from(table).delete().eq("user_id", userId);
  }
  log("2/9", "Cleanup complete.");

  // -----------------------------------------------------------------------
  // 3. Sign in as user (RLS-safe client)
  // -----------------------------------------------------------------------
  log("3/9", "Signing in as test user...");
  const userClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInErr } = await userClient.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });
  if (signInErr) {
    console.error("Sign-in failed:", signInErr.message);
    process.exit(1);
  }

  bindAll(userClient);

  // Also set user preferences
  await adminClient
    .from("user_preferences")
    .upsert({ user_id: userId, interface_language: "es" }, { onConflict: "user_id" });

  // -----------------------------------------------------------------------
  // 4. Activity Contexts
  // -----------------------------------------------------------------------
  log("4/9", `Creating ${COUNTS.activityContexts} activity contexts...`);
  const contextIds: string[] = [];

  // Default context is auto-created by some modules; create named ones
  const contextNames = [
    { type: "employment" as const, name: "Búsqueda de Empleo Tech" },
    { type: "employment" as const, name: "Empleo Actual - Senior Engineer" },
    { type: "project" as const, name: "Proyecto AI Checker" },
    { type: "project" as const, name: "Proyecto Open Source CLI" },
    { type: "personal" as const, name: "Desarrollo Personal" },
    { type: "personal" as const, name: "Certificaciones Cloud" },
    { type: "other" as const, name: "Networking y Conferencias" },
    { type: "other" as const, name: "Mentoring Junior Devs" },
  ];

  for (const ctx of contextNames.slice(0, COUNTS.activityContexts)) {
    const result = await activityModule.createActivityContext.execute({
      userId,
      type: ctx.type,
      name: ctx.name,
    });
    contextIds.push(result.toPrimitives().id);
  }

  // Get default context
  const allContexts = await activityModule.listActivityContexts.execute(userId);
  const defaultCtx = allContexts.find((c) => c.toPrimitives().isDefault);
  if (defaultCtx) contextIds.unshift(defaultCtx.toPrimitives().id);

  log("4/9", `${contextIds.length} contexts created (including default).`);

  // -----------------------------------------------------------------------
  // 5. CVs + Analyses
  // -----------------------------------------------------------------------
  log("5/9", `Creating ${COUNTS.cvs} CVs with analyses...`);
  const cvPaths = getFixtureCVPaths();
  const cvIds: string[] = [];
  const structuredProfileIds: string[] = [];

  for (let i = 0; i < COUNTS.cvs; i++) {
    const cvInput = CVDocumentFixture.createUploadedInput({ userId });

    // Upload real PDF to storage if available
    if (cvPaths.length > 0) {
      const pdfPath = faker.helpers.arrayElement(cvPaths);
      const buffer = fs.readFileSync(pdfPath);
      const storagePath = `${userId}/${cvInput.id}.pdf`;

      const { error: uploadErr } = await userClient.storage
        .from("cv-pdfs")
        .upload(storagePath, buffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (!uploadErr) {
        cvInput.pdfStoragePath = storagePath;
        cvInput.fileSize = buffer.length;
        cvInput.filename = path.basename(pdfPath);
      }
    }

    const cv = await cvLibraryE2E.createUploadedCVDocument.execute(cvInput);
    const cvPrimitives = cv.toPrimitives();
    cvIds.push(cvPrimitives.id);

    // Upsert a structured profile (mock)
    const profile = await cvLibraryE2E.structureCVProfileWithAI.execute({
      provider: "mock",
      model: "mock-model",
      text: cvInput.textNode ?? "Mock text",
    });

    const sp = await cvLibraryE2E.upsertCVStructuredProfile.execute({
      userId,
      cvDocumentId: cvPrimitives.id,
      schemaVersion: profile.schemaVersion,
      sourceTextHash: crypto
        .createHash("sha256")
        .update(cvInput.textNode ?? "")
        .digest("hex"),
      aiModel: "mock-model",
      profile: profile.profile,
    });
    structuredProfileIds.push(sp.toPrimitives().id);

    // Create CV analyses for this CV
    for (let a = 0; a < COUNTS.cvAnalysesPerCV; a++) {
      const analysisInput = CVAnalysisFixture.createInput({
        userId,
        cvDocumentId: cvPrimitives.id,
        cvStructuredProfileId: sp.toPrimitives().id,
        filename: cvInput.filename ?? "cv.pdf",
        fileSize: cvInput.fileSize,
        pdfStoragePath: cvInput.pdfStoragePath,
        extractedText: {
          textPython: cvInput.textPython,
          textPdfjs: cvInput.textPdfjs,
          textNode: cvInput.textNode,
          extractErrorPython: cvInput.extractErrorPython,
          extractErrorPdfjs: cvInput.extractErrorPdfjs,
          extractErrorNode: cvInput.extractErrorNode,
        },
      });

      const analysis =
        await cvAnalysisModule.createCVAnalysis.execute(analysisInput);

      // Score with mock provider
      await cvAnalysisModule.scoreCVAnalysis.execute({
        id: analysis.toPrimitives().id,
        userId,
        provider: "mock",
        model: "mock-model",
      });
    }
  }
  log("5/9", `${cvIds.length} CVs, ${cvIds.length} profiles, ${cvIds.length * COUNTS.cvAnalysesPerCV} CV analyses created.`);

  // -----------------------------------------------------------------------
  // 6. Job Opportunities + Match Analyses + FollowUps + Questions
  // -----------------------------------------------------------------------
  log("6/9", `Creating ${COUNTS.jobOpportunities} job opportunities with cascades...`);
  let totalMatches = 0;
  let totalFollowUps = 0;
  let totalQuestions = 0;

  let totalChats = 0;

  for (let i = 0; i < COUNTS.jobOpportunities; i++) {
    const oppRow = SelectionProcessFixture.createJobOpportunityRow(userId);

    const { data: opp, error: oppErr } = await userClient
      .from("job_opportunities")
      .insert(oppRow)
      .select("id")
      .single();

    if (oppErr) {
      console.error("Error creating job opportunity:", oppErr.message);
      continue;
    }

    // Job Match Analysis for each opportunity
    const matchIds: string[] = [];
    for (let m = 0; m < COUNTS.jobMatchAnalysesPerOpp; m++) {
      const cvIdx = faker.number.int({ min: 0, max: cvIds.length - 1 });
      const matchInput = JobMatchAnalysisFixture.createInput({
        userId,
        cvDocumentId: cvIds[cvIdx],
        cvStructuredProfileId: structuredProfileIds[cvIdx],
        jobOpportunityId: opp.id,
        jobDescription: oppRow.description,
        jobUrl: oppRow.url,
      });

      const match =
        await jobMatchModule.createJobMatchAnalysis.execute(matchInput);
      const matchId = match.toPrimitives().id;
      matchIds.push(matchId);

      await jobMatchModule.scoreJobMatchAnalysis.execute({
        id: matchId,
        userId,
        provider: "mock",
        model: "mock-model",
        jobDescription: oppRow.description,
        jobUrl: oppRow.url,
      });

      // Enrich job_snapshot with real opportunity data (mock AI returns nulls)
      await userClient
        .from("job_match_analyses")
        .update({
          job_snapshot: {
            url: oppRow.url,
            description: oppRow.description,
            keyData: {
              title: oppRow.title,
              company: oppRow.company,
              location: oppRow.location,
              remote: oppRow.remote,
              salary: oppRow.salary,
              seniority: oppRow.seniority,
              contractType: oppRow.contract_type,
              benefits: oppRow.benefits,
              requirements: oppRow.requirements,
              responsibilities: oppRow.responsibilities,
              notablePoints: [
                "Equipo internacional",
                "Producto con impacto social",
              ],
            },
          },
        })
        .eq("id", matchId);

      // Create chat conversation with mock messages (40% of analyses)
      if (faker.datatype.boolean({ probability: 0.4 })) {
        const convo = await analysisChatModule.createConversation.execute({
          userId,
          analysisId: matchId,
          title: `Chat sobre ${oppRow.title} en ${oppRow.company}`,
          requestId: crypto.randomUUID(),
        });
        const convoId = convo.toPrimitives().id;

        const chatMessages = [
          "¿Qué aspectos de mi perfil encajan mejor con esta oferta?",
          "¿Qué habilidades debería destacar en la entrevista?",
          "¿Hay algún gap importante entre mi perfil y los requisitos?",
        ];
        const numMessages = faker.number.int({ min: 1, max: 3 });
        for (let cm = 0; cm < numMessages; cm++) {
          await analysisChatModule.sendMessage.execute({
            userId,
            analysisId: matchId,
            conversationId: convoId,
            message: chatMessages[cm],
            provider: "mock",
            model: "mock-model",
            requestId: crypto.randomUUID(),
          });
        }
        totalChats++;
      }

      totalMatches++;
    }

    // Follow-up (70% chance)
    if (faker.datatype.boolean({ probability: 0.7 })) {
      const followUpRow = SelectionProcessFixture.createFollowUpRow(
        userId,
        opp.id,
      );
      await userClient.from("follow_ups").insert(followUpRow);
      totalFollowUps++;
    }

    // Process questions linked to job match analysis
    const numQuestions = faker.number.int(COUNTS.processQuestionsPerOpp);
    for (let q = 0; q < numQuestions; q++) {
      const qInput = SelectionProcessFixture.createProcessQuestionInput({
        userId,
        jobOpportunityId: opp.id,
        sourceJobMatchAnalysisId: matchIds.length > 0
          ? faker.helpers.arrayElement(matchIds)
          : undefined,
      });
      await selectionProcessModule.createProcessQuestion.execute(qInput);
      totalQuestions++;
    }
  }
  log(
    "6/9",
    `${COUNTS.jobOpportunities} opportunities, ${totalMatches} matches, ${totalFollowUps} follow-ups, ${totalQuestions} questions, ${totalChats} chat conversations.`,
  );

  // -----------------------------------------------------------------------
  // 7. Feedback Notes + Received Feedback
  // -----------------------------------------------------------------------
  log("7/9", `Creating ${COUNTS.feedbackNotes} feedback notes and ${COUNTS.receivedFeedback} received feedback...`);

  for (let i = 0; i < COUNTS.feedbackNotes; i++) {
    const fbInput = FeedbackFixture.createInput({ user_id: userId });
    const fb = await feedbackNotesModule.createFeedback.execute(fbInput);
    const fbId = fb.toPrimitives().id;

    const numEntries = faker.number.int(COUNTS.entriesPerFeedback);
    for (let e = 0; e < numEntries; e++) {
      await feedbackNotesModule.createEntry.execute(
        FeedbackFixture.createEntryInput({
          user_id: userId,
          feedback_id: fbId,
        }),
      );
    }

    // Close some feedbacks (30%)
    if (faker.datatype.boolean({ probability: 0.3 })) {
      await feedbackNotesModule.closeFeedback.execute(userId, fbId);
    }
  }

  for (let i = 0; i < COUNTS.receivedFeedback; i++) {
    const ctxId = faker.helpers.arrayElement(contextIds);
    await receivedFeedbackModule.createReceivedFeedback.execute(
      ReceivedFeedbackFixture.createInput({
        userId,
        activityContextId: ctxId,
      }),
    );
  }
  log("7/9", "Feedback notes and received feedback created.");

  // -----------------------------------------------------------------------
  // 8. Work Journal Entries
  // -----------------------------------------------------------------------
  log("8/9", `Creating ${COUNTS.workJournalEntries} work journal entries...`);

  // Ensure default work journal context exists
  const wjDefaultCtx = await workJournalModule.ensureDefaultContext.execute(userId);
  if (!wjDefaultCtx) {
    console.error("Failed to create default work journal context");
    process.exit(1);
  }
  const wjContextId = wjDefaultCtx.toPrimitives().id;

  // Create a few extra work journal contexts
  const wjContextIds = [wjContextId];
  const wjContextNames = ["Proyecto Principal", "Investigación", "Reuniones"];
  for (const name of wjContextNames) {
    const ctx = await workJournalModule.createContext.execute({
      user_id: userId,
      type: faker.helpers.arrayElement(["employment", "project", "personal", "other"] as const),
      name,
    });
    wjContextIds.push(ctx.toPrimitives().id);
  }

  for (let i = 0; i < COUNTS.workJournalEntries; i++) {
    await workJournalModule.createEntry.execute(
      WorkJournalEntryFixture.createInput({
        user_id: userId,
        context_id: faker.helpers.arrayElement(wjContextIds),
      }),
    );
  }
  log("8/9", `${COUNTS.workJournalEntries} work journal entries created.`);

  // -----------------------------------------------------------------------
  // 9. Commitments
  // -----------------------------------------------------------------------
  log("9/9", "Creating commitments...");
  let totalCommitments = 0;
  let totalItems = 0;
  let totalOutcomes = 0;

  // Ensure default commitment context
  const cmtDefault = await commitmentsModule.ensureDefaultContext.execute(userId);
  const cmtContextIds = [cmtDefault.toPrimitives().id];

  for (let c = 0; c < COUNTS.commitmentContexts; c++) {
    const ctx = await commitmentsModule.createContext.execute(
      CommitmentFixture.createContextInput({ userId }),
    );
    cmtContextIds.push(ctx.toPrimitives().id);
  }

  for (const ctxId of cmtContextIds) {
    const numCommitments = faker.number.int(COUNTS.commitmentsPerContext);
    for (let ci = 0; ci < numCommitments; ci++) {
      const commitment = await commitmentsModule.createCommitment.execute(
        CommitmentFixture.createCommitmentInput({
          userId,
          contextId: ctxId,
        }),
      );
      const commitmentId = commitment.toPrimitives().id;
      totalCommitments++;

      const numItems = faker.number.int(COUNTS.itemsPerCommitment);
      for (let ii = 0; ii < numItems; ii++) {
        await commitmentsModule.createItem.execute(
          CommitmentFixture.createItemInput({
            userId,
            commitmentId,
            orderIndex: ii,
          }),
        );
        totalItems++;
      }

      const numOutcomes = faker.number.int(COUNTS.outcomesPerCommitment);
      for (let oi = 0; oi < numOutcomes; oi++) {
        await commitmentsModule.createOutcome.execute(
          CommitmentFixture.createOutcomeInput({ userId, commitmentId }),
        );
        totalOutcomes++;
      }
    }
  }
  log(
    "9/9",
    `${totalCommitments} commitments, ${totalItems} items, ${totalOutcomes} outcomes.`,
  );

  // -----------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("SYNTHETIC SEED COMPLETE!");
  console.log(`User: ${EMAIL} / ${PASSWORD}`);
  console.log("=======================================================");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
