"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 font-mono relative overflow-hidden dark">
      <div className="max-w-4xl mx-auto relative z-10">
        <nav className="flex justify-between items-center mb-8 text-sm">
          <div className="flex space-x-6">
            <a href="#main" className="text-muted-foreground hover:text-foreground transition-colors">
              main
            </a>
            <span className="">/</span>
            <a href="https://dev0.cfg/blog" className="text-muted-foreground hover:text-foreground transition-colors">
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

        <div className="mb-4">
          <h1 className="text-2xl mb-2 min-h-[2rem]">
            <span className="text-foreground">xdearboy</span>
            <span className="animate-pulse text-muted-foreground">|</span>
          </h1>

          <div className="text-sm space-y-1 mb-6">
            <div>
              <span className="text-muted-foreground">name:</span> xdearboy
            </div>
            <div>
              <span className="text-muted-foreground">role:</span> middle devops engineer & fullstack developer
            </div>
            <div>
              <span className="text-muted-foreground">focus:</span> fullstack development (python/js/ts/rust), cloud infrastructure, devops automation & linux system administration
            </div>
            <div>
              <span className="text-muted-foreground">projects:</span> <a href="https://github.com/xdearboy?tab=repositories" className="text-muted-foreground hover:text-accent transition-colors">discord bots, backend services, websites</a>
            </div>
            <div>
              <span className="text-muted-foreground">location:</span> moscow/russia
            </div>
            <div>
              <span className="text-muted-foreground">timezone:</span> utc+3
            </div>
            <div>
              <span className="text-muted-foreground">langs:</span> 🇷🇺 native, 🇬🇧 B2, 🇨🇳 learning
            </div>
          </div>
        </div>

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
