"use client";

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DonateCard() {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [showNotification, setShowNotification] = useState(false)

  const cryptoAddresses = [
    {
      title: "Cloudtips",
      value: "pay.cloudtips.ru/p/fdaea5a6",
      isLink: true,
    },
    // ----
    // ! Я был заблокирован в Crypto-Bot, поэтому половина путей для доната была убрана.
    // ----
    // {
    //   title: "Crypto-bot",
    //   value: "t.me/send?start=IVTISEyPdXCn",
    //   isLink: true,
    // },
    // {
    //   title: "BTC",
    //   value: "bc1q0jp4772me2hxhqvf7vx286slzpm4z0m9n4mljk",
    // },
    // {
    //   title: "USDT - ERC20",
    //   value: "0xa22865D447cEdCf46bD61c5026DCacfBd25804D6",
    // },
    // {
    //   title: "TON",
    //   value: "UQCErKzWZGFTKO_oyRvpDn_5452RmMmQh9s-GWz9",
    // },
    // {
    //   title: (
    //     <span className="flex items-center gap-2">
    //       <span>TRON</span>
    //       <span className="text-muted-foreground text-xs">мин. сумма - 10 TRX</span>
    //     </span>
    //   ),
    //   value: "TUFk7BZJWUNCQQtSLparZxyBeGei461sfP",
    // },
  ]

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedAddress(text)
      setShowNotification(true)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [showNotification])

  return (
    <div className="min-h-screen bg-background text-foreground p-4 font-mono relative overflow-hidden dark">
      <div className="max-w-4xl mx-auto relative z-10">
        <nav className="flex justify-between items-center mb-8 text-sm">
          <div className="flex space-x-6">
            <a href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              main
            </a>
            <span className="">/</span>
            <a href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
              blog
            </a>
            <span className="">/</span>
            <a href="/donate" className="text-accent transition-colors">
              donate
            </a>
          </div>
        </nav>

        <div className="mb-6">
          <h1 className="text-2xl mb-4 min-h-[2rem]">
            <span className="text-foreground">xdearboy</span>
            <span className="animate-pulse text-muted-foreground">|</span>
          </h1>

          <div className="text-xs text-muted-foreground leading-relaxed">
            hi! i'm a middle devops engineer & fullstack developer from moscow.
            i'm interested in developing bots for discord, creating backend services
            and web applications. my specialization is python, javascript/typescript,
            rust, and automation of devops processes. if you like my work or
            my projects, feel free to support me ❤️
          </div>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border border-border/50 py-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-primary text-base">donate me :3</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cryptoAddresses.map((crypto) => (
                <div
                  key={typeof crypto.value === "string" ? crypto.value : ""}
                  onClick={() =>
                    crypto.isLink
                      ? window.open(`https://${crypto.value}`, "_blank")
                      : copyToClipboard(crypto.value)
                  }
                  className={`
                    cursor-pointer
                    p-3 rounded-md
                    border border-border/50
                    bg-card/60 backdrop-blur-sm
                    hover:bg-card/80
                    transition-all duration-200 hover:scale-[1.02] hover:shadow-lg
                    text-foreground
                    font-mono text-xs
                  `}
                >
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-medium">{crypto.title}</h3>
                    <p className="text-xs break-all opacity-80 text-muted-foreground">
                      {crypto.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {showNotification && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center justify-center w-[170px] h-[32px] px-2 rounded-md border border-border bg-card/60 backdrop-blur-sm font-mono font-bold text-xs z-50 opacity-0 translate-y-2 transition-all duration-300 opacity-100 translate-y-0">
          <span className="leading-none whitespace-nowrap text-foreground">
            copied to clipboard
          </span>
        </div>
      )}

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
  )
}
