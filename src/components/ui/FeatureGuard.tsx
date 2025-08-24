import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useFeatureToggle } from '@/hooks/useFeatureToggle';
import { useAuth } from '@/contexts/auth-context';

interface FeatureGuardProps {
  children: React.ReactNode;
  feature?: string;
  permission?: string;
  locationId?: string;
  fallback?: React.ReactNode;
  requireBoth?: boolean; // If true, both permission and feature must be enabled
}

export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  children,
  feature,
  permission,
  locationId,
  fallback = null,
  requireBoth = true
}) => {
  const { hasPermission, getFeatureNameFromPermission } = usePermissions();
  const { userProfile } = useAuth();
  const effectiveLocationId = locationId || userProfile?.allowed_locations?.[0];

  // Determine the feature name to check
  const featureToCheck = feature || (permission ? getFeatureNameFromPermission(permission) : null);
  
  const { data: isFeatureEnabled, isLoading: featureLoading } = useFeatureToggle(
    featureToCheck || '',
    { 
      locationId: effectiveLocationId,
      enabled: !!featureToCheck && !!effectiveLocationId
    }
  );

  // If no location ID, default to true for features
  const finalFeatureEnabled = effectiveLocationId ? (isFeatureEnabled ?? true) : true;

  // Check permission if provided
  const hasRequiredPermission = permission ? hasPermission(permission) : true;

  // Loading state
  if (featureLoading && featureToCheck) {
    return <>{fallback}</>;
  }


  // Determine if access should be granted
  let shouldRender = true;

  if (requireBoth) {
    // Both permission and feature must be enabled
    shouldRender = hasRequiredPermission && (!featureToCheck || finalFeatureEnabled);
  } else {
    // Either permission OR feature enabled is sufficient
    shouldRender = hasRequiredPermission || (!featureToCheck || finalFeatureEnabled);
  }

  return shouldRender ? <>{children}</> : <>{fallback}</>;
};

// Higher-order component version
export function withFeatureGuard<T extends object>(
  Component: React.ComponentType<T>,
  guardProps: Omit<FeatureGuardProps, 'children'>
) {
  return function GuardedComponent(props: T) {
    return (
      <FeatureGuard {...guardProps}>
        <Component {...props} />
      </FeatureGuard>
    );
  };
}

// Hook version for conditional logic
export const useFeatureAccess = (
  feature?: string,
  permission?: string,
  locationId?: string,
  requireBoth: boolean = true
) => {
  const { hasPermission, getFeatureNameFromPermission } = usePermissions();
  const { userProfile } = useAuth();
  const effectiveLocationId = locationId || userProfile?.allowed_locations?.[0];

  const featureToCheck = feature || (permission ? getFeatureNameFromPermission(permission) : null);
  
  const { data: isFeatureEnabled = true, isLoading } = useFeatureToggle(
    featureToCheck || '',
    { 
      locationId: effectiveLocationId,
      enabled: !!featureToCheck && !!effectiveLocationId
    }
  );

  const hasRequiredPermission = permission ? hasPermission(permission) : true;

  let hasAccess = true;
  if (requireBoth) {
    hasAccess = hasRequiredPermission && (!featureToCheck || isFeatureEnabled);
  } else {
    hasAccess = hasRequiredPermission || (!featureToCheck || isFeatureEnabled);
  }

  return {
    hasAccess,
    isLoading,
    hasPermission: hasRequiredPermission,
    isFeatureEnabled,
    featureName: featureToCheck
  };
};