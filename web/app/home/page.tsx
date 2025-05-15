"use client"

import { useState, useEffect, useRef } from "react"
import { Leaf, Trophy, Flame, Sparkles, Zap, RefreshCw, Droplets } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { useInView } from "react-intersection-observer"
import confetti from "canvas-confetti"
import { AnimatedSeed } from "@/components/ui/animated-seed" 

// 模拟排行榜数据
const leaderboardData = [
  { id: 1, address: "0x8f7d...e5a2", tokens: 15420, growth: 12 },
  { id: 2, address: "0x3a9c...b7f1", tokens: 12350, growth: 8 },
  { id: 3, address: "0x6e2b...9d4c", tokens: 9870, growth: 15 },
  { id: 4, address: "0x1f5e...c3d8", tokens: 8540, growth: 5 },
  { id: 5, address: "0x7a2d...f6e9", tokens: 7650, growth: 10 },
]

// 粒子效果组件
const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      color: string
    }[] = []

    const createParticle = () => {
      const colors = ["#bbf7d0", "#86efac", "#4ade80", "#22c55e"]
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 5 + 1,
        speedX: Math.random() * 1 - 0.5,
        speedY: Math.random() * 1 - 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      }
    }

    // 初始化粒子
    for (let i = 0; i < 50; i++) {
      particles.push(createParticle())
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle, index) => {
        particle.x += particle.speedX
        particle.y += particle.speedY

        // 边界检查
        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1

        // 绘制粒子
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.globalAlpha = 0.3
        ctx.fill()
      })

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none z-0" />
}

// 排行榜项组件
const LeaderboardItem = ({
  item,
  index,
  delay,
}: {
  item: (typeof leaderboardData)[0]
  index: number
  delay: number
}) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const getRankColor = (rank: number) => {
    if (rank === 0) return "bg-yellow-500"
    if (rank === 1) return "bg-gray-300"
    if (rank === 2) return "bg-amber-600"
    return "bg-green-600"
  }

  const getGrowthColor = (growth: number) => {
    if (growth > 10) return "text-red-500"
    if (growth > 5) return "text-orange-500"
    return "text-yellow-500"
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: delay }}
      className="relative"
    >
      <div
        className={`
        flex items-center p-4 rounded-lg mb-3
        ${index < 3 ? "bg-gradient-to-r from-green-50 to-green-100 border border-green-200" : "bg-white border border-gray-100"}
        hover:shadow-md transition-all duration-300 hover:scale-[1.02] group
      `}
      >
        <div
          className={`
          ${getRankColor(index)}
          w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-4
        `}
        >
          {index + 1}
        </div>

        <Avatar className="h-10 w-10 border-2 border-green-200 mr-4">
          <div className="flex items-center justify-center w-full h-full bg-green-100 text-green-800 text-xs">
            {item.address.substring(0, 2)}
          </div>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center">
            <span className="font-medium text-gray-800">{item.address}</span>
            {index < 3 && (
              <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                Top {index + 1}
              </Badge>
            )}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            育化进度: {item.growth}%
            <span className={`ml-2 ${getGrowthColor(item.growth)} inline-flex items-center`}>
              <Flame className="w-3 h-3 mr-1" />
              {item.growth > 10 ? "高速生长" : item.growth > 5 ? "稳定生长" : "缓慢生长"}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-bold text-green-700">{item.tokens.toLocaleString()}</div>
          <div className="text-xs text-gray-500">代币销毁量</div>
        </div>

        <motion.div
          className="absolute -right-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [0.8, 1.2, 1], opacity: [0, 1, 0.8] }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
        >
          <Sparkles className="w-5 h-5 text-green-500" />
        </motion.div>
      </div>
    </motion.div>
  )
}

