"use client";

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
            <a href="#main" className="text-muted-foreground hover:text-foreground transition-colors">
              main
            </a>
            <span className="">/</span>
            <a href="https://dev0.cfg/blog" className="text-accent transition-colors">
              blog
            </a>
            <span className="">/</span>
            <a href="https://dev0.cfg/donate" className="text-muted-foreground hover:text-foreground transition-colors">
              donate
            </a>
            <span className="">/</span>
            <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
              contact
            </a>
          </div>
        </nav>

        <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center mb-6">
              <Link
                href="/"
                className="flex items-center text-foreground hover:text-accent transition-colors"
              >
                <ArrowLeft size={16} className="mr-2" />
                <span className="font-medium">blog</span>
              </Link>
            </div>

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
                    <Card className="bg-card/60 backdrop-blur-sm border border-border/50 hover:bg-card/80 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer">
                      <CardContent className="p-4">
                        <h2 className="font-medium text-foreground mb-2">
                          {post.title}
                        </h2>
                        <p className="text-xs text-muted-foreground mb-2">
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

      <style jsx global>{`
        .emoji {
          font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', 'EmojiSymbols', 'Twemoji Mozilla', 'Segoe UI Symbol', 'Symbola', 'Android Emoji', sans-serif !important;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
      <style jsx>{`
        .hover\\:glow:hover {
          text-shadow: 0 0 10px currentColor;
        }
      `}</style>
    </div>
  );
}
