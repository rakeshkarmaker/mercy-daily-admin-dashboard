import { useQuery } from '@tanstack/react-query'
import { appSettingsApi } from '@/api/settings'

/**
 * Shared app-settings query. The General tab (settings.tsx) uses the same
 * queryKey, so saving a new logo there invalidates this query and the
 * sidebar/header pick up the change immediately.
 */
export function useAppSettings() {
    const query = useQuery({
        queryKey: ['app-settings'],
        queryFn: appSettingsApi.get,
    })

    return {
        settings: query.data,
        isLoading: query.isLoading,
        logoUrl: query.data?.logoUrl ?? null,
    }
}
