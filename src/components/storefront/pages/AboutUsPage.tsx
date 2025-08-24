import React from 'react';
import { MapPin, Phone, Mail, Clock, Star, Users, Award, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface AboutUsPageProps {
  store: any;
  pageContent?: {
    content: string;
  };
}

export function AboutUsPage({ store, pageContent }: AboutUsPageProps) {
  // Default content if no custom content is provided
  const defaultContent = {
    mission: "We are committed to providing exceptional products and outstanding customer service. Our passion for quality drives everything we do, from carefully selecting our products to ensuring each customer has a memorable shopping experience.",
    story: "Founded with a vision to create a unique shopping destination, our store has grown from a small local business to a trusted name in the community. We believe in building lasting relationships with our customers and supporting our local community.",
    values: [
      { icon: Star, title: "Quality First", description: "We source only the finest products that meet our high standards." },
      { icon: Users, title: "Customer Focus", description: "Your satisfaction is our top priority in everything we do." },
      { icon: Award, title: "Excellence", description: "We strive for excellence in every aspect of our business." },
      { icon: Heart, title: "Community", description: "We're proud to be part of and give back to our community." }
    ]
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold" style={{ color: store.primary_color }}>
          About {store.name}
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Discover our story, values, and commitment to exceptional service
        </p>
      </div>

      {/* Custom Content or Default Mission */}
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8">
            {pageContent?.content ? (
              <div 
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: pageContent.content }}
                style={{ color: store.secondary_color }}
              />
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-4" style={{ color: store.primary_color }}>
                    Our Mission
                  </h2>
                  <p className="text-lg leading-relaxed" style={{ color: store.secondary_color }}>
                    {defaultContent.mission}
                  </p>
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold mb-4" style={{ color: store.primary_color }}>
                    Our Story
                  </h2>
                  <p className="text-lg leading-relaxed" style={{ color: store.secondary_color }}>
                    {defaultContent.story}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Values Section */}
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-center" style={{ color: store.primary_color }}>
          Our Values
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {defaultContent.values.map((value, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div 
                  className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${store.accent_color}20` }}
                >
                  <value.icon 
                    className="h-8 w-8" 
                    style={{ color: store.accent_color }}
                  />
                </div>
                <h3 className="text-xl font-semibold" style={{ color: store.primary_color }}>
                  {value.title}
                </h3>
                <p className="text-muted-foreground">
                  {value.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-muted/30 rounded-lg p-8">
        <h2 className="text-3xl font-bold text-center mb-8" style={{ color: store.primary_color }}>
          Visit Our Store
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center space-y-2">
            <MapPin className="h-8 w-8 mx-auto" style={{ color: store.accent_color }} />
            <h3 className="font-semibold" style={{ color: store.primary_color }}>Location</h3>
            <p className="text-sm text-muted-foreground">
              Visit us at our store location<br />
              for the full shopping experience
            </p>
          </div>
          
          <div className="text-center space-y-2">
            <Phone className="h-8 w-8 mx-auto" style={{ color: store.accent_color }} />
            <h3 className="font-semibold" style={{ color: store.primary_color }}>Phone</h3>
            <p className="text-sm text-muted-foreground">
              Call us for any questions<br />
              or special requests
            </p>
          </div>
          
          <div className="text-center space-y-2">
            <Mail className="h-8 w-8 mx-auto" style={{ color: store.accent_color }} />
            <h3 className="font-semibold" style={{ color: store.primary_color }}>Email</h3>
            <p className="text-sm text-muted-foreground">
              Reach out via email for<br />
              support and inquiries
            </p>
          </div>
          
          <div className="text-center space-y-2">
            <Clock className="h-8 w-8 mx-auto" style={{ color: store.accent_color }} />
            <h3 className="font-semibold" style={{ color: store.primary_color }}>Hours</h3>
            <p className="text-sm text-muted-foreground">
              Check our operating hours<br />
              before your visit
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center space-y-6">
        <h2 className="text-3xl font-bold" style={{ color: store.primary_color }}>
          Ready to Shop?
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore our carefully curated collection of products and experience the difference quality makes.
        </p>
        <Button 
          size="lg" 
          className="text-lg px-8 py-3"
          style={{ 
            backgroundColor: store.accent_color,
            color: '#ffffff',
            borderColor: store.accent_color
          }}
        >
          Shop Now
        </Button>
      </div>
    </div>
  );
}