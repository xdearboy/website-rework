import { getMotionMediaQueries, isMotionForced } from '@/shared/lib/motion';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface GithubProject {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  fork: boolean;
  archived: boolean;
}

const AUTO_ADVANCE_MS = 5_000;

interface ProjectCardProps {
  project: GithubProject;
}

function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="flex flex-col gap-1">
      <a
        href={project.html_url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-foreground/90 underline underline-offset-2 decoration-gray-500 transition-colors duration-150 hover:text-primary hover:decoration-primary"
      >
        {project.name}
      </a>
      {project.description ? (
        <p className="line-clamp-3 text-sm text-muted-foreground sm:text-base">
          {project.description}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground/60 italic sm:text-base">без описания</p>
      )}
      {project.language ? (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span aria-hidden="true" className="inline-block size-2 rounded-full bg-primary/70" />
          {project.language}
        </p>
      ) : null}
    </div>
  );
}

function StaticProjectList({ projects }: { projects: GithubProject[] }) {
  return (
    <ul>
      {projects.map((project) => (
        <li key={project.id}>
          <a href={project.html_url} target="_blank" rel="noopener noreferrer">
            {project.name}
          </a>
          {project.description ? ` — ${project.description}` : ''}
          {project.language ? (
            <span className="text-muted-foreground"> ({project.language})</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

interface ProjectCarouselProps {
  projects: GithubProject[];
}

export default function ProjectCarousel({ projects }: ProjectCarouselProps) {
  const containerRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const directionRef = useRef<1 | -1>(1);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const total = projects.length;
  const hasMultiple = total > 1;

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(query.matches && !isMotionForced());

    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const goNext = useCallback(() => {
    setIndex((current) => {
      directionRef.current = 1;
      return total === 0 ? 0 : (current + 1) % total;
    });
  }, [total]);

  const goPrev = useCallback(() => {
    setIndex((current) => {
      directionRef.current = -1;
      return total === 0 ? 0 : (current - 1 + total) % total;
    });
  }, [total]);

  const goTo = useCallback(
    (next: number) => {
      if (total === 0) return;
      setIndex((current) => {
        directionRef.current = next > current ? 1 : -1;
        return ((next % total) + total) % total;
      });
    },
    [total]
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-running on `index` change resets the 10s timer after manual nav
  useEffect(() => {
    if (!hasMultiple || paused || reduceMotion) return;

    const id = window.setInterval(goNext, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [hasMultiple, paused, reduceMotion, goNext, index]);

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    setPaused(document.hidden);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(getMotionMediaQueries(), (context) => {
        const { reduceMotion: reduce } = context.conditions as { reduceMotion: boolean };

        const card = trackRef.current?.querySelector<HTMLElement>('[data-carousel-card]');
        if (!card) return;

        if (reduce) {
          gsap.set(card, { opacity: 1, x: 0, filter: 'blur(0px)' });
          return;
        }

        const offset = 24 * directionRef.current;

        gsap.set(card, { opacity: 0, x: offset, filter: 'blur(6px)' });

        const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
        tl.to(card, {
          opacity: 1,
          x: 0,
          filter: 'blur(0px)',
          duration: 0.45,
        });

        return () => {
          tl.kill();
        };
      });

      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [index] }
  );

  if (total === 0) {
    return <p className="text-muted-foreground">проекты не найдены</p>;
  }

  if (!hasMultiple) {
    return (
      <div className="min-h-32">
        <ProjectCard project={projects[0]} />
      </div>
    );
  }

  if (reduceMotion) {
    return <StaticProjectList projects={projects} />;
  }

  const current = projects[index];

  return (
    <section
      ref={containerRef}
      aria-roledescription="carousel"
      aria-label="проекты с github"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: focusable region enables arrow-key nav for the carousel
      tabIndex={0}
      className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          goNext();
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault();
          goPrev();
        }
      }}
    >
      <div ref={trackRef} aria-live="polite" className="min-h-32 sm:min-h-28">
        <div key={current.id} data-carousel-card>
          <ProjectCard project={current} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          aria-label="предыдущий проект"
          onClick={goPrev}
          className="inline-flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors duration-150 hover:border-primary hover:text-primary"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground" aria-hidden="true">
            {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
          <div className="flex items-center gap-1.5">
            {projects.map((project, dotIndex) => (
              <button
                key={project.id}
                type="button"
                aria-label={`показать проект ${project.name}`}
                aria-current={dotIndex === index ? 'true' : undefined}
                onClick={() => goTo(dotIndex)}
                className={`size-2 rounded-full transition-colors duration-150 ${
                  dotIndex === index
                    ? 'bg-primary'
                    : 'bg-muted-foreground/40 hover:bg-muted-foreground'
                }`}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          aria-label="следующий проект"
          onClick={goNext}
          className="inline-flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors duration-150 hover:border-primary hover:text-primary"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
