'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import Link from 'next/link'

interface Property {
  id: string
  title: string
  price: number
  property_type: string
  bed: number | null
  bath: number | null
  area: number | null
  images: string[] | null
  latitude: number | null
  longitude: number | null
  listing_type: string
}

interface MapProps {
  properties: Property[]
  center?: [number, number]
  zoom?: number
  onPropertyClick?: (propertyId: string) => void
}

export function Map({ properties, center, zoom = 12, onPropertyClick }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])
  const popups = useRef<mapboxgl.Popup[]>([])
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)

  useEffect(() => {
    if (!mapContainer.current) return

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    if (!token) {
      console.error('Mapbox access token is not set')
      return
    }

    mapboxgl.accessToken = token

    // Initialize map
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: center || [-74.006, 40.7128], // Default to NYC
        zoom: zoom,
      })

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    }

    // Clean up existing markers and popups
    markers.current.forEach((marker) => marker.remove())
    popups.current.forEach((popup) => popup.remove())
    markers.current = []
    popups.current = []

    // Add markers for properties with coordinates
    const propertiesWithCoords = properties.filter(
      (p) => p.latitude && p.longitude
    )

    if (propertiesWithCoords.length > 0 && map.current) {
      const bounds = new mapboxgl.LngLatBounds()

      propertiesWithCoords.forEach((property) => {
        if (!property.latitude || !property.longitude) return

        const lng = property.longitude
        const lat = property.latitude

        bounds.extend([lng, lat])

        // Create popup content
        const popupContent = document.createElement('div')
        popupContent.className = 'p-2 min-w-[200px]'
        popupContent.innerHTML = `
          <div class="space-y-2">
            ${property.images && property.images[0] ? `
              <img src="${property.images[0]}" alt="${property.title}" class="w-full h-24 object-cover rounded" />
            ` : ''}
            <h3 class="font-semibold text-sm">${property.title}</h3>
            <p class="text-lg font-bold text-primary">$${property.price.toLocaleString()}</p>
            <div class="flex gap-2 text-xs text-gray-600">
              ${property.bed ? `<span>${property.bed} bed</span>` : ''}
              ${property.bath ? `<span>${property.bath} bath</span>` : ''}
              ${property.area ? `<span>${property.area} sqft</span>` : ''}
            </div>
            <div class="text-xs">
              <span class="px-2 py-1 bg-primary/10 text-primary rounded">${property.property_type}</span>
            </div>
          </div>
        `

        const popup = new mapboxgl.Popup({ offset: 25 })
          .setDOMContent(popupContent)

        // Create marker
        const el = document.createElement('div')
        el.className = 'custom-marker'
        el.style.width = '32px'
        el.style.height = '32px'
        el.style.borderRadius = '50%'
        el.style.backgroundColor = '#3b82f6'
        el.style.border = '3px solid white'
        el.style.cursor = 'pointer'

        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map.current!)

        marker.getElement().addEventListener('click', () => {
          if (onPropertyClick) {
            onPropertyClick(property.id)
          } else {
            window.location.href = `/properties/${property.id}`
          }
        })

        markers.current.push(marker)
        popups.current.push(popup)
      })

      // Fit map to show all markers
      if (propertiesWithCoords.length > 1) {
        map.current.fitBounds(bounds, {
          padding: 50,
        })
      } else if (propertiesWithCoords.length === 1) {
        map.current.setCenter([propertiesWithCoords[0].longitude!, propertiesWithCoords[0].latitude!])
        map.current.setZoom(14)
      }
    }
  }, [properties, center, zoom, onPropertyClick])

  return (
    <div className="h-full w-full relative">
      <div ref={mapContainer} className="h-full w-full rounded-lg" />
    </div>
  )
}

