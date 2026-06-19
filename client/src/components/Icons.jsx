const SVGS = {
  bca: `<svg viewBox="0 0 88 32" fill="none"><rect width="88" height="32" rx="4" fill="#0055A4"/><text x="44" y="23" text-anchor="middle" fill="white" font-family="Arial Black,Impact,sans-serif" font-weight="900" font-size="18">BCA</text></svg>`,
  bri: `<svg viewBox="0 0 72 32" fill="none"><rect width="72" height="32" rx="4" fill="#003D79"/><text x="36" y="23" text-anchor="middle" fill="white" font-family="Arial Black,Impact,sans-serif" font-weight="900" font-size="18">BRI</text></svg>`,
  bni: `<svg viewBox="0 0 72 32" fill="none"><rect width="72" height="32" rx="4" fill="#E8780A"/><text x="36" y="23" text-anchor="middle" fill="white" font-family="Arial Black,Impact,sans-serif" font-weight="900" font-size="18">BNI</text></svg>`,
  mandiri: `<svg viewBox="0 0 128 32" fill="none"><rect width="128" height="32" rx="4" fill="#FFB800"/><text x="64" y="23" text-anchor="middle" fill="#003D79" font-family="Arial Black,Impact,sans-serif" font-weight="900" font-size="16">MANDIRI</text></svg>`,
  bsi: `<svg viewBox="0 0 72 32" fill="none"><rect width="72" height="32" rx="4" fill="#00804A"/><text x="36" y="23" text-anchor="middle" fill="white" font-family="Arial Black,Impact,sans-serif" font-weight="900" font-size="18">BSI</text></svg>`,
  cimb: `<svg viewBox="0 0 88 32" fill="none"><rect width="88" height="32" rx="4" fill="#8B0000"/><text x="44" y="23" text-anchor="middle" fill="white" font-family="Arial Black,Impact,sans-serif" font-weight="900" font-size="16">CIMB</text></svg>`,
  danamon: `<svg viewBox="0 0 120 32" fill="none"><rect width="120" height="32" rx="4" fill="#00A651"/><text x="60" y="23" text-anchor="middle" fill="white" font-family="Arial Black,Impact,sans-serif" font-weight="900" font-size="14">DANAMON</text></svg>`,
  permata: `<svg viewBox="0 0 120 32" fill="none"><rect width="120" height="32" rx="4" fill="#00A19A"/><text x="60" y="23" text-anchor="middle" fill="white" font-family="Arial Black,Impact,sans-serif" font-weight="900" font-size="14">PERMATA</text></svg>`,
  dana: `<svg viewBox="0 0 72 32" fill="none"><rect width="72" height="32" rx="16" fill="#108EE9"/><text x="36" y="23" text-anchor="middle" fill="white" font-family="Arial Black,Impact,sans-serif" font-weight="900" font-size="16">DANA</text></svg>`,
  ovo: `<svg viewBox="0 0 72 32" fill="none"><rect width="72" height="32" rx="16" fill="#4C3494"/><text x="36" y="23" text-anchor="middle" fill="white" font-family="Arial Black,Impact,sans-serif" font-weight="900" font-size="18">OVO</text></svg>`,
  gopay: `<svg viewBox="0 0 88 32" fill="none"><rect width="88" height="32" rx="16" fill="#00AA13"/><text x="44" y="23" text-anchor="middle" fill="white" font-family="Arial Black,Impact,sans-serif" font-weight="900" font-size="14">GoPay</text></svg>`,
  shopeepay: `<svg viewBox="0 0 120 32" fill="none"><rect width="120" height="32" rx="16" fill="#EE4D2D"/><text x="60" y="23" text-anchor="middle" fill="white" font-family="Arial Black,Impact,sans-serif" font-weight="900" font-size="12">ShopeePay</text></svg>`,
  visa: `<svg viewBox="0 0 72 32" fill="none"><rect width="72" height="32" rx="4" fill="#1A1F71"/><text x="36" y="22" text-anchor="middle" fill="#F7B600" font-family="Arial Black,Impact,sans-serif" font-weight="900" font-size="16" font-style="italic">VISA</text></svg>`,
  mastercard: `<svg viewBox="0 0 72 32" fill="none"><rect width="72" height="32" rx="4" fill="#1A1F71"/><circle cx="28" cy="16" r="9" fill="#EB001B" opacity="0.95"/><circle cx="44" cy="16" r="9" fill="#F79E1B" opacity="0.95"/></svg>`,
  amex: `<svg viewBox="0 0 80 32" fill="none"><rect width="80" height="32" rx="4" fill="#006FCF"/><text x="40" y="22" text-anchor="middle" fill="white" font-family="Arial Black,Impact,sans-serif" font-weight="900" font-size="14">AMEX</text></svg>`,
  paypal: `<svg viewBox="0 0 96 32" fill="none"><rect width="96" height="32" rx="4" fill="#003087"/><text x="30" y="22" fill="#009CDE" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="14">Pay</text><rect x="50" y="8" width="32" height="16" rx="2" fill="white"/><text x="66" y="22" text-anchor="middle" fill="#003087" font-family="Arial Black,Impact,sans-serif" font-weight="900" font-size="12">Pal</text></svg>`,
}

