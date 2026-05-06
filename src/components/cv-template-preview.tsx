"use client";

import type React from "react";
import type {
  StandardCVEducation,
  StandardCVExperience,
  StandardCVNamedItem,
  StandardCVProfile,
} from "@/lib/cv-profile";
import {
  getOrderedRenderableSections,
  getResolvedAccentColor,
  getSectionTitle,
  type CVRenderableSectionId,
  type CVTemplateId,
  type CVTemplateLocale,
} from "@/lib/cv-templates";

interface CVTemplatePreviewProps {
  profile: StandardCVProfile;
  templateId: CVTemplateId;
  locale: CVTemplateLocale;
  scale?: "card" | "full";
}

const hasItems = <T,>(items?: T[]) => Array.isArray(items) && items.length > 0;

function dateRange(
  dates?: { start?: string; end?: string; current?: boolean }
) {
  if (!dates?.start && !dates?.end) return "";
  if (dates.current) return [dates.start, dates.end || "Present"].filter(Boolean).join(" - ");
  return [dates.start, dates.end].filter(Boolean).join(" - ");
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="cvp-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function ExperienceItem({ item, companyFirst }: { item: StandardCVExperience; companyFirst?: boolean }) {
  return (
    <article className="cvp-item">
      <div className="cvp-item-head">
        <div>
          <h3>{companyFirst ? (item.company || item.role) : (item.role || item.company)}</h3>
          <p>
            {companyFirst
              ? [item.role, item.location].filter(Boolean).join(" · ")
              : [item.company, item.location].filter(Boolean).join(" · ")}
          </p>
        </div>
        <span>{dateRange(item.dates)}</span>
      </div>
      {hasItems(item.bullets) && (
        <ul>
          {item.bullets?.map((bullet, index) => <li key={index}>{bullet}</li>)}
        </ul>
      )}
    </article>
  );
}

