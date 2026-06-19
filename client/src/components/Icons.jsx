// Bank & E-wallet SVG logos (inline SVG strings)
const BANK_SVGS = {
  bca: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="12" fill="#005BAE"/><path d="M14 18.5C14 17.1 15.1 16 16.5 16H20L17 24L21 32H17.5L14 24.5V18.5Z" fill="white"/><path d="M22 16H26L29 24L26 32H22L25 24L22 16Z" fill="white"/><path d="M28 16H31.5C32.9 16 34 17.1 34 18.5V24.5L30.5 32H27L31 24L28 16Z" fill="white"/></svg>`,
  bri: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="12" fill="#003D79"/><path d="M12 19C12 17.3 13.3 16 15 16H20C22.2 16 24 17.8 24 20C24 21.5 23.2 22.8 22 23.5L25 32H21L18.5 24H16V32H12V19Z" fill="white"/><path d="M27 16H33C34.7 16 36 17.3 36 19V22C36 23.7 34.7 25 33 25H31V32H27V16ZM31 19.5V22H32.5V19.5H31Z" fill="white"/></svg>`,
  bni: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="12" fill="#E8780A"/><path d="M14 16H18L24 26V16H28V32H24L18 22V32H14V16Z" fill="white"/><path d="M30 16H34V32H30V16Z" fill="white"/></svg>`,
  mandiri: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="12" fill="#003876"/><rect x="10" y="16" width="6" height="16" rx="1" fill="#FFB800"/><rect x="18" y="16" width="6" height="16" rx="1" fill="#FFB800"/><rect x="26" y="16" width="6" height="16" rx="1" fill="#FFB800"/><rect x="34" y="16" width="4" height="16" rx="1" fill="#FFB800"/></svg>`,
  bsi: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="12" fill="#00804A"/><path d="M14 16H22C24.2 16 26 17.8 26 20V22C26 23.5 25.2 24.8 24 25.5V26C25.5 26.5 26.5 28 26.5 29.5V30C26.5 31.1 25.6 32 24.5 32H14V16ZM18 19.5V22.5H21.5V19.5H18ZM18 26V30H22V26H18Z" fill="white"/><circle cx="34" cy="16" r="4" fill="#F7B600"/></svg>`,
  cimb: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="12" fill="#8B0000"/><path d="M12 18C12 16.9 12.9 16 14 16H34C35.1 16 36 16.9 36 18V20H16V22H36V30C36 31.1 35.1 32 34 32H14C12.9 32 12 31.1 12 30V18Z" fill="white"/><rect x="16" y="24" width="16" height="5" rx="1" fill="#8B0000"/></svg>`,
  danamon: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="12" fill="#00A651"/><circle cx="24" cy="24" r="10" fill="#FFD700"/><path d="M19 20H29V22H19V20ZM19 23H29V25H19V23ZM19 26H29V28H19V26Z" fill="#00A651"/></svg>`,
  permata: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="12" fill="#00A19A"/><polygon points="24,12 32,20 28,20 28,32 20,32 20,20 16,20" fill="white"/><rect x="16" y="33" width="16" height="3" rx="1" fill="white"/></svg>`,
  dana: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="24" fill="#108EE9"/><path d="M15 18C15 16.9 15.9 16 17 16H24C28.4 16 32 19.6 32 24C32 28.4 28.4 32 24 32H15V18ZM19 20V28H24C26.2 28 28 26.2 28 24C28 21.8 26.2 20 24 20H19Z" fill="white"/></svg>`,
  ovo: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="24" fill="#4C3494"/><circle cx="24" cy="24" r="10" fill="none" stroke="white" stroke-width="3"/><text x="24" y="28" text-anchor="middle" fill="white" font-family="Arial" font-weight="700" font-size="10">OVO</text></svg>`,
  gopay: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="24" fill="#00AA13"/><circle cx="20" cy="22" r="6" fill="white"/><circle cx="20" cy="22" r="3" fill="#00AA13"/><path d="M26 18H34V21H29V23H34V30H26V27H31V25H26V18Z" fill="white"/></svg>`,
  shopeepay: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="24" fill="#EE4D2D"/><path d="M24 12C22 12 20 14 20 16V18H16C14.9 18 14 18.9 14 20V32C14 33.1 14.9 34 16 34H32C33.1 34 34 33.1 34 32V20C34 18.9 33.1 18 32 18H28V16C28 14 26 12 24 12ZM24 15C24.8 15 25.5 15.7 25.5 16.5V18H22.5V16.5C22.5 15.7 23.2 15 24 15Z" fill="white"/><text x="24" y="30" text-anchor="middle" fill="#EE4D2D" font-family="Arial" font-weight="700" font-size="7">SPay</text></svg>`,
}

