/* Simple line icons approximating the ones in the design frames. */

const common = { width: 34, height: 34, viewBox: '0 0 24 24', fill: 'none', stroke: '#202122', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }

export const CalendarUserIcon = () => (
  <svg {...common}>
    <rect x="3" y="4.5" width="18" height="16.5" rx="1.5" />
    <path d="M3 9h18M8 2.5v4M16 2.5v4" />
    <circle cx="12" cy="13.2" r="2" />
    <path d="M8.5 18.5c.6-1.8 2-2.6 3.5-2.6s2.9.8 3.5 2.6" />
  </svg>
)

export const EditIcon = () => (
  <svg {...common}>
    <path d="M4 20h4.5L19 9.5a1.6 1.6 0 0 0 0-2.2l-2.3-2.3a1.6 1.6 0 0 0-2.2 0L4 15.5V20z" />
    <path d="M13 6.5l4.5 4.5" />
  </svg>
)

export const UserGearIcon = () => (
  <svg {...common}>
    <circle cx="9" cy="8" r="3.5" fill="#202122" stroke="none" />
    <path d="M2.5 20c.8-4 3.5-6 6.5-6 1.2 0 2.3.3 3.2.8" fill="#202122" stroke="none" />
    <circle cx="17.5" cy="16.5" r="2" />
    <path d="M17.5 12.5v1.3M17.5 19.2v1.3M13.5 16.5h1.3M20.2 16.5h1.3M14.7 13.7l.9.9M19.4 18.4l.9.9M14.7 19.3l.9-.9M19.4 14.6l.9-.9" />
  </svg>
)

export const UserSlashIcon = () => (
  <svg {...common}>
    <circle cx="9" cy="8" r="3.5" fill="#202122" stroke="none" />
    <path d="M2.5 20c.8-4 3.5-6 6.5-6 1.2 0 2.3.3 3.2.8" fill="#202122" stroke="none" />
    <circle cx="17.5" cy="16.5" r="3.2" />
    <path d="M15.3 18.7l4.4-4.4" />
  </svg>
)

export const Caret = () => (
  <svg className="caret-icon" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <path d="M2 4l4 4 4-4z" fill="currentColor" />
  </svg>
)

export const BackArrow = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 12H5M11 5l-7 7 7 7" fill="none" stroke="#202122" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
