import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error(
      "Error: Asegúrate de que NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY estén definidas en el entorno o en .env.local / .env"
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const email = "agent-test@example.com";
  const password = "agent-test-password";

  console.log(`[1/13] Buscando usuario de prueba para agentes: ${email}...`);

  let page = 1;
  let foundUser = null;

  while (true) {
    const {
      data: { users },
      error,
    } = await supabase.auth.admin.listUsers({ page, perPage: 100 });

    if (error) {
      console.error("Error al listar usuarios:", error.message);
      process.exit(1);
    }

    if (!users || users.length === 0) {
      break;
    }

    foundUser = users.find((u) => u.email === email);
    if (foundUser) {
      break;
    }

    page++;
  }

  if (!foundUser) {
    console.log(`Usuario no encontrado. Creando ${email}...`);
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      console.error("Error al crear usuario de prueba:", createError.message);
      process.exit(1);
    }

    foundUser = createData.user;
    console.log(`Usuario creado exitosamente con ID: ${foundUser.id}`);
  } else {
    console.log(`Usuario encontrado con ID: ${foundUser.id}`);
  }

  const userId = foundUser.id;

  console.log(`[2/13] Limpiando datos antiguos para el usuario ${userId}...`);

  // Delete in correct order to avoid foreign key violations
  await supabase.from("process_questions").delete().eq("user_id", userId);
  await supabase.from("follow_ups").delete().eq("user_id", userId);
  await supabase.from("job_match_analyses").delete().eq("user_id", userId);
  await supabase.from("job_opportunities").delete().eq("user_id", userId);
  await supabase.from("cv_analyses").delete().eq("user_id", userId);
  await supabase.from("cv_structured_profiles").delete().eq("user_id", userId);
  await supabase.from("cvs").delete().eq("user_id", userId);
  await supabase.from("work_journal_entries").delete().eq("user_id", userId);
  await supabase.from("feedback_notes_entries").delete().eq("user_id", userId);
  await supabase.from("feedback_notes_feedbacks").delete().eq("user_id", userId);
  await supabase.from("received_feedback").delete().eq("user_id", userId);
  await supabase.from("commitment_items").delete().eq("user_id", userId);
  await supabase.from("commitment_outcomes").delete().eq("user_id", userId);
  await supabase.from("commitments").delete().eq("user_id", userId);
  await supabase.from("user_preferences").delete().eq("user_id", userId);
  await supabase.from("activity_contexts").delete().eq("user_id", userId);

  console.log("Limpieza completada.");

  console.log("[3/13] Creando activity_contexts (General, Empleo, Proyectos)...");
  
  // Re-create default context
  const { data: defContext, error: defErr } = await supabase
    .from("activity_contexts")
    .insert({
      user_id: userId,
      type: "other",
      name: "General",
      status: "active",
      is_default: true,
    })
    .select("id")
    .single();

  if (defErr) {
    console.error("Error al crear contexto General:", defErr.message);
    process.exit(1);
  }
  const defaultContextId = defContext.id;

  // Create additional contexts
  const { data: empContext, error: empErr } = await supabase
    .from("activity_contexts")
    .insert({
      user_id: userId,
      type: "employment",
      name: "Búsqueda de Empleo",
      status: "active",
      is_default: false,
    })
    .select("id")
    .single();

  if (empErr) {
    console.error("Error al crear contexto Empleo:", empErr.message);
    process.exit(1);
  }
  const empContextId = empContext.id;

  const { data: projContext, error: projErr } = await supabase
    .from("activity_contexts")
    .insert({
      user_id: userId,
      type: "project",
      name: "Proyecto AI Agent",
      status: "active",
      is_default: false,
    })
    .select("id")
    .single();

  if (projErr) {
    console.error("Error al crear contexto Proyecto:", projErr.message);
    process.exit(1);
  }
  const projContextId = projContext.id;

  console.log(`Contextos creados: General (${defaultContextId}), Empleo (${empContextId}), Proyecto (${projContextId})`);

  console.log("[4/13] Creando CV de prueba...");
  const cvId = crypto.randomUUID();
  const mockCVText = `Jonathan De La Sen | Lead Full-Stack Engineer & AI Architect
Email: agent-test@example.com | Tel: +34 600 000 000 | Location: Madrid, Spain

EXPERIENCE:
Tech Innovations S.L. - Lead Full-Stack Engineer (2022 - Present)
- Led team of 5 developers to migrate legacy monolith to Next.js and Supabase.
- Designed high-throughput LLM prompt processing pipelines.
- Integrated DDD architectural patterns and clean practices.

Software Solutions Corp - Senior Developer (2018 - 2021)
- Built interactive and responsive interfaces using React and TailwindCSS.
- Optimized complex SQL queries in PostgreSQL, saving 200ms latency.

EDUCATION:
Universidad Politécnica de Madrid - BS in Computer Science (2013 - 2017)

SKILLS: TypeScript, React, Next.js, Node.js, Python, PostgreSQL, DDD, AWS.`;

  const { error: cvErr } = await supabase
    .from("cvs")
    .insert({
      id: cvId,
      user_id: userId,
      name: "CV Jonathan De La Sen - Principal",
      filename: "cv_jonathan_delasen.pdf",
      file_size: 45280,
      type: "uploaded",
      text_node: mockCVText,
      schema_version: "cv-profile.v1",
      source_text_hash: crypto.createHash("sha256").update(mockCVText).digest("hex"),
    });

  if (cvErr) {
    console.error("Error al crear CV:", cvErr.message);
    process.exit(1);
  }

  console.log(`CV creado exitosamente (ID: ${cvId})`);

  console.log("[5/13] Creando CV Structured Profile...");
  const mockProfile = {
    basics: {
      name: "Jonathan De La Sen",
      headline: "Senior Full-Stack Engineer & AI Solutions Architect",
      email: "agent-test@example.com",
      phone: "+34 600 000 000",
      location: "Madrid, Spain",
      links: [
        { label: "GitHub", url: "https://github.com/JonathandelaSen" },
        { label: "LinkedIn", url: "https://linkedin.com/in/jonathandelasen" }
      ]
    },
    summary: "Software engineer with 8+ years of experience designing and building scalable web applications, distributed systems, and AI integrations. Focused on DDD, beautiful UX, and solid system architecture.",
    experience: [
      {
        company: "Tech Innovations S.L.",
        role: "Lead Full-Stack Engineer",
        location: "Madrid, Spain",
        dates: { start: "2022-01", current: true },
        bullets: [
          "Led a team of 5 developers to migrate legacy monolith to Next.js and Supabase, increasing performance by 40%.",
          "Designed and implemented high-throughput LLM prompt processing pipeline handling 10k+ daily analyses.",
          "Introduced DDD architectural patterns and hexagonal codebase structure to improve maintainability."
        ]
      },
      {
        company: "Software Solutions Corp",
        role: "Senior Developer",
        location: "Remote",
        dates: { start: "2018-03", end: "2021-12" },
        bullets: [
          "Built responsive user interfaces using React, TailwindCSS, and state-management libraries.",
          "Optimized complex PostgreSQL queries and database schemas, reducing average response latency by 200ms.",
          "Automated continuous integration and deployment pipelines using GitHub Actions."
        ]
      }
    ],
    education: [
      {
        institution: "Universidad Politécnica de Madrid",
        degree: "Bachelor of Science",
        field: "Computer Science",
        location: "Madrid, Spain",
        dates: { start: "2013-09", end: "2017-06" },
        details: [
          "Graduated with honors in Software Engineering major.",
          "Thesis on distributed processing architectures."
        ]
      }
    ],
    skills: [
      { name: "Languages", items: ["TypeScript", "JavaScript", "Python", "SQL", "HTML5/CSS3"] },
      { name: "Frameworks", items: ["Next.js", "React", "Node.js", "Express", "Vite"] },
      { name: "Databases & Cloud", items: ["PostgreSQL", "Supabase", "Redis", "Docker", "AWS"] },
      { name: "Methodologies", items: ["DDD", "Hexagonal Architecture", "Agile/Scrum", "TDD"] }
    ],
    languages: [
      { name: "Español", level: "Nativo" },
      { name: "English", level: "C1 - Professional" }
    ],
    certifications: [
      {
        name: "AWS Certified Solutions Architect",
        issuer: "Amazon Web Services",
        date: "2023-05"
      }
    ]
  };

  const structProfileId = crypto.randomUUID();
  const { error: spErr } = await supabase
    .from("cv_structured_profiles")
    .insert({
      id: structProfileId,
      user_id: userId,
      cv_id: cvId,
      schema_version: "cv-profile.v1",
      source_text_hash: crypto.createHash("sha256").update(mockCVText).digest("hex"),
      ai_model: "gemini-2.5-flash",
      profile: mockProfile,
    });

  if (spErr) {
    console.error("Error al crear CV Structured Profile:", spErr.message);
    process.exit(1);
  }
  console.log(`CV Structured Profile creado (ID: ${structProfileId})`);

  console.log("[6/13] Creando CV Analysis...");
  const { error: cvaErr } = await supabase
    .from("cv_analyses")
    .insert({
      id: crypto.randomUUID(),
      user_id: userId,
      cv_document_id: cvId,
      cv_structured_profile_id: structProfileId,
      title: "Análisis de CV - Jonathan De La Sen",
      filename: "cv_jonathan_delasen.pdf",
      file_size: 45280,
      ai_model: "gemini-2.5-flash",
      score: 88,
      feedback: "El currículum está sumamente bien estructurado y demuestra una sólida progresión profesional hacia roles de liderazgo técnico y arquitectura de software. Las viñetas de experiencia son de alto impacto y están orientadas a resultados cuantificables. La sección de habilidades refleja tecnologías modernas y relevantes. Se recomienda enriquecer la sección de proyectos personales o colaboraciones de código abierto, y detallar más el impacto de las automatizaciones implementadas.",
      keywords: ["TypeScript", "Next.js", "Supabase", "DDD", "Hexagonal Architecture", "PostgreSQL", "Liderazgo Técnico", "AI Prompt Engineering"],
      improvements: [
        "Cuantificar con mayor precisión el ahorro de costes en los pipelines de LLM.",
        "Añadir enlaces a proyectos relevantes de código abierto en GitHub para demostrar contribuciones tangibles.",
        "Incluir una sección corta de logros destacados al inicio del resumen profesional para captar atención inmediata."
      ],
      analyzed_at: new Date().toISOString(),
    });

  if (cvaErr) {
    console.error("Error al crear CV Analysis:", cvaErr.message);
    process.exit(1);
  }
  console.log("CV Analysis creado exitosamente.");

  console.log("[7/13] Creando Job Opportunity y Job Match Analysis...");
  const jobOppId = crypto.randomUUID();
  const { error: joErr } = await supabase
    .from("job_opportunities")
    .insert({
      id: jobOppId,
      user_id: userId,
      company: "Stripe",
      title: "Senior Full-Stack Engineer (AI Team)",
      location: "Madrid, Spain / Hybrid",
      remote: "Hybrid",
      salary: "85,000 - 105,000 EUR",
      seniority: "Senior",
      contract_type: "Full-time",
      url: "https://stripe.com/jobs/senior-fullstack-ai",
      benefits: ["Seguro médico completo", "Presupuesto de teletrabajo de 2000 EUR", "Opciones sobre acciones (RSUs)", "Clases de idiomas"],
      requirements: ["5+ años en desarrollo Full-Stack", "Experiencia sólida con React, TypeScript y Node.js", "Conocimientos demostrables de bases de datos relacionales (PostgreSQL)", "Experiencia previa trabajando con APIs de LLM o integraciones de IA"],
      responsibilities: ["Diseñar y construir flujos interactivos para las herramientas internas asistidas por IA de Stripe", "Colaborar con ingenieros de ML para optimizar la latencia y fiabilidad del front-end", "Asegurar la consistencia arquitectónica y escalabilidad del código"],
      description: "Buscamos un Ingeniero Full-Stack Senior apasionado por la inteligencia artificial y las interfaces de usuario de alta fidelidad. Trabajarás en el equipo central de IA construyendo el futuro de las operaciones y flujos de pago inteligentes en Stripe.",
    });

  if (joErr) {
    console.error("Error al crear Job Opportunity:", joErr.message);
    process.exit(1);
  }
  console.log(`Job Opportunity creado (ID: ${jobOppId})`);

  const jobMatchId = crypto.randomUUID();
  const { error: jmErr } = await supabase
    .from("job_match_analyses")
    .insert({
      id: jobMatchId,
      user_id: userId,
      cv_document_id: cvId,
      cv_structured_profile_id: structProfileId,
      job_opportunity_id: jobOppId,
      title: "Compatibilidad CV - Stripe (Senior AI Engineer)",
      filename: "cv_jonathan_delasen.pdf",
      file_size: 45280,
      ai_model: "gemini-2.5-flash",
      score: 93,
      feedback: "Excelente nivel de afinidad con la oportunidad en Stripe. Tu experiencia liderando el desarrollo Full-Stack con Next.js y Supabase encaja perfectamente con el stack requerido de React/TypeScript/PostgreSQL. Además, tu experiencia construyendo pipelines de procesamiento LLM en Tech Innovations cubre de sobra el requisito de integraciones de IA. Tienes el nivel de senioridad adecuado y dominas metodologías arquitectónicas limpias que aportarán gran valor al equipo.",
      ai_keywords: ["React", "TypeScript", "Node.js", "PostgreSQL", "LLM APIs", "System Architecture", "DDD"],
      improvements: [
        "Alinear el resumen del currículum para destacar explícitamente el entusiasmo por trabajar en herramientas financieras y sistemas de alta transaccionalidad.",
        "Destacar la optimización de latencia en bases de datos PostgreSQL realizada en Software Solutions, ya que Stripe valora altamente la eficiencia de bases de datos."
      ],
      job_keywords: ["React", "TypeScript", "Node.js", "PostgreSQL", "LLM APIs", "High Fidelity UI", "Collaboration"],
      cv_keywords: ["TypeScript", "Next.js", "Supabase", "React", "Node.js", "PostgreSQL", "LLM Processing", "DDD"],
      matching_keywords: ["React", "TypeScript", "Node.js", "PostgreSQL", "LLM APIs"],
      missing_keywords: ["High Fidelity UI"],
      analyzed_at: new Date().toISOString(),
    });

  if (jmErr) {
    console.error("Error al crear Job Match Analysis:", jmErr.message);
    process.exit(1);
  }
  console.log(`Job Match Analysis creado (ID: ${jobMatchId})`);

  console.log("[8/13] Creando Follow-up para la oportunidad de Stripe...");
  const { error: fuErr } = await supabase
    .from("follow_ups")
    .insert({
      user_id: userId,
      job_opportunity_id: jobOppId,
      status: "entrevista",
      notes: "El reclutador se puso en contacto. Programamos una llamada inicial de 30 minutos para hablar sobre el stack y mi experiencia con IA. La entrevista técnica de arquitectura y algoritmos será en la segunda fase.",
      next_action: "Repasar patrones de arquitectura distribuidos y preparación de casos prácticos de diseño de sistemas de Stripe.",
      next_action_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    });

  if (fuErr) {
    console.error("Error al crear Follow-up:", fuErr.message);
    process.exit(1);
  }
  console.log("Follow-up creado exitosamente.");

  console.log("[9/13] Creando Process Questions (Preguntas de entrevista)...");
  const { error: pqErr } = await supabase
    .from("process_questions")
    .insert([
      {
        user_id: userId,
        job_opportunity_id: jobOppId,
        question: "¿Cómo optimizarías la latencia de una interfaz web que recibe respuestas de un LLM en streaming?",
        context: "Dado que el usuario de Stripe espera experiencias fluidas y en tiempo real, procesar tokens en stream es clave.",
        answer: "Usaría componentes de React que soporten streaming Server Sent Events (SSE). Renderizaría los tokens optimistamente usando buffers cortos para evitar saltos bruscos en el scroll de la UI. Implementaría cancelación del fetch en caso de que el usuario cierre el chat o reinicie la consulta para no saturar conexiones activas de red.",
        ai_model: "gemini-2.5-flash",
        ai_generated_at: new Date().toISOString(),
      },
      {
        user_id: userId,
        job_opportunity_id: jobOppId,
        question: "Explica cómo diseñaste el pipeline de prompts y LLM en tu trabajo actual.",
        context: "Pregunta directa de comportamiento/técnica para evaluar tu experiencia previa en IA listada en tu CV.",
        answer: "Diseñamos un pipeline asíncrono utilizando colas de Redis y Node.js. Implementamos un sistema de plantillas dinámicas (prompt templates) desacopladas del controlador principal. Usamos reintentos exponenciales con backoff y fallback automático a modelos alternativos cuando la API principal fallaba o estaba saturada de límites de tasa (rate limits).",
        ai_model: "gemini-2.5-flash",
        ai_generated_at: new Date().toISOString(),
      }
    ]);

  if (pqErr) {
    console.error("Error al crear Process Questions:", pqErr.message);
    process.exit(1);
  }
  console.log("Preguntas de entrevista creadas exitosamente.");

  console.log("[10/13] Creando Work Journal Entries (Entradas del diario de trabajo)...");
  const { error: wjErr } = await supabase
    .from("work_journal_entries")
    .insert([
      {
        user_id: userId,
        activity_context_id: projContextId,
        date_start: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 3 days ago
        topic: "Refactorización de Arquitectura Hexagonal",
        input_mode: "manual",
        raw_notes: "Hoy refactoricé los repositorios del módulo de diario de trabajo. Implementé SupabaseAware para soportar multitenancy y bindRequest por request de manera limpia. Eliminé el acoplamiento directo de db.ts.",
        final_text: "Refactoricé con éxito el módulo de diario de trabajo para adoptar los patrones de arquitectura hexagonal y Domain-Driven Design (DDD). Implementé la interfaz `SupabaseAware` en los repositorios de infraestructura, facilitando la inyección dinámica del cliente de base de datos (`bindRequest`) en cada petición HTTP. Este cambio elimina por completo la dependencia del módulo con conexiones estáticas globales (`db.ts`), garantizando el aislamiento de datos por usuario y mejorando drásticamente la capacidad de realizar pruebas unitarias e integración en el backend.",
      },
      {
        user_id: userId,
        activity_context_id: empContextId,
        date_start: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 1 day ago
        topic: "Preparación de Entrevista con Stripe",
        input_mode: "ai_assisted",
        raw_notes: "Estudié los casos de uso comunes de Stripe en IA y preparé respuestas sobre optimización de latencia en streaming de LLM.",
        final_text: "Completé una sesión intensiva de preparación técnica de cara a la entrevista en Stripe. Diseñé un modelo conceptual de arquitectura frontend optimizado para el consumo de APIs generativas asíncronas en tiempo real, profundizando en técnicas de renderizado progresivo a través de Server Sent Events (SSE), estrategias de amortiguación de tokens para mitigar el parpadeo de layout, y mecanismos de control de flujo para cancelar peticiones redundantes. Además, preparé un caso práctico sobre cómo manejar límites de tasa (rate limiting) de manera elegante en el cliente.",
      }
    ]);

  if (wjErr) {
    console.error("Error al crear Work Journal Entries:", wjErr.message);
    process.exit(1);
  }
  console.log("Work Journal Entries creadas con éxito.");

  console.log("[11/13] Creando Feedback Notes y Received Feedback...");

  const feedbacksToSeed = [
    {
      person_name: "María López (CTO)",
      status: "active",
      entries: [
        "María mencionó en la reunión trimestral que valora enormemente el rigor con el que introduje DDD en el equipo técnico. Mencionó que la calidad y legibilidad del código del checker ha aumentado considerablemente.",
        "Sugerencia de María: Para el próximo sprint, sería genial si pudiera liderar la mentoría de los desarrolladores junior en patrones de testing backend con Vitest, ayudando a elevar el nivel de cobertura."
      ]
    },
    {
      person_name: "David Silva (Senior Dev)",
      status: "closed",
      final_feedback: "Jonathan demostró un liderazgo excepcional guiando al equipo en la migración a arquitectura hexagonal. Las sesiones de diseño técnico que organizó fueron fundamentales.",
      closed_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      entries: [
        "David comentó que las explicaciones sobre la interfaz SupabaseAware ayudaron a desenredar varios antipatrones en el acceso a la base de datos.",
        "Mencionó que le gustaría ver más ejemplos de pruebas unitarias usando mocks del EventTracker para el flujo asíncrono."
      ]
    },
    {
      person_name: "Ana Martínez (Product Manager)",
      status: "active",
      entries: [
        "Ana destacó positivamente la velocidad con la que implementamos la vista interactiva de compatibilidad de ofertas.",
        "Nos pide poner especial foco en optimizar el tiempo de carga del árbol de competencias en el primer renderizado de la UI."
      ]
    },
    {
      person_name: "Carlos Ruiz (Tech Lead)",
      status: "active",
      entries: [
        "Carlos sugirió revisar la carga de bundle de PDFJS en el cliente para no bloquear el hilo de renderizado principal en conexiones lentas.",
        "Felicitó al equipo por la robustez del validador de tipos en la capa de la API de Next.js."
      ]
    },
    {
      person_name: "Laura Gómez (UX Designer)",
      status: "closed",
      final_feedback: "La implementación de las transiciones en el menú lateral y las animaciones de carga con Framer Motion superaron nuestras expectativas de pulido visual.",
      closed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      entries: [
        "Laura notó pequeños desalineamientos de 4px en la cabecera de las tarjetas en resoluciones de tablet.",
        "Propuso un diseño más fluido y con menos bordes marcados para la sección de diarios de trabajo."
      ]
    },
    {
      person_name: "Elena Ramos (HR Partner)",
      status: "active",
      entries: [
        "Elena felicitó a Jonathan por su excelente onboarding técnico de los dos nuevos integrantes de ingeniería.",
        "Sugiere estructurar una guía rápida para que los nuevos desarrolladores configuren su entorno local de Supabase de manera más autónoma."
      ]
    },
    {
      person_name: "Javier Ortega (VP of Engineering)",
      status: "active",
      entries: [
        "Javier felicitó al equipo por mantener la estabilidad en producción con cero incidencias críticas durante la migración de la base de datos.",
        "Preguntó por la viabilidad de incorporar logs distribuidos de OpenTelemetry a mediano plazo."
      ]
    },
    {
      person_name: "Sofía Castro (Senior QA)",
      status: "closed",
      final_feedback: "El número de regresiones detectadas en el backend se redujo prácticamente a cero tras la migración a use-cases con Vitest. Gran trabajo coordinando esto.",
      closed_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      entries: [
        "Sofía felicitó por la claridad en la descripción de los escenarios en los archivos *.test.ts.",
        "Señaló un caso extremo de huso horario no contemplado al procesar fechas de compromisos vencidos en la madrugada."
      ]
    },
    {
      person_name: "Pedro Morales (DevOps Engineer)",
      status: "active",
      entries: [
        "Pedro agradeció la simplificación de variables de entorno y secretos del pipeline de CI/CD.",
        "Propone migrar las imágenes Docker de procesamiento de PDF a una arquitectura ARM64 para ahorrar costes de AWS Fargate."
      ]
    },
    {
      person_name: "Lucía Santos (Frontend Engineer)",
      status: "active",
      entries: [
        "Lucía mencionó que el refactor del Feature Router facilitó enormemente la creación de las nuevas pantallas de objetivos.",
        "Recomienda extraer los helpers de formateo de moneda a un módulo compartido en frontend."
      ]
    },
    {
      person_name: "Alberto Gil (Backend Developer)",
      status: "closed",
      final_feedback: "La adopción de Value Objects inmutables para la identidad del usuario y fechas ISO previno con éxito múltiples bugs de mutación de estado silenciosos.",
      closed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      entries: [
        "Alberto admitió que al principio le costaba entender el patrón, pero ahora aprecia la seguridad técnica de no lidiar con tipos primitivos sueltos.",
        "Sugirió compilar un glosario de términos DDD para el equipo."
      ]
    },
    {
      person_name: "Marta Navarro (Customer Success)",
      status: "active",
      entries: [
        "Marta reportó que los usuarios finales están fascinados con el autocompletado inteligente de diarios usando IA.",
        "Solicitó agregar una opción para descargar el reporte mensual en formato PDF firmado."
      ]
    },
    {
      person_name: "Diego Ortiz (Systems Architect)",
      status: "active",
      entries: [
        "Diego elogió la separación clara entre la lógica de prompts e invocación directa al SDK de Gemini en el módulo feedback-notes.",
        "Sugerencia: añadir caché persistente de Redis para los prompts más comunes y estáticos."
      ]
    },
    {
      person_name: "Beatriz Soler (Security Analyst)",
      status: "closed",
      final_feedback: "La auditoría de políticas de RLS en Supabase fue superada con matrícula de honor. Las comprobaciones basadas en subconsultas de auth.uid() aíslan perfectamente a cada inquilino.",
      closed_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      entries: [
        "Beatriz recomendó limitar el rol service_role únicamente a tareas administrativas y cronjobs de backend asíncronos.",
        "Validó que no hay fugas de tokens en las respuestas serializadas por los controladores API."
      ]
    },
    {
      person_name: "Raúl Ibáñez (Agile Coach)",
      status: "active",
      entries: [
        "Raúl destacó la participación activa de Jonathan en la retrospectiva y su enfoque pragmático para solucionar cuellos de botella en las revisiones de código.",
        "Sugerencia: Reducir a un máximo de 3 historias de usuario en progreso simultáneo por desarrollador."
      ]
    },
    {
      person_name: "Carmen Torres (Data Analyst)",
      status: "active",
      entries: [
        "Carmen felicitó al equipo por la consistencia de los eventos guardados en la tabla de observabilidad.",
        "Nos pidió añadir una propiedad adicional con el tiempo exacto de procesamiento de LLM para afinar los gráficos de coste por uso."
      ]
    },
    {
      person_name: "Ignacio Vega (Lead Architect)",
      status: "closed",
      final_feedback: "El diseño de la QueryBus centralizada para comunicación intermodular ha sido la mejor decisión arquitectónica del año. Previene con éxito el acoplamiento cruzado de bases de datos.",
      closed_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      entries: [
        "Ignacio sugirió añadir tipado estricto a las clases Query para evitar casts dinámicos en tiempo de ejecución.",
        "Destacó positivamente la documentación autogenerada de endpoints."
      ]
    },
    {
      person_name: "Silvia Mendez (Lead Recruiter)",
      status: "active",
      entries: [
        "Silvia mencionó que el panel de preguntas de entrevista personalizadas para ofertas nos está ahorrando mucho tiempo en la preselección.",
        "Sugiere poder clasificar las preguntas por nivel de dificultad directamente desde la pantalla de la oferta."
      ]
    },
    {
      person_name: "Fernando Soto (Mobile Developer)",
      status: "active",
      entries: [
        "Fernando valoró la agilidad técnica de las APIs REST para conectarse desde la app móvil nativa en desarrollo.",
        "Sugirió incluir paginación estándar por cursor en la lista de entradas del diario."
      ]
    },
    {
      person_name: "Gloria Medina (Product Designer)",
      status: "closed",
      final_feedback: "La pantalla de objetivos y compromisos cumple exactamente con la especificación interactiva propuesta. Las microinteracciones para completar tareas son espectaculares.",
      closed_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      entries: [
        "Gloria propuso utilizar una paleta de colores HSL más cálida para la priorización alta de compromisos.",
        "Felicitó por el soporte impecable de modo oscuro y glassmorphism."
      ]
    }
  ];

  for (const fbItem of feedbacksToSeed) {
    const feedbackId = crypto.randomUUID();
    const { error: fbnErr } = await supabase
      .from("feedback_notes_feedbacks")
      .insert({
        id: feedbackId,
        user_id: userId,
        person_name: fbItem.person_name,
        status: fbItem.status,
        final_feedback: fbItem.final_feedback || null,
        closed_at: fbItem.closed_at || null,
      });

    if (fbnErr) {
      console.error(`Error al crear Feedback Note para ${fbItem.person_name}:`, fbnErr.message);
      process.exit(1);
    }

    if (fbItem.entries && fbItem.entries.length > 0) {
      const entryRows = fbItem.entries.map((content) => ({
        user_id: userId,
        feedback_id: feedbackId,
        content: content,
      }));

      const { error: fbneErr } = await supabase
        .from("feedback_notes_entries")
        .insert(entryRows);

      if (fbneErr) {
        console.error(`Error al crear Feedback Note Entries para ${fbItem.person_name}:`, fbneErr.message);
        process.exit(1);
      }
    }
  }

  console.log(`Se sembraron exitosamente ${feedbacksToSeed.length} Feedback Notes con sus correspondientes entradas.`);

  const { error: rfErr } = await supabase
    .from("received_feedback")
    .insert([
      {
        user_id: userId,
        activity_context_id: defaultContextId,
        received_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 5 days ago
        giver_name: "David Silva (Senior Dev)",
        feedback_text: "Jonathan tiene una destreza espectacular en el diseño de arquitecturas limpias. Su iniciativa de refactorizar el backend bajo DDD nos ha ahorrado incontables horas de depuración de dependencias cíclicas y ha hecho que integrar nuevas funcionalidades sea un proceso intuitivo.",
        user_note: "Me alegra ver que el esfuerzo de refactorización está dando frutos tangibles para el equipo en su día a día.",
      }
    ]);

  if (rfErr) {
    console.error("Error al crear Received Feedback:", rfErr.message);
    process.exit(1);
  }
  console.log("Received Feedback creado exitosamente.");

  console.log("[12/13] Creando Commitments (Objetivos y metas de carrera)...");
  const commitmentId = crypto.randomUUID();
  const { error: comErr } = await supabase
    .from("commitments")
    .insert({
      id: commitmentId,
      user_id: userId,
      activity_context_id: defaultContextId,
      title: "Liderar la transición tecnológica hacia arquitectura limpia (DDD)",
      description: "Establecer las bases arquitectónicas de Domain-Driven Design y Hexagonal Architecture en el backend del checker, eliminando el acoplamiento con la base de datos y capacitando al equipo.",
      success_criteria: "1. Haber migrado al menos 3 módulos centrales (Work Journal, Feedback Notes, Commitments).\n2. Tener una cobertura de tests backend superior al 80% en los módulos migrados.\n3. Contar con un documento de convenciones técnicas aprobado.",
      source: "self",
      status: "active",
      priority: "high",
      start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 15 days ago
      target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days from now
    });

  if (comErr) {
    console.error("Error al crear Commitment:", comErr.message);
    process.exit(1);
  }

  const { error: comiErr } = await supabase
    .from("commitment_items")
    .insert([
      {
        user_id: userId,
        commitment_id: commitmentId,
        title: "Escribir documento de convenciones técnicas AGENTS.md",
        notes: "Definir de forma explícita el estándar de la arquitectura de capas, los controladores de endpoints API, y las reglas del inyector SupabaseAware.",
        status: "done",
        due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        order_index: 0,
      },
      {
        user_id: userId,
        commitment_id: commitmentId,
        title: "Migrar el módulo de Work Journal a arquitectura hexagonal",
        notes: "Implementar entidades, value objects, ports, use cases e infraestructura del diario de trabajo.",
        status: "done",
        due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        order_index: 1,
      },
      {
        user_id: userId,
        commitment_id: commitmentId,
        title: "Migrar el módulo de Feedback Notes",
        notes: "Realizar la migración técnica del módulo piloto para alinearlo con el frontend modular por features.",
        status: "in_progress",
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        order_index: 2,
      }
    ]);

  if (comiErr) {
    console.error("Error al crear Commitment Items:", comiErr.message);
    process.exit(1);
  }

  const { error: comoErr } = await supabase
    .from("commitment_outcomes")
    .insert([
      {
        user_id: userId,
        commitment_id: commitmentId,
        type: "leadership",
        status: "expected",
        title: "Transición oficial a Rol de Tech Lead",
        description: "Al culminar con éxito la migración arquitectónica y mentoría del equipo, se formalizará el ascenso a Technical Lead del área de software.",
      }
    ]);

  if (comoErr) {
    console.error("Error al crear Commitment Outcomes:", comoErr.message);
    process.exit(1);
  }
  console.log("Commitments creados exitosamente.");

  console.log("[13/13] Configurando User Preferences...");
  const { error: upErr } = await supabase
    .from("user_preferences")
    .upsert({
      user_id: userId,
      interface_language: "es",
    }, { onConflict: "user_id" });

  if (upErr) {
    console.error("Error al configurar User Preferences:", upErr.message);
    process.exit(1);
  }
  console.log("User Preferences configuradas a español ('es').");

  console.log("\n=======================================================");
  console.log("¡DATOS MOCK DE AGENTE POPULADOS CON ÉXITO!");
  console.log(`Usuario: ${email}`);
  console.log(`Contraseña: ${password}`);
  console.log("=======================================================");
}

main().catch((err) => {
  console.error("Error inesperado en el script de seed:", err);
  process.exit(1);
});