function EducationItem({ item }: { item: StandardCVEducation }) {
  return (
    <article className="cvp-item">
      <div className="cvp-item-head">
        <div>
          <h3>{item.degree || item.institution}</h3>
          <p>
            {[item.institution, item.field, item.location]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <span>{dateRange(item.dates)}</span>
      </div>
      {hasItems(item.details) && (
        <ul>
          {item.details?.map((detail, index) => <li key={index}>{detail}</li>)}
        </ul>
      )}
    </article>
  );
}

function NamedItem({ item }: { item: StandardCVNamedItem }) {
  const metaParts = [item.issuer, item.organization].filter(Boolean);
  return (
    <article className="cvp-item cvp-small-item">
      <div className="cvp-item-head">
        <div>
          <h3>{item.name}</h3>
          <p>
            {metaParts.join(" · ")}
            {metaParts.length > 0 && item.url ? " · " : ""}
            {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer">{item.url}</a>}
          </p>
        </div>
        <span>{item.date}</span>
      </div>
      {item.description && <p className="cvp-description">{item.description}</p>}
      {hasItems(item.bullets) && (
        <ul>
          {item.bullets?.map((bullet, index) => <li key={index}>{bullet}</li>)}
        </ul>
      )}
    </article>
  );
}

const TEMPLATE_CLASS_MAP: Record<CVTemplateId, string> = {
  compact: "cvp-compact",
  classic: "cvp-classic",
  modern: "cvp-modern",
  filo: "cvp-filo",
};

export default function CVTemplatePreview({
  profile,
  templateId,
  locale,
  scale = "full",
}: CVTemplatePreviewProps) {
  const basics = profile.basics ?? {};
  const isModern = templateId === "modern";
  const isClassic = templateId === "classic";
  const isFilo = templateId === "filo";
  const skillSeparator = isModern || isFilo ? " / " : ", ";
  const accentColor = getResolvedAccentColor(profile, templateId);

  const renderSection = (section: CVRenderableSectionId) => {
    const title = getSectionTitle(section, locale, profile);

    if (section === "summary" && profile.summary) {
      return (
        <Section key={section} title={title}>
          <p className="cvp-summary">
            {isModern && basics.headline ? `${basics.headline}. ${profile.summary}` : profile.summary}
          </p>
        </Section>
      );
    }

    if (section === "skills" && hasItems(profile.skills)) {
      return (
        <Section key={section} title={title}>
          {isClassic || isFilo ? (
            <p className="cvp-summary">
              {profile.skills?.flatMap((g) => g.items || []).join(", ")}
            </p>
          ) : (
            <div className="cvp-skills">
              {profile.skills?.map((group, index) => (
                <div key={index}>
                  {group.name && <h3>{group.name}</h3>}
                  <p>{group.items?.join(skillSeparator)}</p>
                </div>
              ))}
            </div>
          )}
        </Section>
      );
    }

    if (section === "technicalSkills" && hasItems(profile.technicalSkills)) {
      const tagsColor = profile.presentation?.tagsColor;
      return (
        <Section key={section} title={title}>
          {isFilo ? (
            <p className="cvp-summary">
              {profile.technicalSkills?.join(skillSeparator)}
            </p>
          ) : (
            <div className="cvp-tags">
              {profile.technicalSkills?.map((skill, index) => (
                <span 
                  key={index} 
                  className="cvp-tag"
                  style={tagsColor ? { backgroundColor: tagsColor, color: "#ffffff" } : undefined}
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </Section>
      );
    }

    if (section === "experience" && hasItems(profile.experience)) {
      return (
        <Section key={section} title={title}>
          {profile.experience?.map((item, index) => (
            <ExperienceItem key={index} item={item} companyFirst={isModern} />
          ))}
        </Section>
      );
    }

    if (section === "projects" && hasItems(profile.projects)) {
      return (
        <Section key={section} title={title}>
          {profile.projects?.map((item, index) => (
            <NamedItem key={index} item={item} />
          ))}
        </Section>
      );
    }

    if (section === "education" && hasItems(profile.education)) {
      return (
        <Section key={section} title={title}>
          {profile.education?.map((item, index) => (
            <EducationItem key={index} item={item} />
          ))}
        </Section>
      );
    }

    if (section === "languages" && hasItems(profile.languages)) {
      const tagsColor = profile.presentation?.tagsColor;
      return (
        <Section key={section} title={title}>
          <div className="cvp-tags">
            {profile.languages?.map((language, index) => (
              <span 
                key={index}
                style={tagsColor ? { backgroundColor: tagsColor, color: "#ffffff" } : undefined}
              >
                {[language.name, language.level].filter(Boolean).join(" · ")}
              </span>
            ))}
          </div>
        </Section>
      );
    }

    if (section === "certifications" && hasItems(profile.certifications)) {
      return (
        <Section key={section} title={title}>
          {profile.certifications?.map((item, index) => (
            <NamedItem key={index} item={item} />
          ))}
        </Section>
      );
    }

    if (section === "awards" && hasItems(profile.awards)) {
      return (
        <Section key={section} title={title}>
          {profile.awards?.map((item, index) => (
            <NamedItem key={index} item={item} />
          ))}
        </Section>
      );
    }

    if (section === "publications" && hasItems(profile.publications)) {
      return (
        <Section key={section} title={title}>
          {profile.publications?.map((item, index) => (
            <NamedItem key={index} item={item} />
          ))}
        </Section>
      );
    }

    if (section === "volunteering" && hasItems(profile.volunteering)) {
      return (
        <Section key={section} title={title}>
          {profile.volunteering?.map((item, index) => (
            <NamedItem key={index} item={item} />
          ))}
        </Section>
      );
    }

    return null;
  };

  return (
    <div
      className={`cvp-shell ${TEMPLATE_CLASS_MAP[templateId]} ${
        scale === "card" ? "cvp-card-scale" : ""
      }`}
      style={{ "--cvp-accent": accentColor } as React.CSSProperties}
    >
      <header className="cvp-header">
        <div>
          <h1>{basics.name || "Untitled CV"}</h1>
          {basics.headline && !isModern && <p className="cvp-headline">{basics.headline}</p>}
        </div>
        <div className="cvp-contact">
          {basics.email && (
            <a key={basics.email} href={`mailto:${basics.email}`}>{basics.email}</a>
          )}
          {[basics.phone, basics.location]
            .filter(Boolean)
            .map((item) => (
              <span key={item}>{item}</span>
            ))}
          {basics.links?.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">{link.label || link.url}</a>
          ))}
        </div>
      </header>

      <main className="cvp-body">
        {getOrderedRenderableSections(profile).map(renderSection)}
      </main>
    </div>
  );
}
