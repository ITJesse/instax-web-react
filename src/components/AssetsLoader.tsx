import fetchProgress, { FetchProgressData } from 'fetch-progress'
import localforage from 'localforage'
import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { ZstdInit } from '@oneidentity/zstd-js/wasm/decompress'
import { useThrottle } from '@uidotdev/usehooks'

const list = ['/20210701_3DLUT.bin.zst']

export const AssetsLoader: React.FC<PropsWithChildren> = ({ children }) => {
  const [fileIdx, setFileIdx] = useState(0)
  const [currProgress, setCurrProgress] = useState<FetchProgressData | null>(
    null,
  )
  const throttledCurrProgress = useThrottle(currProgress, 100)
  const [done, setDone] = useState(false)

  const fetcher = useCallback(async (filePath: string) => {
    const catchedBlob = await localforage.getItem<Blob>(filePath)
    if (catchedBlob) {
      return catchedBlob
    }
    const response = await fetch(filePath).then(
      fetchProgress({
        onProgress(progress) {
          setCurrProgress(progress)
        },
      }),
    )
    if (!response.ok) {
      throw new Error(`Failed to fetch ${filePath}`)
    }
    let blob: Blob
    if (filePath.endsWith('.zst')) {
      const data = await response.arrayBuffer()
      const { ZstdSimple } = await ZstdInit()
      const decompressed = ZstdSimple.decompress(new Uint8Array(data))
      blob = new Blob([decompressed])
    } else {
      blob = await response.blob()
    }
    localforage.setItem(filePath, blob)
  }, [])

  useEffect(() => {
    const loader = async () => {
      for (let i = 0; i < list.length; i++) {
        setFileIdx(i)
        await fetcher(list[i])
      }
      setDone(true)
    }
    loader()
  }, [fetcher])

  const downloadSpeed = useMemo(() => {
    const progress = throttledCurrProgress
    if (!progress) return null
    if (progress.speed < 1024) {
      return `${progress.speed.toFixed(1)} B/s`
    } else if (progress.speed < 1024 * 1024) {
      return `${(progress.speed / 1024).toFixed(1)} KB/s`
    } else {
      return `${(progress.speed / 1024 / 1024).toFixed(1)} MB/s`
    }
  }, [throttledCurrProgress])

  if (done) {
    return children
  }

  return (
    <div>
      <h1>AssetsLoader</h1>
      <p>
        {fileIdx + 1}/{list.length}
      </p>
      {currProgress && (
        <>
          <p>
            {((currProgress.transferred / currProgress.total) * 100).toFixed(1)}
            %
          </p>
          <p>{downloadSpeed}</p>
        </>
      )}
    </div>
  )
}
