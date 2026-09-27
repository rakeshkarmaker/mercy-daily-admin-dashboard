import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useSearchParams } from '@/hooks/use-search-params'
import { WorshipMusicUI } from '@/components/features/worship-music/worship-music-ui'
import {
    getStoredSongs,
    saveStoredSongs,
    getStoredPlaylists,
    saveStoredPlaylists,
    getStoredBanner,
    saveStoredBanner,
    getStoredArtists,
    type WorshipSong,
    type WorshipPlaylist,
    type WorshipHeroBanner,
} from '@/api/worship-music'
import { toast } from 'sonner'
import * as z from 'zod'

const searchSchema = z.object({
    search: z.string().catch('').optional(),
})

export const Route = createFileRoute('/__main/worship-music')({
    validateSearch: searchSchema,
    component: WorshipMusicPage,
})

function WorshipMusicPage() {
    const { search: searchQuery = '' } = Route.useSearch()
    const mergeSearch = useSearchParams()

    const [songs, setSongs] = useState<WorshipSong[]>(() => getStoredSongs())
    const [playlists, setPlaylists] = useState<WorshipPlaylist[]>(() => getStoredPlaylists())
    const [banner, setBanner] = useState<WorshipHeroBanner>(() => getStoredBanner())
    const [artists] = useState(() => getStoredArtists())

    const handleSearchChange = (value: string) => {
        mergeSearch({ search: value || undefined })
    }

    const handleResetSearch = () => {
        mergeSearch({ search: undefined })
    }

    const handleSaveSong = (song: WorshipSong) => {
        setSongs((prev) => {
            const exists = prev.some((s) => s.id === song.id)
            const updated = exists ? prev.map((s) => (s.id === song.id ? song : s)) : [song, ...prev]
            saveStoredSongs(updated)
            return updated
        })
        toast.success(song.id ? 'Worship track saved successfully' : 'Track created')
    }

    const handleDeleteSong = (id: string) => {
        setSongs((prev) => {
            const updated = prev.filter((s) => s.id !== id)
            saveStoredSongs(updated)
            return updated
        })
        toast.success('Track removed from library')
    }

    const handleSavePlaylist = (playlist: WorshipPlaylist) => {
        setPlaylists((prev) => {
            const exists = prev.some((p) => p.id === playlist.id)
            const updated = exists ? prev.map((p) => (p.id === playlist.id ? playlist : p)) : [playlist, ...prev]
            saveStoredPlaylists(updated)
            return updated
        })
        toast.success('Playlist saved')
    }

    const handleDeletePlaylist = (id: string) => {
        setPlaylists((prev) => {
            const updated = prev.filter((p) => p.id !== id)
            saveStoredPlaylists(updated)
            return updated
        })
        toast.success('Playlist removed')
    }

    const handleSaveBanner = (updatedBanner: WorshipHeroBanner) => {
        setBanner(updatedBanner)
        saveStoredBanner(updatedBanner)
        toast.success('Hero banner updated')
    }

    return (
        <WorshipMusicUI
            songs={songs}
            playlists={playlists}
            banner={banner}
            artists={artists}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onResetSearch={handleResetSearch}
            onSaveSong={handleSaveSong}
            onDeleteSong={handleDeleteSong}
            onSavePlaylist={handleSavePlaylist}
            onDeletePlaylist={handleDeletePlaylist}
            onSaveBanner={handleSaveBanner}
        />
    )
}
