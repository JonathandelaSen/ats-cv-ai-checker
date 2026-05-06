import {
  Document,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
  Font,
} from "@react-pdf/renderer";
import path from "path";
import type React from "react";
import type {
  StandardCVEducation,
  StandardCVExperience,
  StandardCVNamedItem,
  StandardCVProfile,
} from "@/lib/cv-profile";
import {
  getCVTemplate,
  getOrderedRenderableSections,
  getResolvedAccentColor,
  getSectionTitle,
  type CVRenderableSectionId,
  type CVTemplateId,
  type CVTemplateLocale,
} from "@/lib/cv-templates";

Font.register({
  family: "InterPDF",
  src: path.join(process.cwd(), "public/fonts/Inter-Regular.ttf"),
});

Font.register({
  family: "InterPDFSemiBold",
  src: path.join(process.cwd(), "public/fonts/Inter-SemiBold.ttf"),
});

Font.register({
  family: "InterPDFBold",
  src: path.join(process.cwd(), "public/fonts/Inter-Bold.ttf"),
});

Font.register({
  family: "InterPDFExtraBold",
  src: path.join(process.cwd(), "public/fonts/Inter-ExtraBold.ttf"),
});

Font.register({
  family: "GaramondPDF",
  src: path.join(process.cwd(), "public/fonts/EBGaramond-Regular.ttf"),
});

Font.register({
  family: "GaramondPDFBold",
  src: path.join(process.cwd(), "public/fonts/EBGaramond-Bold.ttf"),
});

Font.registerHyphenationCallback((word) => [word]);

// ─── Compact (Linea) styles ───
const compactStyles = StyleSheet.create({
  page: {
    padding: 42.52,
    fontFamily: "InterPDF",
    fontWeight: 400,
    fontSize: 9,
    lineHeight: 1.55,
    color: "#2d2d2d",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 24,
    borderBottomWidth: 2.25,
    borderBottomColor: "#111827",
    paddingBottom: 16.5,
    marginBottom: 19.5,
  },
  headerIdentity: {
    flex: 1,
    paddingRight: 9,
  },
  name: {
    fontFamily: "InterPDFExtraBold",
    fontSize: 24,
    fontWeight: 400,
    color: "#101010",
    marginBottom: 6,
    lineHeight: 1.1,
  },
  headline: {
    fontSize: 12.75,
    fontWeight: 400,
    color: "#505050",
    marginBottom: 4.5,
    lineHeight: 1.2,
  },
  contact: {
    flexShrink: 0,
    alignItems: "flex-end",
    color: "#4f4f4f",
    fontSize: 9,
    textAlign: "right",
  },
  contactLine: { marginBottom: 3 },
  body: { flexDirection: "column", gap: 0 },
  section: { marginBottom: 19.5 },
  sectionTitle: {
    fontFamily: "InterPDFExtraBold",
    fontWeight: 400,
    fontSize: 11.25,
    letterSpacing: 0,
    textTransform: "uppercase",
    color: "#161616",
    borderBottomWidth: 0.75,
    borderBottomColor: "#dfd9ce",
    paddingBottom: 4.5,
    marginBottom: 10,
  },
  summary: { color: "#2d2d2d", fontSize: 9, lineHeight: 1.55 },
  item: { marginBottom: 13.5 },
  itemHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
    marginBottom: 3,
  },
  itemHeadMain: { flexGrow: 1, flexShrink: 1 },
  itemTitle: {
    fontFamily: "InterPDFSemiBold",
    fontWeight: 600,
    fontSize: 9.75,
    color: "#161616",
    lineHeight: 1.2,
    marginBottom: 3,
  },
  itemMeta: { color: "#5a5a5a", fontSize: 9 },
  itemDate: {
    flexGrow: 0,
    flexShrink: 0,
    width: 90,
    color: "#5a5a5a",
    fontSize: 9,
    textAlign: "right",
  },
  bulletContainer: { flexDirection: "row", marginBottom: 3, paddingLeft: 4 },
  bulletDot: { width: 11, fontSize: 9, color: "#2d2d2d" },
  bulletText: { flex: 1, color: "#2d2d2d", fontSize: 9, lineHeight: 1.55 },
  skillsGrid: { flexDirection: "column", gap: 9, marginBottom: 9 },
  skillGroup: { marginBottom: 3 },
  skillTitle: {
    fontFamily: "InterPDFSemiBold",
    fontWeight: 600,
    fontSize: 9.75,
    color: "#161616",
    marginBottom: 3,
  },
  skillItems: { color: "#2d2d2d", fontSize: 9, lineHeight: 1.55 },
  tag: {
    color: "#2d2d2d",
    backgroundColor: "#f4f4f5",
    fontSize: 8.5,
    lineHeight: 1,
    borderRadius: 4,
    paddingTop: 3,
    paddingBottom: 5,
    paddingHorizontal: 8,
    marginBottom: 6,
    marginRight: 6,
    overflow: "hidden",
  },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 6, marginBottom: 6 },
  link: { color: "#2d2d2d", textDecoration: "none" },
});

