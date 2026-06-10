import { Link as RouterLink } from 'react-router-dom'
import { type AnchorHTMLAttributes } from 'react'

type Variant = 'default' | 'muted' | 'nav'

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string
  variant?: Variant
  external?: boolean
}

const variants: Record<Variant, string> = {
  default: 'text-teal-700 hover:text-teal-800 underline-offset-4 hover:underline',
  muted: 'text-neutral-500 hover:text-neutral-800 underline-offset-4 hover:underline',
  nav: 'text-neutral-700 hover:text-neutral-900 font-medium',
}

function isExternalHref(href: string) {
  return href.startsWith('http') || href.startsWith('//') || href.startsWith('mailto:') || href.startsWith('tel:')
}

export function Link({ href, variant = 'default', external, className, children, ...props }: LinkProps) {
  const classes = ['transition-colors', variants[variant], className].filter(Boolean).join(' ')
  const useExternal = external ?? isExternalHref(href)

  if (useExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...props}>
        {children}
      </a>
    )
  }

  return (
    <RouterLink to={href} className={classes} {...props}>
      {children}
    </RouterLink>
  )
}
