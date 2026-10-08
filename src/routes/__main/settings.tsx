import { useAppForm } from '@/components/shared/forms/form-context'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/page-header'
import { Separator } from '@/components/ui/separator'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { request } from '@/api/base'
import { SlidersHorizontal, User, ShieldCheck, ArrowLeft, FileText, FileSignature, Info, Mail, Loader2, X } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import * as z from 'zod'
import JoditEditor from 'jodit-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { appSettingsApi, staticContentApi } from '@/api/settings'
import type { AppSetting, UpdateAppSetting } from '@/api/settings'

export const Route = createFileRoute('/__main/settings')({
    component: RouteComponent,
})

const TABS = [
    { id: 'general', label: 'General', icon: SlidersHorizontal },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'privacy-policy', label: 'Privacy Policy', icon: FileText },
    { id: 'terms-and-conditions', label: 'Terms & Conditions', icon: FileSignature },
    { id: 'about-us', label: 'About Us', icon: Info },
    { id: 'contact-info', label: 'Contact Info', icon: Mail },
] as const

type TabId = (typeof TABS)[number]['id']

const emptyToUndefined = (v: unknown) => (v === '' ? undefined : v)
const optionalHttps = z.preprocess(
    emptyToUndefined,
    z.string().regex(/^https:\/\/\S+$/, 'Must be an absolute https URL').optional(),
)

const generalSchema = z.object({
    logoUrl: z.string(),
    supportEmail: z.preprocess(emptyToUndefined, z.email('Enter a valid email address').optional()),
    supportPhone: z.string(),
    websiteUrl: optionalHttps,
    companyName: z.string(),
    address: z.string(),
    iosAppUrl: optionalHttps,
    androidAppUrl: optionalHttps,
    instagramUrl: optionalHttps,
    twitterUrl: optionalHttps,
    youtubeUrl: optionalHttps,
})

// ─── Schemas ────────────────────────────────────────────────────────────────────

const profileSchema = z.object({
    image: z.string(),
    name: z.string().min(2, 'Enter your full name'),
    email: z.email('Enter a valid email address'),
})

// Backend enforces MinLength(8) on newPassword (UpdateMyPasswordDto).
const securitySchema = z
    .object({
        currentPassword: z.string().min(1, 'Enter your current password'),
        newPassword: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string().min(1, 'Re-enter your new password'),
    })
    .refine((v) => v.newPassword === v.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
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
                        const Icon = tab.icon
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
                    {activeTab === 'privacy-policy' && (
                        <StaticPageTab slug="privacy-policy" title="Privacy Policy" description="Manage the application's privacy policy." />
                    )}
                    {activeTab === 'terms-and-conditions' && (
                        <StaticPageTab slug="terms-and-conditions" title="Terms & Conditions" description="Manage the application's terms and conditions." />
                    )}
                    {activeTab === 'about-us' && (
                        <StaticPageTab slug="about-us" title="About Us" description="Manage the application's about us page." />
                    )}
                    {activeTab === 'contact-info' && (
                        <StaticPageTab slug="contact-info" title="Contact Info" description="Manage the application's contact information page." />
                    )}
                </div>
            </div>
        </>
    )
}

// ─── General Tab ────────────────────────────────────────────────────────────────

function GeneralTab() {
    const queryClient = useQueryClient()
    const { data, isLoading } = useQuery({
        queryKey: ['app-settings'],
        queryFn: appSettingsApi.get,
    })

    const saveSettings = useMutation({
        mutationFn: (data: UpdateAppSetting) => appSettingsApi.update(data),
        onSuccess: () => {
            toast.success('Settings saved successfully')
            queryClient.invalidateQueries({ queryKey: ['app-settings'] })
        },
        onError: (error) => toast.error(error.message),
    })

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-96 gap-4 text-muted-foreground">
                <Loader2 className="size-8 animate-spin" />
                <p>Loading settings...</p>
            </div>
        )
    }

    return (
        <GeneralForm
            key={data?.updatedAt ?? 'initial'}
            initial={data}
            onSave={(patch) => saveSettings.mutateAsync(patch)}
        />
    )
}

