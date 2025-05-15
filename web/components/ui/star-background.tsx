"use client"

import { useEffect, useRef } from "react"

export const StarBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 设置画布大小
    const setCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    setCanvasSize()

    // 创建星星
    const stars: {
      x: number
      y: number
      size: number
      speed: number
      brightness: number
      color: string
    }[] = []

    const createStars = () => {
      stars.length = 0
      const starCount = Math.floor((canvas.width * canvas.height) / 5000)

      for (let i = 0; i < starCount; i++) {
        const colors = [
          "rgba(255, 255, 255, 0.8)",
          "rgba(135, 206, 235, 0.8)",
          "rgba(155, 176, 255, 0.8)",
          "rgba(170, 191, 255, 0.8)",
        ]

        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.5 + 0.5,
          speed: Math.random() * 0.05 + 0.01,
          brightness: Math.random(),
          color: colors[Math.floor(Math.random() * colors.length)],
        })
      }
    }

    createStars()

    // 绘制星星
    let animationFrameId: number
    let time = 0

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      time += 0.01

      // 绘制星星
      stars.forEach((star) => {
        ctx.beginPath()

        // 星星闪烁效果
        const brightness = 0.5 + Math.sin(time * 5 + star.brightness * 10) * 0.5
        ctx.fillStyle = star.color
        ctx.globalAlpha = brightness

        // 绘制星星
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fill()

        // 移动星星
        star.y += star.speed

        // 如果星星移出画布底部，重新放置到顶部
        if (star.y > canvas.height) {
          star.y = 0
          star.x = Math.random() * canvas.width
        }
      })

      // 绘制流星（随机出现）
      if (Math.random() < 0.01) {
        const shootingStar = {
          x: Math.random() * canvas.width,
          y: 0,
          length: Math.random() * 80 + 50,
          speed: Math.random() * 10 + 10,
          angle: Math.random() * 30 + 30,
        }

        ctx.beginPath()
        ctx.moveTo(shootingStar.x, shootingStar.y)

        const radians = (shootingStar.angle * Math.PI) / 180
        const endX = shootingStar.x + Math.cos(radians) * shootingStar.length
        const endY = shootingStar.y + Math.sin(radians) * shootingStar.length

        const gradient = ctx.createLinearGradient(shootingStar.x, shootingStar.y, endX, endY)
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.8)")
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)")

        ctx.strokeStyle = gradient
        ctx.lineWidth = 2
        ctx.lineTo(endX, endY)
        ctx.stroke()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    // 窗口大小变化时重新设置画布大小
    window.addEventListener("resize", () => {
      setCanvasSize()
      createStars()
    })

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", setCanvasSize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
      style={{ background: "linear-gradient(to bottom, #0f172a, #1e3a8a)" }}
    />
  )
}
