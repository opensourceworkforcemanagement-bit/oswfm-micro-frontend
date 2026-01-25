/**
 * ABAC React Components
 * Pre-built components for common ABAC UI patterns
 */

import React, { ReactNode } from 'react';
import { UUID } from '../types';
import { AttributeMap } from '../types/client-evaluation.types';
import { useAbacEvaluator } from './AbacProvider';
import { useAccessControl } from './useAccessControl';

// ============================================================================
// Protected Component
// ============================================================================

export interface ProtectedProps {
  /**
   * User ID to check permissions for
   */
  userId: UUID;
  
  /**
   * Resource ID
   */
  resourceId: UUID;
  
  /**
   * Action ID
   */
  actionId: UUID;
  
  /**
   * Environment attributes
   */
  environmentAttributes?: AttributeMap;
  
  /**
   * Content to render if permitted
   */
  children: ReactNode;
  
  /**
   * Content to render if denied (optional)
   */
  fallback?: ReactNode;
  
  /**
   * Content to render while loading (optional)
   */
  loading?: ReactNode;
  
  /**
   * Content to render on error (optional)
   */
  onError?: (error: Error) => ReactNode;
}

/**
 * Component that conditionally renders children based on permissions
 */
export function Protected({
  userId,
  resourceId,
  actionId,
  environmentAttributes,
  children,
  fallback,
  loading,
  onError,
}: ProtectedProps) {
  const evaluator = useAbacEvaluator();
  
  const { isPermitted, isLoading, error } = useAccessControl(evaluator, {
    userId,
    resourceId,
    actionId,
    environmentAttributes,
    autoEvaluate: true,
  });

  if (error && onError) {
    return <>{onError(error)}</>;
  }

  if (isLoading && loading) {
    return <>{loading}</>;
  }

  if (isPermitted) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}

// ============================================================================
// ProtectedButton Component
// ============================================================================

export interface ProtectedButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  userId: UUID;
  resourceId: UUID;
  actionId: UUID;
  environmentAttributes?: AttributeMap;
  /**
   * Whether to hide button when not permitted (default: false, shows disabled)
   */
  hideWhenDenied?: boolean;
  /**
   * Custom disabled message
   */
  disabledTitle?: string;
}

/**
 * Button that is automatically disabled based on permissions
 */
export function ProtectedButton({
  userId,
  resourceId,
  actionId,
  environmentAttributes,
  hideWhenDenied = false,
  disabledTitle = 'You do not have permission to perform this action',
  children,
  onClick,
  ...buttonProps
}: ProtectedButtonProps) {
  const evaluator = useAbacEvaluator();
  
  const { isPermitted, isLoading } = useAccessControl(evaluator, {
    userId,
    resourceId,
    actionId,
    environmentAttributes,
    autoEvaluate: true,
  });

  if (hideWhenDenied && !isPermitted) {
    return null;
  }

  return (
    <button
      {...buttonProps}
      disabled={!isPermitted || isLoading}
      title={!isPermitted ? disabledTitle : buttonProps.title}
      onClick={isPermitted ? onClick : undefined}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
}

// ============================================================================
// ProtectedLink Component
// ============================================================================

export interface ProtectedLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'onClick'> {
  userId: UUID;
  resourceId: UUID;
  actionId: UUID;
  environmentAttributes?: AttributeMap;
  hideWhenDenied?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * Link that is conditionally rendered/disabled based on permissions
 */
export function ProtectedLink({
  userId,
  resourceId,
  actionId,
  environmentAttributes,
  hideWhenDenied = false,
  children,
  onClick,
  ...linkProps
}: ProtectedLinkProps) {
  const evaluator = useAbacEvaluator();
  
  const { isPermitted, isLoading } = useAccessControl(evaluator, {
    userId,
    resourceId,
    actionId,
    environmentAttributes,
    autoEvaluate: true,
  });

  if (hideWhenDenied && !isPermitted) {
    return null;
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isPermitted) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  return (
    <a
      {...linkProps}
      onClick={handleClick}
      style={{
        ...linkProps.style,
        cursor: isPermitted ? 'pointer' : 'not-allowed',
        opacity: isPermitted ? 1 : 0.5,
      }}
    >
      {isLoading ? 'Loading...' : children}
    </a>
  );
}

// ============================================================================
// PermissionGate Component
// ============================================================================

export interface PermissionGateProps {
  userId: UUID;
  permissions: Array<{
    resourceId: UUID;
    actionId: UUID;
  }>;
  /**
   * Require all permissions (AND) or any permission (OR)
   */
  mode?: 'all' | 'any';
  environmentAttributes?: AttributeMap;
  children: ReactNode;
  fallback?: ReactNode;
  loading?: ReactNode;
}

/**
 * Component that checks multiple permissions
 */
export function PermissionGate({
  userId,
  permissions,
  mode = 'all',
  environmentAttributes,
  children,
  fallback,
  loading,
}: PermissionGateProps) {
  const evaluator = useAbacEvaluator();
  const [isPermitted, setIsPermitted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    async function checkPermissions() {
      setIsLoading(true);

      const results = await Promise.all(
        permissions.map((perm) =>
          evaluator.evaluate(userId, perm.resourceId, perm.actionId, environmentAttributes)
        )
      );

      if (!mounted) return;

      const permitted =
        mode === 'all'
          ? results.every((r) => r.decision === 'PERMIT')
          : results.some((r) => r.decision === 'PERMIT');

      setIsPermitted(permitted);
      setIsLoading(false);
    }

    checkPermissions();

    return () => {
      mounted = false;
    };
  }, [evaluator, userId, permissions, mode, environmentAttributes]);

  if (isLoading && loading) {
    return <>{loading}</>;
  }

  if (isPermitted) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}

// ============================================================================
// ResourceActions Component
// ============================================================================

export interface ResourceAction {
  id: UUID;
  name: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
}

export interface ResourceActionsProps {
  userId: UUID;
  resourceId: UUID;
  actions: ResourceAction[];
  environmentAttributes?: AttributeMap;
  renderAction?: (
    action: ResourceAction,
    isPermitted: boolean,
    isLoading: boolean
  ) => ReactNode;
}

/**
 * Component that renders a set of actions with permission checks
 */
export function ResourceActions({
  userId,
  resourceId,
  actions,
  environmentAttributes,
  renderAction,
}: ResourceActionsProps) {
  const evaluator = useAbacEvaluator();
  const [permissions, setPermissions] = React.useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    async function checkAllPermissions() {
      setIsLoading(true);

      const results: Record<string, boolean> = {};

      for (const action of actions) {
        const result = await evaluator.evaluate(
          userId,
          resourceId,
          action.id,
          environmentAttributes
        );
        results[action.id] = result.decision === 'PERMIT';
      }

      if (!mounted) return;

      setPermissions(results);
      setIsLoading(false);
    }

    checkAllPermissions();

    return () => {
      mounted = false;
    };
  }, [evaluator, userId, resourceId, actions, environmentAttributes]);

  if (renderAction) {
    return (
      <>
        {actions.map((action) =>
          renderAction(action, permissions[action.id] || false, isLoading)
        )}
      </>
    );
  }

  return (
    <div className="resource-actions">
      {actions.map((action) => (
        <button
          key={action.id}
          disabled={!permissions[action.id] || isLoading}
          onClick={action.onClick}
        >
          {action.icon}
          {action.label}
        </button>
      ))}
    </div>
  );
}
