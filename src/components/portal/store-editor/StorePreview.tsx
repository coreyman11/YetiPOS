import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Monitor, Smartphone, Tablet } from "lucide-react"
import { Database } from "@/integrations/supabase/types"

type Store = Database['public']['Tables']['online_stores']['Row']

interface StorePreviewProps {
  store: Partial<Store>
}

export const StorePreview = ({ store }: StorePreviewProps) => {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  const getPreviewUrl = () => {
    return `/store/${store.slug || 'preview'}?preview=true`
  }

  const getPreviewDimensions = () => {
    switch (previewMode) {
      case 'mobile':
        return { width: '375px', height: '667px' }
      case 'tablet':
        return { width: '768px', height: '1024px' }
      default:
        return { width: '100%', height: '800px' }
    }
  }

  const { width, height } = getPreviewDimensions()

  return (
    <div className="space-y-4">
      {/* Preview Controls */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Button
            variant={previewMode === 'desktop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('desktop')}
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            variant={previewMode === 'tablet' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('tablet')}
          >
            <Tablet className="h-4 w-4" />
          </Button>
          <Button
            variant={previewMode === 'mobile' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('mobile')}
          >
            <Smartphone className="h-4 w-4" />
          </Button>
        </div>
        <Badge variant="secondary" className="text-xs">
          {previewMode.charAt(0).toUpperCase() + previewMode.slice(1)} Preview
        </Badge>
      </div>

      {/* Preview Frame */}
      <div className="flex justify-center bg-gray-100 p-4 min-h-[600px]">
        <div
          className="bg-white border rounded-lg shadow-lg overflow-hidden transition-all duration-300"
          style={{
            width: width,
            height: height,
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        >
          {store.slug ? (
            <iframe
              src={getPreviewUrl()}
              width="100%"
              height="100%"
              frameBorder="0"
              title="Store Preview"
              className="w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Monitor className="h-12 w-12 mx-auto mb-4" />
                <p>Preview will be available after saving</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Info */}
      <div className="text-center text-sm text-muted-foreground p-4">
        This is a live preview of your store. Changes may take a moment to reflect.
      </div>
    </div>
  )
}