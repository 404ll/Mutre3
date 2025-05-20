"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ArrowDownUp, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { queryAddressSUI ,queryAddressHOH} from "@/contracts/query"

interface SwapModalProps {
  isOpen: boolean
  onClose: () => void
  onSwapToHOH: (amount: number) => void
  onSwapToSUI: (amount: number) => void
  address?: string
}

export const SwapModal = ({ isOpen, onClose, onSwapToHOH, onSwapToSUI,address }: SwapModalProps) => {
  const [amountSUI, setAmountSUI] = useState<string>("")
  const [amountHOH, setAmountHOH] = useState<string>("")
  const [swapDirection, setSwapDirection] = useState<"toHOH" | "toSUI">("toHOH")
  const [isProcessing, setIsProcessing] = useState(false)
  const [suiBalance, setSuiBalance] = useState<string>("")
  const [hohBalance, setHohBalance] = useState<string>("")

  // Reset form when modal opens
  useEffect(() => {
      const fetchBalance = async () => {
        if (isOpen && address) {
          setAmountSUI("")
          setAmountHOH("")
          setSwapDirection("toHOH")
          setIsProcessing(false)
  
          try {
            // 获取并转换 SUI 余额
            const suibalance = await queryAddressSUI(address)
            const suiValue = typeof suibalance === "string" ? 
              Number(suibalance) / 1000000000 : 0
            setSuiBalance(suiValue.toFixed(4)) // 保留4位小数
            
            // 获取并转换 HOH 余额 - 修复这部分
            const hohCoins = await queryAddressHOH(address)
            const userHOHBalance = hohCoins.reduce((acc, coin) => acc + coin.balance, 0)
            setHohBalance((userHOHBalance/1000000000).toFixed(4)) // 保留4位小数
          } catch (error) {
            console.error("Failed to fetch balances:", error)
          }

        }
      }
      fetchBalance()
    }, [isOpen, address])

  const handleSwapDirectionToggle = () => {
    setSwapDirection(swapDirection === "toHOH" ? "toSUI" : "toHOH")
    setAmountSUI("")
    setAmountHOH("")
  }

  const handleSwap = async () => {
    setIsProcessing(true)
    try {
      if (swapDirection === "toHOH") {
        const amount = Number.parseFloat(amountSUI) || 0
        if (amount > 0) {
          onSwapToHOH(amount)
        }
      } else {
        const amount = Number.parseFloat(amountHOH) || 0
        if (amount > 0) {
          onSwapToSUI(amount)
        }
      }
      // Close modal after successful swap
      onClose()
    } catch (error) {
      console.error("Swap failed:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Calculate estimated output based on a 1:3 ratio (SUI:HOH)
  const calculateEstimatedOutput = () => {
    if (swapDirection === "toHOH") {
      const sui = Number.parseFloat(amountSUI) || 0
      return (sui * 3).toFixed(2) // Changed from 10 to 3
    } else {
      const hoh = Number.parseFloat(amountHOH) || 0
      return (hoh / 3).toFixed(2) // Changed from 10 to 3
    }
  }

  // Handle input change with validation
  const handleInputChange = (value: string, setter: (value: string) => void) => {
    // Only allow numbers and a single decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setter(value)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-effect border border-blue-500/30 rounded-xl overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-blue-500/30">
                <h3 className="text-xl font-medium text-blue-300 neon-text">Swap Tokens</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-8 w-8 text-blue-300 hover:bg-blue-900/50 hover:text-blue-100"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* From Token */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-blue-300">
                    <span>From</span>
                    <span>Balance: {swapDirection === "toHOH" ? 
                    `${suiBalance} SUI` : 
                    `${hohBalance} HOH`}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all duration-200">
                    <div className="flex-shrink-0 h-8 w-6 relative">
                      <Image
                        src={swapDirection === "toHOH" ? "/logo/sui-logo.jpg" : "/logo/Mutr3.png"}
                        alt={swapDirection === "toHOH" ? "SUI" : "HOH"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <input
                        type="text"
                        value={swapDirection === "toHOH" ? amountSUI : amountHOH}
                        onChange={(e) =>
                          handleInputChange(e.target.value, swapDirection === "toHOH" ? setAmountSUI : setAmountHOH)
                        }
                        placeholder="0.00"
                        className="w-full bg-transparent border-none outline-none text-blue-100 text-xl font-medium placeholder:text-blue-500/50"
                      />
                    </div>
                    <div className="flex-shrink-0 text-blue-300 font-medium">
                      {swapDirection === "toHOH" ? "SUI" : "HOH"}
                    </div>
                  </div>
                </div>

                {/* Swap Direction Button */}
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-10 w-10 bg-blue-900/30 border border-blue-500/30 text-blue-300 hover:bg-blue-900/50 hover:text-blue-100 hover:scale-110 transition-all duration-200"
                    onClick={handleSwapDirectionToggle}
                  >
                    <ArrowDownUp className="h-5 w-5" />
                  </Button>
                </div>

                {/* To Token */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-blue-300">
                    <span>To (estimated)</span>
                    <span>Balance: {swapDirection === "toHOH" ? 
                    `${hohBalance} HOH` : 
                    `${suiBalance} SUI`}</span>
                    </div>
                  <div className="flex items-center space-x-3 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                    <div className="flex-shrink-0 h-8 w-6 relative">
                      <Image
                        src={swapDirection === "toHOH" ? "/logo/Mutr3.png" : "/logo/sui-logo.jpg"}
                        alt={swapDirection === "toHOH" ? "HOH" : "SUI"}
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <input
                        type="text"
                        value={calculateEstimatedOutput()}
                        readOnly
                        className="w-full bg-transparent border-none outline-none text-blue-100 text-xl font-medium"
                      />
                    </div>
                    <div className="flex-shrink-0 text-blue-300 font-medium">
                      {swapDirection === "toHOH" ? "HOH" : "SUI"}
                    </div>
                  </div>
                </div>

                {/* Exchange Rate */}
                <div className="flex items-center justify-between text-sm text-blue-300/70 bg-blue-900/10 rounded-lg p-3">
                  <span className="flex items-center">
                    <Info className="h-4 w-4 mr-1" />
                    Exchange Rate
                  </span>
                  <span>1 SUI = 3 HOH</span>
                </div>

                {/* Swap Button */}
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 text-white font-medium py-6 rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all duration-200 relative overflow-hidden group"
                  disabled={
                    isProcessing ||
                    (swapDirection === "toHOH" && (!amountSUI || Number.parseFloat(amountSUI) <= 0)) ||
                    (swapDirection === "toSUI" && (!amountHOH || Number.parseFloat(amountHOH) <= 0))
                  }
                  onClick={handleSwap}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10">
                    {isProcessing ? "Processing..." : `Swap to ${swapDirection === "toHOH" ? "HOH" : "SUI"}`}
                  </span>
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
