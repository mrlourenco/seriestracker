const GRADIENTS = [
  'linear-gradient(150deg,#7f1d1d 0%,#dc2626 100%)',
  'linear-gradient(150deg,#0c4a6e 0%,#0891b2 100%)',
  'linear-gradient(150deg,#082f49 0%,#2563eb 100%)',
  'linear-gradient(150deg,#422006 0%,#d97706 100%)',
  'linear-gradient(150deg,#1e1b4b 0%,#4f46e5 100%)',
  'linear-gradient(150deg,#14532d 0%,#16a34a 100%)',
  'linear-gradient(150deg,#4a044e 0%,#c026d3 100%)',
  'linear-gradient(150deg,#18181b 0%,#52525b 100%)',
]

export function seriesGradient(title: string): string {
  return GRADIENTS[(title.charCodeAt(0) || 0) % GRADIENTS.length]
}