// General tab — everything here is public: the website footer/header and the
// mobile app read it via GET /settings/public/app.
function GeneralForm({ initial, onSave }: { initial?: AppSetting; onSave: (data: UpdateAppSetting) => Promise<unknown> }) {
    const form = useAppForm({
        defaultValues: {
            logoUrl: initial?.logoUrl ?? '',
            supportEmail: initial?.supportEmail ?? '',
            supportPhone: initial?.supportPhone ?? '',
            websiteUrl: initial?.websiteUrl ?? '',
            companyName: initial?.companyName ?? '',
            address: initial?.address ?? '',
            iosAppUrl: initial?.iosAppUrl ?? '',
            androidAppUrl: initial?.androidAppUrl ?? '',
            instagramUrl: initial?.instagramUrl ?? '',
            twitterUrl: initial?.twitterUrl ?? '',
            youtubeUrl: initial?.youtubeUrl ?? '',
        },
        validators: { onChange: generalSchema },
        onSubmit: async ({ value }) => {
            // Empty inputs clear the column server-side.
            const nullIfEmpty = (v: string) => (v.trim() === '' ? null : v.trim())
            await onSave({
                logoUrl: value.logoUrl || null,
                supportEmail: value.supportEmail ? value.supportEmail.trim().toLowerCase() : null,
                supportPhone: nullIfEmpty(value.supportPhone),
                websiteUrl: nullIfEmpty(value.websiteUrl),
                companyName: nullIfEmpty(value.companyName),
                address: nullIfEmpty(value.address),
                iosAppUrl: nullIfEmpty(value.iosAppUrl),
                androidAppUrl: nullIfEmpty(value.androidAppUrl),
                instagramUrl: nullIfEmpty(value.instagramUrl),
                twitterUrl: nullIfEmpty(value.twitterUrl),
                youtubeUrl: nullIfEmpty(value.youtubeUrl),
            })
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
                <p className="text-sm text-muted-foreground mt-0.5">
                    Brand, contact details, store links and socials. These are public — the website and the mobile app read them live.
                </p>
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-5 max-w-2xl">
                <form.AppField name="logoUrl">{(field) => <field.FormImage label="App logo" folder="branding" />}</form.AppField>
            </div>

            <Separator />
            <p className="text-sm font-semibold text-foreground">Contact information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl">
                <form.AppField name="supportEmail">
                    {(field) => <field.FormInput type="email" label="Support email" placeholder="support@mercydaily.com" />}
                </form.AppField>
                <form.AppField name="supportPhone">
                    {(field) => <field.FormInput label="Support phone" placeholder="+1 (555) 123-4567" />}
                </form.AppField>
                <form.AppField name="websiteUrl">
                    {(field) => <field.FormInput label="Website URL" placeholder="https://mercydaily.com" />}
                </form.AppField>
                <form.AppField name="companyName">
                    {(field) => <field.FormInput label="Company name" placeholder="Mercy Daily Limited" />}
                </form.AppField>
                <form.AppField name="address">
                    {(field) => <field.FormInput label="Address" placeholder="Street, City, Country" />}
                </form.AppField>
            </div>

            <Separator />
            <p className="text-sm font-semibold text-foreground">App & mobile links</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl">
                <form.AppField name="iosAppUrl">
                    {(field) => <field.FormInput label="iOS App Store URL" placeholder="https://apps.apple.com/..." />}
                </form.AppField>
                <form.AppField name="androidAppUrl">
                    {(field) => <field.FormInput label="Android / Play Store URL" placeholder="https://play.google.com/..." />}
                </form.AppField>
            </div>

            <Separator />
            <p className="text-sm font-semibold text-foreground">Social links</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl">
                <form.AppField name="instagramUrl">
                    {(field) => <field.FormInput label="Instagram URL" placeholder="https://instagram.com/..." />}
                </form.AppField>
                <form.AppField name="twitterUrl">
                    {(field) => <field.FormInput label="X (Twitter) URL" placeholder="https://x.com/..." />}
                </form.AppField>
                <form.AppField name="youtubeUrl">
                    {(field) => <field.FormInput label="YouTube URL" placeholder="https://youtube.com/..." />}
                </form.AppField>
            </div>

            <div className="mt-2">
                <form.AppForm>
                    <Button type="submit" variant="default" disabled={form.state.isSubmitting} className="w-full sm:w-62.5">
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
    const router = useRouter()

    // Persists via PATCH /profile/me (self-service account endpoint).
    // Sending `email` when it changed drops isEmailVerified server-side and
    // re-issues a verification OTP to the new address.
    const updateUser = useMutation({
        mutationFn: async (data: { name?: string; email?: string; avatarUrl?: string | null }) => {
            return request('/profile/me', {
                method: 'PATCH',
                body: JSON.stringify(data),
            })
        },
        onSuccess: (updated, variables) => {
            // Keep the sidebar/header in sync with the saved profile.
            const next = {
                id: (updated as any).id,
                name: (updated as any).name,
                email: (updated as any).email,
                role: (updated as any).role,
                image: (updated as any).avatarUrl ?? '',
            }
            localStorage.setItem('auth_user', JSON.stringify(next))
            if (variables.email && variables.email !== user.email) {
                toast.success('Profile updated. A verification code was sent to your new email address.')
            } else {
                toast.success('Profile updated successfully')
            }
            // Re-run the parent route's beforeLoad so the header and sidebar
            // re-read auth_user and pick up the new name/avatar.
            router.invalidate()
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
                // Only send the email when it actually changed — avoids an
                // unnecessary re-verification cycle on name/avatar-only saves.
                ...(value.email !== user.email ? { email: value.email } : {}),
                // null clears the avatar (empty string would fail validation)
                avatarUrl: value.image || null,
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

            {/* Avatar Upload — FormAvatar already renders its own hover overlay. */}
            <div className="flex justify-center my-4">
                <form.AppField name="image">{(field) => <field.FormAvatar folder="avatars" />}</form.AppField>
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
                            <field.FormInput type="email" label="Email Address" placeholder="Enter your email" />
                        </div>
                    )}
                </form.AppField>
            </div>
            <p className="text-xs text-muted-foreground max-w-3xl">
                Changing your email address will mark it as unverified and send a verification code to the new address.
            </p>

            {/* Save Button */}
            <div className="mt-4">
                <form.AppForm>
                    <Button type="submit" variant="default" disabled={form.state.isSubmitting} className="w-full sm:w-87.5">
                        Save
                    </Button>
                </form.AppForm>
            </div>
        </form>
    )
}

// ─── Security Tab ───────────────────────────────────────────────────────────────

function SecurityTab() {
    const navigate = useNavigate()

    // Changes the password via PUT /profile/me/password. The backend bumps
    // tokenVersion on success, invalidating every outstanding session —
    // including this one — so the user is signed back in.
    const changePassword = useMutation({
        mutationFn: async (data: { oldPassword: string; newPassword: string; confirmPassword: string }) => {
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
                            <field.FormInput type="password" label={'Current Password'} placeholder={'Enter your current password'} />
                        )}
                    </form.AppField>

                    <form.AppField name="newPassword">
                        {(field) => <field.FormInput type="password" label={'New Password'} placeholder={'Enter a new password (min 8 characters)'} />}
                    </form.AppField>

                    <form.AppField name="confirmPassword">
                        {(field) => (
                            <field.FormInput type="password" label={'Confirm Password'} placeholder={'Re-enter your new password'} />
                        )}
                    </form.AppField>
                </div>
            </div>
            <div className="mt-4">
                <form.AppForm>
                    <Button type="submit" variant="default" disabled={form.state.isSubmitting} className="w-full sm:w-62.5">
                        Save Changes
                    </Button>
                </form.AppForm>
            </div>
        </form>
    )
}

// ─── Static pages (privacy policy / terms / about / contact) ───────────────────
// Single shared editor — previously PrivacyPolicyTab and TermsAndConditionsTab
// were copy-pasted duplicates. All four pages share the same backend shape
// (GET/PUT /settings/static/:slug, empty draft on first access).

function StaticPageTab({ slug, title, description }: { slug: string; title: string; description: string }) {
    const queryClient = useQueryClient()
    const [content, setContent] = useState<string>('')
    const [isInitialized, setIsInitialized] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)

    const { data, isLoading, error } = useQuery({
        queryKey: ['static-content', slug],
        queryFn: () => staticContentApi.get(slug),
    })

    const updateContent = useMutation({
        mutationFn: () =>
            staticContentApi.update(slug, {
                title: data?.title || title,
                content: content,
            }),

        onSuccess: () => {
            toast.success(`${title} updated successfully`)
            setIsEditing(false)

            queryClient.invalidateQueries({
                queryKey: ['static-content', slug],
            })
        },

        onError: () => {
            toast.error(`Failed to update ${title}`)
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
                'bold',
                'italic',
                'underline',
                'strike',
                'subscript',
                'superscript',
                '|',
                'font',
                'fontsize',
                'paragraph',
                '|',
                'align',
                'ul',
                'ol',
                'outdent',
                'indent',
                '|',
                'table',
                'hr',
                'link',
                '|',
                'undo',
                'redo',
            ],
            placeholder: 'Start typing...',
        }),
        [isEditing],
    )

    if (isLoading || !isInitialized) {
        return (
            <div className="flex flex-col justify-center items-center h-96 gap-4 text-muted-foreground">
                <Loader2 className="size-8 animate-spin" />
                <p>Loading {title}...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-96">
                <p className="text-destructive font-medium">Error loading {title}</p>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col gap-6 w-full mt-4">
            <div>
                <h3 className="text-xl font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            </div>
            <Separator />
            <div className="rounded-xl overflow-hidden border shadow-sm">
                <JoditEditor config={config} value={content} onBlur={(newContent) => setContent(newContent)} />
            </div>

            <div className="flex flex-col gap-4 mt-2">
                <p className="text-sm font-medium text-foreground">
                    {data?.updatedAt
                        ? `Last updated: ${new Date(data.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}${data.updatedBy ? ` by ${data.updatedBy}` : ''}.`
                        : 'Not published yet.'}
                </p>

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
                                <DialogTitle className="text-lg font-bold tracking-tight text-white">
                                    {title} Preview
                                </DialogTitle>
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
