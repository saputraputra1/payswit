export function SplitView({ left, right, leftWidth = '1/3', className = '' }) {
  const widths = {
    '1/4': 'lg:grid-cols-[1fr_3fr]',
    '1/3': 'lg:grid-cols-[1fr_2fr]',
    '1/2': 'lg:grid-cols-2',
    '2/3': 'lg:grid-cols-[2fr_1fr]',
    '3/4': 'lg:grid-cols-[3fr_1fr]',
  }

  return (
    <div className={`grid grid-cols-1 ${widths[leftWidth] || widths['1/3']} gap-4 sm:gap-6 ${className}`}>
      <div className="order-2 lg:order-1">{left}</div>
      <div className="order-1 lg:order-2">{right}</div>
    </div>
  )
}

export function SplitCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`bg-white/[0.02] border border-white/[0.06] rounded-xl sm:rounded-2xl overflow-hidden ${className}`}>
      {(title || subtitle) && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/[0.06]">
          {title && <h3 className="font-bold text-white text-sm sm:text-base">{title}</h3>}
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  )
}

export function SidebarContent({ children, className = '' }) {
  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      {children}
    </div>
  )
}

export function MainContent({ children, className = '' }) {
  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      {children}
    </div>
  )
}
