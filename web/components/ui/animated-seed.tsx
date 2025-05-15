"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface AnimatedSeedProps {
  progress: number
  state: string
}

export const AnimatedSeed = ({ progress, state }: AnimatedSeedProps) => {
  const [scale, setScale] = useState(1)

  // 随机轻微缩放效果，模拟呼吸
  useEffect(() => {
    const interval = setInterval(() => {
      setScale(1 + Math.random() * 0.05)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  // 根据进度确定种子的颜色和大小
  const getSeedColor = () => {
    if (progress < 25) return "#4ade80" // 浅绿色
    if (progress < 50) return "#22c55e" // 中绿色
    if (progress < 75) return "#16a34a" // 深绿色
    return "#15803d" // 更深的绿色
  }

  const getSeedSize = () => {
    const baseSize = 60
    const growthFactor = 1 + (progress / 100) * 0.5
    return baseSize * growthFactor
  }

  // 根据状态确定是否显示芽和叶子
  const showSprout = progress > 25
  const showLeaf = progress > 50
  const showFlower = progress > 75

  // 水滴动画
  const waterDrops = Array(3)
    .fill(0)
    .map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full bg-blue-400"
        style={{
          width: 6 + i * 2,
          height: 10 + i * 3,
          left: `${40 + i * 20}%`,
          top: "-20px",
          opacity: 0,
        }}
        animate={{
          y: [0, 100],
          opacity: [0, 0.7, 0],
          scale: [1, 0.8],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "loop",
          delay: i * 0.8,
          ease: "easeInOut",
        }}
      />
    ))

  // 光芒效果
  const rays = Array(8)
    .fill(0)
    .map((_, i) => {
      const angle = i * 45 * (Math.PI / 180)
      const x = Math.cos(angle) * 50
      const y = Math.sin(angle) * 50

      return (
        <motion.div
          key={i}
          className="absolute bg-yellow-300"
          style={{
            width: 2,
            height: 15,
            borderRadius: 4,
            left: "50%",
            top: "50%",
            transformOrigin: "0 0",
            transform: `rotate(${i * 45}deg) translateX(${getSeedSize() / 2}px)`,
            opacity: 0,
          }}
          animate={{
            opacity: showFlower ? [0.2, 0.8, 0.2] : 0,
            height: showFlower ? [15, 20, 15] : 0,
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      )
    })

  return (
    <div className="relative w-full h-64 flex items-center justify-center">
      {/* 土壤 */}
      <div className="absolute bottom-0 w-full h-16 bg-gradient-to-t from-amber-800 to-amber-700 rounded-t-full opacity-70" />

      {/* 水滴效果 */}
      {waterDrops}

      {/* 光芒效果 */}
      {rays}

      {/* 种子和植物 */}
      <div className="relative z-10">
        {/* 种子 */}
        <motion.div
          className="relative"
          animate={{
            scale,
            rotate: progress > 75 ? [0, 1, -1, 0] : 0,
          }}
          transition={{
            scale: { duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" },
            rotate: { duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" },
          }}
        >
          {/* 种子主体 */}
          <motion.div
            className="rounded-b-full rounded-t-[40%] bg-gradient-to-b from-amber-600 to-amber-800"
            style={{
              width: getSeedSize(),
              height: getSeedSize() * 1.2,
              transformOrigin: "center bottom",
            }}
            animate={{
              backgroundColor: getSeedColor(),
              y: progress > 25 ? -20 : 0,
            }}
            transition={{ duration: 1 }}
          >
            {/* 种子纹理 */}
            <motion.div
              className="absolute top-1/4 left-1/2 w-[2px] h-[60%] bg-amber-900 opacity-40"
              style={{ transform: "translateX(-50%)" }}
            />
            <motion.div
              className="absolute top-1/4 left-1/2 w-[2px] h-[60%] bg-amber-900 opacity-40"
              style={{ transform: "translateX(-50%) rotate(30deg)", transformOrigin: "top" }}
            />
            <motion.div
              className="absolute top-1/4 left-1/2 w-[2px] h-[60%] bg-amber-900 opacity-40"
              style={{ transform: "translateX(-50%) rotate(-30deg)", transformOrigin: "top" }}
            />
          </motion.div>

          {/* 发芽 */}
          {showSprout && (
            <motion.div
              className="absolute left-1/2 bottom-[90%] w-2 bg-green-500"
              style={{
                height: progress > 50 ? 40 : 20,
                transform: "translateX(-50%)",
              }}
              initial={{ height: 0 }}
              animate={{ height: progress > 50 ? 40 : 20 }}
              transition={{ duration: 1 }}
            />
          )}

          {/* 叶子 - 左 */}
          {showLeaf && (
            <motion.div
              className="absolute left-[40%] bottom-[100%] w-12 h-8"
              style={{ transformOrigin: "bottom right" }}
              initial={{ rotate: -30, scale: 0 }}
              animate={{ rotate: -30, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              <svg viewBox="0 0 100 60" className="w-full h-full">
                <path
                  d="M100,0 C70,20 30,20 0,60 C30,40 70,40 100,0 Z"
                  fill="#16a34a"
                  stroke="#15803d"
                  strokeWidth="1"
                />
              </svg>

              {/* 叶脉 */}
              <motion.div
                className="absolute top-1/2 right-0 w-[80%] h-[1px] bg-green-800 opacity-40"
                style={{ transform: "rotate(-20deg)", transformOrigin: "right" }}
              />
            </motion.div>
          )}

          {/* 叶子 - 右 */}
          {showLeaf && (
            <motion.div
              className="absolute right-[40%] bottom-[100%] w-12 h-8"
              style={{ transformOrigin: "bottom left" }}
              initial={{ rotate: 30, scale: 0 }}
              animate={{ rotate: 30, scale: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              <svg viewBox="0 0 100 60" className="w-full h-full">
                <path d="M0,0 C30,20 70,20 100,60 C70,40 30,40 0,0 Z" fill="#16a34a" stroke="#15803d" strokeWidth="1" />
              </svg>

              {/* 叶脉 */}
              <motion.div
                className="absolute top-1/2 left-0 w-[80%] h-[1px] bg-green-800 opacity-40"
                style={{ transform: "rotate(20deg)", transformOrigin: "left" }}
              />
            </motion.div>
          )}

          {/* 花朵/果实 */}
          {showFlower && (
            <motion.div
              className="absolute left-1/2 bottom-[130%] w-10 h-10"
              style={{ transform: "translateX(-50%)" }}
              initial={{ scale: 0 }}
              animate={{
                scale: [0.9, 1.1, 0.9],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                scale: { duration: 2, repeat: Number.POSITIVE_INFINITY },
                rotate: { duration: 4, repeat: Number.POSITIVE_INFINITY },
              }}
            >
              <div className="relative w-full h-full">
                {/* 花朵中心 */}
                <motion.div
                  className="absolute inset-[20%] rounded-full bg-yellow-400 z-10"
                  animate={{
                    backgroundColor: progress > 90 ? "#eab308" : "#facc15",
                  }}
                />

                {/* 花瓣 */}
                {Array(8)
                  .fill(0)
                  .map((_, i) => {
                    const angle = i * 45 * (Math.PI / 180)
                    const x = Math.cos(angle) * 18
                    const y = Math.sin(angle) * 18

                    return (
                      <motion.div
                        key={i}
                        className="absolute w-5 h-5 rounded-full bg-green-400"
                        style={{
                          left: `calc(50% + ${x}px - 10px)`,
                          top: `calc(50% + ${y}px - 10px)`,
                          transformOrigin: "center",
                          zIndex: i < 4 ? 5 : 15,
                        }}
                        animate={{
                          scale: [0.9, 1.1, 0.9],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: i * 0.2,
                        }}
                      />
                    )
                  })}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* 状态文本 */}
        <motion.div
          className="absolute top-full left-1/2 mt-4 text-center"
          style={{ transform: "translateX(-50%)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm text-sm font-medium text-green-700 shadow-sm border border-green-100">
            {state}
          </span>
        </motion.div>
      </div>
    </div>
  )
}
