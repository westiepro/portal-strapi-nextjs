import { createClient } from '@/lib/supabase/client'

export async function uploadPropertyImages(
  files: File[],
  propertyId: string
): Promise<string[]> {
  const supabase = createClient()
  const uploadedUrls: string[] = []

  for (const file of files) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${propertyId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `property-images/${fileName}`

    const { error: uploadError, data } = await supabase.storage
      .from('property-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      continue
    }

    const { data: { publicUrl } } = supabase.storage
      .from('property-images')
      .getPublicUrl(filePath)

    uploadedUrls.push(publicUrl)
  }

  return uploadedUrls
}

export async function deletePropertyImages(urls: string[]) {
  const supabase = createClient()

  for (const url of urls) {
    const path = url.split('property-images/')[1]
    if (path) {
      await supabase.storage
        .from('property-images')
        .remove([`property-images/${path}`])
    }
  }
}

