import { useAppForm } from '@/components/shared/forms/form-context'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/page-header'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { request } from '@/api/base'
import { SlidersHorizontal, User, ShieldCheck, Camera, ArrowLeft, FileText, FileSignature, Loader2, X } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import * as z from 'zod'
import JoditEditor from 'jodit-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { staticContentApi } from '@/api/settings'

export const Route = createFileRoute('/__main/settings')({
    component: RouteComponent,
})

const TABS = [
    { id: 'general', label: 'General', icon: SlidersHorizontal },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'privacy-policy', label: 'Privacy Policy', icon: FileText },
    { id: 'terms-and-conditions', label: 'Terms & Conditions', icon: FileSignature },
] as const

type TabId = (typeof TABS)[number]['id']

// ─── Schemas ────────────────────────────────────────────────────────────────────

const profileSchema = z.object({
    image: z.string(),
    name: z.string().min(2, 'Enter your full name'),
    email: z.email('Enter a valid email address'),
})

const generalSchema = z.object({
    appName: z.string().min(1, 'Enter App Name'),
    logoUrl: z.string(),
})

const securitySchema = z.object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Re-enter your new password'),
})

// ─── Main Component ─────────────────────────────────────────────────────────────

function RouteComponent() {
    const [activeTab, setActiveTab] = useState<TabId>('general')

    return (
        <>
            <PageHeader title="Settings" description="Configure your application preferences and integrations." />

            <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-5">
                {/* Left Sidebar Tabs */}
                <nav className="flex flex-row md:flex-col gap-2 bg-card border rounded-xl p-3 h-fit overflow-x-auto">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <Button
                                key={tab.id}
                                variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                                onClick={() => setActiveTab(tab.id)}
                                className={`justify-start gap-3 h-11 ${activeTab === tab.id ? 'bg-muted/50' : ''}`}
                            >
                                <Icon className="size-4" />
                                {tab.label}
                            </Button>
                        )
                    })}
                </nav>

                {/* Right Content Area */}
                <div className="border rounded-xl bg-card p-6 min-h-125">
                    {activeTab === 'general' && <GeneralTab />}
                    {activeTab === 'profile' && <ProfileTab />}
                    {activeTab === 'security' && <SecurityTab />}
                    {activeTab === 'privacy-policy' && <PrivacyPolicyTab />}
                    {activeTab === 'terms-and-conditions' && <TermsAndConditionsTab />}
                </div>
            </div>
        </>
    )
}

// ─── General Tab ────────────────────────────────────────────────────────────────

function GeneralTab() {
    const form = useAppForm({
        defaultValues: { appName: '', logoUrl: '' },
        validators: { onChange: generalSchema },
        onSubmit: async ({ value }) => {
            console.log('General saved:', value)
            toast.success("Settings saved successfully")
        },
    })

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                form.handleSubmit()
            }}
            className="flex flex-col gap-5 h-full"
        >
            <div>
                <h3 className="text-xl font-semibold text-foreground">General</h3>
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-5 max-w-2xl">
                <form.AppField name="appName">
                    {(field) => (
                        <field.FormInput
                            label="App Name"
                            placeholder="Enter App Name"
                        />
                    )}
                </form.AppField>

                <form.AppField name="logoUrl">
                    {(field) => (
                        <field.FormInput
                            label="Logo URL"
                            placeholder="Enter Logo URL"
                        />
                    )}
                </form.AppField>
            </div>

            <div className="mt-2">
                <form.AppForm>
                    <Button 
                        type="submit" 
                        variant="default"
                        disabled={form.state.isSubmitting}
                        className="w-full sm:w-62.5"
                    >
                        Save
                    </Button>
                </form.AppForm>
            </div>
        </form>
    )
}

// ─── Profile Tab ────────────────────────────────────────────────────

