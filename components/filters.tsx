'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { X, DollarSign, Bed, Bath, Square, ChevronDown, Filter, Save } from 'lucide-react'
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
    <div className="bg-white sticky top-16 z-40 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Price Filter */}
          <Dialog open={priceOpen} onOpenChange={setPriceOpen}>
            <DialogTrigger asChild>
              <Button variant={filters.minPrice || filters.maxPrice ? "default" : "outline"} size="default" className="gap-2 h-11 px-4 hover:bg-blue-600 hover:text-white [&_svg]:hover:text-white">
                <DollarSign className="h-5 w-5" />
                Price
                {(filters.minPrice || filters.maxPrice) && <X className="ml-1 h-4 w-4" />}
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
                  <Button variant="outline" onClick={() => {
                    resetFilter('minPrice')
                    resetFilter('maxPrice')
                  }}>
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
            <SelectTrigger className="w-[200px] h-11 gap-2 hover:bg-blue-600 hover:text-white [&_svg]:hover:text-white">
              <SelectValue placeholder="Property Type" />
              <ChevronDown className="h-5 w-5 opacity-50" />
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

          {/* Bedrooms Filter */}
          <Dialog open={bedBathOpen} onOpenChange={setBedBathOpen}>
            <DialogTrigger asChild>
              <Button variant={filters.minBed ? "default" : "outline"} size="default" className="gap-2 h-11 px-4 hover:bg-blue-600 hover:text-white [&_svg]:hover:text-white">
                <Bed className="h-5 w-5" />
                Bedrooms
                {filters.minBed && <X className="ml-1 h-4 w-4" />}
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
                  <Button variant="outline" onClick={() => {
                    resetFilter('minBed')
                    resetFilter('minBath')
                  }}>
                    Reset
                  </Button>
                  <Button onClick={() => setBedBathOpen(false)} className="flex-1">Done</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Bathrooms Filter - Same dialog as bedrooms */}
          <Dialog open={bedBathOpen} onOpenChange={setBedBathOpen}>
            <DialogTrigger asChild>
              <Button variant={filters.minBath ? "default" : "outline"} size="default" className="gap-2 h-11 px-4 hover:bg-blue-600 hover:text-white [&_svg]:hover:text-white">
                <Bath className="h-5 w-5" />
                Bathrooms
                {filters.minBath && <X className="ml-1 h-4 w-4" />}
              </Button>
            </DialogTrigger>
          </Dialog>

          {/* Area Filter */}
          <Dialog open={areaOpen} onOpenChange={setAreaOpen}>
            <DialogTrigger asChild>
              <Button variant={(filters.minArea || filters.maxArea) ? "default" : "outline"} size="default" className="gap-2 h-11 px-4 hover:bg-blue-600 hover:text-white [&_svg]:hover:text-white">
                <Square className="h-5 w-5" />
                Area
                {(filters.minArea || filters.maxArea) && <X className="ml-1 h-4 w-4" />}
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
                  <Button variant="outline" onClick={() => {
                    resetFilter('minArea')
                    resetFilter('maxArea')
                  }}>
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
              <Button variant="outline" size="default" className="gap-2 h-11 px-4 hover:bg-blue-600 hover:text-white [&_svg]:hover:text-white">
                <Filter className="h-5 w-5" />
                More Filters
              </Button>
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
            <Button variant="ghost" size="default" className="h-11 px-4" onClick={resetAll}>
              Clear All
            </Button>
          )}

          {canSaveSearch && onSaveSearch && (
            <Button variant="outline" size="default" className="gap-2 h-11 px-4 hover:bg-blue-600 hover:text-white [&_svg]:hover:text-white" onClick={onSaveSearch}>
              <Save className="h-5 w-5" />
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

