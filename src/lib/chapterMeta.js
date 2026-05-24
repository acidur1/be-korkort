import { Icons } from '../components/Icons.jsx'

export const CHAPTER_META = {
  'Några körkortsregler':             { num: 1, short: 'Körkortsregler',    icon: Icons.BookOpen },
  'Fordonskännedom':                  { num: 2, short: 'Fordonskännedom',   icon: Icons.Truck },
  'Fordons last - säkerhetskontroll': { num: 3, short: 'Last & säkerhet',   icon: Icons.Package },
  'Körning med släpvagn':             { num: 4, short: 'Körning med släp',  icon: Icons.Steering },
}

export function stripPrefix(opt) {
  if (!opt) return opt
  const c = opt.charCodeAt(0)
  if (c >= 65 && c <= 90) {
    if (opt[1] === ' ') return opt.slice(2)
    if (opt[1] === '.' && opt[2] === ' ') return opt.slice(3)
  }
  return opt
}

export function letterFor(idx) {
  return String.fromCharCode(65 + idx)
}