function ProfileTab() {
    const { user } = Route.useRouteContext()

    // Persists via PATCH /profile/me (self-service account endpoint).
    const updateUser = useMutation({
        mutationFn: async (data: { name?: string; avatarUrl?: string }) => {
            return request('/profile/me', {
                method: 'PATCH',
                body: JSON.stringify(data),
            })
        },
        onSuccess: (updated) => {
            // Keep the sidebar/header in sync with the saved profile.
            const next = {
                id: (updated as any).id,
                name: (updated as any).name,
                email: (updated as any).email,
                role: (updated as any).role,
                image: (updated as any).avatarUrl ?? '',
            }
            localStorage.setItem('auth_user', JSON.stringify(next))
            toast.success("Profile updated successfully")
        },
        onError: (error) => toast.error(error.message),
    })

    const form = useAppForm({
        defaultValues: {
            image: user.image,
            name: user.name,
            email: user.email,
        },
        validators: { onChange: profileSchema },
        onSubmit: async ({ value }) => {
            await updateUser.mutateAsync({
                name: value.name,
                avatarUrl: value.image,
            })
        },
    })

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                form.handleSubmit()
            }}
            className="flex flex-col gap-5"
        >
            <div className="flex items-center gap-2 -ml-2">
                <Button variant="ghost" size="icon" className="rounded-full">
                    <ArrowLeft className="size-4" />
                </Button>
                <h3 className="text-xl font-semibold text-foreground">Profile</h3>
            </div>

            <Separator />

            {/* Avatar Upload */}
            <div className="flex justify-center my-4">
                <div className="relative group cursor-pointer inline-block">
                    <form.AppField name="image">{(field) => <field.FormAvatar folder="owner" />}</form.AppField>
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center pointer-events-none">
                        <Camera className="size-5 text-white" />
                    </div>
                </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl">
                <form.AppField name="name">
                    {(field) => (
                        <div className="relative">
                            <field.FormInput label="Full Name" placeholder="Enter your name" />
                        </div>
                    )}
                </form.AppField>

                <form.AppField name="email">
                    {(field) => (
                        <div className="relative">
                            <field.FormInput
                                type="email"
                                label="Email Address"
                                placeholder="Enter your email"
                                readOnly
                            />
                        </div>
                    )}
                </form.AppField>
            </div>

            {/* Save Button */}
            <div className="mt-4">
                <form.AppForm>
                    <Button 
                        type="submit" 
                        variant="default"
                        disabled={form.state.isSubmitting}
                        className="w-full sm:w-87.5"
                    >
                        Save
                    </Button>
                </form.AppForm>
            </div>
        </form>
    )
}

// ─── Security Tab ───────────────────────────────────────────────────────────────

function SecurityTab() {
    const [twoFactor, setTwoFactor] = useState(false)
    const navigate = useNavigate()

    // Changes the password via PUT /profile/me/password. The backend bumps
    // tokenVersion on success, invalidating every outstanding session —
    // including this one — so the user is signed back in.
    const changePassword = useMutation({
        mutationFn: async (data: {
            oldPassword: string
            newPassword: string
            confirmPassword: string
        }) => {
            return request<{ message: string }>('/profile/me/password', {
                method: 'PUT',
                body: JSON.stringify(data),
            })
        },
        onSuccess: (data) => {
            toast.success(data.message ?? 'Password changed successfully')
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_refresh_token')
            localStorage.removeItem('auth_user')
            navigate({ to: '/signin' })
        },
        onError: (error) => toast.error(error.message),
    })

    const form = useAppForm({
        defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
        validators: { onChange: securitySchema },
        onSubmit: async ({ value }) => {
            await changePassword.mutateAsync({
                oldPassword: value.currentPassword,
                newPassword: value.newPassword,
                confirmPassword: value.confirmPassword,
            })
        },
    })

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                form.handleSubmit()
            }}
            className="flex flex-col gap-5"
        >
            <div>
                <h3 className="text-xl font-semibold text-foreground">Security</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Manage your password and security settings.</p>
            </div>

            <Separator />

            {/* Change Password */}
            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 max-w-md">
                    <form.AppField name="currentPassword">
                        {(field) => (
                            <field.FormInput
                                type="password"
                                label={'Current Password'}
                                placeholder={'Current Password Placeholder'}
                            />
                        )}
                    </form.AppField>

                    <form.AppField name="newPassword">
                        {(field) => (
                            <field.FormInput
                                type="password"
                                label={'New Password'}
                                placeholder={'New Password Placeholder'}
                            />
                        )}
                    </form.AppField>

                    <form.AppField name="confirmPassword">
                        {(field) => (
                            <field.FormInput
                                type="password"
                                label={'Confirm Password'}
                                placeholder={'Confirm Password Placeholder'}
                            />
                        )}
                    </form.AppField>
                </div>
            </div>

            <Separator />

            {/* Two-Factor Authentication */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-success" />
                        Two-Factor Authentication
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 ml-6">Add an extra layer of security to your account.</p>
                </div>
                <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
            </div>
            <div className="mt-4">
                <form.AppForm>
                    <Button 
                        type="submit" 
                        variant="default"
                        disabled={form.state.isSubmitting}
                        className="w-full sm:w-62.5"
                    >
                        Save Changes
                    </Button>
                </form.AppForm>
            </div>
        </form>
    )
}

// ─── Privacy Policy & Terms Tabs ───────────────────────────────────────────────────────────────

