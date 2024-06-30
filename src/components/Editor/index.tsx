import clsx from 'clsx'
import { Spinner } from 'flowbite-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FaPlusCircle } from 'react-icons/fa'

import miniFrame from '@/assets/polaroids/mini.webp'
import squareFrame from '@/assets/polaroids/square.webp'
import wideFrame from '@/assets/polaroids/wide.webp'
import { usePrinter } from '@/providers/PrinterProvider'

const frameMap = {
  wide: {
    src: wideFrame,
    frameWidth: 1056,
    frameHeight: 880,
  },
  mini: {
    src: miniFrame,
    frameWidth: 564,
    frameHeight: 880,
  },
  square: {
    src: squareFrame,
    frameWidth: 736,
    frameHeight: 880,
  },
}

export const Editor = () => {
  const { status } = usePrinter()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [containerWidth, setContainerWidth] = useState(640)
  const [image, setImage] = useState<Blob | null>(null)

  const frame = useMemo(() => {
    if (!status) return frameMap.wide
    const type = status.type
    return frameMap[type]
  }, [status])

  const { width, height } = useMemo(() => {
    if (!status) return { width: 1260, height: 840 }
    return status
  }, [status])

  useEffect(() => {
    if (!containerRef.current) return
    const resize = () => {
      setContainerWidth(containerRef.current!.clientWidth)
    }
    document.addEventListener('resize', resize, { passive: true })
    return () => document.removeEventListener('resize', resize)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImage(file)
  }

  useEffect(() => {
    if (!image) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      const imgWidth = img.width
      const imgHeight = img.height
      const imgRatio = imgWidth / imgHeight

      const frameRatio = frame.frameWidth / frame.frameHeight

      let width = 0
      let height = 0
      let x = 0
      let y = 0

      if (imgRatio > frameRatio) {
        width = frame.frameWidth
        height = (frame.frameWidth * imgHeight) / imgWidth
        x = 0
        y = (frame.frameHeight - height) / 2
      } else {
        width = (frame.frameHeight * imgWidth) / imgHeight
        height = frame.frameHeight
        x = (frame.frameWidth - width) / 2
        y = 0
      }

      ctx.clearRect(0, 0, frame.frameWidth, frame.frameHeight)
      ctx.drawImage(img, x, y, width, height)
    }

    img.src = URL.createObjectURL(image)
  }, [image, frame])

  // if (!status) return <Spinner />

  return (
    <>
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        hidden
        onChange={(e) => handleFileSelect(e)}
      />
      <div
        className="relative w-full max-w-[640px]"
        style={{
          height: (containerWidth * frame.frameHeight) / frame.frameWidth,
        }}
        ref={containerRef}
      >
        <img
          src={frame.src}
          alt="Wide Polaroid Frame"
          className={clsx(
            'absolute top-0 left-0',
            'w-full h-full',
            'pointer-events-none select-none',
            'z-40',
          )}
        />
        <div
          className={clsx(
            'absolute top-[7%] left-1/2 -translate-x-1/2 overflow-hidden',
            'bg-gray-300 z-10',
            // 'bg-opacity-50 bg-red-500',
          )}
          style={{
            width: containerWidth * 0.96,
            height: (containerWidth * 0.96 * height) / width,
          }}
        >
          <canvas
            width={width}
            height={height}
            className={clsx('absolute top-0 left-0', 'w-full h-full')}
            ref={canvasRef}
          />
          {!image && (
            <div
              className={clsx(
                'absolute top-1/2 left-1/2',
                '-translate-x-1/2 -translate-y-1/2',
                'cursor-pointer select-none',
                'text-gray-500',
                'hover:text-gray-600',
                'active:text-gray-500',
              )}
              onClick={() => inputRef.current?.click()}
            >
              <FaPlusCircle className="w-16 h-16" />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
