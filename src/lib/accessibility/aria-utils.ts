/**
 * Accessibility utilities for ARIA attributes and screen reader support
 * Ensures WCAG 2.1 AA compliance
 */

export interface AriaProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  'aria-current'?:
    | 'page'
    | 'step'
    | 'location'
    | 'date'
    | 'time'
    | 'true'
    | 'false';
  'aria-pressed'?: boolean;
  'aria-selected'?: boolean;
  'aria-checked'?: boolean | 'mixed';
  'aria-disabled'?: boolean;
  'aria-required'?: boolean;
  'aria-invalid'?: boolean | 'grammar' | 'spelling';
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-atomic'?: boolean;
  'aria-busy'?: boolean;
  'aria-controls'?: string;
  'aria-owns'?: string;
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  'aria-modal'?: boolean;
  role?: string;
  tabIndex?: number;
}

/**
 * Generate proper ARIA attributes for navigation elements
 */
export function getNavigationAria(
  isActive: boolean,
  isExpanded?: boolean,
  hasSubmenu?: boolean
): AriaProps {
  const aria: AriaProps = {};

  if (isActive) {
    aria['aria-current'] = 'page';
  }

  if (hasSubmenu) {
    aria['aria-haspopup'] = 'menu';
    aria['aria-expanded'] = Boolean(isExpanded);
  }

  return aria;
}

/**
 * Generate ARIA attributes for buttons
 */
export function getButtonAria(
  label: string,
  isPressed?: boolean,
  isDisabled?: boolean,
  controls?: string
): AriaProps {
  const aria: AriaProps = {
    'aria-label': label,
  };

  if (typeof isPressed === 'boolean') {
    aria['aria-pressed'] = isPressed;
  }

  if (isDisabled) {
    aria['aria-disabled'] = true;
  }

  if (controls) {
    aria['aria-controls'] = controls;
  }

  return aria;
}

/**
 * Generate ARIA attributes for form inputs
 */
export function getInputAria(
  label: string,
  isRequired?: boolean,
  isInvalid?: boolean,
  describedBy?: string
): AriaProps {
  const aria: AriaProps = {
    'aria-label': label,
  };

  if (isRequired) {
    aria['aria-required'] = true;
  }

  if (isInvalid) {
    aria['aria-invalid'] = true;
  }

  if (describedBy) {
    aria['aria-describedby'] = describedBy;
  }

  return aria;
}

/**
 * Generate ARIA attributes for loading states
 */
export function getLoadingAria(
  label: string = 'Loading...',
  isLive: boolean = true
): AriaProps {
  return {
    'aria-label': label,
    'aria-live': isLive ? 'polite' : 'off',
    'aria-busy': true,
    role: 'status',
  };
}

/**
 * Generate ARIA attributes for alerts and notifications
 */
export function getAlertAria(
  type: 'success' | 'error' | 'warning' | 'info',
  message: string,
  isLive: boolean = true
): AriaProps {
  return {
    'aria-label': `${type}: ${message}`,
    'aria-live': isLive ? 'assertive' : 'polite',
    role: type === 'error' ? 'alert' : 'status',
  };
}

/**
 * Generate ARIA attributes for modal dialogs
 */
export function getModalAria(
  title: string,
  isOpen: boolean,
  labelledBy?: string,
  describedBy?: string
): AriaProps {
  const aria: AriaProps = {
    role: 'dialog',
    'aria-modal': true,
    'aria-hidden': !isOpen,
  };

  if (labelledBy) {
    aria['aria-labelledby'] = labelledBy;
  } else {
    aria['aria-label'] = title;
  }

  if (describedBy) {
    aria['aria-describedby'] = describedBy;
  }

  return aria;
}

/**
 * Generate ARIA attributes for dropdown menus
 */
export function getDropdownAria(
  isOpen: boolean,
  triggerId: string,
  menuId: string
): {
  trigger: AriaProps;
  menu: AriaProps;
} {
  return {
    trigger: {
      'aria-expanded': isOpen,
      'aria-haspopup': 'menu',
      'aria-controls': menuId,
    },
    menu: {
      role: 'menu',
      'aria-labelledby': triggerId,
      'aria-hidden': !isOpen,
    },
  };
}

/**
 * Generate ARIA attributes for tabs
 */
export function getTabsAria(
  activeTab: string,
  tabId: string,
  panelId: string
): {
  tab: AriaProps;
  panel: AriaProps;
} {
  const isSelected = activeTab === tabId;

  return {
    tab: {
      role: 'tab',
      'aria-selected': isSelected,
      'aria-controls': panelId,
      tabIndex: isSelected ? 0 : -1,
    },
    panel: {
      role: 'tabpanel',
      'aria-labelledby': tabId,
      'aria-hidden': !isSelected,
      tabIndex: 0,
    },
  };
}

