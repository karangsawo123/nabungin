'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  variant?: 'full' | 'mark' | 'horizontal'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  withLink?: boolean
  className?: string
  priority?: boolean
}

export function Logo({
  variant = 'horizontal',
  size = 'md',
  withLink = true,
  className = '',
  priority = false,
}: LogoProps) {
  // Dimensions map
  const markDimensions = {
    sm: { width: 30, height: 30 },
    md: { width: 38, height: 38 },
    lg: { width: 50, height: 50 },
    xl: { width: 68, height: 68 },
  }

  const fullDimensions = {
    sm: { width: 90, height: 90 },
    md: { width: 120, height: 120 },
    lg: { width: 160, height: 160 },
    xl: { width: 220, height: 220 },
  }

  const { width: markW, height: markH } = markDimensions[size]

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {variant === 'mark' ? (
        <div className="relative flex items-center justify-center flex-shrink-0">
          <Image
            src="/logo-mark-transparent.png"
            alt="Nabungin Logo"
            width={markW}
            height={markH}
            priority={priority}
            className="object-contain"
          />
        </div>
      ) : variant === 'full' ? (
        <div className="relative flex flex-col items-center justify-center flex-shrink-0">
          <Image
            src="/logo-opsi2-transparent.png"
            alt="Nabungin"
            width={fullDimensions[size].width}
            height={fullDimensions[size].height}
            priority={priority}
            className="object-contain"
          />
        </div>
      ) : (
        /* Horizontal: Mark on left, Nabungin wordmark with Option 2 brand styling */
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center flex-shrink-0">
            <Image
              src="/logo-mark-transparent.png"
              alt="Nabungin Logo"
              width={markW}
              height={markH}
              priority={priority}
              className="object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span
              className={`font-black tracking-tight leading-none text-[#F59E0B] ${
                size === 'sm'
                  ? 'text-lg'
                  : size === 'md'
                  ? 'text-xl sm:text-2xl'
                  : size === 'lg'
                  ? 'text-2xl sm:text-3xl'
                  : 'text-3xl sm:text-4xl'
              }`}
            >
              Nabungin
            </span>
            {size !== 'sm' && (
              <span className="text-[10px] font-bold text-[#10B981] tracking-wide leading-tight mt-0.5">
                Tumbuh Bersama
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )

  if (withLink) {
    return (
      <Link
        href="/"
        className="inline-flex items-center focus-visible:outline-2 focus-visible:outline-emerald-500 rounded-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
        aria-label="Nabungin Beranda"
      >
        {content}
      </Link>
    )
  }

  return content
}

export default Logo
