import React, { useState, useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export function Tooltip({ content, children, position = 'top', delay = 200, className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipRect, setTooltipRect] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      updatePosition();
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipHeight = tooltipRef.current.offsetHeight;
    const tooltipWidth = tooltipRef.current.offsetWidth;
    const gap = 8;

    let top = 0, left = 0;

    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipHeight - gap;
        left = triggerRect.left + (triggerRect.width - tooltipWidth) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + gap;
        left = triggerRect.left + (triggerRect.width - tooltipWidth) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipHeight) / 2;
        left = triggerRect.left - tooltipWidth - gap;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipHeight) / 2;
        left = triggerRect.right + gap;
        break;
    }

    // Keep in viewport
    const padding = 8;
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

    setTooltipRect({ top, left });
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, { passive: true });
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isVisible, position]);

  const enhancedChildren = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<any>, {
        ref: triggerRef,
        onMouseEnter: showTooltip,
        onMouseLeave: hideTooltip,
        onFocus: showTooltip,
        onBlur: hideTooltip,
      } as any)
    : children;

  if (!isVisible) return enhancedChildren;

  return (
    <>
      {enhancedChildren}
      {createPortal(
        <div
          ref={tooltipRef}
          className={`
            fixed z-[100] pointer-events-none px-3 py-2 text-xs font-medium text-white
            bg-slate-900 dark:bg-slate-100 text-slate-100 dark:text-slate-900
            rounded-lg shadow-lg whitespace-nowrap max-w-[300px]
            animate-fadeIn
            ${className}
          `}
          style={{ top: tooltipRect.top, left: tooltipRect.left }}
          role="tooltip"
        >
          {content}
          <div className={`absolute w-2 h-2 bg-slate-900 dark:bg-slate-100 transform rotate-45 ${
            position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' :
            position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' :
            position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' :
            'left-[-4px] top-1/2 -translate-y-1/2'
          }`} />
        </div>,
        document.body
      )}
    </>
  );
}

// Convenience wrapper for icon buttons with tooltips
interface IconTooltipProps {
  label: string;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function IconTooltip({ label, children, position = 'top' }: IconTooltipProps) {
  return (
    <Tooltip content={label} position={position}>
      {children}
    </Tooltip>
  );
}

// Help tooltip with more content
interface HelpTooltipProps {
  title: string;
  description: ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function HelpTooltip({ title, description, children, position = 'top' }: HelpTooltipProps) {
  return (
    <Tooltip
      content={
        <div className="max-w-xs">
          <p className="font-semibold mb-1">{title}</p>
          <p className="opacity-80 text-xs leading-relaxed">{description}</p>
        </div>
      }
      position={position}
      delay={300}
    >
      {children}
    </Tooltip>
  );
}

// Keyboard shortcut hint
interface ShortcutHintProps {
  shortcut: string;
  description: string;
  className?: string;
}

export function ShortcutHint({ shortcut, description, className = '' }: ShortcutHintProps) {
  const keys = shortcut.split('+').map(k => k.trim());

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 ${className}`}>
      <span className="text-[10px] opacity-60">{description}</span>
      <span className="flex items-center gap-1">
        {keys.map((key, i) => (
          <React.Fragment key={i}>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-400">
              {key.toUpperCase()}
            </kbd>
            {i < keys.length - 1 && <span className="text-slate-300 dark:text-slate-600">+</span>}
          </React.Fragment>
        ))}
      </span>
    </span>
  );
}