/**
 * Generate ARIA attributes for search functionality
 */
export function getSearchAria(
  hasResults: boolean,
  resultCount?: number,
  isLoading?: boolean
): AriaProps {
  const aria: AriaProps = {
    role: 'search',
  };

  if (isLoading) {
    aria['aria-busy'] = true;
    aria['aria-live'] = 'polite';
  }

  if (hasResults && typeof resultCount === 'number') {
    aria['aria-label'] = `Search results: ${resultCount} items found`;
  }

  return aria;
}

/**
 * Generate ARIA attributes for pagination
 */
export function getPaginationAria(
  currentPage: number,
  totalPages: number,
  pageNumber?: number
): AriaProps {
  const aria: AriaProps = {
    role: 'navigation',
    'aria-label': 'Pagination',
  };

  if (pageNumber) {
    aria['aria-label'] = `Go to page ${pageNumber}`;
    if (pageNumber === currentPage) {
      aria['aria-current'] = 'page';
    }
  }

  return aria;
}

/**
 * Generate ARIA attributes for article cards
 */
export function getArticleCardAria(
  title: string,
  summary?: string,
  isRead?: boolean
): AriaProps {
  const aria: AriaProps = {
    'aria-label': `Article: ${title}`,
  };

  if (summary) {
    aria['aria-describedby'] =
      `${title.toLowerCase().replace(/\s+/g, '-')}-summary`;
  }

  if (isRead) {
    aria['aria-label'] += ' (read)';
  }

  return aria;
}

/**
 * Generate ARIA attributes for category filters
 */
export function getCategoryFilterAria(
  categoryName: string,
  isActive: boolean,
  count?: number
): AriaProps {
  let label = `Filter by ${categoryName}`;
  
  if (count !== undefined) {
    label += ` (${count} articles)`;
  }

  if (isActive) {
    label += ' - currently active';
  }

  return {
    'aria-label': label,
    'aria-pressed': isActive,
    role: 'button',
  };
}

/**
 * Utility to merge ARIA props with existing props
 */
export function mergeAriaProps(
  existingProps: Record<string, any>,
  ariaProps: AriaProps
): Record<string, any> {
  return {
    ...existingProps,
    ...ariaProps,
  };
}

/**
 * Validate ARIA attributes for development
 */
export function validateAriaProps(props: AriaProps): string[] {
  const warnings: string[] = [];

  // Check for conflicting aria-label and aria-labelledby
  if (props['aria-label'] && props['aria-labelledby']) {
    warnings.push(
      'Both aria-label and aria-labelledby are present. aria-labelledby takes precedence.'
    );
  }

  // Check for proper boolean values
  const booleanAttrs = [
    'aria-expanded',
    'aria-hidden',
    'aria-pressed',
    'aria-selected',
    'aria-disabled',
    'aria-required',
    'aria-atomic',
    'aria-busy',
  ];
  booleanAttrs.forEach((attr) => {
    const value = props[attr as keyof AriaProps];
    if (value !== undefined && typeof value !== 'boolean') {
      warnings.push(`${attr} should be a boolean value, got ${typeof value}`);
    }
  });

  // Check for valid aria-current values
  if (
    props['aria-current'] &&
    !['page', 'step', 'location', 'date', 'time', 'true', 'false'].includes(
      props['aria-current']
    )
  ) {
    warnings.push(`Invalid aria-current value: ${props['aria-current']}`);
  }

  return warnings;
}

/**
 * Screen reader utilities
 */
export const screenReader = {
  /**
   * Announce message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (typeof window === 'undefined') return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },

  /**
   * Create visually hidden text for screen readers
   */
  createHiddenText(text: string): HTMLSpanElement {
    const span = document.createElement('span');
    span.className = 'sr-only';
    span.textContent = text;
    return span;
  },
};

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Trap focus within an element
   */
  trapFocus(element: HTMLElement): () => void {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);

    // Return cleanup function
    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  },

  /**
   * Restore focus to previous element
   */
  restoreFocus(previousElement: HTMLElement | null): void {
    if (previousElement && typeof previousElement.focus === 'function') {
      previousElement.focus();
    }
  },

  /**
   * Get next focusable element
   */
  getNextFocusable(currentElement: HTMLElement, direction: 'next' | 'previous' = 'next'): HTMLElement | null {
    const focusableElements = Array.from(
      document.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];

    const currentIndex = focusableElements.indexOf(currentElement);
    if (currentIndex === -1) return null;

    const nextIndex =
      direction === 'next'
        ? (currentIndex + 1) % focusableElements.length
        : (currentIndex - 1 + focusableElements.length) %
          focusableElements.length;

    return focusableElements[nextIndex];
  },
};