"use client"

import { useState, useEffect, useRef } from "react"
import LastFMNowPlaying from "@/components/lastfm-now-playing"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TerminalPortfolio() {
  const [typedText, setTypedText] = useState("")
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fullText = "xdearboy"

  useEffect(() => {
    let index = 0
    const timer = setInterval(() => {
      if (index < fullText.length) {
        setTypedText(fullText.slice(0, index + 1))
        index++
      } else {
        clearInterval(timer)
      }
    }, 100)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true)
        const response = await fetch('https://api.github.com/users/xdearboy/repos')
        if (!response.ok) {
          throw new Error('Failed to fetch projects')
        }
        const data = await response.json()
        const openProjects = data.filter((repo: any) => !repo.fork && !repo.archived)
        const sortedProjects = openProjects.sort((a: any, b: any) => b.stargazers_count - a.stargazers_count)
        setProjects(sortedProjects)
        setError(null)
      } catch (err) {
        setError('Failed to load projects from GitHub')
        console.error('Error fetching projects:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])


  const languages = [
    { name: "python", years: 8 },
    { name: "javascript/typescript", years: 4 },
    { name: "java", years: 1 },
    { name: "rust", years: 1 },
    { name: "bash", years: 5 },
    { name: "html5", years: 4 },
    { name: "css3", years: 4 },
    { name: "markdown", years: 3 },
    { name: "sql", years: 3 },
  ]

  const technologies: Record<string, string[]> = {
    frontend: [
      "react",
      "next.js",
      "tailwind css",
      "framer motion"
    ],
    backend: [
      "express.js",
      "fastify",
      "flask",
      "fastapi",
      "restful api",
      "graphql"
    ],
    devops: [
      "docker & docker compose",
      "git & github",
      "ci/cd",
      "ansible",
      "terraform",
      "kubernetes",
      "proxmox",
      "nginx / h2o / haproxy"
    ],
    databases: [
      "postgresql",
      "mysql",
      "mongodb"
    ],
    tools: [
      "linux",
      "vs code",
      "vim"
    ]
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 font-mono relative overflow-hidden dark">

      <div className="max-w-4xl mx-auto relative z-10">
        <nav className="flex justify-between items-center mb-8 text-sm">
          <div className="flex space-x-6">
            <a href="#main" className="text-accent hover:text-primary transition-colors hover:glow">
              main
            </a>
            <span className="">/</span>
            <a href="/blog" className="text-muted-foreground hover:text-[#9BA3D6] transition-colors">
              blog
            </a>
            <span className="">/</span>
            <a href="/donate" className="text-muted-foreground hover:text-[#9BA3D6] transition-colors">
              donate
            </a>
          </div>
        </nav>
        <div className="mb-4">
          <h1 className="text-2xl mb-2 min-h-[2rem] mb-2">
            <span className="text-foreground">{typedText}</span>
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
              <span className="text-muted-foreground">langs:</span> 🇷🇺 native, 🇬🇧 C1, 🇨🇳 learning
            </div>
          </div>
        </div>



        <div className="grid md:grid-cols-2 gap-8 mb-3">
          <Card className="bg-card/50 backdrop-blur-sm border border-border/50 py-6">
            <CardHeader className="pb-1">
              <CardTitle className="text-primary text-base">my programming languages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs mb-4 text-foreground">i mess with these tech stacks:</div>

              <div className="text-xs space-y-1">
                {languages.map((lang, index) => (
                  <div key={index} className="flex items-center space-x-1">
                    <span className="text-muted-foreground emoji">•</span>
                    <span className="text-foreground">{lang.name}</span>
                    <span className="text-muted-foreground">({lang.years}y)</span>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h3 className="text-md mb-3 text-muted-foreground">technologies</h3>
                <div className="text-xs mb-4 text-foreground">i work with these frameworks and libraries:</div>

                <div className="space-y-3 text-xs">
                  {Object.entries(technologies).map(([category, techs]) => (
                    <div key={category}>
                      <div className="text-primary font-semibold mb-1">
                        {category}
                      </div>
                      <div className="grid grid-cols-1 gap-1 ml-2">
                        {techs.map((tech, index) => (
                          <div key={index} className="flex items-center space-x-1">
                            <span className="text-muted-foreground">○</span>
                            <span className="text-foreground">{tech}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm border border-border/50 py-6">
              <CardHeader className="pb-1">
                <CardTitle className="text-primary text-base">projects</CardTitle>
              </CardHeader>
              <CardContent>

                <div className="space-y-4 text-sm">
                  {loading ? (
                    <div className="text-muted-foreground text-xs">Loading projects...</div>
                  ) : error ? (
                    <div className="text-muted-foreground text-xs">{error}</div>
                  ) : (
                    <div
                      className="max-h-64 overflow-y-auto overflow-x-hidden space-y-4 invisible-scrollbar"
                      style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'transparent transparent',
                      }}
                    >
                      {projects.map((project, index) => (
                        <div key={project.id || index}>
                          <a
                            href={project.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground font-semibold hover:text-primary transition-colors block"
                          >
                            {project.name}
                          </a>
                          <div className="text-xs text-muted-foreground mb-1">
                            {project.description || 'No description'}
                          </div>
                          <div className="text-foreground text-xs">
                            {project.language || 'Multiple languages'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            ⭐ {project.stargazers_count}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border border-border/50 py-6">
              <CardHeader className="pb-1">
                <CardTitle className="text-primary text-base">links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <a
                    href="https://github.com/xdearboy"
                    className="flex items-center space-x-2 text-foreground hover:text-muted-foreground transition-colors"
                  >
                    <span className="text-muted-foreground">○</span>
                    <span>github</span>
                  </a>
                  <a
                    href="https://t.me/contactfiuimwix_bot"
                    className="flex items-center space-x-2 text-foreground hover:text-muted-foreground transition-colors"
                  >
                    <span className="text-muted-foreground">○</span>
                    <span>telegram</span>
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("feeeeelbaaaaad");
                      alert("Юзернейм скопирован!");
                    }}
                    className="flex items-center space-x-2 text-foreground hover:text-muted-foreground transition-colors"
                  >
                    <span className="text-muted-foreground">○</span>
                    <span>discord</span>
                  </button>
                  <a
                    href="https://dev0.cfg/blog"
                    className="flex items-center space-x-2 text-foreground hover:text-muted-foreground transition-colors"
                  >
                    <span className="text-muted-foreground">○</span>
                    <span>blog</span>
                  </a>
                  <a
                    href="https://t.me/vroffteam"
                    className="flex items-center space-x-2 text-foreground hover:text-muted-foreground transition-colors"
                  >
                    <span className="text-muted-foreground">○</span>
                    <span>blog in telegram</span>
                  </a>
                  <a
                    href="https://dev0.cfd/donate"
                    className="flex items-center space-x-2 text-foreground hover:text-muted-foreground transition-colors"
                  >
                    <span className="text-muted-foreground">○</span>
                    <span>donate</span>
                  </a>
                </div>
              </CardContent>
            </Card>


            <div className="space-y-6">
              <LastFMNowPlaying
                apiKey="3ccebef5f34a7ba295cee53acb50aa02"
                username="xdearboy"
              />
              
              <Card className="bg-card/50 backdrop-blur-sm border border-border/50 py-6">
                <CardHeader className="pb-1">
                  <CardTitle className="text-primary text-base">activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-foreground">current focus:</span>
                      <span className="text-muted-foreground">automation & devops</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground">learning:</span>
                      <span className="text-muted-foreground">kubernetes & monitoring</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
