import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div style={{
      background: '#4f46e5',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 6,
      color: 'white',
      fontWeight: 'bold',
      fontSize: 13,
      fontFamily: 'Arial, sans-serif',
    }}>
      PB
    </div>,
    { ...size }
  )
}