// ─── Classic (Marco) styles ───
const classicStyles = StyleSheet.create({
  page: {
    padding: 42.52,
    fontFamily: "GaramondPDF",
    fontWeight: 400,
    fontSize: 10,
    lineHeight: 1.5,
    color: "#2d2d2d",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "column",
    alignItems: "center",
    borderBottomWidth: 0.75,
    borderBottomColor: "#1a1a2e",
    paddingBottom: 14,
    marginBottom: 19.5,
  },
  headerIdentity: { alignItems: "center" },
  name: {
    fontFamily: "GaramondPDFBold",
    fontSize: 26,
    fontWeight: 400,
    color: "#1a1a2e",
    marginBottom: 4,
    lineHeight: 1.1,
    textAlign: "center",
  },
  headline: {
    fontSize: 12,
    fontWeight: 400,
    color: "#505050",
    marginBottom: 6,
    lineHeight: 1.2,
    textAlign: "center",
  },
  contact: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 4,
    color: "#4f4f4f",
    fontSize: 9,
    textAlign: "center",
  },
  contactLine: { marginBottom: 0 },
  body: { flexDirection: "column", gap: 0 },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontFamily: "GaramondPDFBold",
    fontWeight: 400,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: "#1a1a2e",
    borderBottomWidth: 0.5,
    borderBottomColor: "#c8c4bc",
    paddingBottom: 4,
    marginBottom: 10,
  },
  summary: { color: "#2d2d2d", fontSize: 10, lineHeight: 1.5 },
  item: { marginBottom: 12 },
  itemHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
    marginBottom: 3,
  },
  itemHeadMain: { flexGrow: 1, flexShrink: 1 },
  itemTitle: {
    fontFamily: "GaramondPDFBold",
    fontWeight: 400,
    fontSize: 10.5,
    color: "#1a1a2e",
    lineHeight: 1.2,
    marginBottom: 2,
  },
  itemMeta: { color: "#5a5a5a", fontSize: 9.5 },
  itemDate: {
    flexGrow: 0,
    flexShrink: 0,
    width: 90,
    color: "#5a5a5a",
    fontSize: 9.5,
    textAlign: "right",
  },
  bulletContainer: { flexDirection: "row", marginBottom: 3, paddingLeft: 4 },
  bulletDot: { width: 11, fontSize: 10, color: "#2d2d2d" },
  bulletText: { flex: 1, color: "#2d2d2d", fontSize: 10, lineHeight: 1.5 },
  skillsGrid: { flexDirection: "column", gap: 0 },
  skillGroup: { marginBottom: 0 },
  skillTitle: {
    fontFamily: "GaramondPDFBold",
    fontWeight: 400,
    fontSize: 10,
    color: "#1a1a2e",
    marginBottom: 0,
  },
  skillItems: { color: "#2d2d2d", fontSize: 10, lineHeight: 1.5 },
  tag: {
    color: "#2d2d2d",
    backgroundColor: "#f0ede6",
    fontSize: 9.5,
    lineHeight: 1,
    borderRadius: 3,
    paddingTop: 3,
    paddingBottom: 5,
    paddingHorizontal: 7,
    marginBottom: 5,
    marginRight: 5,
    overflow: "hidden",
  },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  link: { color: "#2d2d2d", textDecoration: "none" },
});

