import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Globe, BarChart, Share2, Tag } from "lucide-react"
import { Database } from "@/integrations/supabase/types"

type Store = Database['public']['Tables']['online_stores']['Row']

interface StoreSEOTabProps {
  store: Partial<Store>
  onChange: (updates: Partial<Store>) => void
}

export const StoreSEOTab = ({ store, onChange }: StoreSEOTabProps) => {
  const [seoData, setSeoData] = useState({
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    og_title: '',
    og_description: '',
    og_image_url: '',
    twitter_title: '',
    twitter_description: '',
    twitter_image_url: '',
    google_analytics_id: '',
    facebook_pixel_id: ''
  })

  const handleInputChange = (field: keyof Store, value: any) => {
    onChange({ [field]: value })
  }

  const handleSEOChange = (field: string, value: string) => {
    setSeoData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-8">
      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic" className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <span>Basic SEO</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center space-x-2">
            <Share2 className="h-4 w-4" />
            <span>Social Media</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center space-x-2">
            <Tag className="h-4 w-4" />
            <span>Advanced</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Engine Optimization</CardTitle>
              <CardDescription>
                Configure how your store appears in search engine results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="meta-title">Meta Title</Label>
                <Input
                  id="meta-title"
                  value={seoData.meta_title}
                  onChange={(e) => handleSEOChange('meta_title', e.target.value)}
                  placeholder={`${store.name || 'Your Store'} - High Quality Products Online`}
                  maxLength={60}
                />
                <p className="text-sm text-muted-foreground">
                  {seoData.meta_title.length}/60 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta-description">Meta Description</Label>
                <Textarea
                  id="meta-description"
                  value={seoData.meta_description}
                  onChange={(e) => handleSEOChange('meta_description', e.target.value)}
                  placeholder="Discover amazing products at great prices. Shop our curated collection of high-quality items with fast shipping and excellent customer service."
                  maxLength={160}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  {seoData.meta_description.length}/160 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta-keywords">Meta Keywords</Label>
                <Input
                  id="meta-keywords"
                  value={seoData.meta_keywords}
                  onChange={(e) => handleSEOChange('meta_keywords', e.target.value)}
                  placeholder="online store, products, shopping, e-commerce"
                />
                <p className="text-sm text-muted-foreground">
                  Separate keywords with commas. Keep it relevant and specific.
                </p>
              </div>

              {/* SEO Preview */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="font-medium mb-3">Search Engine Preview</h4>
                <div className="space-y-1">
                  <div className="text-blue-600 text-lg hover:underline cursor-pointer">
                    {seoData.meta_title || store.name || 'Your Store Name'}
                  </div>
                  <div className="text-green-700 text-sm">
                    {window.location.origin}/store/{store.slug || 'your-store'}
                  </div>
                  <div className="text-gray-600 text-sm">
                    {seoData.meta_description || 'Add a meta description to see how your store will appear in search results.'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Open Graph (Facebook)</CardTitle>
              <CardDescription>
                Configure how your store appears when shared on Facebook and other platforms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="og-title">Facebook Title</Label>
                <Input
                  id="og-title"
                  value={seoData.og_title}
                  onChange={(e) => handleSEOChange('og_title', e.target.value)}
                  placeholder={seoData.meta_title || `${store.name || 'Your Store'} - Shop Online`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="og-description">Facebook Description</Label>
                <Textarea
                  id="og-description"
                  value={seoData.og_description}
                  onChange={(e) => handleSEOChange('og_description', e.target.value)}
                  placeholder={seoData.meta_description || 'Discover amazing products at our online store.'}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="og-image">Facebook Image URL</Label>
                <Input
                  id="og-image"
                  value={seoData.og_image_url}
                  onChange={(e) => handleSEOChange('og_image_url', e.target.value)}
                  placeholder="https://example.com/facebook-image.jpg"
                />
                <p className="text-sm text-muted-foreground">
                  Recommended size: 1200x630px
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Twitter Cards</CardTitle>
              <CardDescription>
                Configure how your store appears when shared on Twitter
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="twitter-title">Twitter Title</Label>
                <Input
                  id="twitter-title"
                  value={seoData.twitter_title}
                  onChange={(e) => handleSEOChange('twitter_title', e.target.value)}
                  placeholder={seoData.og_title || seoData.meta_title || `${store.name || 'Your Store'}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter-description">Twitter Description</Label>
                <Textarea
                  id="twitter-description"
                  value={seoData.twitter_description}
                  onChange={(e) => handleSEOChange('twitter_description', e.target.value)}
                  placeholder={seoData.og_description || seoData.meta_description || 'Check out our amazing products!'}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter-image">Twitter Image URL</Label>
                <Input
                  id="twitter-image"
                  value={seoData.twitter_image_url}
                  onChange={(e) => handleSEOChange('twitter_image_url', e.target.value)}
                  placeholder="https://example.com/twitter-image.jpg"
                />
                <p className="text-sm text-muted-foreground">
                  Recommended size: 1200x600px
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Google Analytics</CardTitle>
              <CardDescription>
                Track your store's performance with Google Analytics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ga-id">Google Analytics ID</Label>
                <Input
                  id="ga-id"
                  value={seoData.google_analytics_id}
                  onChange={(e) => handleSEOChange('google_analytics_id', e.target.value)}
                  placeholder="G-XXXXXXXXXX or UA-XXXXXXXX-X"
                />
                <p className="text-sm text-muted-foreground">
                  Find this in your Google Analytics account under Admin → Property Settings
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Facebook Pixel</CardTitle>
              <CardDescription>
                Track conversions and optimize Facebook ads
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fb-pixel">Facebook Pixel ID</Label>
                <Input
                  id="fb-pixel"
                  value={seoData.facebook_pixel_id}
                  onChange={(e) => handleSEOChange('facebook_pixel_id', e.target.value)}
                  placeholder="123456789012345"
                />
                <p className="text-sm text-muted-foreground">
                  Find this in your Facebook Business Manager under Data Sources → Pixels
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>
                Monitor your store's SEO performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">85</div>
                  <div className="text-sm text-muted-foreground">SEO Score</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">92</div>
                  <div className="text-sm text-muted-foreground">Page Speed</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">78</div>
                  <div className="text-sm text-muted-foreground">Mobile Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Structured Data</CardTitle>
              <CardDescription>
                Help search engines understand your content better
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Organization Schema</h4>
                    <p className="text-sm text-muted-foreground">Basic business information</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Product Schema</h4>
                    <p className="text-sm text-muted-foreground">Rich product snippets</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Breadcrumb Schema</h4>
                    <p className="text-sm text-muted-foreground">Navigation structure</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sitemap & Robots</CardTitle>
              <CardDescription>
                Control how search engines crawl your store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">XML Sitemap</h4>
                    <p className="text-sm text-muted-foreground">Automatically generated and updated</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Globe className="h-4 w-4 mr-2" />
                    View Sitemap
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Robots.txt</h4>
                    <p className="text-sm text-muted-foreground">Control search engine crawling</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Globe className="h-4 w-4 mr-2" />
                    View Robots.txt
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}