import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { fetchPost } from '@/lib/blog-client'
import type { Post } from '@/lib/blog-client'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import PostSkeleton from '@/components/PostSkeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<Post | null | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    fetchPost(slug)
      .then(setPost)
      .catch(() => setPost(null))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <PostSkeleton />

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 font-mono">
        <p className="text-muted-foreground">Пост не найден</p>
        <Link to="/blog" className="text-primary underline text-sm">← Назад к блогу</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 font-mono relative overflow-hidden dark">
      <div className="max-w-4xl mx-auto relative z-10">
        <nav className="flex justify-between items-center mb-8 text-sm">
          <div className="flex space-x-6">
            <a href="/" className="text-muted-foreground hover:text-foreground transition-colors">main</a>
            <span className="">/</span>
            <a href="/blog" className="text-accent transition-colors">blog</a>
            <span className="">/</span>
            <a href="/donate" className="text-muted-foreground hover:text-foreground transition-colors">donate</a>
          </div>
        </nav>

        <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center mb-6">
              <Link
                to="/blog"
                className="flex items-center text-foreground hover:text-[#9BA3D6] transition-colors"
              >
                <ArrowLeft size={16} className="mr-2" />
                <span className="font-medium">blog</span>
              </Link>
            </div>

            <article className="mb-4">
              <h1 className="font-bold text-xl sm:text-2xl text-foreground mb-2">{post.title}</h1>
              <p className="text-xs text-muted-foreground mb-4">{post.date}</p>
              <div className="bg-card/60 backdrop-blur-sm border border-border/50 p-6 sm:p-8 rounded-lg">
                <MarkdownRenderer content={post.content} />
              </div>
            </article>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