// ─── Modern (Pulso) styles ───
const modernStyles = StyleSheet.create({
  page: {
    padding: 42.52,
    fontFamily: "InterPDF",
    fontWeight: 400,
    fontSize: 9.5,
    lineHeight: 1.5,
    color: "#2d2d2d",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "column",
    gap: 6,
    paddingBottom: 14,
    marginBottom: 18,
  },
  headerIdentity: { flexDirection: "column" },
  name: {
    fontFamily: "InterPDFExtraBold",
    fontSize: 30,
    fontWeight: 400,
    color: "#101010",
    marginBottom: 4,
    lineHeight: 1.05,
  },
  headline: {
    fontFamily: "InterPDFExtraBold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0,
    color: "#0f766e",
    marginBottom: 6,
    lineHeight: 1.2,
  },
  contact: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    color: "#4f4f4f",
    fontSize: 9,
  },
  contactLine: { marginBottom: 0 },
  body: { flexDirection: "column", gap: 0 },
  section: { marginBottom: 17 },
  sectionTitle: {
    fontFamily: "InterPDFExtraBold",
    fontWeight: 400,
    fontSize: 10,
    letterSpacing: 0,
    textTransform: "uppercase",
    color: "#0f766e",
    borderLeftWidth: 3,
    borderLeftColor: "#0f766e",
    paddingLeft: 8,
    paddingBottom: 0,
    marginBottom: 9,
  },
  summary: { color: "#2d2d2d", fontSize: 9.5, lineHeight: 1.5 },
  item: { marginBottom: 13 },
  itemHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
    marginBottom: 3,
  },
  itemHeadMain: { flexGrow: 1, flexShrink: 1 },
  itemTitle: {
    fontFamily: "InterPDFBold",
    fontWeight: 400,
    fontSize: 10,
    color: "#161616",
    lineHeight: 1.2,
    marginBottom: 2,
  },
  itemMeta: { color: "#5a5a5a", fontSize: 9 },
  itemDate: {
    flexGrow: 0,
    flexShrink: 0,
    width: 90,
    color: "#5a5a5a",
    fontSize: 9,
    textAlign: "right",
  },
  bulletContainer: { flexDirection: "row", marginBottom: 3, paddingLeft: 4 },
  bulletDot: { width: 11, fontSize: 9.5, color: "#2d2d2d" },
  bulletText: { flex: 1, color: "#2d2d2d", fontSize: 9.5, lineHeight: 1.5 },
  skillsGrid: { flexDirection: "column", gap: 6 },
  skillGroup: { marginBottom: 3 },
  skillTitle: {
    fontFamily: "InterPDFBold",
    fontWeight: 400,
    fontSize: 9.5,
    color: "#161616",
    marginBottom: 2,
  },
  skillItems: { color: "#2d2d2d", fontSize: 9.5, lineHeight: 1.5 },
  tag: {
    color: "#2d2d2d",
    backgroundColor: "#f0fdfa",
    fontSize: 8.5,
    lineHeight: 1,
    borderRadius: 3,
    paddingTop: 3,
    paddingBottom: 5,
    paddingHorizontal: 7,
    marginBottom: 5,
    marginRight: 5,
    overflow: "hidden",
  },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  link: { color: "#2d2d2d", textDecoration: "none" },
});

