import type React from 'react'
import { cn } from './cn'

export function Input({
  className,
  leftIcon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { leftIcon?: React.ReactNode }) {
  return (
    <div className={cn('relative', className)}>
      {leftIcon ? (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          {leftIcon}
        </div>
      ) : null}
      <input
        {...props}
        className={cn(
          'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none ring-brand-500 placeholder:text-slate-400 focus:ring-2',
          leftIcon ? 'pl-10' : '',
          props.disabled ? 'bg-slate-50 text-slate-500' : '',
        )}
      />
    </div>
  )
}