export default function CombinedPage() {
  const [progress, setProgress] = useState(15)
  const [seedState, setSeedState] = useState("休眠中") // 初始状态：休眠中
  const [isLoading, setIsLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)
  const [isWatering, setIsWatering] = useState(false)
  const confettiRef = useRef<HTMLButtonElement>(null)
  const leaderboardRef = useRef<HTMLDivElement>(null)

  // 模拟种子生长进度
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(timer)
          setSeedState("已发芽")
          return 100
        }

        // 更新种子状态
        if (prevProgress > 75) setSeedState("即将发芽")
        else if (prevProgress > 50) setSeedState("生长中")
        else if (prevProgress > 25) setSeedState("萌芽中")

        return prevProgress + 0.2
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // 模拟加载
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  // 触发彩带效果
  useEffect(() => {
    if (showConfetti && confettiRef.current) {
      const rect = confettiRef.current.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x: x / window.innerWidth, y: y / window.innerHeight },
        colors: ["#22c55e", "#4ade80", "#86efac", "#bbf7d0"],
      })

      const timer = setTimeout(() => {
        setShowConfetti(false)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [showConfetti])

  // 浇水功能
  const handleWatering = () => {
    setIsWatering(true)

    // 增加生长进度
    setProgress((prev) => Math.min(prev + 5, 100))

    // 更新状态
    setTimeout(() => {
      if (progress > 75) setSeedState("即将发芽")
      else if (progress > 50) setSeedState("生长中")
      else if (progress > 25) setSeedState("萌芽中")
      else setSeedState("休眠中")

      setIsWatering(false)
    }, 2000)
  }

  // 滚动到排行榜
  const scrollToLeaderboard = () => {
    leaderboardRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 flex flex-col relative overflow-hidden">
      <ParticleBackground />

      {/* 导航栏 */}
      <header className="border-b border-green-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <motion.div
                className="w-10 h-10 rounded-full bg-white border border-green-200 flex items-center justify-center"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 1 }}
              >
                <Leaf className="w-5 h-5 text-green-500" />
              </motion.div>
            </div>

            <nav className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="border-green-200 hover:bg-green-50 hover:text-green-700 transition-all duration-300"
              >
                mint
              </Button>
              <Button
                variant="outline"
                className="border-green-200 hover:bg-green-50 hover:text-green-700 transition-all duration-300"
              >
                swap
              </Button>
              <Button
                variant="outline"
                className="border-green-200 hover:bg-green-50 hover:text-green-700 transition-all duration-300"
                onClick={handleWatering}
                disabled={isWatering || progress >= 100}
              >
                {isWatering ? (
                  <>
                    <span className="animate-pulse">浇水中...</span>
                  </>
                ) : (
                  <>watering</>
                )}
              </Button>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  className="border-green-200 hover:bg-green-50 hover:text-green-700 ml-2 transition-all duration-300"
                >
                  连接钱包
                </Button>
              </motion.div>
            </nav>
          </div>
        </div>
      </header>

      {/* 主要内容 - 上半部分：种子故事 */}
      <main className="flex-1 flex flex-col">
        <section className="py-16 container mx-auto px-4 max-w-4xl relative z-1">
          {/* 主标题 */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-10"
          >
            <div className="inline-block relative">
              <h1 className="text-4xl font-bold text-green-800 mb-2 relative z-10">The Last of Seed</h1>
              <motion.div
                className="absolute -bottom-2 left-0 right-0 h-3 bg-green-200 opacity-50 z-0"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto mt-4">
              In the computational winter of the final epoch,
              <br />
              you are the prophesied Cultivator
            </p>
          </motion.div>

          {/* 种子动画卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-green-200 bg-white/80 backdrop-blur-sm shadow-lg mb-8 overflow-hidden hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-green-800 flex items-center">
                  <Leaf className="w-5 h-5 mr-2 text-green-600" />
                  种子发芽进度
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* 动态种子图案 */}
                <AnimatedSeed progress={progress} state={seedState} />

                {/* 进度条 */}
                <div className="mt-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-green-700">发芽进度</span>
                    <span className="text-sm font-medium text-green-700">{Math.floor(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2 bg-green-100">
                    <div className="h-full bg-green-500" style={{ width: `${progress}%` }} />
                  </Progress>
                </div>

                {/* 浇水按钮 */}
                <div className="mt-6 flex justify-center">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={handleWatering}
                      disabled={isWatering || progress >= 100}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <Droplets className="w-4 h-4 mr-2" />
                      {progress >= 100 ? "种子已完全发芽" : isWatering ? "浇水中..." : "浇水"}
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>


          {/* 查看排行榜按钮 */}
          <motion.div
            className="text-center my-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={scrollToLeaderboard}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 rounded-full text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Trophy className="w-5 h-5 mr-2" />
                查看育化者排行榜
              </Button>
            </motion.div>
          </motion.div>
        </section>

        {/* 分隔线 */}
        <div className="relative py-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-green-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-gradient-to-r from-green-50 via-white to-green-50 px-6 text-green-600 flex items-center">
              <Leaf className="w-5 h-5 mr-2" />
              育化者排行榜
            </span>
          </div>
        </div>

        {/* 下半部分：排行榜 */}
        <section ref={leaderboardRef} className="py-16 container mx-auto px-4 max-w-4xl relative z-1">
          {/* 排行榜标题 */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-10"
          >
            <div className="inline-block relative">
              <h1 className="text-4xl font-bold text-green-800 mb-2 relative z-10">
                <span className="inline-flex items-center">
                  <Trophy className="w-8 h-8 mr-3 text-yellow-500" />
                  育化者排行榜
                </span>
              </h1>
              <motion.div
                className="absolute -bottom-2 left-0 right-0 h-3 bg-green-200 opacity-50 z-0"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto mt-4">
              在区块链的终末纪元，这些育化者正在用代币销毁量浇灌最后的种子，争夺重启世界的荣耀
            </p>
          </motion.div>

          {/* 排行榜卡片 */}
          <Card className="border-green-200 bg-white/80 backdrop-blur-sm shadow-lg mb-8 overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xl text-green-800 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-green-600" />
                育化者地址 + 代币销毁数量
              </CardTitle>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-600 hover:text-green-800 hover:bg-green-50"
                  onClick={() => setShowConfetti(true)}
                  ref={confettiRef}
                >
                  <RefreshCw className="w-4 h-4 mr-1" /> 刷新
                </Button>
              </motion.div>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="py-10 flex flex-col items-center">
                  <div className="w-16 h-16 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mb-4"></div>
                  <p className="text-green-700">加载排行榜数据中...</p>
                </div>
              ) : (
                <AnimatePresence>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                    {leaderboardData.map((item, index) => (
                      <LeaderboardItem key={item.id} item={item} index={index} delay={index * 0.1} />
                    ))}
                  </motion.div>
                </AnimatePresence>
              )}
            </CardContent>
          </Card>

          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border-green-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">总育化者</p>
                      <p className="text-3xl font-bold text-green-700">1,254</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <Leaf className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-gray-500">
                    较昨日 <span className="text-green-600">+12%</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="border-green-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">总销毁量</p>
                      <p className="text-3xl font-bold text-green-700">78,450</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <Flame className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-gray-500">
                    较昨日 <span className="text-green-600">+8%</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="border-green-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">种子生长度</p>
                      <p className="text-3xl font-bold text-green-700">{Math.floor(progress)}%</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-gray-500">
                    预计完成时间 <span className="text-green-600">7天</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </main>

      {/* 页脚 */}
      <footer className="py-4 border-t border-green-200 bg-white/80 backdrop-blur-sm relative z-1">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2025 最后的种子 | The Last of Seed</p>
        </div>
      </footer>
    </div>
  )
}