// ─── Filo styles ───
const filoStyles = StyleSheet.create({
  page: {
    padding: 42.52,
    fontFamily: "InterPDF",
    fontWeight: 400,
    fontSize: 9.5,
    lineHeight: 1.48,
    color: "#27272a",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "column",
    gap: 7,
    borderTopWidth: 6,
    borderTopColor: "#9f1239",
    borderBottomWidth: 2,
    borderBottomColor: "#171717",
    paddingTop: 11,
    paddingBottom: 14,
    marginBottom: 18,
  },
  headerIdentity: { flexDirection: "column" },
  name: {
    fontFamily: "InterPDFExtraBold",
    fontSize: 34,
    fontWeight: 400,
    color: "#111111",
    marginBottom: 5,
    lineHeight: 0.98,
    textTransform: "uppercase",
  },
  headline: {
    fontFamily: "InterPDFExtraBold",
    fontSize: 10.5,
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: 1.2,
    color: "#9f1239",
    textTransform: "uppercase",
  },
  contact: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    color: "#3f3f46",
    fontFamily: "InterPDFSemiBold",
    fontSize: 8.75,
  },
  contactLine: { marginBottom: 0 },
  body: { flexDirection: "column", gap: 0 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontFamily: "InterPDFExtraBold",
    fontWeight: 400,
    fontSize: 9.5,
    letterSpacing: 0,
    textTransform: "uppercase",
    color: "#171717",
    borderTopWidth: 2,
    borderTopColor: "#9f1239",
    borderBottomWidth: 0.75,
    borderBottomColor: "#171717",
    paddingTop: 4,
    paddingBottom: 4,
    marginBottom: 9,
  },
  summary: { color: "#27272a", fontSize: 9.5, lineHeight: 1.48 },
  item: { marginBottom: 12 },
  itemHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
    marginBottom: 3,
  },
  itemHeadMain: { flexGrow: 1, flexShrink: 1 },
  itemTitle: {
    fontFamily: "InterPDFExtraBold",
    fontWeight: 400,
    fontSize: 10.25,
    color: "#111111",
    lineHeight: 1.2,
    marginBottom: 2,
  },
  itemMeta: {
    color: "#52525b",
    fontFamily: "InterPDFSemiBold",
    fontSize: 8.75,
  },
  itemDate: {
    flexGrow: 0,
    flexShrink: 0,
    width: 86,
    color: "#52525b",
    fontFamily: "InterPDFSemiBold",
    fontSize: 8.75,
    textAlign: "right",
  },
  bulletContainer: { flexDirection: "row", marginBottom: 3, paddingLeft: 4 },
  bulletDot: { width: 10, fontSize: 9.5, color: "#9f1239" },
  bulletText: { flex: 1, color: "#27272a", fontSize: 9.5, lineHeight: 1.48 },
  skillsGrid: { flexDirection: "column", gap: 0 },
  skillGroup: { marginBottom: 0 },
  skillTitle: {
    fontFamily: "InterPDFExtraBold",
    fontWeight: 400,
    fontSize: 9.5,
    color: "#111111",
    marginBottom: 2,
  },
  skillItems: { color: "#27272a", fontSize: 9.5, lineHeight: 1.48 },
  tag: {
    color: "#27272a",
    backgroundColor: "#ffffff",
    borderWidth: 0.75,
    borderColor: "#9f1239",
    fontSize: 8.75,
    lineHeight: 1,
    borderRadius: 0,
    paddingTop: 3,
    paddingBottom: 5,
    paddingHorizontal: 7,
    marginBottom: 5,
    marginRight: 5,
    overflow: "hidden",
  },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  link: { color: "#27272a", textDecoration: "none" },
});

function getStyles(templateId: CVTemplateId) {
  if (templateId === "classic") return classicStyles;
  if (templateId === "modern") return modernStyles;
  if (templateId === "filo") return filoStyles;
  return compactStyles;
}

const hasItems = <T,>(items?: T[]) => Array.isArray(items) && items.length > 0;

function dateRange(dates?: { start?: string; end?: string; current?: boolean }) {
  if (!dates?.start && !dates?.end) return "";
  if (dates.current) {
    return [dates.start, dates.end || "Present"].filter(Boolean).join(" - ");
  }
  return [dates.start, dates.end].filter(Boolean).join(" - ");
}

