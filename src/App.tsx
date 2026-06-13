import SiteBackground from '@/shared/layout/SiteBackground';
import { getMotionMediaQueries } from '@/shared/lib/motion';
import { scrollToTop } from '@/shared/lib/smoothScroll';
import PageSkeleton from '@/shared/ui/PageSkeleton';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Suspense, lazy, useRef } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import NotFoundPage from './pages/NotFoundPage';

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollSmoother);

const HomePage = lazy(() => import('./pages/HomePage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const DonatePage = lazy(() => import('./pages/DonatePage'));
const DegensList = lazy(() => import('./pages/DegensList'));
const DegensChat = lazy(() => import('./pages/DegensChat'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));

export default function App() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { pathname, hash } = useLocation();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(getMotionMediaQueries(), (context) => {
        const { reduceMotion } = context.conditions as { reduceMotion: boolean };

        if (reduceMotion) {
          return;
        }

        const smoother = ScrollSmoother.create({
          wrapper: '#smooth-wrapper',
          content: '#smooth-content',
          smooth: 1.2,
          smoothTouch: false,
          effects: true,
        });

        return () => smoother.kill();
      });

      return () => mm.revert();
    },
    { scope: wrapperRef }
  );

  useGSAP(() => {
    if (!hash) {
      scrollToTop();
    }

    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname, hash]);

  return (
    <>
      <SiteBackground />
      <div id="smooth-wrapper" ref={wrapperRef}>
        <div id="smooth-content">
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/donate" element={<DonatePage />} />
              <Route path="/degens" element={<DegensList />} />
              <Route path="/degens/:id" element={<DegensChat />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </>
  );
}
