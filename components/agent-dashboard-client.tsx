'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { LocationPicker } from '@/components/location-picker'
import { uploadPropertyImages } from '@/lib/image-upload'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit, Eye, List, Grid, FileText, Eye as EyeIcon, EyeOff, TrendingUp, Layers, Trash2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface AgentDashboardClientProps {
  initialListings: any[]
  agentProfile: any
  agentId: string | null
  stats: {
    total: number
    published: number
    draft: number
    views: number
  }
  userId: string
  showMyProperties?: boolean
  showDashboard?: boolean
  showSettings?: boolean
  isRealEstateCompany?: boolean
}

export function AgentDashboardClient({
  initialListings,
  agentProfile,
  agentId: initialAgentId,
  stats,
  userId,
  showMyProperties = false,
  showDashboard = true,
  showSettings = false,
  isRealEstateCompany = false,
}: AgentDashboardClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [listings, setListings] = useState(initialListings)
  const [agentId, setAgentId] = useState(initialAgentId)
  const [createListingOpen, setCreateListingOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_type: 'apartment',
    listing_type: 'buy',
    price: '',
    bed: '',
    bath: '',
    area: '',
    location: '',
    city: '',
    latitude: '',
    longitude: '',
    status: 'published',
  })
  const [images, setImages] = useState<File[]>([])
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [settingsData, setSettingsData] = useState({
    company_name: agentProfile?.company_name || '',
    bio: agentProfile?.bio || '',
    phone: agentProfile?.phone || '',
    website: agentProfile?.website || '',
    logo_url: agentProfile?.logo_url || '',
  })

  useEffect(() => {
    // Refresh listings when component mounts or when create dialog closes
    const refreshListings = async () => {
      if (!agentId) return
      const supabase = createClient()
      const { data: newListings } = await supabase
        .from('properties')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
      
      if (newListings) {
        setListings(newListings)
      }
    }

    if (!createListingOpen) {
      refreshListings()
    }
  }, [agentId, createListingOpen])

  const deleteListing = async (listingId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('properties').delete().eq('id', listingId)
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete listing. Please try again.",
      })
    } else {
      setListings(listings.filter(l => l.id !== listingId))
      toast({
        variant: "success",
        title: "Success",
        description: "Listing deleted successfully.",
      })
      router.refresh()
    }
  }

  const updateStatus = async (listingId: string, status: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('properties')
      .update({ status })
      .eq('id', listingId)

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update listing status. Please try again.",
      })
    } else {
      setListings(
        listings.map(l => l.id === listingId ? { ...l, status } : l)
      )
      const statusText = status === 'published' ? 'published' : 'unpublished'
      toast({
        variant: "success",
        title: "Success",
        description: `Listing ${statusText} successfully.`,
      })
      router.refresh()
    }
  }

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault()
    
    let currentAgentId = agentId

    // If no agentId, try to create or get agent profile
    if (!currentAgentId) {
      setLoading(true)
      const supabase = createClient()
      
      // Check if user is a real estate company user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to create a listing.",
        })
        setLoading(false)
        return
      }

      // Check if agent already exists
      let { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle() // Use maybeSingle() to avoid errors when no agent exists

      // If no agent (and no error), check if user is a real estate company
      if (!agent && !agentError) {
        // First check if we already know this is a real estate company (from props)
        if (isRealEstateCompany) {
          // Allow property creation without agent_id for real estate companies
          console.log('Real estate company detected (from props), allowing property creation without agent_id')
          currentAgentId = null
        } else {
          // Check database for real estate company
          const { data: company, error: companyError } = await supabase
            .from('real_estate_companies')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle() // Use maybeSingle() to avoid errors when no company exists

          if (company && !companyError) {
            // For real estate companies, allow property creation without agent profile
            // Try to create agent entry, but if it fails, continue without it
            const { data: newAgent, error } = await supabase
              .from('agents')
              .insert({
                user_id: user.id,
                company_name: company.company_name,
                phone: company.phone_number || null,
              })
              .select('id')
              .single()

            if (!error && newAgent) {
              agent = newAgent
              currentAgentId = newAgent.id
              setAgentId(newAgent.id) // Update state
              // Refresh the page to update agentId
              router.refresh()
            } else {
              // If agent creation fails or doesn't exist, allow property creation without agent_id
              // This is allowed for real estate companies
              console.log('Agent profile not created, allowing property creation without agent_id for real estate company')
              currentAgentId = null // Explicitly set to null - properties can be created without agent_id
            }
          } else {
            // Not a real estate company or error occurred
            console.log('Company check result:', { company, companyError, isRealEstateCompany })
            if (companyError) {
              console.error('Error checking for real estate company:', companyError)
            }
            toast({
              variant: "destructive",
              title: "Profile Required",
              description: "Agent profile not found. Please set up your profile first in Settings.",
            })
            setLoading(false)
            return
          }
        }
      } else if (agent && !agentError) {
        currentAgentId = agent.id
      } else {
        // Error occurred while checking for agent
        console.error('Error checking for agent:', agentError)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error checking agent profile. Please try again.",
        })
        setLoading(false)
        return
      }
    }

    // Don't block property creation if currentAgentId is null for real estate companies
    // Properties can be created with agent_id = null

    // Only set loading if we haven't already set it above
    if (!loading) {
      setLoading(true)
    }

    try {
      const supabase = createClient()

      // Upload images
      let imageUrls: string[] = []
      if (images.length > 0 && formData.title) {
        const tempId = `temp-${Date.now()}`
        imageUrls = await uploadPropertyImages(images, tempId)
      }

      // Create property - agent_id can be null for real estate companies without agent profile
      const propertyData: any = {
        title: formData.title,
        description: formData.description || null,
        property_type: formData.property_type,
        listing_type: formData.listing_type,
        price: parseFloat(formData.price),
        bed: formData.bed ? parseInt(formData.bed) : null,
        bath: formData.bath ? parseInt(formData.bath) : null,
        area: formData.area ? parseFloat(formData.area) : null,
        location: formData.location,
        city: formData.city,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        images: imageUrls.length > 0 ? imageUrls : null,
        status: formData.status,
      }

      // Only set agent_id if it exists (can be null for real estate companies without agent profile)
      if (currentAgentId) {
        propertyData.agent_id = currentAgentId
      }

      const { data: property, error } = await supabase
        .from('properties')
        .insert(propertyData)
        .select()
        .single()

      if (error) {
        console.error('Error creating property:', error)
        toast({
          variant: "destructive",
          title: "Error Creating Property",
          description: error.message || "Failed to create property. Please try again.",
        })
        setLoading(false)
      } else {
        // Refresh listings
        const { data: newListings } = await supabase
          .from('properties')
          .select('*')
          .eq('agent_id', currentAgentId)
          .order('created_at', { ascending: false })
        
        setListings(newListings || [])
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          property_type: 'apartment',
          listing_type: 'buy',
          price: '',
          bed: '',
          bath: '',
          area: '',
          location: '',
          city: '',
          latitude: '',
          longitude: '',
          status: 'published',
        })
        setImages([])
        setCreateListingOpen(false)
        setLoading(false)
        
        router.refresh()
        toast({
          variant: "success",
          title: "Success",
          description: "Listing created successfully!",
        })
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred. Please try again.",
      })
      setLoading(false)
    }
  }

  const handleLocationSelect = (location: {
    address: string
    city: string
    latitude: number
    longitude: number
  }) => {
    setFormData({
      ...formData,
      location: location.address,
      city: location.city,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
    })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files))
    }
  }

  // Update settings data when agentProfile changes
  useEffect(() => {
    if (agentProfile) {
      setSettingsData({
        company_name: agentProfile.company_name || '',
        bio: agentProfile.bio || '',
        phone: agentProfile.phone || '',
        website: agentProfile.website || '',
        logo_url: agentProfile.logo_url || '',
      })
    }
  }, [agentProfile])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0])
    }
  }

  const uploadLogo = async (logoFile: File, userId: string): Promise<string | null> => {
    const supabase = createClient()
    const fileExt = logoFile.name.split('.').pop()
    const fileName = `${userId}/logo-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `property-images/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(filePath, logoFile, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading logo:', uploadError)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('property-images')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSettingsLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to save settings.",
        })
        setSettingsLoading(false)
        return
      }

      let logoUrl = settingsData.logo_url

      // Upload logo if a new one was selected
      if (logoFile) {
        const uploadedLogoUrl = await uploadLogo(logoFile, user.id)
        if (uploadedLogoUrl) {
          logoUrl = uploadedLogoUrl
        }
      }

      // Get or create agent profile
      let currentAgentId = agentId

      if (!currentAgentId) {
        // Check if agent exists
        const { data: existingAgent } = await supabase
          .from('agents')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (existingAgent) {
          currentAgentId = existingAgent.id
        } else {
          // Create new agent entry
          const { data: company } = await supabase
            .from('real_estate_companies')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle()

          const { data: newAgent, error: agentError } = await supabase
            .from('agents')
            .insert({
              user_id: user.id,
              company_name: settingsData.company_name || company?.company_name || '',
              phone: settingsData.phone || company?.phone_number || null,
              bio: settingsData.bio || null,
              website: settingsData.website || null,
              logo_url: logoUrl || null,
            })
            .select('id')
            .single()

          if (agentError) {
            console.error('Error creating agent:', agentError)
            toast({
              variant: "destructive",
              title: "Error",
              description: "Error creating agent profile: " + (agentError.message || 'Unknown error'),
            })
            setSettingsLoading(false)
            return
          }

          if (newAgent) {
            currentAgentId = newAgent.id
            setAgentId(newAgent.id)
          }
        }
      }

      // Update agent profile
      if (currentAgentId) {
        const { error: updateError } = await supabase
          .from('agents')
          .update({
            company_name: settingsData.company_name,
            bio: settingsData.bio || null,
            phone: settingsData.phone || null,
            website: settingsData.website || null,
            logo_url: logoUrl || null,
          })
          .eq('id', currentAgentId)

        if (updateError) {
          console.error('Error updating agent profile:', updateError)
          toast({
            variant: "destructive",
            title: "Error",
            description: "Error updating profile: " + (updateError.message || 'Unknown error'),
          })
          setSettingsLoading(false)
          return
        }

        toast({
          variant: "success",
          title: "Success",
          description: "Settings saved successfully!",
        })
        setLogoFile(null)
        router.refresh()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not create or find agent profile. Please try again.",
        })
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred. Please try again.",
      })
    } finally {
      setSettingsLoading(false)
    }
  }

  // If agent profile doesn't exist, try to create it automatically if user is a real estate company
  useEffect(() => {
    const checkAndCreateAgentProfile = async () => {
      if (!agentProfile && agentId === null) {
        const supabase = createClient()
        
        // Check if user is a real estate company user
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: company, error: companyError } = await supabase
            .from('real_estate_companies')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle() // Use maybeSingle() to avoid errors when no company exists

          // If user is a real estate company, create agent entry automatically
          if (company && !companyError) {
            const { data: newAgent, error } = await supabase
              .from('agents')
              .insert({
                user_id: user.id,
                company_name: company.company_name,
                phone: company.phone_number || null,
              })
              .select()
              .single()

            if (!error && newAgent) {
              setAgentId(newAgent.id) // Update state immediately
              // Refresh the page to load the new agent profile
              router.refresh()
            }
          }
        }
      }
    }

    checkAndCreateAgentProfile()
  }, [agentProfile, agentId, router])

  // Always show the dashboard, even if agent profile doesn't exist yet
  // The stats will just show 0 values if there are no listings

  // Calculate stats
  const activeListings = listings.filter(l => l.status === 'published').length
  const totalValue = listings.reduce((sum, l) => sum + (parseFloat(l.price) || 0), 0)
  const avgPrice = listings.length > 0 ? totalValue / listings.length : 0

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getPropertyImage = (listing: any) => {
    if (listing.images && listing.images.length > 0 && listing.images[0]) {
      return listing.images[0]
    }
    return '/placeholder-property.jpg'
  }

  // If showing Settings view, show settings form
  if (showSettings) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Set up your agent profile and company information.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Agent Profile</CardTitle>
            <CardDescription>
              Configure your company information and profile details. These settings are required to add properties.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={settingsData.company_name}
                    onChange={(e) => setSettingsData({ ...settingsData, company_name: e.target.value })}
                    required
                    placeholder="Enter your company name"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={settingsData.phone}
                    onChange={(e) => setSettingsData({ ...settingsData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={settingsData.website}
                    onChange={(e) => setSettingsData({ ...settingsData, website: e.target.value })}
                    placeholder="https://www.example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Bio / Description</Label>
                  <Textarea
                    id="bio"
                    value={settingsData.bio}
                    onChange={(e) => setSettingsData({ ...settingsData, bio: e.target.value })}
                    rows={4}
                    placeholder="Tell us about your company..."
                  />
                </div>

                <div>
                  <Label htmlFor="logo">Company Logo</Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="mt-2"
                  />
                  {settingsData.logo_url && !logoFile && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Current Logo:</p>
                      <img
                        src={settingsData.logo_url}
                        alt="Company logo"
                        className="w-32 h-32 object-cover rounded-md border border-gray-200"
                      />
                    </div>
                  )}
                  {logoFile && (
                    <p className="text-sm text-gray-600 mt-2">New logo selected: {logoFile.name}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.refresh()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={settingsLoading}>
                  {settingsLoading ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If showing My Properties view, only show the listings table
  if (showMyProperties) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Properties</h1>
            <p className="text-gray-600">Manage and track your property listings.</p>
          </div>
          <Dialog open={createListingOpen} onOpenChange={setCreateListingOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add New Listing
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Listing</DialogTitle>
                <DialogDescription>
                  Add a new property listing with all required details
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateListing} className="space-y-6 mt-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      placeholder="e.g., Beautiful 2BR Apartment in Manhattan"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      placeholder="Describe the property..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="property_type">Property Type *</Label>
                      <Select
                        value={formData.property_type}
                        onValueChange={(value) => setFormData({ ...formData, property_type: value })}
                      >
                        <SelectTrigger id="property_type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="villa">Villa</SelectItem>
                          <SelectItem value="townhouse">Townhouse</SelectItem>
                          <SelectItem value="land">Land</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="listing_type">Listing Type *</Label>
                      <Select
                        value={formData.listing_type}
                        onValueChange={(value) => setFormData({ ...formData, listing_type: value })}
                      >
                        <SelectTrigger id="listing_type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buy">For Sale</SelectItem>
                          <SelectItem value="rent">For Rent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="price">Price *</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bed">Bedrooms</Label>
                      <Input
                        id="bed"
                        type="number"
                        value={formData.bed}
                        onChange={(e) => setFormData({ ...formData, bed: e.target.value })}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bath">Bathrooms</Label>
                      <Input
                        id="bath"
                        type="number"
                        value={formData.bath}
                        onChange={(e) => setFormData({ ...formData, bath: e.target.value })}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="area">Area (sqft)</Label>
                      <Input
                        id="area"
                        type="number"
                        value={formData.area}
                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <LocationPicker onLocationSelect={handleLocationSelect} />
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                      placeholder="Enter property address"
                      className="mt-2"
                    />
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                      placeholder="Enter city"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="images">Images</Label>
                    <Input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="mt-2"
                    />
                    {images.length > 0 && (
                      <p className="text-sm text-gray-600 mt-2">{images.length} image(s) selected</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 justify-end pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateListingOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Listing'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* My Listings Table */}
        <Card>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Image</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Title</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Listing</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Price</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Beds/Baths</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">City</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-600">
                        <p>You don't have any listings yet.</p>
                        <Button
                          className="mt-4"
                          onClick={() => setCreateListingOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First Listing
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    listings.map((listing) => (
                      <tr key={listing.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                            {listing.images && listing.images[0] ? (
                              <img
                                src={listing.images[0]}
                                alt={listing.title || 'Property'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                                No Image
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">{listing.title || 'Untitled'}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-700 capitalize">
                            {listing.property_type || '-'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-700 capitalize">
                            {listing.listing_type === 'buy' ? 'Buy' : listing.listing_type === 'rent' ? 'Rent' : listing.listing_type || '-'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">
                            {listing.price ? formatPrice(Number(listing.price)) : '-'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-700">
                            {listing.bed || '-'}/{listing.bath || '-'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-700">{listing.city || '-'}</div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge 
                            className={listing.status === 'published' 
                              ? 'bg-blue-600 text-white hover:bg-blue-600' 
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-200'}
                          >
                            {listing.status === 'published' ? 'active' : listing.status || 'draft'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/properties/${listing.id}`)}
                              className="h-8 w-8"
                              title="View"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => updateStatus(listing.id, listing.status === 'published' ? 'draft' : 'published')}
                              className="h-8 w-8"
                              title={listing.status === 'published' ? 'Unpublish' : 'Publish'}
                            >
                              {listing.status === 'published' ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <EyeIcon className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteListing(listing.id)}
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 relative">
            <FileText className="absolute top-4 right-4 h-5 w-5 text-gray-400" />
            <CardDescription>Total Listings</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{activeListings} active</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 relative">
            <EyeIcon className="absolute top-4 right-4 h-5 w-5 text-gray-400" />
            <CardDescription>Active Listings</CardDescription>
            <CardTitle className="text-3xl">{activeListings}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Currently visible</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 relative">
            <TrendingUp className="absolute top-4 right-4 h-5 w-5 text-gray-400" />
            <CardDescription>Total Value</CardDescription>
            <CardTitle className="text-3xl">{formatPrice(totalValue)}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Portfolio value</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 relative">
            <Layers className="absolute top-4 right-4 h-5 w-5 text-gray-400" />
            <CardDescription>Avg. Price</CardDescription>
            <CardTitle className="text-3xl">{formatPrice(avgPrice)}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Average listing</p>
          </CardHeader>
        </Card>
      </div>

      {/* My Listings Section */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">My Listings</h2>
              <p className="text-sm text-gray-600">Manage and track your property listings.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" title="List View">
                <List className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" title="Grid View">
                <Grid className="h-5 w-5" />
              </Button>
              <Dialog open={createListingOpen} onOpenChange={setCreateListingOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Listing
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Listing</DialogTitle>
                    <DialogDescription>
                      Add a new property listing with all required details
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateListing} className="space-y-6 mt-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          required
                          placeholder="e.g., Beautiful 2BR Apartment in Manhattan"
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={4}
                          placeholder="Describe the property..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="property_type">Property Type *</Label>
                          <Select
                            value={formData.property_type}
                            onValueChange={(value) => setFormData({ ...formData, property_type: value })}
                          >
                            <SelectTrigger id="property_type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="apartment">Apartment</SelectItem>
                              <SelectItem value="villa">Villa</SelectItem>
                              <SelectItem value="townhouse">Townhouse</SelectItem>
                              <SelectItem value="land">Land</SelectItem>
                              <SelectItem value="commercial">Commercial</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="listing_type">Listing Type *</Label>
                          <Select
                            value={formData.listing_type}
                            onValueChange={(value) => setFormData({ ...formData, listing_type: value })}
                          >
                            <SelectTrigger id="listing_type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="buy">For Sale</SelectItem>
                              <SelectItem value="rent">For Rent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="price">Price *</Label>
                          <Input
                            id="price"
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            required
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="bed">Bedrooms</Label>
                          <Input
                            id="bed"
                            type="number"
                            value={formData.bed}
                            onChange={(e) => setFormData({ ...formData, bed: e.target.value })}
                            min="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="bath">Bathrooms</Label>
                          <Input
                            id="bath"
                            type="number"
                            value={formData.bath}
                            onChange={(e) => setFormData({ ...formData, bath: e.target.value })}
                            min="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="area">Area (sqft)</Label>
                          <Input
                            id="area"
                            type="number"
                            value={formData.area}
                            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="location">Location *</Label>
                        <LocationPicker onLocationSelect={handleLocationSelect} />
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          required
                          placeholder="Enter property address"
                          className="mt-2"
                        />
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          required
                          placeholder="Enter city"
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="status">Status *</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => setFormData({ ...formData, status: value })}
                        >
                          <SelectTrigger id="status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="images">Images</Label>
                        <Input
                          id="images"
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageChange}
                          className="mt-2"
                        />
                        {images.length > 0 && (
                          <p className="text-sm text-gray-600 mt-2">{images.length} image(s) selected</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-4 justify-end pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCreateListingOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Listing'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Table */}
          {listings.length === 0 ? (
            <div className="py-12 text-center text-gray-600">
              <p>You don't have any listings yet.</p>
              <Button
                className="mt-4"
                onClick={() => setCreateListingOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Listing
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Image</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Title</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Listing</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Price</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Beds/Baths</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">City</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((listing) => (
                    <tr key={listing.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                          {listing.images && listing.images[0] ? (
                            <img
                              src={listing.images[0]}
                              alt={listing.title || 'Property'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                              No Image
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">{listing.title || 'Untitled'}</div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="secondary" className="capitalize">
                          {listing.property_type || '-'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="secondary" className="capitalize">
                          {listing.listing_type === 'buy' ? 'Buy' : listing.listing_type === 'rent' ? 'Rent' : listing.listing_type || '-'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">
                          {listing.price ? formatPrice(Number(listing.price)) : '-'}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-700">
                          {listing.bed || '-'}/{listing.bath || '-'}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-700">{listing.city || listing.location || '-'}</div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge 
                          className={listing.status === 'published' 
                            ? 'bg-blue-600 text-white hover:bg-blue-600' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-200'}
                        >
                          {listing.status === 'published' ? 'active' : listing.status || 'draft'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/properties/${listing.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/sell?edit=${listing.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
