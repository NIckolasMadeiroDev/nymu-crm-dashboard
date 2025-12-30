import Image from 'next/image'
import type { CSSProperties } from 'react'

export type LogoVariant = 'twocolor' | 'white' | 'black' | 'yellow'
export type LogoType = 'logotype' | 'logo'

interface NymuLogoProps {
  readonly variant?: LogoVariant
  readonly type?: LogoType
  readonly width?: number
  readonly height?: number
  readonly className?: string
  readonly priority?: boolean
  readonly style?: CSSProperties
}

export default function NymuLogo({
  variant = 'twocolor',
  type = 'logotype',
  width = 192,
  height = 48,
  className = '',
  priority = false,
  style,
}: NymuLogoProps) {
  const getLogoPath = () => {
    if (type === 'logotype') {
      switch (variant) {
        case 'twocolor':
          return '/logos/twocolorLogotype-nymu.png'
        case 'white':
          return '/logos/whiteLogotype-nymu.png'
        case 'black':
          return '/logos/blackLogotype-nymu.png'
        default:
          return '/logos/twocolorLogotype-nymu.png'
      }
    } else {
      switch (variant) {
        case 'white':
          return '/logos/white-logo.png'
        case 'black':
          return '/logos/black-logo.png'
        case 'yellow':
          return '/logos/yellow-logo.png'
        default:
          return '/logos/black-logo.png'
      }
    }
  }

  return (
    <div className={`inline-flex items-center justify-center ${className}`} style={{ ...style }}>
      <Image
        src={getLogoPath()}
        alt="NYMU Logo"
        width={width}
        height={height}
        priority={priority}
        className="object-contain"
        style={{ width: 'auto', height: 'auto', maxWidth: '100%' }}
      />
    </div>
  )
}

