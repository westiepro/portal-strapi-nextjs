'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Plus, Search, Edit } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'

interface AllPropertiesTableProps {
  initialProperties: any[]
  initialAgents: any[]
  initialCompanies?: any[]
  onCreateProperty: () => void
  onEditProperty: (property: any) => void
  onPropertiesUpdate?: () => void
}

export function AllPropertiesTable({
  initialProperties,
  initialAgents,
  initialCompanies = [],
  onCreateProperty,
  onEditProperty,
}: AllPropertiesTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('all')
  const [listingTypeFilter, setListingTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Use initialProperties directly to always show real data
  const properties = initialProperties

  const agentMap = useMemo(() => {
    const map: Record<string, any> = {}
    initialAgents.forEach(agent => {
      map[agent.id] = agent
    })
    return map
  }, [initialAgents])

  const companyMap = useMemo(() => {
    const map: Record<string, any> = {}
    initialCompanies.forEach(company => {
      if (company.user_id) {
        map[company.user_id] = company
      }
    })
    return map
  }, [initialCompanies])

  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = 
          property.title?.toLowerCase().includes(query) ||
          property.city?.toLowerCase().includes(query) ||
          property.location?.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Property type filter
      if (propertyTypeFilter !== 'all' && property.property_type !== propertyTypeFilter) {
        return false
      }

      // Listing type filter
      if (listingTypeFilter !== 'all' && property.listing_type !== listingTypeFilter) {
        return false
      }

      // Status filter
      if (statusFilter !== 'all' && property.status !== statusFilter) {
        return false
      }

      return true
    })
  }, [properties, searchQuery, propertyTypeFilter, listingTypeFilter, statusFilter])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getPropertyImage = (property: any) => {
    if (property.images && property.images.length > 0 && property.images[0]) {
      return property.images[0]
    }
    return '/placeholder-property.jpg'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Properties</h1>
          <p className="text-gray-600">View and manage all properties on the platform</p>
        </div>
        <Button onClick={onCreateProperty} className="gap-2">
          <Plus className="h-4 w-4" />
          New Property
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by title, city, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="apartment">Apartment</SelectItem>
            <SelectItem value="villa">Villa</SelectItem>
            <SelectItem value="townhouse">Townhouse</SelectItem>
            <SelectItem value="land">Land</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
          </SelectContent>
        </Select>
        <Select value={listingTypeFilter} onValueChange={setListingTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Listings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Listings</SelectItem>
            <SelectItem value="buy">Buy</SelectItem>
            <SelectItem value="rent">Rent</SelectItem>
            <SelectItem value="sell">Sell</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
            <SelectItem value="rented">Rented</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Property Listings</h2>
              <p className="text-sm text-gray-600 mt-1">
                Showing 1-{filteredProperties.length} of {filteredProperties.length} properties
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Image</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Title</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Listing</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Price</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Location</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Company</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Beds/Baths</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-gray-600">
                      No properties found.
                    </td>
                  </tr>
                ) : (
                  filteredProperties.map((property) => {
                    // Get agent info - either from nested relation or from agentMap
                    let agent = null
                    if (property.agents) {
                      agent = property.agents
                    } else if (property.agent_id && agentMap[property.agent_id]) {
                      agent = agentMap[property.agent_id]
                    }
                    
                    // Get company name - check real_estate_companies first, then fallback to agent company_name
                    let companyName = '-'
                    if (agent?.user_id && companyMap[agent.user_id]) {
                      companyName = companyMap[agent.user_id].company_name || '-'
                    } else if (agent?.company_name) {
                      companyName = agent.company_name
                    }
                    
                    return (
                      <tr key={property.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                            {property.images && Array.isArray(property.images) && property.images.length > 0 && property.images[0] ? (
                              <img
                                src={property.images[0]}
                                alt={property.title || 'Property'}
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
                          <div className="font-medium text-gray-900">{property.title || 'Untitled'}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-700 capitalize">
                            {property.property_type || '-'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-700 capitalize">
                            {property.listing_type === 'buy' ? 'Buy' : property.listing_type === 'rent' ? 'Rent' : property.listing_type || '-'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">
                            {property.price ? formatPrice(Number(property.price)) : '-'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-700">{property.city || property.location || '-'}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-700">
                            {companyName}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge 
                            className={property.status === 'published' 
                              ? 'bg-blue-600 text-white hover:bg-blue-600' 
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-200'}
                          >
                            {property.status === 'published' ? 'active' : property.status || 'draft'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-700">
                            {property.bed || '-'}/{property.bath || '-'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditProperty(property)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  )
}

