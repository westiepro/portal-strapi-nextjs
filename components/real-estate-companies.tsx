'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Search, Edit, Phone, Eye, ArrowUpDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface RealEstateCompany {
  id: string
  email: string
  company_name: string
  contact_person_name: string
  phone_number?: string
  created_at: string
  user_id?: string
  properties_count?: number
}

interface RealEstateCompaniesProps {
  initialCompanies: RealEstateCompany[]
  initialProperties?: any[]
  onCompaniesUpdate?: () => void
}

export function RealEstateCompanies({
  initialCompanies,
  initialProperties = [],
  onCompaniesUpdate,
}: RealEstateCompaniesProps) {
  const [companies, setCompanies] = useState(initialCompanies)
  const [searchQuery, setSearchQuery] = useState('')
  const [createCompanyOpen, setCreateCompanyOpen] = useState(false)
  const [editCompanyOpen, setEditCompanyOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<RealEstateCompany | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    company_name: '',
    contact_person_name: '',
    phone_number: '',
  })

  // Calculate properties count for each company
  const companiesWithProperties = useMemo(() => {
    return companies.map(company => {
      // Count properties for this company's user_id through agents
      const propertiesCount = initialProperties.filter(p => {
        // If we have user_id, we need to find if any agent with that user_id has properties
        // For now, we'll show 0 or a placeholder
        return false // We'll update this logic based on how companies link to properties
      }).length

      return {
        ...company,
        properties_count: propertiesCount || 0,
      }
    })
  }, [companies, initialProperties])

  const filteredCompanies = useMemo(() => {
    return companiesWithProperties.filter(company => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          company.company_name?.toLowerCase().includes(query) ||
          company.contact_person_name?.toLowerCase().includes(query) ||
          company.phone_number?.toLowerCase().includes(query) ||
          company.email?.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [companiesWithProperties, searchQuery])

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      // Create user account in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.contact_person_name,
            role: 'agent',
          },
        },
      })

      if (authError) {
        console.error('Error creating user:', authError)
        alert('Error creating user account: ' + authError.message)
        setLoading(false)
        return
      }

      if (!authData.user) {
        alert('Error: User was not created')
        setLoading(false)
        return
      }

      // Wait a bit for the trigger to create the profile automatically
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Check if profile exists, if not create it (trigger should handle this, but as fallback)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .single()

      if (!existingProfile) {
        // Profile wasn't created by trigger, create it manually
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: formData.email,
            full_name: formData.contact_person_name,
            role: 'agent',
          })

        if (profileError) {
          console.error('Error creating profile:', profileError.message || profileError)
          // Continue anyway - might already exist or will be created by trigger
        }
      } else {
        // Update profile with agent role if needed
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            role: 'agent',
            full_name: formData.contact_person_name,
          })
          .eq('id', authData.user.id)

        if (updateError) {
          console.error('Error updating profile:', updateError.message || updateError)
        }
      }

      // Check if agent already exists for this user
      const { data: existingAgent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', authData.user.id)
        .single()

      let agentData = existingAgent

      if (!existingAgent) {
        // Create agent entry
        const { data: newAgentData, error: agentError } = await supabase
          .from('agents')
          .insert({
            user_id: authData.user.id,
            company_name: formData.company_name,
            phone: formData.phone_number || null,
          })
          .select()
          .single()

        if (agentError) {
          console.error('Error creating agent:', agentError.message || JSON.stringify(agentError))
          alert('Warning: User created but agent profile failed: ' + (agentError.message || 'Unknown error'))
          // Continue to create company entry anyway
        } else {
          agentData = newAgentData
        }
      } else {
        // Update existing agent
        const { error: updateError } = await supabase
          .from('agents')
          .update({
            company_name: formData.company_name,
            phone: formData.phone_number || null,
          })
          .eq('id', existingAgent.id)

        if (updateError) {
          console.error('Error updating agent:', updateError.message || updateError)
        }
      }

      // Create real estate company entry
      const { data: companyData, error: companyError } = await supabase
        .from('real_estate_companies')
        .insert({
          email: formData.email,
          company_name: formData.company_name,
          contact_person_name: formData.contact_person_name,
          phone_number: formData.phone_number || null,
          user_id: authData.user.id,
        })
        .select()
        .single()

      if (companyError) {
        console.error('Error creating company:', companyError)
        alert('Error creating company: ' + companyError.message)
        setLoading(false)
        return
      }

      // Refresh companies list
      const { data: newCompanies } = await supabase
        .from('real_estate_companies')
        .select('*')
        .order('created_at', { ascending: false })

      if (newCompanies) {
        setCompanies(newCompanies)
      }

      // Reset form
      setFormData({
        email: '',
        password: '',
        company_name: '',
        contact_person_name: '',
        phone_number: '',
      })
      setCreateCompanyOpen(false)
      setLoading(false)

      if (onCompaniesUpdate) {
        onCompaniesUpdate()
      }

      alert('Company created successfully!')
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleEditCompany = (company: RealEstateCompany) => {
    setEditingCompany(company)
    setFormData({
      email: company.email,
      password: '', // Don't pre-fill password for security
      company_name: company.company_name,
      contact_person_name: company.contact_person_name,
      phone_number: company.phone_number || '',
    })
    setEditCompanyOpen(true)
  }

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCompany) return

    setLoading(true)

    try {
      const supabase = createClient()

      // Update real estate company entry
      const updateData: any = {
        company_name: formData.company_name,
        contact_person_name: formData.contact_person_name,
        phone_number: formData.phone_number || null,
      }

      // Only update email if it changed
      if (formData.email !== editingCompany.email) {
        updateData.email = formData.email
      }

      const { error: companyError } = await supabase
        .from('real_estate_companies')
        .update(updateData)
        .eq('id', editingCompany.id)

      if (companyError) {
        console.error('Error updating company:', companyError)
        alert('Error updating company: ' + (companyError.message || 'Unknown error'))
        setLoading(false)
        return
      }

      // Update password if provided (requires admin API key)
      // Note: This requires server-side admin access
      if (formData.password && formData.password.length >= 8 && editingCompany.user_id) {
        // Password update will be handled via API endpoint or skipped
        // For security, password updates should be done server-side
        console.log('Password update requested (requires server-side admin access)')
        // TODO: Create API endpoint for password updates or handle server-side
      }

      // Update profile if user_id exists
      if (editingCompany.user_id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            email: formData.email,
            full_name: formData.contact_person_name,
          })
          .eq('id', editingCompany.user_id)

        if (profileError) {
          console.error('Error updating profile:', profileError.message || profileError)
          // Continue anyway
        }

        // Update agent entry if it exists
        const { data: agent } = await supabase
          .from('agents')
          .select('id')
          .eq('user_id', editingCompany.user_id)
          .single()

        if (agent) {
          const { error: agentError } = await supabase
            .from('agents')
            .update({
              company_name: formData.company_name,
              phone: formData.phone_number || null,
            })
            .eq('id', agent.id)

          if (agentError) {
            console.error('Error updating agent:', agentError.message || agentError)
            // Continue anyway
          }
        }
      }

      // Refresh companies list
      const { data: newCompanies } = await supabase
        .from('real_estate_companies')
        .select('*')
        .order('created_at', { ascending: false })

      if (newCompanies) {
        setCompanies(newCompanies)
      }

      // Reset form
      setFormData({
        email: '',
        password: '',
        company_name: '',
        contact_person_name: '',
        phone_number: '',
      })
      setEditingCompany(null)
      setEditCompanyOpen(false)
      setLoading(false)

      if (onCompaniesUpdate) {
        onCompaniesUpdate()
      }

      alert('Company updated successfully!')
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Real Estate Companies</h1>
          <p className="text-gray-600">Manage real estate companies and view their properties</p>
        </div>
        <Dialog open={createCompanyOpen} onOpenChange={(open) => {
          setCreateCompanyOpen(open)
          if (!open) {
            setFormData({
              email: '',
              password: '',
              company_name: '',
              contact_person_name: '',
              phone_number: '',
            })
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Real Estate Company</DialogTitle>
              <DialogDescription>
                Create a new agent account with login credentials and company details.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCompany} className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="agent@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <p className="text-sm text-gray-500">This will be used for login credentials</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                />
                <p className="text-sm text-gray-500">Minimum 8 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_name">
                  Company Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="company_name"
                  type="text"
                  placeholder="ABC Real Estate"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_person_name">
                  Contact Person Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contact_person_name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.contact_person_name}
                  onChange={(e) => setFormData({ ...formData, contact_person_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                />
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateCompanyOpen(false)
                    setFormData({
                      email: '',
                      password: '',
                      company_name: '',
                      contact_person_name: '',
                      phone_number: '',
                    })
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Company'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Company Dialog */}
        <Dialog open={editCompanyOpen} onOpenChange={(open) => {
          setEditCompanyOpen(open)
          if (!open) {
            setEditingCompany(null)
            setFormData({
              email: '',
              password: '',
              company_name: '',
              contact_person_name: '',
              phone_number: '',
            })
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Real Estate Company</DialogTitle>
              <DialogDescription>
                Update company information and details.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateCompany} className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edit_email">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit_email"
                  type="email"
                  placeholder="agent@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <p className="text-sm text-gray-500">This will be used for login credentials</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_password">Password</Label>
                <Input
                  id="edit_password"
                  type="password"
                  placeholder="Leave blank to keep current password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  minLength={8}
                />
                <p className="text-sm text-gray-500">Minimum 8 characters (leave blank to keep current)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_company_name">
                  Company Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit_company_name"
                  type="text"
                  placeholder="ABC Real Estate"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_contact_person_name">
                  Contact Person Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit_contact_person_name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.contact_person_name}
                  onChange={(e) => setFormData({ ...formData, contact_person_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_phone_number">Phone Number</Label>
                <Input
                  id="edit_phone_number"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                />
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditCompanyOpen(false)
                    setEditingCompany(null)
                    setFormData({
                      email: '',
                      password: '',
                      company_name: '',
                      contact_person_name: '',
                      phone_number: '',
                    })
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Company'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Companies Section */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Companies</h2>
              <p className="text-sm text-gray-600">{filteredCompanies.length} companies total</p>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by company name, contact person, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      Company Name
                      <ArrowUpDown className="h-3 w-3 text-gray-400" />
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      Contact Person
                      <ArrowUpDown className="h-3 w-3 text-gray-400" />
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      Contact Info
                      <ArrowUpDown className="h-3 w-3 text-gray-400" />
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      Properties
                      <ArrowUpDown className="h-3 w-3 text-gray-400" />
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      Joined
                      <ArrowUpDown className="h-3 w-3 text-gray-400" />
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-600">
                      {searchQuery ? 'No companies found matching your search.' : 'No companies found.'}
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((company) => (
                    <tr key={company.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">{company.company_name}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-700">{company.contact_person_name}</div>
                      </td>
                      <td className="py-4 px-4">
                        {company.phone_number ? (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Phone className="h-4 w-4" />
                            {company.phone_number}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <Button variant="outline" size="sm" className="h-8">
                          {company.properties_count || 0} properties
                        </Button>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-700">{formatDate(company.created_at)}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleEditCompany(company)}
                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </button>
                          <button className="text-sm text-blue-600 hover:text-blue-700">
                            View Details
                          </button>
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