function PrivacyPolicyTab() {
    const queryClient = useQueryClient()
    const [content, setContent] = useState<string>('')
    const [isInitialized, setIsInitialized] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)

    const { data, isLoading, error } = useQuery({
        queryKey: ['static-content', 'privacy-policy'],
        queryFn: () => staticContentApi.get('privacy-policy'),
    })

    const updateContent = useMutation({
        mutationFn: () =>
            staticContentApi.update('privacy-policy', {
                slug: data?.slug || 'privacy-policy',
                title: data?.title || 'Privacy Policy',
                content: content,
            }),

        onSuccess: () => {
            toast.success('Privacy Policy updated successfully')
            setIsEditing(false)

            queryClient.invalidateQueries({
                queryKey: ['static-content', 'privacy-policy'],
            })
        },

        onError: () => {
            toast.error('Failed to update Privacy Policy')
        },
    })

    useEffect(() => {
        if (!isLoading) {
            setContent(data?.content ?? '')
            setIsInitialized(true)
        }
    }, [data, isLoading])

    const handleCancel = () => {
        if (data) {
            setContent(data.content ?? '')
        }
        setIsEditing(false)
    }

    const config = useMemo(
        () => ({
            height: 512,
            readonly: !isEditing,
            buttons: [
                'bold', 'italic', 'underline', 'strike', 'subscript', 'superscript', '|',
                'font', 'fontsize', 'paragraph', '|',
                'align', 'ul', 'ol', 'outdent', 'indent', '|',
                'table', 'hr', 'link', '|',
                'undo', 'redo',
            ],
            placeholder: 'Start typing...',
        }),
        [isEditing],
    )

    if (isLoading || !isInitialized) {
        return (
            <div className="flex flex-col justify-center items-center h-96 gap-4 text-muted-foreground">
                <Loader2 className="size-8 animate-spin" />
                <p>Loading Privacy Policy...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-96">
                <p className="text-destructive font-medium">Error loading Privacy Policy</p>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col gap-6 w-full mt-4">
            <div>
                <h3 className="text-xl font-semibold text-foreground">Privacy Policy</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Manage the application's privacy policy.</p>
            </div>
            <Separator />
            <div className="rounded-xl overflow-hidden border shadow-sm">
                <JoditEditor config={config} value={content} onBlur={(newContent) => setContent(newContent)} />
            </div>

            <div className="flex flex-col gap-4 mt-2">
                <p className="text-sm font-medium text-foreground">Last updated: June 8, 2026 by Dianne Plummer.</p>

                <div className="flex flex-col sm:flex-row gap-4 w-full">
                    {!isEditing ? (
                        <>
                            <Button
                                size="lg"
                                variant="secondary"
                                className="flex-1 rounded-full text-base h-12 bg-muted/50 hover:bg-muted shadow-none border"
                                onClick={() => setIsPreviewOpen(true)}
                            >
                                Preview
                            </Button>
                            <Button
                                size="lg"
                                variant="default"
                                className="flex-1 rounded-full text-base h-12"
                                onClick={() => setIsEditing(true)}
                            >
                                Edit
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                size="lg"
                                variant="outline"
                                className="flex-1 rounded-full text-base h-12"
                                onClick={handleCancel}
                                disabled={updateContent.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="lg"
                                variant="default"
                                disabled={updateContent.isPending}
                                onClick={() => updateContent.mutate()}
                                className="flex-1 rounded-full text-base h-12"
                            >
                                {updateContent.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent
                    showCloseButton={false}
                    className="sm:max-w-5xl w-[92vw] h-[85vh] overflow-hidden flex flex-col p-0 rounded-3xl border-none shadow-2xl bg-slate-900 text-white outline-none"
                >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/20 text-primary p-2 rounded-xl">
                                <SlidersHorizontal className="size-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold tracking-tight text-white">Privacy Policy Preview</DialogTitle>
                                <p className="text-xs text-white/50">Draft Version (Live View)</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/20 border-none font-semibold px-3 py-1 rounded-full text-xs">
                                Ready to Publish
                            </Badge>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
                                onClick={() => setIsPreviewOpen(false)}
                            >
                                <X className="size-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 bg-slate-900/60 p-6 md:p-10 overflow-y-auto flex justify-center">
                        <div className="w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-100 p-8 md:p-16 min-h-[60vh] h-fit relative">
                            <div className="w-12 h-1 bg-primary rounded-full mx-auto mb-8" />
                            <div className="prose prose-slate lg:prose-base max-w-none leading-relaxed text-slate-800">
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html:
                                            content || '<p className="text-muted-foreground italic text-center">No content available.</p>',
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function TermsAndConditionsTab() {
    const queryClient = useQueryClient()
    const [content, setContent] = useState<string>('')
    const [isInitialized, setIsInitialized] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)

    const { data, isLoading, error } = useQuery({
        queryKey: ['static-content', 'terms-and-conditions'],
        queryFn: () => staticContentApi.get('terms-and-conditions'),
    })

    const updateContent = useMutation({
        mutationFn: () =>
            staticContentApi.update('terms-and-conditions', {
                slug: data?.slug || 'terms-and-conditions',
                title: data?.title || 'Terms and Conditions',
                content: content,
            }),

        onSuccess: () => {
            toast.success('Terms & Conditions updated successfully')
            setIsEditing(false)

            queryClient.invalidateQueries({
                queryKey: ['static-content', 'terms-and-conditions'],
            })
        },

        onError: () => {
            toast.error('Failed to update Terms & Conditions')
        },
    })

    useEffect(() => {
        if (!isLoading) {
            setContent(data?.content ?? '')
            setIsInitialized(true)
        }
    }, [data, isLoading])

    const handleCancel = () => {
        if (data) {
            setContent(data.content ?? '')
        }
        setIsEditing(false)
    }

    const config = useMemo(
        () => ({
            height: 512,
            readonly: !isEditing,
            buttons: [
                'bold', 'italic', 'underline', 'strike', 'subscript', 'superscript', '|',
                'font', 'fontsize', 'paragraph', '|',
                'align', 'ul', 'ol', 'outdent', 'indent', '|',
                'table', 'hr', 'link', '|',
                'undo', 'redo',
            ],
            placeholder: 'Start typing...',
        }),
        [isEditing],
    )

    if (isLoading || !isInitialized) {
        return (
            <div className="flex flex-col justify-center items-center h-96 gap-4 text-muted-foreground">
                <Loader2 className="size-8 animate-spin" />
                <p>Loading Terms & Conditions...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-96">
                <p className="text-destructive font-medium">Error loading Terms & Conditions</p>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col gap-6 w-full mt-4">
            <div>
                <h3 className="text-xl font-semibold text-foreground">Terms & Conditions</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Manage the application's terms and conditions.</p>
            </div>
            <Separator />
            <div className="rounded-xl overflow-hidden border shadow-sm">
                <JoditEditor config={config} value={content} onBlur={(newContent) => setContent(newContent)} />
            </div>

            <div className="flex flex-col gap-4 mt-2">
                <p className="text-sm font-medium text-foreground">Last updated: June 8, 2026 by Dianne Plummer.</p>

                <div className="flex flex-col sm:flex-row gap-4 w-full">
                    {!isEditing ? (
                        <>
                            <Button
                                size="lg"
                                variant="secondary"
                                className="flex-1 rounded-full text-base h-12 bg-muted/50 hover:bg-muted shadow-none border"
                                onClick={() => setIsPreviewOpen(true)}
                            >
                                Preview
                            </Button>
                            <Button
                                size="lg"
                                variant="default"
                                className="flex-1 rounded-full text-base h-12"
                                onClick={() => setIsEditing(true)}
                            >
                                Edit
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                size="lg"
                                variant="outline"
                                className="flex-1 rounded-full text-base h-12"
                                onClick={handleCancel}
                                disabled={updateContent.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="lg"
                                variant="default"
                                disabled={updateContent.isPending}
                                onClick={() => updateContent.mutate()}
                                className="flex-1 rounded-full text-base h-12"
                            >
                                {updateContent.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent
                    showCloseButton={false}
                    className="sm:max-w-5xl w-[92vw] h-[85vh] overflow-hidden flex flex-col p-0 rounded-3xl border-none shadow-2xl bg-slate-900 text-white outline-none"
                >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/20 text-primary p-2 rounded-xl">
                                <SlidersHorizontal className="size-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold tracking-tight text-white">Terms & Conditions Preview</DialogTitle>
                                <p className="text-xs text-white/50">Draft Version (Live View)</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/20 border-none font-semibold px-3 py-1 rounded-full text-xs">
                                Ready to Publish
                            </Badge>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
                                onClick={() => setIsPreviewOpen(false)}
                            >
                                <X className="size-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 bg-slate-900/60 p-6 md:p-10 overflow-y-auto flex justify-center">
                        <div className="w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-100 p-8 md:p-16 min-h-[60vh] h-fit relative">
                            <div className="w-12 h-1 bg-primary rounded-full mx-auto mb-8" />
                            <div className="prose prose-slate lg:prose-base max-w-none leading-relaxed text-slate-800">
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html:
                                            content || '<p className="text-muted-foreground italic text-center">No content available.</p>',
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

