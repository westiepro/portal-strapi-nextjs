'use client'

import { useState, useEffect } from 'react'
import { Map } from '@/components/map'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin } from 'lucide-react'

interface LocationPickerProps {
  onLocationSelect: (location: {
    address: string
    city: string
    latitude: number
    longitude: number
  }) => void
  initialLocation?: {
    address: string
    city: string
    latitude: number
    longitude: number
  }
}

export function LocationPicker({ onLocationSelect, initialLocation }: LocationPickerProps) {
  const [address, setAddress] = useState(initialLocation?.address || '')
  const [city, setCity] = useState(initialLocation?.city || '')
  const [coordinates, setCoordinates] = useState<[number, number] | null>(
    initialLocation ? [initialLocation.longitude, initialLocation.latitude] : null
  )

  const handleGeocode = async () => {
    if (!address || !city) return

    // Simple geocoding - in production, use Mapbox Geocoding API
    const query = `${address}, ${city}`
    
    // For now, just set default coordinates
    // In production, you'd call Mapbox Geocoding API here
    const defaultCoords: [number, number] = [-74.006, 40.7128] // NYC default
    
    setCoordinates(defaultCoords)
    onLocationSelect({
      address,
      city,
      latitude: defaultCoords[1],
      longitude: defaultCoords[0],
    })
  }

  const handleMapClick = (lng: number, lat: number) => {
    setCoordinates([lng, lat])
    onLocationSelect({
      address,
      city,
      latitude: lat,
      longitude: lng,
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Address</label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street address"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">City</label>
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City name"
          />
        </div>
      </div>
      <Button type="button" onClick={handleGeocode}>
        <MapPin className="h-4 w-4 mr-2" />
        Find on Map
      </Button>
      {coordinates && (
        <Card>
          <CardContent className="p-0">
            <div className="h-64 relative">
              <Map
                properties={[]}
                center={coordinates}
                zoom={14}
              />
            </div>
          </CardContent>
        </Card>
      )}
      {coordinates && (
        <p className="text-sm text-gray-600">
          Coordinates: {coordinates[1].toFixed(6)}, {coordinates[0].toFixed(6)}
        </p>
      )}
    </div>
  )
}

