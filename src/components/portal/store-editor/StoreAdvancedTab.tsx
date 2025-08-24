import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Code, Zap, Shield, Download, Upload, AlertTriangle } from "lucide-react"
import { Database } from "@/integrations/supabase/types"

type Store = Database['public']['Tables']['online_stores']['Row']

interface StoreAdvancedTabProps {
  store: Partial<Store>
  onChange: (updates: Partial<Store>) => void
}

export const StoreAdvancedTab = ({ store, onChange }: StoreAdvancedTabProps) => {
  const [customCSS, setCustomCSS] = useState(store.custom_css || '')
  const [customJS, setCustomJS] = useState(store.custom_js || '')

  const handleInputChange = (field: keyof Store, value: any) => {
    onChange({ [field]: value })
  }

  const handleCSSChange = (value: string) => {
    setCustomCSS(value)
    handleInputChange('custom_css', value)
  }

  const handleJSChange = (value: string) => {
    setCustomJS(value)
    handleInputChange('custom_js', value)
  }

  return (
    <div className="space-y-8">
      <Tabs defaultValue="code" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="code" className="flex items-center space-x-2">
            <Code className="h-4 w-4" />
            <span>Custom Code</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Integrations</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Backup</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="code" className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Custom code changes can affect your store's functionality and appearance. Only add code if you know what you're doing.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Custom CSS</CardTitle>
              <CardDescription>
                Add custom styles to modify your store's appearance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-css">CSS Code</Label>
                <Textarea
                  id="custom-css"
                  value={customCSS}
                  onChange={(e) => handleCSSChange(e.target.value)}
                  placeholder={`/* Add your custom CSS here */
.custom-header {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  color: white;
  padding: 20px;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}`}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Code className="h-4 w-4 mr-2" />
                  Format Code
                </Button>
                <Button variant="outline" size="sm">
                  Reset to Default
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom JavaScript</CardTitle>
              <CardDescription>
                Add custom scripts for analytics, widgets, or enhanced functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-js">JavaScript Code</Label>
                <Textarea
                  id="custom-js"
                  value={customJS}
                  onChange={(e) => handleJSChange(e.target.value)}
                  placeholder={`// Add your custom JavaScript here
// Example: Add a live chat widget
(function() {
  // Your custom code here
  console.log('Store loaded successfully');
})();

// Example: Track custom events
function trackCustomEvent(event, data) {
  if (window.gtag) {
    gtag('event', event, data);
  }
}`}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Code className="h-4 w-4 mr-2" />
                  Validate Code
                </Button>
                <Button variant="outline" size="sm">
                  Reset to Default
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Marketing</CardTitle>
                <CardDescription>Connect with email service providers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Mailchimp</h4>
                    <p className="text-sm text-muted-foreground">Sync customers and send campaigns</p>
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Klaviyo</h4>
                    <p className="text-sm text-muted-foreground">Advanced email automation</p>
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shipping & Fulfillment</CardTitle>
                <CardDescription>Connect with shipping providers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">ShipStation</h4>
                    <p className="text-sm text-muted-foreground">Multi-carrier shipping solution</p>
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Printful</h4>
                    <p className="text-sm text-muted-foreground">Print-on-demand fulfillment</p>
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Support</CardTitle>
                <CardDescription>Enhance customer service</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Zendesk</h4>
                    <p className="text-sm text-muted-foreground">Complete support solution</p>
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Intercom</h4>
                    <p className="text-sm text-muted-foreground">Live chat and messaging</p>
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analytics & Marketing</CardTitle>
                <CardDescription>Track performance and optimize</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Hotjar</h4>
                    <p className="text-sm text-muted-foreground">Heatmaps and user recordings</p>
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Google Tag Manager</h4>
                    <p className="text-sm text-muted-foreground">Advanced tracking setup</p>
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Protect your store and customer data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SSL Certificate</Label>
                  <p className="text-sm text-muted-foreground">
                    Encrypt data in transit
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-green-600">Active</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Add extra security to your admin account
                  </p>
                </div>
                <Switch />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Admin Login Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified of admin logins
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Security Audit Log</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm p-2 border rounded">
                    <span>Admin login from new device</span>
                    <span className="text-muted-foreground">2 hours ago</span>
                  </div>
                  <div className="flex justify-between text-sm p-2 border rounded">
                    <span>Store settings updated</span>
                    <span className="text-muted-foreground">1 day ago</span>
                  </div>
                  <div className="flex justify-between text-sm p-2 border rounded">
                    <span>New product added</span>
                    <span className="text-muted-foreground">2 days ago</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Store Backup</CardTitle>
              <CardDescription>
                Backup and restore your store data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Automatic Backups</Label>
                  <p className="text-sm text-muted-foreground">
                    Daily automatic backups of your store data
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Manual Backup</h4>
                <p className="text-sm text-muted-foreground">
                  Create a manual backup of your store data, settings, and content.
                </p>
                <Button className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Create Backup
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Restore from Backup</h4>
                <p className="text-sm text-muted-foreground">
                  Upload and restore from a previous backup file.
                </p>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Backup
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Recent Backups</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium text-sm">Automatic Backup</p>
                      <p className="text-sm text-muted-foreground">Today, 3:00 AM</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium text-sm">Manual Backup</p>
                      <p className="text-sm text-muted-foreground">Yesterday, 2:30 PM</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium text-sm">Automatic Backup</p>
                      <p className="text-sm text-muted-foreground">2 days ago, 3:00 AM</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}