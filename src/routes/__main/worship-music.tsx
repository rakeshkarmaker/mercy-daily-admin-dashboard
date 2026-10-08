import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from '@/hooks/use-search-params'
import type { FilterState } from '@/components/shared/filter-builder'
import { languageFromFilters } from '@/lib/language'
import { WorshipMusicUI } from '@/components/features/worship-music/worship-music-ui'
import {
    createPlaylist,
    createSong,
    deletePlaylist,
    deleteSong,
    getWorshipStats,
    listPlaylists,
    listSongs,
    recordSongPlay,
    updatePlaylist,
    updateSong,
} from '@/api/worship-music'
import type { PlaylistInput, SongInput, WorshipStatus } from '@/api/worship-music'
import { toast } from 'sonner'
import * as z from 'zod'

const searchSchema = z.object({
    page: z.number().catch(1).optional(),
    limit: z.number().catch(10).optional(),
    search: z.string().catch('').optional(),
})

/** Status comes from the shared Add Filter component; unset means ALL. */
function statusFromFilters(filters: FilterState[]): 'ALL' | WorshipStatus {
    const match = filters.find((f) => f.fieldId === 'status')
    if (!match || Array.isArray(match.value)) return 'ALL'
    const value = match.value.trim().toUpperCase()
    return value === 'PUBLISHED' || value === 'SCHEDULED' || value === 'DRAFT'
        ? value
        : 'ALL'
}

export const Route = createFileRoute('/__main/worship-music')({
    validateSearch: searchSchema,
    component: WorshipMusicPage,
})

function WorshipMusicPage() {
    const { page = 1, limit = 10, search: searchQuery = '' } = Route.useSearch()
    const mergeSearch = useSearchParams()
    const queryClient = useQueryClient()
    // Both filters come from the shared Add Filter component: `language`
    // drives `?language=` (unset = everything in its own language) and
    // `status` drives the songs query (unset = all statuses).
    const [filters, setFilters] = useState<FilterState[]>([])
    const language = languageFromFilters(filters)
    const status = statusFromFilters(filters)

    const { data, isLoading } = useQuery({
        queryKey: ['worship-songs', page, limit, status, language ?? 'all'],
        queryFn: () =>
            listSongs({
                page,
                limit,
                status: status === 'ALL' ? undefined : (status as WorshipStatus),
                language,
            }),
    })
    const { data: playlists = [] } = useQuery({
        queryKey: ['worship-playlists', language ?? 'all'],
        queryFn: () => listPlaylists(language),
    })
    const { data: stats } = useQuery({
        queryKey: ['worship-stats'],
        queryFn: getWorshipStats,
    })
    const songs = useMemo(() => {
        const rows = data?.data ?? []
        const query = searchQuery.trim().toLowerCase()
        if (!query) return rows
        return rows.filter((song) =>
            [
                song.title,
                song.artist,
                song.bibleReference ?? '',
                song.description ?? '',
                song.playlist?.title ?? '',
            ].some((value) => value.toLowerCase().includes(query)),
        )
    }, [data?.data, searchQuery])

    const invalidateSongs = () => {
        queryClient.invalidateQueries({ queryKey: ['worship-songs'] })
        queryClient.invalidateQueries({ queryKey: ['worship-stats'] })
    }
    const invalidatePlaylists = () => {
        queryClient.invalidateQueries({ queryKey: ['worship-playlists'] })
    }

    const createSongMutation = useMutation({
        mutationFn: (input: SongInput) => createSong(input),
        onSuccess: () => {
            toast.success('Worship track created')
            invalidateSongs()
            invalidatePlaylists()
        },
        onError: (error: Error) => toast.error(error.message),
    })
    const updateSongMutation = useMutation({
        mutationFn: ({ id, input }: { id: string; input: Partial<SongInput> }) =>
            updateSong(id, input),
        onSuccess: () => {
            toast.success('Worship track saved')
            invalidateSongs()
            invalidatePlaylists()
        },
        onError: (error: Error) => toast.error(error.message),
    })
    const deleteSongMutation = useMutation({
        mutationFn: (id: string) => deleteSong(id),
        onSuccess: () => {
            toast.success('Track removed from library')
            invalidateSongs()
            invalidatePlaylists()
        },
        onError: (error: Error) => toast.error(error.message),
    })
    const createPlaylistMutation = useMutation({
        mutationFn: (input: PlaylistInput) => createPlaylist(input),
        onSuccess: () => {
            toast.success('Playlist created')
            invalidatePlaylists()
        },
        onError: (error: Error) => toast.error(error.message),
    })
    const updatePlaylistMutation = useMutation({
        mutationFn: ({ id, input }: { id: string; input: Partial<PlaylistInput> }) =>
            updatePlaylist(id, input),
        onSuccess: () => {
            toast.success('Playlist saved')
            invalidatePlaylists()
        },
        onError: (error: Error) => toast.error(error.message),
    })
    const deletePlaylistMutation = useMutation({
        mutationFn: (id: string) => deletePlaylist(id),
        onSuccess: () => {
            toast.success('Playlist removed')
            invalidatePlaylists()
            invalidateSongs()
        },
        onError: (error: Error) => toast.error(error.message),
    })
    return (
        <WorshipMusicUI
            songs={songs}
            stats={
                stats ?? {
                    totalSongs: data?.total ?? 0,
                    totalPlaylists: playlists.length,
                    featuredCount: 0,
                    totalPlays: 0,
                }
            }
            songsLoading={isLoading}
            page={page}
            limit={limit}
            filters={filters}
            onFiltersChange={setFilters}
            playlists={playlists}
            searchQuery={searchQuery}
            onSearchChange={(value) => mergeSearch({ search: value || undefined, page: 1 })}
            onResetSearch={() => mergeSearch({ search: undefined, page: 1 })}
            onCreateSong={(input) => createSongMutation.mutateAsync(input).then(() => undefined)}
            onUpdateSong={(id, input) => updateSongMutation.mutateAsync({ id, input }).then(() => undefined)}
            onDeleteSong={(id) => deleteSongMutation.mutateAsync(id).then(() => undefined)}
            onRecordPlay={(id) => {
                // Best-effort play counting; never block the preview player.
                recordSongPlay(id, language)
                    .then(() => invalidateSongs())
                    .catch(() => undefined)
            }}
            onCreatePlaylist={(input) => createPlaylistMutation.mutateAsync(input).then(() => undefined)}
            onUpdatePlaylist={(id, input) => updatePlaylistMutation.mutateAsync({ id, input }).then(() => undefined)}
            onDeletePlaylist={(id) => deletePlaylistMutation.mutateAsync(id).then(() => undefined)}
        />
    )
}
