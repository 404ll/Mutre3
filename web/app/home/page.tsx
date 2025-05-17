"use client"

import { useState, useEffect, useRef } from "react"
import { Leaf, Flame, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"
import { AnimatedSeed} from "@/components/ui/animated-seed"
import Image from "next/image"
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit"
import { StarBackground } from "@/components/ui/star-background"
import { useBetterSignAndExecuteTransaction } from "@/hooks/useBetterTx"
import { swap_HoH, watering, swap_Sui, queryAllCultivator, queryWaterEvent, querySeedBurn } from "@/contracts/query"
import { queryAddressHOH } from "@/contracts/query"
import { LeaderboardItem } from "@/components/Leaderboard"
import { SwapModal } from "@/components/swap-modal"
import { WateringEvent } from "@/types/contract"
import { EventNotificationBar } from "@/components/EventBar"
import { useToast } from "@/hooks/use-toast"
import { CustomConnectButton } from "@/components/CustomConnectButton"

export default function CombinedPage() {
  // Change this declaration:
  const { toast } = useToast()

  const [amountSUI, setAmountSUI] = useState(0)
  const [amountHOH, setAmountHOH] = useState(0)
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false)
  const account = useCurrentAccount()
  const [progress, setProgress] = useState(15)
  const [seedState, setSeedState] = useState("Dormant") 
  const [isLoading, setIsLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)
  const [isWatering, setIsWatering] = useState(false)
  const confettiRef = useRef<HTMLButtonElement>(null)
  const leaderboardRef = useRef<HTMLDivElement>(null)
  const [recentEvent, setRecentEvent] = useState<WateringEvent[]>([])
  const [leaderboardData, setLeaderboardData] = useState<{ address: string; burnAmount: number }[]>([]);
  const [burnamount, setBurnAmount] = useState(0);
  
  const { handleSignAndExecuteTransaction: swapToHOH } = useBetterSignAndExecuteTransaction({
    tx: swap_HoH,
  })
  const { handleSignAndExecuteTransaction: waterSeed } = useBetterSignAndExecuteTransaction({
    tx: watering,
  })
  const { handleSignAndExecuteTransaction: swapToSUI } = useBetterSignAndExecuteTransaction({
    tx: swap_Sui,
  })

  const handleSwapToHOH = async (amount: number) => {
    if (account?.address) {
      const amountInMist = amount * 1000000000
      swapToHOH({ amount: amountInMist })
        .onSuccess(async (response) => {
          console.log("Transaction successful:", response)
          setAmountHOH(0)
          // 显示交易成功通知
          toast({
            title: "Transaction Successful",
            description: `Successfully swapped ${amount} SUI to HOH`,
            variant: "default",
          })
        })
        .onError((error) => {
          console.error("Transaction failed:", error)
          // 显示交易失败通知
          toast({
            title: "Transaction Failed",
            description: "Failed to swap SUI to HOH. Please try again.",
            variant: "destructive",
          })
        })
        .execute()
    }
  }

  const handleWatering = async () => {
    if (account?.address) {
      setIsWatering(true)
      const amount = 0.1 * 1000000000
      try {
        // 检查HOH余额是否足够
        const userHohCoins = await queryAddressHOH(account.address)
        const userHOHBalance = userHohCoins.reduce((acc, coin) => acc + coin.balance, 0)
        console.log("User HOH Coins:", userHOHBalance)
        if (Number(userHOHBalance) < amount) {
          toast({
            title: "Insufficient HOH Balance",
            description: "You need at least 0.1 HOH to water the seed. Please swap more HOH first.",
            variant: "destructive",
          })
          setIsWatering(false)
          return
        }
        
        // 提取代币ID数组
        const coinIds = userHohCoins.map((coin) => coin.id)
        waterSeed({ amount: amount, coins: coinIds })
          .onSuccess(async (response) => {
            console.log("Transaction successful:", response)
            // 显示浇水成功通知
            toast({
              title: "Watering Successful",
              description: "You've successfully watered the seed with 0.1 HOH!",
              variant: "default",
            })
            // 刷新排行榜以显示最新数据
            refreshLeaderboard()
          })
          .onError((error) => {
            console.error("Transaction failed:", error)
            // 显示浇水失败通知
            toast({
              title: "Watering Failed",
              description: "Failed to water the seed. Please try again.",
              variant: "destructive",
            })
          })        
          .execute()
          setIsWatering(false)

      } catch (error) {
        console.error("Error preparing watering transaction:", error)
        toast({
          title: "Transaction Error",
          description: "Failed to prepare watering transaction. Please try again.",
          variant: "destructive",
        })
        setIsWatering(false)
      }
    }
  }

  const handleSwapToSUI = async (amount: number) => {
    if (account?.address) {

      try {
        // 获取用户的 HOH 代币
        const userHohCoins = await queryAddressHOH(account.address)
        
        // 提取代币ID数组
        const coinIds = userHohCoins.map((coin) => coin.id)
        const amountInMist = amount * 1000000000
        swapToSUI({ amount: amountInMist, coins: coinIds })
          .onSuccess(async (response) => {
            console.log("Transaction successful:", response)
            setAmountSUI(0)
            // 显示交易成功通知
            toast({
              title: "Transaction Successful",
              description: `Successfully swapped ${amount} HOH to SUI`,
              variant: "default",
            })
          })
          .onError((error) => {
            console.error("Transaction failed:", error)
            // 显示交易失败通知
            toast({
              title: "Transaction Failed",
              description: "Failed to swap HOH to SUI. Please try again.",
              variant: "destructive",
            })
          })
          .execute()
      } catch (error) {
        console.error("Error preparing swap transaction:", error)
        toast({
          title: "Transaction Error",
          description: "Failed to prepare swap transaction. Please try again.",
          variant: "destructive",
        })
      }
    }
  }
  
  const refreshLeaderboard = async () => {
    try {
      setIsLoading(true);
      const cultivators = await queryAllCultivator();
      setLeaderboardData(
        cultivators.filter(
          (cultivator): cultivator is { address: string; burnAmount: number } =>
            cultivator !== null
        )
      );
      const burnamount = await querySeedBurn();
      setBurnAmount(burnamount);
      console.log("Burn amount refreshed:", burnamount);
      console.log("Cultivators refreshed:", cultivators);
    } catch (error) {
      console.error("Failed to refresh leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
        colors: ["#3b82f6", "#60a5fa", "#93c5fd", "#22c55e"],
      })

      const timer = setTimeout(() => {
        setShowConfetti(false)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [showConfetti])

  //查询浇水事件
  useEffect(() => {
      const fetchRecentEvents = async () => {
          const events = await queryWaterEvent()
          setRecentEvent(events)
          console.log("Recent Watering Events:", events)
      }
  
      const recentEvent = setInterval(() => {
          fetchRecentEvents()
      }, 6000)
  
      return () => clearInterval(recentEvent)
  }, [])

   // 根据育化者数量和销毁量计算种子发芽进度
   useEffect(() => {
    if (!isLoading) {
      const targetCultivators = 100 // 假设需要100个育化者才能达到最大贡献
      const targetBurnAmount = 10000 // 假设需要10000的销毁量才能达到最大贡献

      // 计算两个因素的贡献比例
      const cultivatorContribution = Math.min(leaderboardData.length / targetCultivators, 1) * 0.4 // 育化者贡献40%
      const burnContribution = Math.min(burnamount / targetBurnAmount, 1) * 0.6 // 销毁量贡献60%

      const calculatedProgress = Math.min((cultivatorContribution + burnContribution) * 100 * 0.75, 85)

      // 更新进度和状态
      setProgress(calculatedProgress)

      // 更新种子状态
      if (calculatedProgress > 60) setSeedState("About to Sprout")
      else if (calculatedProgress > 40) setSeedState("Growing")
      else if (calculatedProgress > 20) setSeedState("Budding")
      else setSeedState("Dormant")

    }
  }, [isLoading, leaderboardData.length, burnamount])

  // 获取排行榜数据
  useEffect(() => {
    const fetchCultivators = async () => {
      try {
        setIsLoading(true);
        const cultivators = await queryAllCultivator();
        setLeaderboardData(cultivators.filter((cultivator): cultivator is { address: string; burnAmount: number } => cultivator !== null));
        const burnamount = await querySeedBurn();
        setBurnAmount(burnamount);
        console.log("Burn amount:", burnamount);
        console.log("Cultivators fetched:", cultivators);
      } catch (error) {
        console.error("Failed to fetch cultivators:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCultivators();
  }, [account]);



  return (
    <div className="min-h-screen flex flex-col">
      <StarBackground />
      {/* 导航栏 - 更浅的颜色 */}
      <header className="border-b border-blue-100/30 glass-effect fixed top-0 left-0 right-0 w-full z-50 backdrop-blur-sm bg-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center overflow-hidden">
              <div className="w-20 h-20 relative">
                <Image src="/logo1.png" alt="Sui Logo" fill style={{ objectFit: "cover", objectPosition: "center" }} />
              </div>
            </div>

            <nav className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="border-blue-500/30 hover:bg-blue-900/50 hover:text-blue-300 transition-all duration-300 text-blue-300 text-lg h-8"
                onClick={() => setIsSwapModalOpen(true)}
              >
                swap
              </Button>
              <CustomConnectButton />
            </nav>
          </div>
        </div>
      </header>

      {/* Swap Modal */}
      <SwapModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        onSwapToHOH={handleSwapToHOH}
        onSwapToSUI={handleSwapToSUI}
        address={account?.address}
      />

      {/* 主要内容 - 上半部分：种子故事 */}
      <main className="flex-1 flex flex-col items-center justify-center">
        <section className="py-16 container mx-auto px-8">
             {/* 事件通知栏 */}
      {/* 事件通知栏 */}
      <EventNotificationBar />
          <div className="text-center mb-10 mt-8">
            <div className="inline-block relative mb-4">
              <h1 className="text-6xl font-bold text-blue-300 mb-2 neon-text">The Last of Seed</h1>
              <div className=" mb-2 mt-2 left-0 right-0 h-4 bg-blue-500/30"></div>
            </div>

            {/* 确保文本可见 */}
            <p className="text-xl text-blue max-w-4xl mx-auto mt-4 relative z-10">
              In the computational winter of the final epoch, you are the prophesied Cultivator
            </p>
          </div>


          {/* 种子动画卡片部分保持不变 */}
          <div className="max-w-md mx-auto w-full mt-20">
            <Card className="border-blue-500/30 glass-effect shadow-sm mb-6 overflow-hidden hover:shadow-lg transition-all duration-300">
              <CardContent className="px-3 py-2">
                {/* 进度条和百分比放在同一行 */}
                <div className="flex items-center space-x-2 mb-1">
                  <div className="h-1 bg-blue-900/50 rounded-full overflow-hidden flex-grow">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-green-500 animate-pulse"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-blue-300 whitespace-nowrap">{Math.floor(progress)}%</span>
                </div>

                {/* 减小种子图案大小 */}
                <div className="scale-75 transform-origin-center -my-3">
                  <AnimatedSeed progress={progress} />
                </div>

                {/* 浇水按钮更小 */}
                <div className="mb-2 flex justify-center">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-blue-500/30 hover:bg-green-500/50 active:bg-green-500 hover:text-blue-300 transition-all duration-300 text-blue-300 text-lg px-2 py-0 min-h-0 h-8"
                    onClick={handleWatering}
                    disabled={isWatering || progress >= 100}
                  >
                    {isWatering ? (
                      <span className="animate-pulse">Watering...</span>
                    ) : (
                      <span className="flex items-center">Water the seed</span>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 下半部分：排行榜 */}
        <section ref={leaderboardRef} className="py-16 container mx-auto px-16 max-w z-1">
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border-blue-500/30 glass-effect hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:neon-border">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Cultivators</p>
                      <p className="text-3xl font-bold text-blue-300 neon-text">{leaderboardData.length}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-900/50 flex items-center justify-center border border-blue-500/30">
                      <Leaf className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-gray-400">
                    Since yesterday <span className="text-blue-400">+12%</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="border-blue-500/30 glass-effect hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:neon-border">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Burned</p>
                      <p className="text-3xl font-bold text-blue-300 neon-text">{burnamount}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-900/50 flex items-center justify-center border border-blue-500/30">
                      <Flame className="w-6 h-6 text-orange-400" />
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-gray-400">
                    Since yesterday <span className="text-blue-400">+8%</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* 排行榜卡片 */}
          <Card className="border-blue-500/30 glass-effect shadow-lg mb-8 overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <span className="inline-flex items-center">Cultivators</span>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-300 hover:text-blue-100 hover:bg-blue-900/50"
                  onClick={refreshLeaderboard}
                  ref={confettiRef}
                >
                  <RefreshCw className="w-4 h-4 mr-1" /> refresh
                </Button>
              </motion.div>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="py-10 flex flex-col items-center">
                  <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                  <p className="text-blue-300">Loading...</p>
                </div>
              ) : (
                <div>
                  {leaderboardData.length > 0 ? (
                    leaderboardData.map((item, index) => (
                      <LeaderboardItem key={index} item={item} index={index} />
                    ))
                  ) : (
                    <p className="text-blue-300 text-center">No data available</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      {/* 页脚 */}
      <footer className="py-4 border-t border-blue-500/30 glass-effect relative z-1">
        <div className="container mx-auto px-4 text-center text-sm text-gray-400">
          <p>© 2025 The Last of Seed</p>
        </div>
      </footer>
    </div>
  )
}

