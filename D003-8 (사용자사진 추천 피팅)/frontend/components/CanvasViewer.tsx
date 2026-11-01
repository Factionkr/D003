import React, { useEffect, useState } from 'react'
import Image from 'next/image'

export default function CanvasViewer() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Placeholder: In real app, the URL will be set after rendering job completes.
  // Here we just display a default avatar.
  useEffect(() => {
    // TODO: subscribe to rendering job status via WebSocket or polling.
    setImageUrl('/placeholder-avatar.png')
  }, [])

  return (
    <div className="relative w-full aspect-[2/3] bg-surfaceCard rounded shadow overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutralLight bg-opacity-50 z-10">
          <span className="text-neutralDark">로드 중...</span>
        </div>
      )}
      {imageUrl && (
        <Image src={imageUrl} alt="Fitting Result" layout="fill" objectFit="contain" />
      )}
    </div>
  )
}

