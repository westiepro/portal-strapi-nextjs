'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface FiltersProps {
  listingType: 'buy' | 'rent'
  onFilterChange: (filters: FilterState) => void
  onSaveSearch?: () => void
  canSaveSearch?: boolean
}

export interface FilterState {
  city?: string
  minPrice?: number
  maxPrice?: number
  propertyType?: string[]
  minBed?: number
  maxBed?: number
  minBath?: number
  maxBath?: number
  minArea?: number
  maxArea?: number
}

export function Filters({ listingType, onFilterChange, onSaveSearch, canSaveSearch }: FiltersProps) {
  const [filters, setFilters] = useState<FilterState>({})
  const [priceOpen, setPriceOpen] = useState(false)
  const [bedBathOpen, setBedBathOpen] = useState(false)
  const [areaOpen, setAreaOpen] = useState(false)
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false)

  const maxBath = listingType === 'rent' ? 4 : 5
  const maxBed = 5

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const resetFilter = (key: keyof FilterState) => {
    const newFilters = { ...filters, [key]: undefined }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const resetAll = () => {
    setFilters({})
    onFilterChange({})
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && (Array.isArray(v) ? v.length > 0 : true))

  return (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Price Filter */}
          <Dialog open={priceOpen} onOpenChange={setPriceOpen}>
            <DialogTrigger asChild>
              <Button variant={filters.minPrice || filters.maxPrice ? "default" : "outline"} size="sm">
                Price
                {(filters.minPrice || filters.maxPrice) && <X className="ml-2 h-3 w-3" />}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Price Range</DialogTitle>
                <DialogDescription>Select minimum and maximum price</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Min Price</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="0"
                    value={filters.minPrice || ''}
                    onChange={(e) => updateFilter('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Price</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="No max"
                    value={filters.maxPrice || ''}
                    onChange={(e) => updateFilter('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => resetFilter('minPrice') && resetFilter('maxPrice')}>
                    Reset
                  </Button>
                  <Button onClick={() => setPriceOpen(false)} className="flex-1">Done</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Property Type Filter */}
          <Select
            value={filters.propertyType?.[0] || 'any'}
            onValueChange={(value) => updateFilter('propertyType', value === 'any' ? undefined : [value])}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Property Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Type</SelectItem>
              <SelectItem value="apartment">Apartment</SelectItem>
              <SelectItem value="villa">Villa</SelectItem>
              <SelectItem value="townhouse">Townhouse</SelectItem>
              <SelectItem value="land">Land</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
            </SelectContent>
          </Select>

          {/* Bed/Baths Filter */}
          <Dialog open={bedBathOpen} onOpenChange={setBedBathOpen}>
            <DialogTrigger asChild>
              <Button variant={(filters.minBed || filters.minBath) ? "default" : "outline"} size="sm">
                Bed/Baths
                {(filters.minBed || filters.minBath) && <X className="ml-2 h-3 w-3" />}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bedrooms & Bathrooms</DialogTitle>
                <DialogDescription>Select minimum bedrooms and bathrooms</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bedrooms (min)</label>
                  <Select
                    value={filters.minBed?.toString() || 'any'}
                    onValueChange={(value) => updateFilter('minBed', value === 'any' ? undefined : Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {Array.from({ length: maxBed + 1 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i === maxBed ? `${i}+` : i.toString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bathrooms (min)</label>
                  <Select
                    value={filters.minBath?.toString() || 'any'}
                    onValueChange={(value) => updateFilter('minBath', value === 'any' ? undefined : Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {Array.from({ length: maxBath + 1 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i === maxBath ? `${i}+` : i.toString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => resetFilter('minBed') && resetFilter('minBath')}>
                    Reset
                  </Button>
                  <Button onClick={() => setBedBathOpen(false)} className="flex-1">Done</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Area Filter */}
          <Dialog open={areaOpen} onOpenChange={setAreaOpen}>
            <DialogTrigger asChild>
              <Button variant={(filters.minArea || filters.maxArea) ? "default" : "outline"} size="sm">
                Total Area
                {(filters.minArea || filters.maxArea) && <X className="ml-2 h-3 w-3" />}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Total Area</DialogTitle>
                <DialogDescription>Select area range in sqft</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Min Area (sqft)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="0"
                    value={filters.minArea || ''}
                    onChange={(e) => updateFilter('minArea', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Area (sqft)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="No max"
                    value={filters.maxArea || ''}
                    onChange={(e) => updateFilter('maxArea', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => resetFilter('minArea') && resetFilter('maxArea')}>
                    Reset
                  </Button>
                  <Button onClick={() => setAreaOpen(false)} className="flex-1">Done</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* More Filters */}
          <Sheet open={moreFiltersOpen} onOpenChange={setMoreFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">More Filters</Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>All Filters</SheetTitle>
                <SheetDescription>Refine your search with advanced filters</SheetDescription>
              </SheetHeader>
              <div className="mt-8 space-y-6">
                {/* All filters can go here in a sidebar format */}
                <Button variant="outline" onClick={resetAll} className="w-full">
                  Clear All Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetAll}>
              Clear All
            </Button>
          )}

          {canSaveSearch && onSaveSearch && (
            <Button variant="outline" size="sm" onClick={onSaveSearch}>
              Save Search
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3">
            {filters.minPrice && <Badge variant="secondary">Min: ${filters.minPrice.toLocaleString()}</Badge>}
            {filters.maxPrice && <Badge variant="secondary">Max: ${filters.maxPrice.toLocaleString()}</Badge>}
            {filters.propertyType && filters.propertyType.length > 0 && (
              <Badge variant="secondary">{filters.propertyType[0]}</Badge>
            )}
            {filters.minBed && <Badge variant="secondary">{filters.minBed}+ beds</Badge>}
            {filters.minBath && <Badge variant="secondary">{filters.minBath}+ baths</Badge>}
            {filters.minArea && <Badge variant="secondary">Min: {filters.minArea} sqft</Badge>}
            {filters.maxArea && <Badge variant="secondary">Max: {filters.maxArea} sqft</Badge>}
          </div>
        )}
      </div>
    </div>
  )
}