// Card brand SVGs
const CARD_SVGS = {
  visa: `<svg viewBox="0 0 72 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="72" height="48" rx="8" fill="#1A1F71"/><path d="M29.5 32H24.5L27.8 16H32.8L29.5 32Z" fill="white"/><path d="M48.5 16.5C47.5 16.2 46 16 44 16C39.5 16 36.5 18.5 36.5 21.5C36.5 24 38.5 25.5 40.5 26.5C42 27.2 42.5 27.8 42.5 28.5C42.5 29.5 41.2 30 40 30C38.5 30 37.5 29.8 36 29.2L35.5 29L35 31.5C36.2 32 38.2 32.5 40.2 32.5C45 32.5 48 30 48 27C48 24 45.5 22.5 43.5 21.5C42 20.8 41.5 20.2 41.5 19.5C41.5 18.5 42.5 18 44 18C45.2 18 46.2 18.2 47 18.5L47.5 18.8L48.5 16.5Z" fill="white"/><path d="M55 16H51C49.8 16 49 16.5 48.5 18L42 32H47L48 29H54L54.5 32H59L55 16ZM49.5 26.5L52 19.5L53.5 26.5H49.5Z" fill="white"/><path d="M23 16L16 32H11L7.5 20C7.3 19.2 7 19 6.5 18.5C5.5 18 4 17 2.5 16.5L9 16C10.5 16 11.5 16.5 12 18L13.5 26L18 16H23Z" fill="white"/></svg>`,
  mastercard: `<svg viewBox="0 0 72 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="72" height="48" rx="8" fill="#252525"/><circle cx="28" cy="24" r="14" fill="#EB001B"/><circle cx="44" cy="24" r="14" fill="#F79E1B"/><path d="M36 13.5C38.8 15.8 40.5 19.5 40.5 24C40.5 28.5 38.8 32.2 36 34.5C33.2 32.2 31.5 28.5 31.5 24C31.5 19.5 33.2 15.8 36 13.5Z" fill="#FF5F00"/></svg>`,
  amex: `<svg viewBox="0 0 72 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="72" height="48" rx="8" fill="#006FCF"/><path d="M12 22L15 16H19L22 22V16H27L28.5 19L30 16H42V19H40V22H42V25H38L36.5 22L35 25H30V22L28.5 25H25L23.5 22L22 25H18V22L15 28H12V22ZM19.5 20L21 17L22.5 20H19.5ZM44 16H50L52 19L54 16H60V32H54L52 29L50 32H44V16ZM48 19V29H51L53 26L55 29H58V19H55L53 22L51 19H48Z" fill="white"/></svg>`,
}

// PayPal logo
const PAYPAL_SVG = `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="12" fill="#003087"/><path d="M20 14H26C29.3 14 32 16 32 19.5C32 24 29 27 25 27H22L21 34H17L20 14Z" fill="#009CDE"/><path d="M18 12H24C27.3 12 30 14 30 17.5C30 22 27 25 23 25H20L19 32H15L18 12Z" fill="white"/></svg>`

function findBank(name) {
  if (!name) return BANK_SVGS.bca
  const key = name.toLowerCase().replace(/[\s\-]/g, '')
  for (const [k, v] of Object.entries(BANK_SVGS)) {
    if (key.includes(k) || k.includes(key)) return v
  }
  return null
}

export function BankLogo({ bankName, size = 'md' }) {
  const sizes = { sm: 'w-16 h-6', md: 'w-[4.5rem] h-8', lg: 'w-24 h-10' }
  const svg = findBank(bankName) || BANK_SVGS.bca
  return (
    <div className={`${sizes[size]} rounded overflow-hidden flex-shrink-0`} dangerouslySetInnerHTML={{ __html: svg }} />
  )
}

export function BankIcon({ bankName, size = 'md' }) {
  const svg = findBank(bankName)
  const sizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' }

  if (svg) {
    return (
      <div className={`${sizes[size]} rounded-xl overflow-hidden flex-shrink-0 shadow-lg`} dangerouslySetInnerHTML={{ __html: svg }} />
    )
  }

  // Fallback: colored text badge
  const initials = bankName?.substring(0, 3).toUpperCase() || 'BNK'
  return (
    <div className={`${sizes[size]} rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-lg flex-shrink-0`}>
      {initials}
    </div>
  )
}

export function CardBrandIcon({ brand, size = 'md' }) {
  const sizes = { sm: 'w-10 h-7', md: 'w-12 h-8', lg: 'w-16 h-10' }
  const svg = CARD_SVGS[brand?.toLowerCase()] || CARD_SVGS.visa
  return (
    <div className={`${sizes[size]} rounded-md overflow-hidden mx-auto flex-shrink-0`} dangerouslySetInnerHTML={{ __html: svg }} />
  )
}

export function PaymentMethodIcon({ method, size = 'md' }) {
  const sizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' }
  const iconSizes = { sm: 16, md: 20, lg: 24 }
  const sz = iconSizes[size] || 20

  const icons = {
    bank_transfer: (
      <div className={`${sizes[size]} rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg mx-auto flex-shrink-0`}>
        <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
      </div>
    ),
    credit_card: (
      <div className={`${sizes[size]} rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg mx-auto flex-shrink-0`}>
        <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
      </div>
    ),
    ewallet: (
      <div className={`${sizes[size]} rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg mx-auto flex-shrink-0`}>
        <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/><circle cx="18" cy="15" r="1"/>
        </svg>
      </div>
    ),
    balance: (
      <div className={`${sizes[size]} rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg mx-auto flex-shrink-0`}>
        <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      </div>
    ),
  }

  return icons[method] || icons.bank_transfer
}

export function TransactionIcon({ type, size = 'md' }) {
  const sizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-14 h-14' }
  const iconSizes = { sm: 14, md: 18, lg: 24 }
  const sz = iconSizes[size] || 18

  const icons = {
    convert: (
      <div className={`${sizes[size]} rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg flex-shrink-0`}>
        <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
        </svg>
      </div>
    ),
    topup: (
      <div className={`${sizes[size]} rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg flex-shrink-0`}>
        <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </div>
    ),
    credit_card: (
      <div className={`${sizes[size]} rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg flex-shrink-0`}>
        <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
      </div>
    ),
  }

  return icons[type] || icons.convert
}
