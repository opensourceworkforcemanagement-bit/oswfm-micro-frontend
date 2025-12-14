export const commonClasses = {
  // Layout
  container: 'min-h-screen flex items-center justify-center p-4',
  card: 'rounded-lg shadow-xl p-8 max-w-md w-full',
  pageContainer: 'p-4 sm:p-6',
  
  // Header
  headerContainer: 'text-center mb-8',
  iconWrapper: 'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
  title: 'text-3xl font-bold mb-2',
  subtitle: 'text-base',
  pageTitle: 'text-xl sm:text-2xl font-bold mb-4',
  
  // Alerts
  alertContainer: 'mb-6 border rounded-lg p-4 flex items-start',
  alertIcon: 'w-5 h-5 mr-3 flex-shrink-0 mt-0.5',
  alertText: 'text-sm',
  
  // Form
  formContainer: 'space-y-5',
  fieldContainer: '',
  label: 'block text-sm font-medium mb-2',
  inputWrapper: 'relative',
  inputIcon: 'absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none',
  inputIconSize: 'h-5 w-5',
  input: 'w-full pl-10 pr-4 py-3 border rounded-lg outline-none transition-all',
  inputWithButton: 'w-full pl-10 pr-12 py-3 border rounded-lg outline-none transition-all',
  inputButton: 'absolute inset-y-0 right-0 pr-3 flex items-center',
  inputField: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
  errorText: 'mt-1 text-sm',
  
  // Checkbox and options
  optionsContainer: 'flex items-center justify-between',
  checkboxLabel: 'flex items-center cursor-pointer',
  checkbox: 'w-5 h-5 border rounded flex items-center justify-center',
  checkboxIcon: 'w-4 h-4',
  checkboxText: 'ml-2 text-sm',
  forgotPasswordButton: 'text-sm font-medium',
  
  // Buttons
  submitButton: 'w-full py-3 px-4 rounded-lg transition-all font-medium flex items-center justify-center',
  logoutButton: 'w-full py-3 px-4 rounded-lg transition-colors font-medium',
  primaryButton: 'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
  secondaryButton: 'px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors',
  dangerButton: 'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors',
  iconButton: 'p-2 hover:bg-gray-100 rounded transition-colors',
  
  // Footer
  footer: 'mt-6 text-center text-sm',
  footerButton: 'font-medium',
  
  // Success screen
  successIconWrapper: 'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
  successIcon: 'w-8 h-8',
  successTitle: 'text-2xl font-bold mb-2',
  successText: 'mb-6',
  
  // Demo credentials
  demoContainer: 'mb-6 border rounded-lg p-4',
  demoTitle: 'text-sm font-medium mb-1',
  demoText: 'text-xs',
  
  // Loading spinner
  spinner: 'animate-spin -ml-1 mr-3 h-5 w-5',
  spinnerCircle: 'opacity-25',
  spinnerPath: 'opacity-75',
  
  // Tables
  tableContainer: 'bg-white rounded-lg shadow overflow-hidden',
  tableHeader: 'bg-gray-100',
  tableHeaderCell: 'px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase',
  tableRow: 'hover:bg-gray-50',
  tableCell: 'px-4 lg:px-6 py-4',
  
  // Cards
  cardContainer: 'bg-white p-4 rounded-lg shadow border border-gray-200',
  cardTitle: 'font-semibold',
  cardText: 'text-sm text-gray-600',
  
  // Grid
  gridContainer: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4',
  
  // Status Badges
  statusBadge: 'px-2 py-1 text-xs font-medium rounded-full',
  
  // Navigation
  navButton: 'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
  navButtonActive: 'bg-indigo-600',
  navButtonInactive: 'hover:bg-gray-800',
  
  // Modals/Dialogs
  dialogOverlay: 'fixed inset-0 bg-black/50 z-40',
  dialogContent: 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto z-50',
  dialogTitle: 'text-xl font-bold text-gray-900 mb-4',
  dialogDescription: 'text-sm text-gray-600 mb-6',
  
  // Filters
  filterContainer: 'display: grid, gridTemplateColumns: repeat(6, 1fr), gap: var(--spacing-md), padding: var(--spacing-md), backgroundColor: var(--color-background), borderRadius: var(--radius-lg), marginBottom: var(--spacing-md), boxShadow: var(--shadow-sm)',
  
  // Sidebar
  sidebar: 'hidden lg:flex lg:w-64 bg-gray-900 text-white flex-col',
  sidebarHeader: 'p-4 border-b border-gray-800',
  sidebarNav: 'flex-1 px-2 py-4',
  sidebarFooter: 'p-4 border-t border-gray-800',
  
  // Mobile menu
  mobileMenuButton: 'lg:hidden p-2 hover:bg-gray-100 rounded transition-colors',
  
  // Shared state indicators
  sharedStateIndicator: 'mb-4 p-3 sm:p-4 border rounded-lg',
  sharedStateIcon: 'w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0',
  sharedStateText: 'text-xs sm:text-sm',
  
  // Work Code specific classes
  workCodePage: 'min-h-screen',
  workCodePageInner: 'max-w-7xl mx-auto',
  workCodeHeader: 'flex justify-between items-center mb-6',
  workCodeSearchWrapper: 'relative mb-4',
  workCodeSearchIcon: 'absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none',
  workCodeSearchInput: 'w-full pl-10 pr-4 py-2 rounded-md',
  workCodeSearchHint: 'text-xs mt-1 block',
  workCodeTableWrapper: 'rounded-lg overflow-hidden border',
  workCodeLoadingContainer: 'flex items-center justify-center p-12',
  workCodeLoadingText: 'ml-3',
  workCodeFormContainer: 'rounded-lg shadow-sm overflow-hidden',
  workCodeFormHeader: 'flex items-center gap-3 mb-6',
  workCodeBackButton: 'p-2 rounded transition-colors',
  workCodeFormTitle: 'text-2xl font-bold',
  workCodeErrorAlert: 'mb-6 p-4 rounded-lg border flex items-start gap-3',
  workCodeErrorIcon: 'flex-shrink-0',
  workCodeTabList: 'flex border-b px-4',
  workCodeTab: 'px-4 py-3 border-b-2 border-transparent transition-colors cursor-pointer',
  workCodeTabActive: 'border-b-2 font-medium',
  workCodeTabContent: 'p-6',
  workCodeFormGrid: 'grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl',
  workCodeFormSingle: 'max-w-3xl',
  workCodeFormFooter: 'flex justify-end gap-3 p-6 border-t',
  workCodeCancelButton: 'px-6 py-2 rounded-md border transition-colors',
  workCodeSaveButton: 'px-6 py-2 rounded-md font-medium transition-colors flex items-center gap-2',
  workCodeFieldWrapper: 'space-y-2',
  workCodeFieldLabel: 'block text-sm font-medium',
  workCodeFieldInput: 'w-full px-3 py-2 rounded-md border transition-colors',
  workCodeFieldTextarea: 'w-full px-3 py-2 rounded-md border transition-colors min-h-32 resize-y',
  workCodeFieldError: 'text-sm mt-1',
  workCodeSelectTrigger: 'flex items-center justify-between w-full px-3 py-2 rounded-md border transition-colors',
  workCodeSelectContent: 'rounded-md border shadow-lg overflow-hidden',
  workCodeSelectItem: 'px-3 py-2 cursor-pointer transition-colors',
  workCodeSelectItemActive: 'flex items-center gap-2',
};

export const themeClasses = {
  // These will use CSS variables for dynamic theming
  primary: 'bg-[var(--color-primary)] text-white',
  primaryHover: 'hover:bg-[var(--color-primary-hover)]',
  primaryLight: 'bg-[var(--color-primary-light)]',
  
  surface: 'bg-[var(--color-surface)]',
  background: 'bg-[var(--color-background)]',
  
  textPrimary: 'text-[var(--color-text)]',
  textSecondary: 'text-[var(--color-text-secondary)]',
  textMuted: 'text-[var(--color-text-muted)]',
  
  border: 'border-[var(--color-border)]',
  borderFocus: 'focus:border-[var(--color-border-focus)]',
  
  success: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
  error: 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]',
};

// Utility function to combine classes
export const combineClasses = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};
