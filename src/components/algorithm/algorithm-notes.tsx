import type { RefObject } from "react";
import { FileText } from "lucide-react";
import type { AlgorithmSection } from "@/algorithms/types";
import { EmptyState } from "@/components/shared/empty-state";

type AlgorithmNotesProps = {
  title: string;
  sections: AlgorithmSection[];
  containerRef: RefObject<HTMLDivElement | null>;
  headingRefs: RefObject<Map<string, HTMLHeadingElement>>;
};

export function AlgorithmNotes({
  title,
  sections,
  containerRef,
  headingRefs,
}: AlgorithmNotesProps) {
  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={`${title}的讲解`}
      tabIndex={0}
      className="h-full min-h-0 overflow-y-auto overscroll-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      {sections.length === 0 ? (
        <div className="flex min-h-full items-center justify-center p-6">
          <EmptyState
            icon={FileText}
            title="暂无算法讲解"
            description={`「${title}」尚未添加讲解内容。`}
          />
        </div>
      ) : (
        <article className="mx-auto max-w-[760px] px-5 py-7 text-sm leading-[1.75] sm:px-7 sm:py-8">
          {sections.map((section) => (
            <section
              key={section.id}
              className="mb-9 last:mb-0"
              aria-labelledby={section.id}
            >
              <h2
                id={section.id}
                ref={(heading) => {
                  if (heading) headingRefs.current.set(section.id, heading);
                  else headingRefs.current.delete(section.id);
                }}
                tabIndex={-1}
                className="mb-3 scroll-mt-7 break-words text-base font-semibold tracking-tight outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring"
              >
                {section.title}
              </h2>
              {section.paragraphs?.map((paragraph, index) => (
                <p
                  key={index}
                  className="mb-3 whitespace-pre-line break-words text-foreground/85 last:mb-0"
                >
                  {paragraph}
                </p>
              ))}
              {!!section.bullets?.length && (
                <ul className="my-3 list-disc space-y-2 pl-5 text-foreground/85 marker:text-muted-foreground">
                  {section.bullets.map((bullet, index) => (
                    <li
                      key={index}
                      className="whitespace-pre-line break-words pl-1"
                    >
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>
      )}
    </div>
  );
}
