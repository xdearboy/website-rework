import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAllPosts } from "@/app/lib/blog";
import { Card, CardContent } from "@/components/ui/card";

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-background text-foreground p-4 font-mono relative overflow-hidden dark">
      <div className="max-w-4xl mx-auto relative z-10">
        <nav className="flex justify-between items-center mb-8 text-sm">
          <div className="flex space-x-6">
            <a href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              main
            </a>
            <span className="">/</span>
            <a href="/blog" className="text-accent transition-colors">
              blog
            </a>
            <span className="">/</span>
            <a href="/donate" className="text-muted-foreground hover:text-foreground transition-colors">
              donate
            </a>
          </div>
        </nav>

        <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
          <CardContent className="py-4">

            {posts.length === 0 ? (
              <p className="text-muted-foreground">Пока нет записей в блоге.</p>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="block"
                  >
                    <Card className="bg-card/60 backdrop-blur-sm border border-border/50 hover:bg-card/80 transition-all duration-200 hover:scale-[1.01] hover:shadow-lg cursor-pointer">
                      <CardContent className="p-3">
                        <h2 className="font-medium text-foreground mb-1">
                          {post.title}
                        </h2>
                        <p className="text-xs text-muted-foreground mb-1">
                          {post.date}
                        </p>
                        {post.excerpt && (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {post.excerpt}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