function find(name) {
  if (!name) return { svg: SVGS.bca, name: 'Bank' }
  const key = name.toLowerCase().replace(/[\s\-]/g, '')
  for (const [k, v] of Object.entries(SVGS)) {
    if (key.includes(k) || k.includes(key)) return { svg: v, name: name }
  }
  return { svg: SVGS.bca, name }
}

export function BankLogo({ bankName, size = 'md' }) {
  const sizes = { sm: 'w-16 h-6', md: 'w-[4.5rem] h-8', lg: 'w-24 h-10' }
  const info = find(bankName)
  return (
    <div className={`${sizes[size]} rounded overflow-hidden flex-shrink-0`} dangerouslySetInnerHTML={{ __html: info.svg }} />
  )
}

export function BankIcon({ bankName, size = 'md' }) {
  const info = find(bankName)
  const sizes = { sm: 'w-8 h-8 text-[10px]', md: 'w-10 h-10 text-xs', lg: 'w-12 h-12 text-sm' }
  const rounded = ['dana','ovo','gopay','shopeepay'].some(k => bankName?.toLowerCase().includes(k)) ? 'rounded-full' : 'rounded-xl'
  const colorMatch = info.svg.match(/fill="#([0-9A-Fa-f]{6})"/)
  const bg = colorMatch ? `#${colorMatch[1]}` : '#3B82F6'

  return (
    <div className={`${sizes[size]} ${rounded} flex items-center justify-center text-white font-black shadow-lg flex-shrink-0`} style={{ backgroundColor: bg }}>
      {bankName?.substring(0, 3).toUpperCase() || 'BNK'}
    </div>
  )
}

export function PaymentMethodIcon({ method, size = 'md' }) {
  const methods = {
    bank_transfer: { bg: '#3B82F6', label: 'B' },
    credit_card: { bg: '#F59E0B', label: 'CC' },
    ewallet: { bg: '#8B5CF6', label: 'EW' },
    balance: { bg: '#10B981', label: 'S' },
  }
  const m = methods[method] || methods.bank_transfer
  const sizes = { sm: 'w-8 h-8 text-[10px]', md: 'w-10 h-10 text-xs', lg: 'w-12 h-12 text-sm' }

  return (
    <div className={`${sizes[size]} rounded-xl flex items-center justify-center text-white font-black shadow-lg mx-auto flex-shrink-0`} style={{ backgroundColor: m.bg }}>
      {m.label}
    </div>
  )
}

export function TransactionIcon({ type, size = 'md' }) {
  const types = {
    convert: { bg: 'linear-gradient(135deg, #3B82F6, #06B6D4)', label: 'PP' },
    topup: { bg: 'linear-gradient(135deg, #10B981, #059669)', label: 'IDR' },
    credit_card: { bg: 'linear-gradient(135deg, #F59E0B, #D97706)', label: 'CC' },
  }
  const t = types[type] || types.convert
  const sizes = { sm: 'w-8 h-8 text-[10px]', md: 'w-10 h-10 text-xs', lg: 'w-14 h-14 text-sm' }

  return (
    <div className={`${sizes[size]} rounded-xl flex items-center justify-center text-white font-black shadow-lg flex-shrink-0`} style={{ background: t.bg }}>
      {t.label}
    </div>
  )
}
