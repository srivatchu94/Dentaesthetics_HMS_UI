// Dentaesthetics HMS Brand Design System
// Cool, professional, gradient-rich color palette

export const brandTheme = {
  // Primary Brand Colors - Sky Blue & Teal
  primary: {
    sky: {
      50: '#F0F9FF',
      100: '#E0F2FE',
      200: '#BAE6FD',
      300: '#7DD3FC',
      400: '#38BDF8',
      500: '#0EA5E9', // Main sky blue
      600: '#0284C7',
      700: '#0369A1',
      800: '#075985',
      900: '#0C4A6E',
    },
    teal: {
      50: '#F0FDFA',
      100: '#CCFBF1',
      200: '#99F6E4',
      300: '#5EEAD4',
      400: '#2DD4BF',
      500: '#14B8A6', // Main teal
      600: '#0D9488',
      700: '#0F766E',
      800: '#115E59',
      900: '#134E4A',
    },
  },

  // Secondary Colors - Purple & Indigo
  secondary: {
    purple: {
      50: '#FAF5FF',
      100: '#F3E8FF',
      200: '#E9D5FF',
      300: '#D8B4FE',
      400: '#C084FC',
      500: '#A855F7', // Elegant purple
      600: '#9333EA',
      700: '#7E22CE',
      800: '#6B21A8',
      900: '#581C87',
    },
    indigo: {
      50: '#EEF2FF',
      100: '#E0E7FF',
      200: '#C7D2FE',
      300: '#A5B4FC',
      400: '#818CF8',
      500: '#6366F1', // Deep indigo
      600: '#4F46E5',
      700: '#4338CA',
      800: '#3730A6',
      900: '#312E81',
    },
    cyan: {
      50: '#ECFEFF',
      100: '#CFFAFE',
      200: '#A5F3FC',
      300: '#67E8F9',
      400: '#22D3EE',
      500: '#06B6D4', // Fresh cyan
      600: '#0891B2',
      700: '#0E7490',
      800: '#155E75',
      900: '#164E63',
    },
  },

  // Neutral Colors - Cool Grays
  neutral: {
    slate: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
  },

  // Semantic Colors
  semantic: {
    success: {
      light: '#D1FAE5',
      main: '#10B981',
      dark: '#047857',
    },
    warning: {
      light: '#FEF9C3',
      main: '#EAB308',
      dark: '#A16207',
    },
    error: {
      light: '#FFE4E6',
      main: '#EF4444',
      dark: '#B91C1C',
    },
    info: {
      light: '#E0F2FE',
      main: '#0EA5E9',
      dark: '#0369A1',
    },
  },

  // Gradients - Rich, smooth transitions
  gradients: {
    primary: 'from-sky-500 via-cyan-500 to-teal-500',
    secondary: 'from-purple-500 via-indigo-500 to-sky-500',
    cool: 'from-sky-400 to-teal-600',
    elegant: 'from-purple-400 via-indigo-400 to-sky-400',
    ocean: 'from-teal-500 via-cyan-500 to-sky-500',
    twilight: 'from-indigo-500 via-purple-500 to-sky-500',
    background: 'from-slate-50 via-sky-50/30 to-teal-50/20',
  },

  // Shadows with gradient colors
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(14, 165, 233, 0.1), 0 1px 2px 0 rgba(14, 165, 233, 0.06)',
    md: '0 4px 6px -1px rgba(14, 165, 233, 0.1), 0 2px 4px -1px rgba(14, 165, 233, 0.06)',
    lg: '0 10px 15px -3px rgba(14, 165, 233, 0.1), 0 4px 6px -2px rgba(14, 165, 233, 0.05)',
    xl: '0 20px 25px -5px rgba(14, 165, 233, 0.1), 0 10px 10px -5px rgba(14, 165, 233, 0.04)',
    sky: '0 10px 25px -5px rgba(14, 165, 233, 0.3), 0 8px 10px -6px rgba(14, 165, 233, 0.2)',
    purple: '0 10px 25px -5px rgba(168, 85, 247, 0.3), 0 8px 10px -6px rgba(168, 85, 247, 0.2)',
    teal: '0 10px 25px -5px rgba(20, 184, 166, 0.3), 0 8px 10px -6px rgba(20, 184, 166, 0.2)',
  },

  // Icons (Emoji-based for unique branding)
  icons: {
    medical: {
      tooth: '🦷',
      hospital: '🏥',
      doctor: '👨‍⚕️',
      stethoscope: '🩺',
      syringe: '💉',
      pill: '💊',
      microscope: '🔬',
    },
    actions: {
      add: '➕',
      edit: '✏️',
      delete: '🗑️',
      search: '🔍',
      filter: '🔽',
      save: '💾',
      cancel: '❌',
      check: '✅',
    },
    general: {
      calendar: '📅',
      clock: '🕒',
      phone: '📞',
      email: '✉️',
      location: '📍',
      home: '🏠',
      user: '👤',
      users: '👥',
      money: '💰',
      chart: '📊',
    },
  },

  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
  },

  // Spacing
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },

  // Border Radius
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    '3xl': '2rem',
    full: '9999px',
  },
};

// Export individual sections for easy access
export const colors = {
  sky: brandTheme.primary.sky,
  teal: brandTheme.primary.teal,
  purple: brandTheme.secondary.purple,
  indigo: brandTheme.secondary.indigo,
  cyan: brandTheme.secondary.cyan,
  slate: brandTheme.neutral.slate,
  gray: brandTheme.neutral.gray,
};

export const gradients = brandTheme.gradients;
export const shadows = brandTheme.shadows;
export const icons = brandTheme.icons;
export const typography = brandTheme.typography;

// Utility function to get gradient class
export const getGradient = (type = 'primary') => {
  return gradients[type] || gradients.primary;
};

// Utility function to get button classes with rich gradients
export const getButtonClass = (variant = 'primary', size = 'md') => {
  const variants = {
    primary: 'bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500 hover:from-sky-600 hover:via-cyan-600 hover:to-teal-600 text-white shadow-sky',
    secondary: 'bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-500 hover:from-purple-600 hover:via-indigo-600 hover:to-sky-600 text-white shadow-purple',
    accent: 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-teal',
    outline: 'border-2 border-sky-500 text-sky-600 hover:bg-sky-50',
    ghost: 'text-sky-600 hover:bg-sky-50',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return `${variants[variant]} ${sizes[size]} rounded-xl font-semibold transition-all duration-300 transform hover:scale-105`;
};

// Utility function to get card classes
export const getCardClass = (elevated = false) => {
  const base = 'bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200';
  const shadow = elevated ? 'shadow-xl' : 'shadow-md';
  return `${base} ${shadow} transition-all duration-300 hover:shadow-xl`;
};

export default brandTheme;
