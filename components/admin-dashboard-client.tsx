'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { LocationPicker } from '@/components/location-picker'
import { uploadPropertyImages } from '@/lib/image-upload'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Eye, Plus, Edit } from 'lucide-react'
import { AllPropertiesTable } from './all-properties-table'
import { RealEstateCompanies } from './real-estate-companies'
import Link from 'next/link'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AdminDashboardClientProps {
  initialProperties: any[]
  initialUsers: any[]
  initialAgents: any[]
  initialCompanies?: any[]
  stats: {
    totalProperties: number
    publishedProperties: number
    totalUsers: number
    totalAgents: number
  }
  activeTab?: string
  onTabChange?: (tab: string) => void
  showAllProperties?: boolean
  showRealEstateCompanies?: boolean
}

export function AdminDashboardClient({
  initialProperties,
  initialUsers,
  initialAgents,
  initialCompanies = [],
  stats,
  activeTab: externalActiveTab,
  onTabChange,
  showAllProperties = false,
  showRealEstateCompanies = false,
}: AdminDashboardClientProps) {
  const router = useRouter()
  const [properties, setProperties] = useState(initialProperties)
  const [users, setUsers] = useState(initialUsers)
  const [agents, setAgents] = useState(initialAgents)
  const [createPropertyOpen, setCreatePropertyOpen] = useState(false)
  const [editPropertyOpen, setEditPropertyOpen] = useState(false)
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [internalActiveTab, setInternalActiveTab] = useState('properties')
  
  const activeTab = externalActiveTab ?? internalActiveTab
  const setActiveTab = onTabChange ?? setInternalActiveTab
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
    agent_id: '',
  })
  const [images, setImages] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])

  const deleteProperty = async (propertyId: string) => {
    const supabase = createClient()
    await supabase.from('properties').delete().eq('id', propertyId)
    setProperties(properties.filter(p => p.id !== propertyId))
  }

  const updatePropertyStatus = async (propertyId: string, status: string) => {
    const supabase = createClient()
    await supabase
      .from('properties')
      .update({ status })
      .eq('id', propertyId)

    setProperties(
      properties.map(p => p.id === propertyId ? { ...p, status } : p)
    )
  }

  const updateUserRole = async (userId: string, role: string) => {
    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)

    setUsers(
      users.map(u => u.id === userId ? { ...u, role } : u)
    )
  }

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      // Upload images
      let imageUrls: string[] = []
      if (images.length > 0 && formData.title) {
        const tempId = `temp-${Date.now()}`
        imageUrls = await uploadPropertyImages(images, tempId)
      }

      // Create property
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

      if (formData.agent_id) {
        propertyData.agent_id = formData.agent_id
      }

      const { data: property, error } = await supabase
        .from('properties')
        .insert(propertyData)
        .select()
        .single()

      if (error) {
        console.error('Error creating property:', error)
        alert('Error creating property: ' + error.message)
        setLoading(false)
      } else {
        // Refresh properties list
        const { data: newProperties } = await supabase
          .from('properties')
          .select('*')
          .order('created_at', { ascending: false })
        
        setProperties(newProperties || [])
        
        // Reset form
        resetForm()
        setCreatePropertyOpen(false)
        setLoading(false)
        
        // Redirect to property page
        router.push(`/properties/${property.id}`)
        router.refresh()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
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

  const handleEditProperty = (property: any) => {
    setEditingPropertyId(property.id)
    setFormData({
      title: property.title || '',
      description: property.description || '',
      property_type: property.property_type || 'apartment',
      listing_type: property.listing_type || 'buy',
      price: property.price?.toString() || '',
      bed: property.bed?.toString() || '',
      bath: property.bath?.toString() || '',
      area: property.area?.toString() || '',
      location: property.location || '',
      city: property.city || '',
      latitude: property.latitude?.toString() || '',
      longitude: property.longitude?.toString() || '',
      status: property.status || 'published',
      agent_id: property.agent_id || '',
    })
    setExistingImages(property.images || [])
    setImages([])
    setEditPropertyOpen(true)
  }

  const handleUpdateProperty = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPropertyId) return

    setLoading(true)

    try {
      const supabase = createClient()

      // Upload new images if any
      let imageUrls: string[] = [...existingImages]
      if (images.length > 0) {
        const uploadedUrls = await uploadPropertyImages(images, editingPropertyId)
        imageUrls = [...existingImages, ...uploadedUrls]
      }

      // Update property
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

      if (formData.agent_id) {
        propertyData.agent_id = formData.agent_id
      } else {
        propertyData.agent_id = null
      }

      const { error } = await supabase
        .from('properties')
        .update(propertyData)
        .eq('id', editingPropertyId)

      if (error) {
        console.error('Error updating property:', error)
        alert('Error updating property: ' + error.message)
        setLoading(false)
      } else {
        // Refresh properties list
        const { data: newProperties } = await supabase
          .from('properties')
          .select('*')
          .order('created_at', { ascending: false })
        
        setProperties(newProperties || [])
        
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
          agent_id: '',
        })
        setImages([])
        setExistingImages([])
        setEditingPropertyId(null)
        setEditPropertyOpen(false)
        setLoading(false)
        
        router.refresh()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const resetForm = () => {
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
      agent_id: '',
    })
    setImages([])
    setExistingImages([])
    setEditingPropertyId(null)
  }

  // Show All Properties table view if requested
  if (showAllProperties) {
    return (
      <AllPropertiesTable
        initialProperties={properties}
        initialAgents={agents}
        initialCompanies={initialCompanies || []}
        onCreateProperty={() => setCreatePropertyOpen(true)}
        onEditProperty={handleEditProperty}
      />
    )
  }

  // Show Real Estate Companies view if requested
  if (showRealEstateCompanies) {
    return (
      <RealEstateCompanies
        initialCompanies={initialCompanies}
        initialProperties={properties}
        onCompaniesUpdate={() => {
          // Refresh companies
          const supabase = createClient()
          supabase
            .from('real_estate_companies')
            .select('*')
            .order('created_at', { ascending: false })
            .then(({ data }) => {
              // This will be handled by parent refresh
            })
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Properties</CardDescription>
            <CardTitle className="text-3xl">{stats.totalProperties}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Published</CardDescription>
            <CardTitle className="text-3xl">{stats.publishedProperties}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl">{stats.totalUsers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Agents</CardDescription>
            <CardTitle className="text-3xl">{stats.totalAgents}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Properties</h2>
            <Dialog open={createPropertyOpen} onOpenChange={setCreatePropertyOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Property
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Property</DialogTitle>
                  <DialogDescription>
                    Add a new property listing with all required details
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateProperty} className="space-y-6 mt-4">
                  {/* Basic Information */}
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
                  </div>

                  {/* Location */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Location</h3>
                    <LocationPicker
                      onLocationSelect={handleLocationSelect}
                      initialLocation={
                        formData.latitude && formData.longitude
                          ? {
                              address: formData.location,
                              city: formData.city,
                              latitude: parseFloat(formData.latitude),
                              longitude: parseFloat(formData.longitude),
                            }
                          : undefined
                      }
                    />
                  </div>

                  {/* Images */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="images">Property Images</Label>
                      <Input
                        id="images"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || [])
                          setImages(files)
                        }}
                      />
                      {images.length > 0 && (
                        <p className="text-sm text-gray-600 mt-2">{images.length} image(s) selected</p>
                      )}
                    </div>
                  </div>

                  {/* Status & Agent */}
                  <div className="grid grid-cols-2 gap-4">
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
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="agent_id">Assign to Agent (Optional)</Label>
                      <Select
                        value={formData.agent_id || 'none'}
                        onValueChange={(value) => setFormData({ ...formData, agent_id: value === 'none' ? '' : value })}
                      >
                        <SelectTrigger id="agent_id">
                          <SelectValue placeholder="Select an agent" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {agents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.company_name || 'Agent ' + agent.id.slice(0, 8)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-4 justify-end pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreatePropertyOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Creating...' : 'Create Property'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Edit Property Dialog */}
            <Dialog open={editPropertyOpen} onOpenChange={(open) => {
              setEditPropertyOpen(open)
              if (!open) {
                resetForm()
              }
            }}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Property</DialogTitle>
                  <DialogDescription>
                    Update property listing details
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdateProperty} className="space-y-6 mt-4">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit_title">Title *</Label>
                      <Input
                        id="edit_title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        placeholder="e.g., Beautiful 2BR Apartment in Manhattan"
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit_description">Description</Label>
                      <Textarea
                        id="edit_description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        placeholder="Describe the property..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit_property_type">Property Type *</Label>
                        <Select
                          value={formData.property_type}
                          onValueChange={(value) => setFormData({ ...formData, property_type: value })}
                        >
                          <SelectTrigger id="edit_property_type">
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
                        <Label htmlFor="edit_listing_type">Listing Type *</Label>
                        <Select
                          value={formData.listing_type}
                          onValueChange={(value) => setFormData({ ...formData, listing_type: value })}
                        >
                          <SelectTrigger id="edit_listing_type">
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
                        <Label htmlFor="edit_price">Price *</Label>
                        <Input
                          id="edit_price"
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          required
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit_bed">Bedrooms</Label>
                        <Input
                          id="edit_bed"
                          type="number"
                          value={formData.bed}
                          onChange={(e) => setFormData({ ...formData, bed: e.target.value })}
                          min="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit_bath">Bathrooms</Label>
                        <Input
                          id="edit_bath"
                          type="number"
                          value={formData.bath}
                          onChange={(e) => setFormData({ ...formData, bath: e.target.value })}
                          min="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit_area">Area (sqft)</Label>
                        <Input
                          id="edit_area"
                          type="number"
                          value={formData.area}
                          onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Location</h3>
                    <LocationPicker
                      onLocationSelect={handleLocationSelect}
                      initialLocation={
                        formData.latitude && formData.longitude
                          ? {
                              address: formData.location,
                              city: formData.city,
                              latitude: parseFloat(formData.latitude),
                              longitude: parseFloat(formData.longitude),
                            }
                          : undefined
                      }
                    />
                  </div>

                  {/* Images */}
                  <div className="space-y-4">
                    {existingImages.length > 0 && (
                      <div>
                        <Label>Existing Images</Label>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          {existingImages.map((url, idx) => (
                            <div key={idx} className="relative aspect-video">
                              <img
                                src={url}
                                alt={`Property ${idx + 1}`}
                                className="w-full h-full object-cover rounded"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6"
                                onClick={() => {
                                  setExistingImages(existingImages.filter((_, i) => i !== idx))
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="edit_images">Add More Images</Label>
                      <Input
                        id="edit_images"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || [])
                          setImages(files)
                        }}
                      />
                      {images.length > 0 && (
                        <p className="text-sm text-gray-600 mt-2">{images.length} new image(s) selected</p>
                      )}
                    </div>
                  </div>

                  {/* Status & Agent */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit_status">Status *</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger id="edit_status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="sold">Sold</SelectItem>
                          <SelectItem value="rented">Rented</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="edit_agent_id">Assign to Agent (Optional)</Label>
                      <Select
                        value={formData.agent_id || 'none'}
                        onValueChange={(value) => setFormData({ ...formData, agent_id: value === 'none' ? '' : value })}
                      >
                        <SelectTrigger id="edit_agent_id">
                          <SelectValue placeholder="Select an agent" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {agents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.company_name || 'Agent ' + agent.id.slice(0, 8)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-4 justify-end pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditPropertyOpen(false)
                        resetForm()
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Updating...' : 'Update Property'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {properties.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-600">No properties found.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {properties.map((property) => (
                  <Card key={property.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold">{property.title}</h3>
                            <Badge variant={property.status === 'published' ? 'default' : 'secondary'}>
                              {property.status}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-2">{property.location}, {property.city}</p>
                          <p className="text-2xl font-bold text-primary">
                            ${property.price.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Link href={`/properties/${property.id}`}>
                            <Button variant="outline" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditProperty(property)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Select
                            value={property.status}
                            onValueChange={(value) => updatePropertyStatus(property.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                              <SelectItem value="sold">Sold</SelectItem>
                              <SelectItem value="rented">Rented</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Property?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this property? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteProperty(property.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{user.full_name || 'No name'}</h3>
                      <p className="text-gray-600">{user.email}</p>
                      <Badge className="mt-2">{user.role}</Badge>
                    </div>
                    <Select
                      value={user.role}
                      onValueChange={(value) => updateUserRole(user.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <div className="space-y-4">
            {agents.map((agent) => (
              <Card key={agent.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{agent.company_name || 'No company name'}</h3>
                      <p className="text-gray-600">{agent.bio || 'No bio'}</p>
                    </div>
                    <Link href={`/agents/${agent.id}`}>
                      <Button variant="outline">View Profile</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

