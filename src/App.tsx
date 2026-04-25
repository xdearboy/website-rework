import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import PageSkeleton from './components/shared/PageSkeleton';
import NotFoundPage from './pages/NotFoundPage';

const HomePage = lazy(() => import('./pages/HomePage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const DonatePage = lazy(() => import('./pages/DonatePage'));
const DegensList = lazy(() => import('./pages/DegensList'));
const DegensChat = lazy(() => import('./pages/DegensChat'));

export default function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/donate" element={<DonatePage />} />
        <Route path="/degens" element={<DegensList />} />
        <Route path="/degens/:id" element={<DegensChat />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
