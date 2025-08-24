
import React from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface ContactFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  marketingConsent: boolean;
  onMarketingConsentChange: (checked: boolean) => void;
  emailError?: string;
}

export const ContactForm = ({
  email,
  onEmailChange,
  marketingConsent,
  onMarketingConsentChange,
  emailError
}: ContactFormProps) => {
  return (
    <div className="bg-white rounded-lg border p-3 shadow-sm">
      <h3 className="font-medium text-sm mb-2">Contact</h3>
      
      <div className="space-y-3">
        <div>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className={`${emailError ? "border-red-300" : ""} h-9`}
            placeholder="Email"
          />
          {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
        </div>
        
        <div className="flex items-center">
          <Checkbox
            id="marketingConsent"
            checked={marketingConsent}
            onCheckedChange={(checked) => onMarketingConsentChange(checked as boolean)}
          />
          <label 
            htmlFor="marketingConsent" 
            className="text-xs text-muted-foreground ml-2"
          >
            Email me with news and offers
          </label>
        </div>
      </div>
    </div>
  );
};
