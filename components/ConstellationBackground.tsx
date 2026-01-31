"use client"
import { useEffect, useRef } from "react"

export default function ConstellationBackground({
  className = "",
  children,
  count = 100,
  connectionDistance = 150,
  nodeColor = "rgba(34, 211, 238, 1)",
  lineColor = "rgba(34, 211, 238, 0.15)",
  nodeSize = 2,
  mouseRadius = 100,
  glow = true,
}: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let width = container.offsetWidth
    let height = container.offsetHeight
    canvas.width = width
    canvas.height = height

    let animationId: number
    let mouseX = -1000
    let mouseY = -1000

    const nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * nodeSize + nodeSize * 0.5,
    }))

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      mouseX = e.clientX - rect.left
      mouseY = e.clientY - rect.top
    }
    const handleMouseLeave = () => { mouseX = -1000; mouseY = -1000; }

    container.addEventListener("mousemove", handleMouseMove)
    container.addEventListener("mouseleave", handleMouseLeave)

    const animate = () => {
      ctx.clearRect(0, 0, width, height)
      for (const node of nodes) {
        if (mouseRadius > 0) {
          const dx = node.x - mouseX
          const dy = node.y - mouseY
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < mouseRadius && dist > 0) {
            const force = ((mouseRadius - dist) / mouseRadius) * 0.02
            node.vx += (dx / dist) * force
            node.vy += (dy / dist) * force
          }
        }
        node.x += node.vx
        node.y += node.vy
        node.vx *= 0.99
        node.vy *= 0.99
        if (node.x < 0 || node.x > width) node.vx *= -1
        if (node.y < 0 || node.y > height) node.vy *= -1
      }

      ctx.strokeStyle = lineColor
      ctx.lineWidth = 1
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < connectionDistance) {
            ctx.globalAlpha = (1 - dist / connectionDistance) * 0.5
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }

      ctx.globalAlpha = 1
      for (const node of nodes) {
        if (glow) {
          const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius * 4)
          gradient.addColorStop(0, nodeColor.replace("1)", "0.3)"))
          gradient.addColorStop(1, "transparent")
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(node.x, node.y, node.radius * 4, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.fillStyle = nodeColor
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
        ctx.fill()
      }
      animationId = requestAnimationFrame(animate)
    }
    animate()
    return () => {
      cancelAnimationFrame(animationId)
      container.removeEventListener("mousemove", handleMouseMove)
      container.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [count, connectionDistance, nodeColor, lineColor, nodeSize, mouseRadius, glow])

  return (
    <div ref={containerRef} className={`fixed inset-0 overflow-hidden bg-neutral-950 ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(56, 189, 248, 0.08) 0%, transparent 60%)" }} />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  )
}