export default function Spinner({ size = 32 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid #E11D2A`, borderTopColor: 'transparent',
      animation: 'spin 0.8s linear infinite',
    }} />
  )
}
