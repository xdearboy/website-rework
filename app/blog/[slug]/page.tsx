import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPostBySlug, getAllPosts } from "@/app/lib/blog";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Markdown from "@/components/markdown";
import { Card, CardContent } from "@/components/ui/card";

interface PostPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata(
  props: PostPageProps,
): Promise<Metadata> {
  const { slug } = await Promise.resolve(props.params);
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Пост не найден",
    };
  }

  return {
    title: `${post.title} | xdearboy`,
    description: post.excerpt || "Блог xdearboy",
  };
}

export async function generateStaticParams() {
  const posts = await getAllPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function PostPage(props: PostPageProps) {
  const { slug } = await Promise.resolve(props.params);
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

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
          <CardContent className="p-6">
            <div className="flex items-center mb-6">
              <Link
                href="/blog"
                className="flex items-center text-foreground hover:text-[#9BA3D6] transition-colors"
              >
                <ArrowLeft size={16} className="mr-2" />
                <span className="font-medium">blog</span>
              </Link>
            </div>

            <article className="mb-4">
              <h1 className="font-bold text-xl sm:text-2xl text-foreground mb-2">
                {post.title}
              </h1>
              <p className="text-xs text-muted-foreground mb-4">{post.date}</p>
              <div className="bg-card/60 backdrop-blur-sm border border-border/50 p-6 sm:p-8 rounded-lg">
                <Markdown content={post.content} />
              </div>
            </article>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
