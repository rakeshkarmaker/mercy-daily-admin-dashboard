import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from '@/hooks/use-search-params'
import { GroupDetailUI } from '@/components/features/groups/group-detail-ui'
import type { GroupDetailTab } from '@/components/features/groups/group-detail-ui'
import {
    deleteGroup,
    deleteGroupMessage,
    getGroup,
    listGroupMessages,
    removeGroupMember,
    setGroupStatus,
} from '@/api/groups'
import type { GroupMember, GroupMessage } from '@/api/groups'
import { toast } from 'sonner'
import * as z from 'zod'

const searchSchema = z.object({
    tab: z.string().catch('members').optional(),
    page: z.number().catch(1).optional(),
    limit: z.number().catch(10).optional(),
    search: z.string().catch('').optional(),
})

export const Route = createFileRoute('/__main/groups/$groupId')({
    validateSearch: searchSchema,
    component: GroupDetailPage,
})

function GroupDetailPage() {
    const { groupId } = Route.useParams()
    const { tab: tabParam = 'members', page = 1, limit = 10, search: searchQuery = '' } = Route.useSearch()
    const mergeSearch = useSearchParams()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const tab: GroupDetailTab = tabParam === 'messages' ? 'messages' : 'members'
    const search = searchQuery.trim() || undefined

    const {
        data: group = null,
        isLoading: groupLoading,
        error: groupError,
    } = useQuery({
        queryKey: ['group', groupId],
        queryFn: () => getGroup(groupId),
    })

    const { data: messages = { data: [], page, limit, total: 0 }, isLoading: messagesLoading } = useQuery({
        queryKey: ['group', groupId, 'messages', page, limit, search ?? ''],
        queryFn: () => listGroupMessages(groupId, { page, limit, search }),
        enabled: tab === 'messages',
    })

    const invalidateGroup = () => {
        queryClient.invalidateQueries({ queryKey: ['group', groupId] })
        queryClient.invalidateQueries({ queryKey: ['groups'] })
    }

    const suspendMutation = useMutation({
        mutationFn: () => setGroupStatus(groupId, 'SUSPENDED', 'Suspended from the admin dashboard'),
        onSuccess: () => {
            toast.success('Group suspended')
            invalidateGroup()
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const reactivateMutation = useMutation({
        mutationFn: () => setGroupStatus(groupId, 'ACTIVE'),
        onSuccess: () => {
            toast.success('Group reactivated')
            invalidateGroup()
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const deleteGroupMutation = useMutation({
        mutationFn: () => deleteGroup(groupId),
        onSuccess: () => {
            toast.success('Group deleted')
            queryClient.invalidateQueries({ queryKey: ['groups'] })
            navigate({ to: '/groups' })
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const removeMemberMutation = useMutation({
        mutationFn: (member: GroupMember) => removeGroupMember(groupId, member.userId),
        onSuccess: (_, member) => {
            toast.success(`${member.name} removed from the group`)
            invalidateGroup()
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const deleteMessageMutation = useMutation({
        mutationFn: (message: GroupMessage) => deleteGroupMessage(message.id),
        onSuccess: () => {
            toast.success('Message deleted')
            queryClient.invalidateQueries({ queryKey: ['group', groupId, 'messages'] })
            invalidateGroup()
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const handleTabChange = (next: GroupDetailTab) => {
        mergeSearch({ tab: next, page: 1 })
    }

    const handleSearchChange = (value: string) => {
        mergeSearch({ search: value || undefined, page: 1 })
    }

    const handleResetSearch = () => {
        mergeSearch({ search: undefined, page: 1 })
    }

    return (
        <GroupDetailUI
            group={group}
            loading={groupLoading}
            error={groupError instanceof Error ? groupError.message : groupError ? 'Could not load the group.' : null}
            tab={tab}
            onTabChange={handleTabChange}
            messages={messages.data}
            messagesTotal={messages.total}
            messagesLoading={messagesLoading}
            page={page}
            limit={limit}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onResetSearch={handleResetSearch}
            onSuspend={() => suspendMutation.mutateAsync().then(() => undefined).catch(() => undefined)}
            onReactivate={() => reactivateMutation.mutateAsync().then(() => undefined).catch(() => undefined)}
            onDeleteGroup={() => deleteGroupMutation.mutateAsync().then(() => undefined).catch(() => undefined)}
            onRemoveMember={(member) => removeMemberMutation.mutateAsync(member).then(() => undefined).catch(() => undefined)}
            onDeleteMessage={(message) =>
                deleteMessageMutation.mutateAsync(message).then(() => undefined).catch(() => undefined)
            }
        />
    )
}
