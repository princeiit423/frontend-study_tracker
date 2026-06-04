export const AVATAR_PRESETS = [
  'cat',
  'dog',
  'bunny',
  'panda',
  'fox',
  'bear',
  'frog',
  'koala',
  'tiger',
  'penguin',
  'owl',
  'monkey',
]

const PALETTES = {
  cat: ['#f9a8d4', '#fef3c7', '#111827'],
  dog: ['#f59e0b', '#fed7aa', '#111827'],
  bunny: ['#c4b5fd', '#f8fafc', '#111827'],
  panda: ['#94a3b8', '#ffffff', '#111827'],
  fox: ['#fb7185', '#fdba74', '#111827'],
  bear: ['#a16207', '#fde68a', '#111827'],
  frog: ['#22c55e', '#bbf7d0', '#052e16'],
  koala: ['#64748b', '#e2e8f0', '#0f172a'],
  tiger: ['#f97316', '#fed7aa', '#111827'],
  penguin: ['#0f172a', '#f8fafc', '#111827'],
  owl: ['#7c3aed', '#fde68a', '#111827'],
  monkey: ['#92400e', '#fcd34d', '#111827'],
}

const hashString = (value = '') => {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

const getInitials = (name = 'User') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

const svgUrl = (svg) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`

const faceParts = (preset, primary, secondary, ink) => {
  const commonEyes = `<circle cx="47" cy="58" r="5" fill="${ink}"/><circle cx="81" cy="58" r="5" fill="${ink}"/>`
  const smile = `<path d="M54 78c6 6 18 6 24 0" stroke="${ink}" stroke-width="4" stroke-linecap="round" fill="none"/>`
  const nose = `<path d="M64 66l-6 6h12z" fill="${ink}" opacity=".85"/>`

  const parts = {
    cat: `<path d="M36 32 26 12l27 16M92 32l10-20-27 16" fill="${primary}" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/><circle cx="64" cy="66" r="42" fill="${secondary}" stroke="${ink}" stroke-width="4"/>${commonEyes}${nose}${smile}<path d="M30 70h20M28 80h21M78 70h20M79 80h21" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`,
    dog: `<circle cx="36" cy="43" r="21" fill="${primary}" stroke="${ink}" stroke-width="4"/><circle cx="92" cy="43" r="21" fill="${primary}" stroke="${ink}" stroke-width="4"/><circle cx="64" cy="66" r="42" fill="${secondary}" stroke="${ink}" stroke-width="4"/>${commonEyes}<ellipse cx="64" cy="72" rx="9" ry="7" fill="${ink}"/><path d="M64 78v8" stroke="${ink}" stroke-width="4" stroke-linecap="round"/><path d="M55 86c5 4 13 4 18 0" stroke="${ink}" stroke-width="4" stroke-linecap="round" fill="none"/>`,
    bunny: `<rect x="38" y="5" width="18" height="48" rx="9" fill="${secondary}" stroke="${ink}" stroke-width="4"/><rect x="72" y="5" width="18" height="48" rx="9" fill="${secondary}" stroke="${ink}" stroke-width="4"/><circle cx="64" cy="68" r="40" fill="${secondary}" stroke="${ink}" stroke-width="4"/>${commonEyes}<circle cx="64" cy="72" r="6" fill="#f472b6"/>${smile}`,
    panda: `<circle cx="39" cy="35" r="17" fill="${ink}"/><circle cx="89" cy="35" r="17" fill="${ink}"/><circle cx="64" cy="66" r="42" fill="${secondary}" stroke="${ink}" stroke-width="4"/><ellipse cx="47" cy="58" rx="12" ry="14" fill="${ink}"/><ellipse cx="81" cy="58" rx="12" ry="14" fill="${ink}"/><circle cx="47" cy="58" r="4" fill="#fff"/><circle cx="81" cy="58" r="4" fill="#fff"/>${nose}${smile}`,
    fox: `<path d="M35 34 23 13l31 13M93 34l12-21-31 13" fill="${primary}" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/><circle cx="64" cy="66" r="42" fill="${primary}" stroke="${ink}" stroke-width="4"/><path d="M29 61c12 4 22 13 35 34 13-21 23-30 35-34-6 28-24 43-35 43S35 89 29 61z" fill="${secondary}"/>${commonEyes}${nose}${smile}`,
    bear: `<circle cx="38" cy="33" r="17" fill="${primary}" stroke="${ink}" stroke-width="4"/><circle cx="90" cy="33" r="17" fill="${primary}" stroke="${ink}" stroke-width="4"/><circle cx="64" cy="66" r="42" fill="${primary}" stroke="${ink}" stroke-width="4"/><ellipse cx="64" cy="77" rx="22" ry="17" fill="${secondary}"/>${commonEyes}<ellipse cx="64" cy="72" rx="8" ry="6" fill="${ink}"/>${smile}`,
    frog: `<circle cx="45" cy="40" r="17" fill="${secondary}" stroke="${ink}" stroke-width="4"/><circle cx="83" cy="40" r="17" fill="${secondary}" stroke="${ink}" stroke-width="4"/><circle cx="64" cy="70" r="40" fill="${primary}" stroke="${ink}" stroke-width="4"/><circle cx="45" cy="40" r="5" fill="${ink}"/><circle cx="83" cy="40" r="5" fill="${ink}"/><path d="M45 76c12 10 38 10 50 0" stroke="${ink}" stroke-width="4" stroke-linecap="round" fill="none"/>`,
    koala: `<circle cx="32" cy="52" r="22" fill="${primary}" stroke="${ink}" stroke-width="4"/><circle cx="96" cy="52" r="22" fill="${primary}" stroke="${ink}" stroke-width="4"/><circle cx="64" cy="68" r="40" fill="${secondary}" stroke="${ink}" stroke-width="4"/>${commonEyes}<ellipse cx="64" cy="70" rx="10" ry="13" fill="${ink}"/>${smile}`,
    tiger: `<circle cx="64" cy="66" r="42" fill="${secondary}" stroke="${ink}" stroke-width="4"/><path d="M34 42l14 9M98 42l-14 9M52 27l7 14M76 27l-7 14" stroke="${ink}" stroke-width="5" stroke-linecap="round"/>${commonEyes}${nose}${smile}`,
    penguin: `<ellipse cx="64" cy="66" rx="39" ry="46" fill="${primary}" stroke="${ink}" stroke-width="4"/><ellipse cx="64" cy="73" rx="27" ry="32" fill="${secondary}"/>${commonEyes}<path d="M64 66l-9 8h18z" fill="#f59e0b"/>${smile}`,
    owl: `<circle cx="64" cy="66" r="42" fill="${primary}" stroke="${ink}" stroke-width="4"/><circle cx="48" cy="58" r="16" fill="${secondary}" stroke="${ink}" stroke-width="4"/><circle cx="80" cy="58" r="16" fill="${secondary}" stroke="${ink}" stroke-width="4"/><circle cx="48" cy="58" r="5" fill="${ink}"/><circle cx="80" cy="58" r="5" fill="${ink}"/><path d="M64 69l-8 11h16z" fill="#f97316"/>`,
    monkey: `<circle cx="35" cy="58" r="18" fill="${primary}" stroke="${ink}" stroke-width="4"/><circle cx="93" cy="58" r="18" fill="${primary}" stroke="${ink}" stroke-width="4"/><circle cx="64" cy="66" r="40" fill="${primary}" stroke="${ink}" stroke-width="4"/><ellipse cx="64" cy="76" rx="27" ry="22" fill="${secondary}"/>${commonEyes}<ellipse cx="64" cy="73" rx="8" ry="5" fill="${ink}"/>${smile}`,
  }
  return parts[preset] || parts.cat
}

export const getPresetAvatarSrc = (presetId, name = 'User') => {
  const preset = AVATAR_PRESETS.includes(presetId) ? presetId : AVATAR_PRESETS[hashString(name) % AVATAR_PRESETS.length]
  const [primary, secondary, ink] = PALETTES[preset]
  const initials = getInitials(name)
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <rect width="128" height="128" rx="64" fill="${secondary}" opacity=".28"/>
      ${faceParts(preset, primary, secondary, ink)}
      <circle cx="102" cy="102" r="19" fill="${primary}" stroke="${ink}" stroke-width="4"/>
      <text x="102" y="109" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="900" fill="#fff">${initials.slice(0, 1)}</text>
    </svg>
  `
  return svgUrl(svg)
}

export const getAvatarSrc = (userOrName) => {
  const user = typeof userOrName === 'string' ? { name: userOrName } : (userOrName || {})
  if (user.avatar && AVATAR_PRESETS.includes(user.avatar)) return getPresetAvatarSrc(user.avatar, user.name)
  if (user.avatar) return user.avatar
  const name = user.name || 'User'
  return getPresetAvatarSrc(AVATAR_PRESETS[hashString(name) % AVATAR_PRESETS.length], name)
}
