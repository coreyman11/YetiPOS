import React from 'react';
import { MapPin, Phone, Mail, Clock, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface StorefrontFooterProps {
  store: any;
  onNavigate: (page: string) => void;
}

export function StorefrontFooter({ store, onNavigate }: StorefrontFooterProps) {
  const footerStyle = store.footer_style || 'standard';
  const isMinimal = footerStyle === 'minimal';
  const isBold = store.layout_style === 'bold';

  const footerBgColor = isBold ? store.primary_color : 'hsl(var(--background))';
  const textColor = isBold ? '#ffffff' : store.secondary_color;
  const borderColor = isBold ? store.accent_color : 'hsl(var(--border))';

  const quickLinks = [
    { label: 'Home', url: 'home' },
    { label: 'Shop', url: 'shop' },
    { label: 'About Us', url: 'about' },
    { label: 'Contact', url: 'contact' },
  ];

  const socialLinks = [
    { icon: Facebook, label: 'Facebook', url: '#' },
    { icon: Twitter, label: 'Twitter', url: '#' },
    { icon: Instagram, label: 'Instagram', url: '#' },
    { icon: Youtube, label: 'YouTube', url: '#' },
  ];

  if (isMinimal) {
    return (
      <footer 
        className="border-t py-4"
        style={{
          backgroundColor: footerBgColor,
          borderColor: borderColor
        }}
      >
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm" style={{ color: textColor }}>
              © 2024 {store.name}. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {quickLinks.slice(0, 3).map((link) => (
                <button
                  key={link.url}
                  onClick={() => onNavigate(link.url)}
                  className="text-sm hover:opacity-70 transition-opacity"
                  style={{ color: textColor }}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer 
      className="border-t py-12"
      style={{
        backgroundColor: footerBgColor,
        borderColor: borderColor
      }}
    >
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Store Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: textColor }}>
              {store.name}
            </h3>
            {store.description && (
              <p className="text-sm opacity-80" style={{ color: textColor }}>
                {store.description.slice(0, 120)}...
              </p>
            )}
            <div className="flex space-x-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.url}
                  className="p-2 rounded-full border hover:opacity-70 transition-opacity"
                  style={{ 
                    borderColor: isBold ? 'rgba(255,255,255,0.2)' : 'hsl(var(--border))',
                    color: textColor 
                  }}
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold" style={{ color: textColor }}>Quick Links</h4>
            <div className="space-y-2">
              {quickLinks.map((link) => (
                <button
                  key={link.url}
                  onClick={() => onNavigate(link.url)}
                  className="block text-sm hover:opacity-70 transition-opacity text-left"
                  style={{ color: textColor }}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-semibold" style={{ color: textColor }}>Contact Info</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: store.accent_color }} />
                <div style={{ color: textColor }}>
                  <p>Visit our store for the</p>
                  <p>complete shopping experience</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 flex-shrink-0" style={{ color: store.accent_color }} />
                <span style={{ color: textColor }}>Call us for inquiries</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 flex-shrink-0" style={{ color: store.accent_color }} />
                <span style={{ color: textColor }}>Email us for support</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 flex-shrink-0" style={{ color: store.accent_color }} />
                <span style={{ color: textColor }}>Check our store hours</span>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="font-semibold" style={{ color: textColor }}>Stay Updated</h4>
            <p className="text-sm opacity-80" style={{ color: textColor }}>
              Subscribe to get updates on new products and special offers.
            </p>
            <div className="space-y-2">
              <Input 
                type="email" 
                placeholder="Enter your email"
                className="bg-transparent border-opacity-30"
                style={{ 
                  borderColor: isBold ? 'rgba(255,255,255,0.3)' : 'hsl(var(--border))',
                  color: textColor
                }}
              />
              <Button 
                size="sm" 
                className="w-full"
                style={{ 
                  backgroundColor: store.accent_color,
                  color: '#ffffff',
                  borderColor: store.accent_color
                }}
              >
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-8" style={{ backgroundColor: borderColor }} />

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm opacity-80" style={{ color: textColor }}>
            © 2024 {store.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <button 
              className="hover:opacity-70 transition-opacity"
              style={{ color: textColor }}
            >
              Privacy Policy
            </button>
            <button 
              className="hover:opacity-70 transition-opacity"
              style={{ color: textColor }}
            >
              Terms of Service
            </button>
            <span className="opacity-60" style={{ color: textColor }}>
              Powered by{" "}
              <a 
                href="https://timberpos.vercel.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:opacity-70"
              >
                TimberPOS
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}