function Section({
  title,
  children,
  s,
  accentColor,
}: {
  title: string;
  children: React.ReactNode;
  s: ReturnType<typeof getStyles>;
  accentColor: string;
}) {
  return (
    <View style={s.section}>
      <Text
        style={[
          s.sectionTitle,
          {
            color: accentColor,
            borderBottomColor: accentColor,
            borderLeftColor: accentColor,
          },
        ]}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function BulletList({ items, s }: { items?: string[]; s: ReturnType<typeof getStyles> }) {
  if (!hasItems(items)) return null;
  return (
    <View style={{ marginTop: 2 }}>
      {items?.map((item, index) => (
        <View key={index} style={s.bulletContainer} wrap={false}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={s.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function ExperiencePDF({
  item,
  s,
  companyFirst,
}: {
  item: StandardCVExperience;
  s: ReturnType<typeof getStyles>;
  companyFirst?: boolean;
}) {
  return (
    <View style={s.item}>
      <View style={s.itemHead} wrap={false}>
        <View style={s.itemHeadMain}>
          <Text style={s.itemTitle}>
            {companyFirst ? (item.company || item.role) : (item.role || item.company)}
          </Text>
          <Text style={s.itemMeta}>
            {companyFirst
              ? [item.role, item.location].filter(Boolean).join(" · ")
              : [item.company, item.location].filter(Boolean).join(" · ")}
          </Text>
        </View>
        <Text style={s.itemDate}>{dateRange(item.dates)}</Text>
      </View>
      <BulletList items={item.bullets} s={s} />
    </View>
  );
}

function EducationPDF({ item, s }: { item: StandardCVEducation; s: ReturnType<typeof getStyles> }) {
  return (
    <View style={s.item}>
      <View style={s.itemHead} wrap={false}>
        <View style={s.itemHeadMain}>
          <Text style={s.itemTitle}>{item.degree || item.institution}</Text>
          <Text style={s.itemMeta}>
            {[item.institution, item.field, item.location]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        </View>
        <Text style={s.itemDate}>{dateRange(item.dates)}</Text>
      </View>
      <BulletList items={item.details} s={s} />
    </View>
  );
}

function NamedPDF({ item, s }: { item: StandardCVNamedItem; s: ReturnType<typeof getStyles> }) {
  const metaParts = [item.issuer, item.organization].filter(Boolean);
  return (
    <View style={s.item}>
      <View style={s.itemHead} wrap={false}>
        <View style={s.itemHeadMain}>
          <Text style={s.itemTitle}>{item.name}</Text>
          <Text style={s.itemMeta}>
            {metaParts.join(" · ")}
            {metaParts.length > 0 && item.url ? " · " : ""}
            {item.url && (
              <Link src={item.url} style={s.link}>
                {item.url}
              </Link>
            )}
          </Text>
        </View>
        <Text style={s.itemDate}>{item.date}</Text>
      </View>
      {item.description && <Text style={s.summary}>{item.description}</Text>}
      <BulletList items={item.bullets} s={s} />
    </View>
  );
}

function CVTemplateDocument({
  profile,
  templateId,
  locale,
}: {
  profile: StandardCVProfile;
  templateId: CVTemplateId;
  locale: CVTemplateLocale;
}) {
  const basics = profile.basics ?? {};
  const s = getStyles(templateId);
  const templateDef = getCVTemplate(templateId);
  const documentVariant = templateDef?.name ?? "CV";
  const isModern = templateId === "modern";
  const isClassic = templateId === "classic";
  const isFilo = templateId === "filo";
  const skillSeparator = isModern || isFilo ? " / " : ", ";
  const accentColor = getResolvedAccentColor(profile, templateId);
  const tagsColor = profile.presentation?.tagsColor;

  const renderSection = (section: CVRenderableSectionId) => {
    const title = getSectionTitle(section, locale, profile);

    if (section === "summary" && profile.summary) {
      return (
        <Section key={section} title={title} s={s} accentColor={accentColor}>
          <View style={s.item}>
            <Text style={s.summary}>{profile.summary}</Text>
          </View>
        </Section>
      );
    }

    if (section === "experience" && hasItems(profile.experience)) {
      return (
        <Section key={section} title={title} s={s} accentColor={accentColor}>
          {profile.experience?.map((item, index) => (
            <ExperiencePDF key={index} item={item} s={s} companyFirst={isModern} />
          ))}
        </Section>
      );
    }

    if (section === "skills" && hasItems(profile.skills)) {
      return (
        <Section key={section} title={title} s={s} accentColor={accentColor}>
          {isClassic || isFilo ? (
            <Text style={s.skillItems}>
              {profile.skills?.flatMap((g) => g.items || []).join(", ")}
            </Text>
          ) : (
            <View style={s.skillsGrid}>
              {profile.skills?.map((group, index) => (
                <View key={index} style={s.skillGroup}>
                  {group.name && <Text style={s.skillTitle}>{group.name}</Text>}
                  <Text style={s.skillItems}>
                    {group.items?.join(skillSeparator)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Section>
      );
    }

    if (section === "education" && hasItems(profile.education)) {
      return (
        <Section key={section} title={title} s={s} accentColor={accentColor}>
          {profile.education?.map((item, index) => (
            <EducationPDF key={index} item={item} s={s} />
          ))}
        </Section>
      );
    }

    if (section === "projects" && hasItems(profile.projects)) {
      return (
        <Section key={section} title={title} s={s} accentColor={accentColor}>
          {profile.projects?.map((item, index) => (
            <NamedPDF key={index} item={item} s={s} />
          ))}
        </Section>
      );
    }

    if (section === "technicalSkills" && hasItems(profile.technicalSkills)) {
      return (
        <Section key={section} title={title} s={s} accentColor={accentColor}>
          {isFilo ? (
            <Text style={s.skillItems}>
              {profile.technicalSkills?.join(skillSeparator)}
            </Text>
          ) : (
            <View style={s.tagsContainer}>
              {profile.technicalSkills?.map((skill, index) => (
                <Text key={index} style={tagsColor ? [s.tag, { backgroundColor: tagsColor, color: "#ffffff" }] : s.tag}>
                  {skill}
                </Text>
              ))}
            </View>
          )}
        </Section>
      );
    }

    if (section === "languages" && hasItems(profile.languages)) {
      return (
        <Section key={section} title={title} s={s} accentColor={accentColor}>
          <View style={s.tagsContainer}>
            {profile.languages?.map((language, index) => (
              <Text key={index} style={tagsColor ? [s.tag, { backgroundColor: tagsColor, color: "#ffffff" }] : s.tag}>
                {[language.name, language.level].filter(Boolean).join(" · ")}
              </Text>
            ))}
          </View>
        </Section>
      );
    }

    if (section === "certifications" && hasItems(profile.certifications)) {
      return (
        <Section key={section} title={title} s={s} accentColor={accentColor}>
          {profile.certifications?.map((item, index) => (
            <NamedPDF key={index} item={item} s={s} />
          ))}
        </Section>
      );
    }

    if (section === "awards" && hasItems(profile.awards)) {
      return (
        <Section key={section} title={title} s={s} accentColor={accentColor}>
          {profile.awards?.map((item, index) => (
            <NamedPDF key={index} item={item} s={s} />
          ))}
        </Section>
      );
    }

    if (section === "publications" && hasItems(profile.publications)) {
      return (
        <Section key={section} title={title} s={s} accentColor={accentColor}>
          {profile.publications?.map((item, index) => (
            <NamedPDF key={index} item={item} s={s} />
          ))}
        </Section>
      );
    }

    if (section === "volunteering" && hasItems(profile.volunteering)) {
      return (
        <Section key={section} title={title} s={s} accentColor={accentColor}>
          {profile.volunteering?.map((item, index) => (
            <NamedPDF key={index} item={item} s={s} />
          ))}
        </Section>
      );
    }

    return null;
  };


  return (
    <Document
      title={basics.name ? `${basics.name} ${documentVariant} CV` : `${documentVariant} CV`}
      author={basics.name}
      language={locale}
    >
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View
          style={[
            s.header,
            {
              borderTopColor: accentColor,
              borderBottomColor: accentColor,
            },
          ]}
        >
          <View style={s.headerIdentity}>
            <Text style={s.name}>{basics.name || "Untitled CV"}</Text>
            {basics.headline && (
              <Text style={isModern || isFilo ? [s.headline, { color: accentColor }] : s.headline}>
                {basics.headline}
              </Text>
            )}
          </View>
          <View style={s.contact}>
            {isClassic ? (
              <Text style={s.contactLine}>
                {[
                  basics.email,
                  basics.phone,
                  basics.location,
                  ...(basics.links?.map((l) => l.label || l.url) || []),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            ) : (
              <>
                {basics.email && (
                  <Link src={`mailto:${basics.email}`} style={[s.contactLine, s.link]}>
                    {basics.email}
                  </Link>
                )}
                {[basics.phone, basics.location]
                  .filter(Boolean)
                  .map((item) => (
                    <Text key={item} style={s.contactLine}>
                      {item}
                    </Text>
                  ))}
                {basics.links?.map((link) => (
                  <Link key={link.url} src={link.url} style={[s.contactLine, s.link]}>
                    {link.label || link.url}
                  </Link>
                ))}
              </>
            )}
          </View>
        </View>

        {/* Body */}
        <View style={s.body}>
          {getOrderedRenderableSections(profile).map(renderSection)}
        </View>
      </Page>
    </Document>
  );
}

export async function renderTemplatePDF(input: {
  profile: StandardCVProfile;
  templateId: CVTemplateId;
  locale: CVTemplateLocale;
}): Promise<Buffer> {
  return renderToBuffer(
    <CVTemplateDocument
      profile={input.profile}
      templateId={input.templateId}
      locale={input.locale}
    />
  );
}
