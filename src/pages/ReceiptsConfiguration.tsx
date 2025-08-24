
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { receiptSettingsApi } from "@/services/receipt-settings-api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { locationsApi } from "@/services/locations-api";
import { AlertTriangle, Download, Upload, Trash, Image } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Form validation schema
const formSchema = z.object({
  business_name: z.string().min(1, "Business name is required"),
  header_text: z.string().optional(),
  footer_text: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email("Invalid email address").optional().or(z.literal("")),
  contact_website: z.string().url("Invalid URL format").optional().or(z.literal("")),
  show_tax_details: z.boolean().default(true),
  show_discount_details: z.boolean().default(true),
  include_customer_info: z.boolean().default(true),
  template_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const ReceiptsConfiguration = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [htmlPreview, setHtmlPreview] = useState<string>("");
  
  // Get current location
  const { data: location } = useQuery({
    queryKey: ['current-location'],
    queryFn: locationsApi.getCurrentLocation,
  });

  // Fetch receipt settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['receipt-settings', location?.id],
    queryFn: () => location ? receiptSettingsApi.getSettings(location.id) : null,
    enabled: !!location,
  });

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      business_name: "",
      header_text: "",
      footer_text: "",
      contact_phone: "",
      contact_email: "",
      contact_website: "",
      show_tax_details: true,
      show_discount_details: true,
      include_customer_info: true,
      template_id: "",
    },
  });

  // Update form with settings data when available
  useEffect(() => {
    if (settings) {
      form.reset({
        business_name: settings.business_name || "",
        header_text: settings.header_text || "",
        footer_text: settings.footer_text || "",
        contact_phone: settings.contact_phone || "",
        contact_email: settings.contact_email || "",
        contact_website: settings.contact_website || "",
        show_tax_details: settings.show_tax_details,
        show_discount_details: settings.show_discount_details,
        include_customer_info: settings.include_customer_info,
        template_id: settings.template_id || "",
      });
      setPreviewUrl(settings.logo_url);
      
      // Generate initial preview
      updateReceiptPreview(settings);
    }
  }, [settings, form]);

  // Watch for form changes to update preview
  const formValues = form.watch();
  useEffect(() => {
    if (settings) {
      updateReceiptPreview({
        ...settings,
        ...formValues,
        logo_url: previewUrl
      });
    }
  }, [formValues, previewUrl]);

  // Update receipt preview
  const updateReceiptPreview = (settings: any) => {
    const preview = receiptSettingsApi.generatePreview(settings);
    setHtmlPreview(preview);
  };

  // Mutation for updating settings
  const updateMutation = useMutation({
    mutationFn: (data: any) => receiptSettingsApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipt-settings'] });
      toast({
        title: "Success",
        description: "Receipt settings updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update receipt settings",
        variant: "destructive",
      });
      console.error("Update error:", error);
    },
  });

  // Logo upload mutation
  const logoUploadMutation = useMutation({
    mutationFn: async ({ locationId, file }: { locationId: string, file: File }) => {
      return receiptSettingsApi.uploadLogo(locationId, file);
    },
    onSuccess: (logoUrl) => {
      if (logoUrl && location?.id) {
        // Update the settings with the new logo URL
        updateMutation.mutate({
          location_id: location.id,
          logo_url: logoUrl
        });
        setPreviewUrl(logoUrl);
        toast({
          title: "Success",
          description: "Logo uploaded successfully",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive",
      });
      console.error("Logo upload error:", error);
    },
  });

  // Logo delete mutation
  const logoDeleteMutation = useMutation({
    mutationFn: async (logoUrl: string) => {
      return receiptSettingsApi.deleteLogo(logoUrl);
    },
    onSuccess: () => {
      if (location?.id) {
        // Update the settings to remove the logo URL
        updateMutation.mutate({
          location_id: location.id,
          logo_url: null
        });
        setPreviewUrl(null);
        toast({
          title: "Success",
          description: "Logo removed successfully",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove logo",
        variant: "destructive",
      });
      console.error("Logo delete error:", error);
    },
  });

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    if (!location) {
      toast({
        title: "Error",
        description: "No location selected",
        variant: "destructive",
      });
      return;
    }

    // Upload logo first if available
    if (logoFile) {
      logoUploadMutation.mutate({ locationId: location.id, file: logoFile });
      setLogoFile(null);
    }

    // Update settings
    updateMutation.mutate({
      location_id: location.id,
      ...data
    });
  };

  // Handle logo file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      
      // Create a preview URL
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
    }
  };

  // Handle logo removal
  const handleRemoveLogo = async () => {
    if (previewUrl && settings?.logo_url) {
      // Only delete from storage if it's a real URL (not a local preview)
      if (settings.logo_url === previewUrl) {
        logoDeleteMutation.mutate(previewUrl);
      } else {
        setPreviewUrl(null);
      }
    } else {
      setPreviewUrl(null);
    }
    setLogoFile(null);
  };

  if (isLoading) {
    return <div>Loading receipt settings...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load receipt settings. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!location) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No Location Selected</AlertTitle>
        <AlertDescription>
          Please select a location to configure receipt settings.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Receipt Configuration</h2>
        <p className="text-muted-foreground">
          Customize how receipts appear for your customers. These settings affect both printed and digital receipts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="display">Display Options</TabsTrigger>
                </TabsList>
                
                <Card className="mt-4">
                  <CardContent className="pt-6">
                    <TabsContent value="general" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="business_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your business name" {...field} />
                            </FormControl>
                            <FormDescription>
                              This appears at the top of your receipts.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="space-y-2">
                        <FormLabel>Business Logo</FormLabel>
                        <div className="flex items-center gap-4">
                          {previewUrl ? (
                            <div className="relative w-32 h-32 border rounded-md overflow-hidden">
                              <img 
                                src={previewUrl} 
                                alt="Logo preview" 
                                className="w-full h-full object-contain" 
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6"
                                onClick={handleRemoveLogo}
                              >
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="w-32 h-32 border rounded-md flex items-center justify-center bg-muted">
                              <Image className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <Input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              id="logo-upload"
                              onChange={handleFileChange}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById('logo-upload')?.click()}
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Logo
                            </Button>
                            <p className="text-xs text-muted-foreground mt-1">
                              Recommended size: 200x200px, PNG or JPEG
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="contact_phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter phone number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="contact_email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter email address" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="contact_website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter website URL" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="content" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="header_text"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Header Text</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter text to display at the top of receipts" 
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              This text appears below your business name at the top of receipts.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="footer_text"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Footer Text</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter text to display at the bottom of receipts" 
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              This text appears at the bottom of receipts (e.g., thank you messages, return policies).
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    
                    <TabsContent value="display" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="show_tax_details"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Show Tax Details</FormLabel>
                              <FormDescription>
                                Display tax breakdown on receipts.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="show_discount_details"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Show Discount Details</FormLabel>
                              <FormDescription>
                                Display discount information on receipts.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="include_customer_info"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Include Customer Information</FormLabel>
                              <FormDescription>
                                Show customer details on receipts when available.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </CardContent>
                </Card>
              </Tabs>
              
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending || logoUploadMutation.isPending}
                >
                  {updateMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
        
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Receipt Preview</CardTitle>
              <CardDescription>
                This is how your receipts will look to customers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-4 bg-white text-black text-sm max-h-[700px] overflow-y-auto">
                <div dangerouslySetInnerHTML={{ __html: htmlPreview }} />
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download Sample
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReceiptsConfiguration;
