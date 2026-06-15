import { type PostMeta, fetchManifest } from '@/features/blog/lib/blog-client';
import BadgeWall from '@/features/home/components/BadgeWall';
import CommitInfo from '@/features/home/components/CommitInfo';
import GithubContributions from '@/features/home/components/GithubContributions';
import NowPlayingWidget from '@/features/home/components/NowPlayingWidget';
import ProjectCarousel, { type GithubProject } from '@/features/home/components/ProjectCarousel';
import TimeWeatherWidget from '@/features/home/components/TimeWeatherWidget';
import WakatimeStats from '@/features/home/components/WakatimeStats';
import { contacts, explorePages, languages, technologies } from '@/features/home/data';
import PageShell from '@/shared/layout/PageShell';
import { getMotionMediaQueries } from '@/shared/lib/motion';
import { FlagIcon } from '@/shared/ui/FlagIcon';
import { Skeleton, SkeletonGroup } from '@/shared/ui/Skeleton';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useEffect, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, ScrambleTextPlugin);

export default function HomePage() {
  const { t } = useTranslation('home');
  const containerRef = useRef<HTMLDivElement>(null);
  const [projects, setProjects] = useState<GithubProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [latestPost, setLatestPost] = useState<PostMeta | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchProjects = async () => {
      try {
        setProjectsLoading(true);
        const response = await fetch('https://api.github.com/users/xdearboy/repos', {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Failed to fetch projects');
        const data: GithubProject[] = await response.json();
        const exclude = new Set(['Pterodactyl-Crasher', 'Pterodactyl-Crasher-EN']);
        const pinned = 'speedra';
        const openProjects = data.filter(
          (repo) => !repo.fork && !repo.archived && !exclude.has(repo.name)
        );
        const pinnedRepo = openProjects.find((repo) => repo.name === pinned);
        const rest = openProjects
          .filter((repo) => repo.name !== pinned)
          .sort((a, b) => b.stargazers_count - a.stargazers_count);
        const sorted = pinnedRepo
          ? [pinnedRepo, ...rest.filter((r) => r.id !== pinnedRepo.id)]
          : rest;
        setProjects(sorted.slice(0, 6));
        setProjectsError(null);
      } catch (err) {
        if (!controller.signal.aborted) {
          setProjectsError(t('projects.error'));
          console.error('Error fetching projects:', err);
        }
      } finally {
        setProjectsLoading(false);
      }
    };

    fetchProjects();
    return () => controller.abort();
  }, [t]);

  useEffect(() => {
    const controller = new AbortController();

    fetchManifest()
      .then((manifest) => {
        if (!controller.signal.aborted) {
          setLatestPost(manifest.posts[0] ?? null);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          console.error('Error fetching blog manifest:', err);
        }
      });

    return () => controller.abort();
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(getMotionMediaQueries(), (context) => {
        const { reduceMotion } = context.conditions as { reduceMotion: boolean };

        const splits: SplitText[] = [];

        if (reduceMotion) {
          gsap.set('[data-animate]', { opacity: 1, y: 0, clearProps: 'transform' });
          gsap.set('[data-hr-draw]', { scaleX: 1, clearProps: 'transform' });
          gsap.set('[data-footer-widget]', { opacity: 1, y: 0, clearProps: 'transform' });
          gsap.set('[data-name-cursor]', { opacity: 1 });
          return;
        }

        gsap.set('[data-hr-draw]', { scaleX: 0, transformOrigin: 'left center' });

        const addCascade = (
          tl: gsap.core.Timeline,
          container: HTMLElement,
          pos: string | number
        ) => {
          const children = Array.from(container.children) as HTMLElement[];
          if (children.length === 0) return;
          gsap.set(children, { opacity: 0, y: 18 });
          tl.to(
            children,
            {
              opacity: 1,
              y: 0,
              duration: 0.55,
              ease: 'power3.out',
              stagger: 0.08,
            },
            pos
          );
        };

        const nameEl = containerRef.current?.querySelector<HTMLElement>('[data-name-split]');
        const scrambleEl = containerRef.current?.querySelector<HTMLElement>('[data-scramble]');
        const cursorEl = containerRef.current?.querySelector<HTMLElement>('[data-name-cursor]');
        const headerImg = containerRef.current?.querySelector<HTMLElement>('header img');
        const headerSubtitle = containerRef.current?.querySelector<HTMLElement>('header p');

        const introTl = gsap.timeline();

        if (headerImg) {
          gsap.set(headerImg, { opacity: 0, scale: 0.92, y: 12 });
          introTl.to(
            headerImg,
            { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'power3.out' },
            0
          );
        }

        if (nameEl) {
          const split = SplitText.create(nameEl, { type: 'chars' });
          splits.push(split);
          gsap.set(split.chars, { opacity: 0, y: 18, rotateX: -60 });
          introTl.to(
            split.chars,
            {
              opacity: 1,
              y: 0,
              rotateX: 0,
              duration: 0.5,
              ease: 'back.out(1.7)',
              stagger: 0.035,
            },
            0.05
          );
        }

        if (cursorEl) {
          gsap.set(cursorEl, { opacity: 0 });
        }

        if (scrambleEl) {
          const originalText = scrambleEl.textContent ?? '';
          gsap.set(scrambleEl, { opacity: 1 });
          introTl.to(
            scrambleEl,
            {
              duration: 0.8,
              ease: 'none',
              scrambleText: {
                text: originalText,
                chars: '01<>/_xX@#',
                revealDelay: 0.15,
                speed: 0.35,
              },
            },
            0.35
          );
        }

        if (headerSubtitle) {
          gsap.set(headerSubtitle, { opacity: 0, y: 10 });
          introTl.to(headerSubtitle, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 0.5);
        }

        const introExtras = gsap.utils.toArray<HTMLElement>('[data-animate="intro"]').slice(1);
        for (const el of introExtras) {
          if (el.matches('[data-intro-instant]')) continue;
          if (el.matches('hr[data-hr-draw]')) {
            introTl.to(el, { scaleX: 1, duration: 0.6, ease: 'power3.out' }, '<0.1');
          } else {
            addCascade(introTl, el, '<0.1');
          }
        }

        if (cursorEl) {
          introTl.set(cursorEl, { opacity: 1 }, 1.15);
          introTl.call(
            () => {
              gsap.to(cursorEl, {
                opacity: 0,
                duration: 0.6,
                repeat: -1,
                yoyo: true,
                ease: 'steps(1)',
              });
            },
            undefined,
            1.15
          );
        }

        const revealTargets = gsap.utils.toArray<HTMLElement>('[data-animate="reveal"]');
        for (const el of revealTargets) {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          });

          if (el.matches('hr[data-hr-draw]')) {
            tl.to(el, { scaleX: 1, duration: 0.6, ease: 'power3.out' }, 0);
          } else if (el.tagName === 'FOOTER') {
            const widgets = gsap.utils.toArray<HTMLElement>('[data-footer-widget]', el);
            const innerHrs = gsap.utils.toArray<HTMLElement>('hr[data-hr-draw]', el);
            if (widgets.length > 0) {
              gsap.set(widgets, { opacity: 0, y: 28, scale: 0.97 });
              tl.to(
                widgets,
                {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  duration: 0.6,
                  ease: 'back.out(1.2)',
                  stagger: 0.1,
                },
                0
              );
            }
            if (innerHrs.length > 0) {
              tl.to(innerHrs, { scaleX: 1, duration: 0.6, ease: 'power3.out' }, 0.15);
            }
          } else {
            addCascade(tl, el, 0);
          }
        }

        const hoverTargets = gsap.utils.toArray<HTMLElement>('[data-hover-pop]');
        const hoverCleanups: Array<() => void> = [];
        for (const el of hoverTargets) {
          const skewTo = gsap.quickTo(el, 'skewX', { duration: 0.3, ease: 'power3.out' });
          const yTo = gsap.quickTo(el, 'y', { duration: 0.2, ease: 'power2.out' });
          const scaleTo = gsap.quickTo(el, 'scale', { duration: 0.2, ease: 'power2.out' });

          const onEnter = () => {
            yTo(-2);
            scaleTo(1.05);
            skewTo(-6);
          };
          const onLeave = () => {
            yTo(0);
            scaleTo(1);
            skewTo(0);
          };
          el.addEventListener('mouseenter', onEnter);
          el.addEventListener('mouseleave', onLeave);
          hoverCleanups.push(() => {
            el.removeEventListener('mouseenter', onEnter);
            el.removeEventListener('mouseleave', onLeave);
          });
        }

        return () => {
          for (const cleanup of hoverCleanups) cleanup();
          for (const el of hoverTargets) {
            gsap.set(el, { clearProps: 'all' });
          }
          for (const split of splits) split.revert();
        };
      });

      return () => mm.revert();
    },
    { scope: containerRef }
  );

  return (
    <PageShell>
      <div ref={containerRef}>
        <header data-animate="intro" className="mb-8 flex items-center gap-3 sm:gap-4">
          <img
            src="/avatar.jpg"
            alt={t('header.avatarAlt')}
            className="size-16 shrink-0 rounded-2xl border border-border object-cover sm:size-20"
          />
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-foreground break-words sm:text-2xl">
              <span data-name-split className="inline-block">
                xdearboy
              </span>{' '}
              <span className="text-sm font-normal text-muted-foreground sm:text-lg">
                <span data-scramble>{'// @xdearboy'}</span>
                <span data-name-cursor className="text-primary">
                  _
                </span>
              </span>
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{t('header.subtitle')}</p>
          </div>
        </header>
        <hr data-animate="intro" data-hr-draw className="mb-8 border-t-2 border-gray-600" />

        <section data-animate="intro" data-intro-instant className="prose-landing intro-reveal">
          <h3>{t('about.title')}</h3>
          <p>
            <Trans t={t} i18nKey="about.paragraph1" components={{ strong: <strong /> }} />
          </p>
          <p>
            {t('about.paragraph2')} <FlagIcon code="RU" /> {t('about.languages.ru')},{' '}
            <FlagIcon code="GB" /> {t('about.languages.en')}, <FlagIcon code="CN" />{' '}
            {t('about.languages.cn')}.
          </p>
          <p className="text-center">
            {contacts.map((contact, index) => (
              <span key={contact.href}>
                {index === 0 && '| '}
                <a
                  data-hover-pop
                  href={contact.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-1"
                >
                  {t(contact.labelKey)}
                </a>
                {index < contacts.length - 1 ? ' ~ ' : ' |'}
              </span>
            ))}
          </p>
        </section>

        <hr data-animate="intro" data-hr-draw className="prose-landing-hr" />

        <section data-animate="reveal" className="prose-landing">
          <h3>{t('whatsNext.title')}</h3>
          <ul>
            <li>{t('whatsNext.items.kubernetes')}</li>
            <li>{t('whatsNext.items.devops')}</li>
            <li>{t('whatsNext.items.bots')}</li>
            <li>{t('whatsNext.items.redesign')}</li>
          </ul>
        </section>

        <hr data-animate="reveal" data-hr-draw className="prose-landing-hr" />

        <section data-animate="reveal" className="prose-landing">
          <h3>{t('sections.title')}</h3>
          {latestPost && (
            <p>
              {t('sections.latestPost')}{' '}
              <Link to={`/blog/${latestPost.slug}`}>{latestPost.title}</Link> — {latestPost.date}
            </p>
          )}
          <p className="flex flex-wrap gap-x-3 gap-y-2">
            {explorePages.map((page) => (
              <Link key={page.to} data-hover-pop to={page.to} className="inline-block">
                [{t(page.labelKey)}]
              </Link>
            ))}
          </p>
        </section>

        <hr data-animate="reveal" data-hr-draw className="prose-landing-hr" />

        <section data-animate="reveal" className="prose-landing">
          <h3>{t('projects.title')}</h3>
          <p>{t('projects.subtitle')}</p>
          {projectsLoading ? (
            <SkeletonGroup className="min-h-32 space-y-2 sm:min-h-28">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="mt-1 h-3 w-1/4" />
            </SkeletonGroup>
          ) : projectsError ? (
            <p className="text-muted-foreground">{projectsError}</p>
          ) : (
            <ProjectCarousel projects={projects} />
          )}
        </section>

        <hr data-animate="reveal" data-hr-draw className="prose-landing-hr" />

        <section data-animate="reveal" className="prose-landing">
          <h3>{t('activity.title')}</h3>
          <div className="space-y-4">
            <GithubContributions />
            <WakatimeStats />
          </div>
        </section>

        <hr data-animate="reveal" data-hr-draw className="prose-landing-hr" />

        <section data-animate="reveal" className="prose-landing">
          <h3>{t('interests.title')}</h3>
          <p>{t('interests.languagesSubtitle')}</p>
          <ul>
            {languages.map((lang) => (
              <li key={lang.name}>
                {lang.url ? (
                  <a href={lang.url} target="_blank" rel="noopener noreferrer">
                    {lang.name}
                  </a>
                ) : (
                  lang.name
                )}{' '}
                <span className="text-muted-foreground">
                  {t('interests.langYears', { count: lang.years })}
                </span>
              </li>
            ))}
          </ul>
          <p>{t('interests.frameworksSubtitle')}</p>
          <ul>
            {Object.entries(technologies).map(([category, techs]) => (
              <li key={category}>
                <strong>{category}</strong>:{' '}
                {techs.map((tech, index) => (
                  <span key={tech.name}>
                    {tech.url ? (
                      <a href={tech.url} target="_blank" rel="noopener noreferrer">
                        {tech.name}
                      </a>
                    ) : (
                      tech.name
                    )}
                    {index < techs.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </li>
            ))}
          </ul>
        </section>

        <hr data-animate="reveal" data-hr-draw className="prose-landing-hr" />

        <section data-animate="reveal" className="prose-landing">
          <h3>{t('badges.title')}</h3>
          <p>{t('badges.subtitle')}</p>
          <BadgeWall />
        </section>

        <hr data-animate="reveal" data-hr-draw className="prose-landing-hr" />
        <footer data-animate="reveal" className="space-y-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div data-footer-widget className="min-w-0 sm:flex-1">
              <NowPlayingWidget apiKey="3ccebef5f34a7ba295cee53acb50aa02" username="xdearboy" />
            </div>
            <div data-footer-widget className="shrink-0">
              <TimeWeatherWidget />
            </div>
          </div>

          <hr data-hr-draw className="prose-landing-hr" />

          <div data-footer-widget>
            <CommitInfo />
          </div>
        </footer>
      </div>
    </PageShell>
  );
}
