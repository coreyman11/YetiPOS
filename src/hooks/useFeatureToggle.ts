import { useQuery } from '@tanstack/react-query';
import { featureTogglesApi } from '@/services/feature-toggles-api';
import { useAuth } from '@/contexts/auth-context';

export interface UseFeatureToggleOptions {
  locationId?: string;
  enabled?: boolean;
}

export const useFeatureToggle = (
  featureName: string, 
  options: UseFeatureToggleOptions = {}
) => {
  const { userProfile } = useAuth();
  const { locationId = userProfile?.allowed_locations?.[0], enabled = true } = options;

  return useQuery({
    queryKey: ['feature-toggle', featureName, locationId],
    queryFn: () => featureTogglesApi.isFeatureEnabled(featureName, locationId!),
    enabled: enabled && !!locationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useFeatureToggles = (locationId?: string) => {
  const { userProfile } = useAuth();
  const effectiveLocationId = locationId || userProfile?.allowed_locations?.[0];

  return useQuery({
    queryKey: ['feature-toggles', effectiveLocationId],
    queryFn: () => featureTogglesApi.getFeatureTogglesForLocation(effectiveLocationId!),
    enabled: !!effectiveLocationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useAllFeatureToggles = () => {
  return useQuery({
    queryKey: ['all-feature-toggles'],
    queryFn: () => featureTogglesApi.getAllFeatureToggles(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useFeatureDefinitions = () => {
  return useQuery({
    queryKey: ['feature-definitions'],
    queryFn: () => featureTogglesApi.getAllFeatureDefinitions(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useVendorAdminStatus = () => {
  const { userProfile } = useAuth();
  
  return useQuery({
    queryKey: ['vendor-admin-status', userProfile?.id],
    queryFn: () => featureTogglesApi.isVendorAdmin(userProfile?.id),
    enabled: !!userProfile?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useVendorAdminAuditLogs = (
  locationId?: string,
  targetType?: string,
  limit: number = 100
) => {
  return useQuery({
    queryKey: ['vendor-admin-audit-logs', locationId, targetType, limit],
    queryFn: () => featureTogglesApi.getAuditLogs(locationId, targetType, limit),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};