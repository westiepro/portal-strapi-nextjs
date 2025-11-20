'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { LocationPicker } from '@/components/location-picker'
import { uploadPropertyImages } from '@/lib/image-upload'
import { createClient } from '@/lib/supabase/client'
import { Label } from '@/components/ui/label'

interface SellPageClientProps {
  userId: string
  role: string
}

export function SellPageClient({ userId, role }: SellPageClientProps) {
  const router = useRouter()
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
    status: 'draft',
  })
  const [images, setImages] = useState<File[]>([])
  const [agentId, setAgentId] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      // Get agent ID
      if (role === 'agent') {
        const { data: agent } = await supabase
          .from('agents')
          .select('id')
          .eq('user_id', userId)
          .single()
        
        if (!agent) {
          alert('Please complete your agent profile first.')
          router.push('/agent')
          return
        }
        setAgentId(agent.id)
      }

      // Upload images
      let imageUrls: string[] = []
      if (images.length > 0 && formData.title) {
        // Generate temp property ID for folder
        const tempId = `temp-${Date.now()}`
        imageUrls = await uploadPropertyImages(images, tempId)
      }

      // Create property
      const propertyData = {
        ...formData,
        price: parseFloat(formData.price),
        bed: formData.bed ? parseInt(formData.bed) : null,
        bath: formData.bath ? parseInt(formData.bath) : null,
        area: formData.area ? parseFloat(formData.area) : null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        images: imageUrls.length > 0 ? imageUrls : null,
        agent_id: agentId,
      }

      const { data: property, error } = await supabase
        .from('properties')
        .insert(propertyData)
        .select()
        .single()

      if (error) {
        console.error('Error creating property:', error)
        alert('Error creating property: ' + error.message)
      } else {
        router.push(`/properties/${property.id}`)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
    } finally {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Property Information</CardTitle>
          <CardDescription>Basic details about the property</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="grid grid-cols-3 gap-4">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
          <CardDescription>Select the property location on the map</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
          <CardDescription>Upload property images</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Publishing</CardTitle>
          <CardDescription>Choose how to publish your listing</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Save as Draft</SelectItem>
              <SelectItem value="published">Publish Now</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Creating...' : 'Create Listing'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

