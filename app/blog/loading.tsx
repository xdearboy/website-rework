import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
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
                className="flex items-center text-foreground hover:text-accent transition-colors"
              >
                <ArrowLeft size={16} className="mr-2" />
                <span className="font-medium">blog</span>
              </Link>
            </div>

            <div className="flex justify-center">
              <div className="relative w-8 h-8">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-primary rounded-full animate-spin"></div>
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-primary rounded-full animate-spin delay-200"></div>
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-primary rounded-full animate-spin delay-400"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
