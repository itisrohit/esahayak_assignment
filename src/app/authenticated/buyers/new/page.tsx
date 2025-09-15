"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { TagInput } from "@/components/ui/tag-input";
import { createClient } from "@/lib/supabase/client";
import { AlertCircle } from "lucide-react";
import { BuyerFormSchema } from "@/lib/schemas/buyer.schema";
import { z } from "zod";

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  propertyType: string;
  bhk: string;
  purpose: string;
  budgetMin: string;
  budgetMax: string;
  timeline: string;
  source: string;
  notes: string;
  tags: string[];
}

interface FormErrors {
  [key: string]: string;
}

export default function NewBuyerPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    propertyType: "",
    bhk: "",
    purpose: "",
    budgetMin: "",
    budgetMax: "",
    timeline: "",
    source: "",
    notes: "",
    tags: [],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const supabase = createClient();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user selects a value
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleTagsChange = (tags: string[]) => {
    setFormData((prev) => ({ ...prev, tags }));
  };

  // Map form BHK values to enum values for validation
  const mapBhkValueForValidation = (bhkValue: string): string => {
    switch (bhkValue) {
      case "1": return "ONE";
      case "2": return "TWO";
      case "3": return "THREE";
      case "4": return "FOUR";
      default: return bhkValue; // For "Studio" and any other values
    }
  };

  const validate = () => {
    try {
      // Transform form data to match schema expectations
      const transformedData = {
        ...formData,
        phone: formData.phone.replace(/\D/g, ''), // Remove all non-digit characters
        budgetMin: formData.budgetMin ? parseInt(formData.budgetMin) : null,
        budgetMax: formData.budgetMax ? parseInt(formData.budgetMax) : null,
        email: formData.email || null,
        notes: formData.notes || null,
        bhk: (formData.propertyType === "Apartment" || formData.propertyType === "Villa") 
          ? mapBhkValueForValidation(formData.bhk)
          : null,
      };

      // Validate using Zod schema
      BuyerFormSchema.parse(transformedData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.issues.forEach((issue) => {
          if (issue.path.length > 0) {
            const fieldName = issue.path[0];
            if (typeof fieldName === 'string') {
              newErrors[fieldName] = issue.message;
            }
          }
        });
        setErrors(newErrors);
        return false;
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      // Focus on the first error field
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          (element as HTMLElement).focus();
        }
      }
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast.error("Authentication error", {
          description: "Please log in again",
          descriptionClassName: "text-muted-foreground",
        });
        router.push("/login");
        return;
      }

      // Map form BHK values to enum values
      const mapBhkValue = (bhkValue: string): string => {
        switch (bhkValue) {
          case "1": return "ONE";
          case "2": return "TWO";
          case "3": return "THREE";
          case "4": return "FOUR";
          default: return bhkValue; // For "Studio" and any other values
        }
      };

      // Prepare data for API
      const buyerData = {
        fullName: formData.fullName,
        email: formData.email || null,
        phone: formData.phone.replace(/\D/g, ''), // Remove all non-digit characters
        city: formData.city,
        propertyType: formData.propertyType,
        bhk: (formData.propertyType === "Apartment" || formData.propertyType === "Villa") 
          ? mapBhkValue(formData.bhk)
          : null,
        purpose: formData.purpose,
        budgetMin: formData.budgetMin ? parseInt(formData.budgetMin) : null,
        budgetMax: formData.budgetMax ? parseInt(formData.budgetMax) : null,
        timeline: formData.timeline,
        source: formData.source || "Website",
        notes: formData.notes || null,
        tags: formData.tags,
        ownerId: user.id,
      };

      // Submit to API
      const response = await fetch("/api/buyers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buyerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create buyer");
      }

      toast.success("Buyer created successfully!", {
        description: "The new buyer lead has been added to your list",
        descriptionClassName: "text-muted-foreground",
      });
      
      router.push("/authenticated/buyers");
    } catch (error: unknown) {
      toast.error("Failed to create buyer", {
        description: error instanceof Error ? error.message : "Please try again",
        descriptionClassName: "text-muted-foreground",
      });
      console.error("Error creating buyer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle CSV file import
  const handleImportCSV = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Process CSV file
  const processCSVFile = async (file: File) => {
    setIsImporting(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n');
      
      if (lines.length < 2) {
        toast.error("Invalid CSV file", {
          description: "CSV file must contain headers and at least one row of data",
          descriptionClassName: "text-muted-foreground",
        });
        return;
      }

      // Parse headers
      const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
      
      // Required headers check (status is not required as it defaults to 'New')
      const requiredHeaders = ['fullName', 'email', 'phone', 'city', 'propertyType', 'bhk', 'purpose', 'budgetMin', 'budgetMax', 'timeline', 'source', 'notes', 'tags'];
      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
      
      if (missingHeaders.length > 0) {
        toast.error("Invalid CSV format", {
          description: `Missing required columns: ${missingHeaders.join(', ')}`,
          descriptionClassName: "text-muted-foreground",
        });
        return;
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast.error("Authentication error", {
          description: "Please log in again",
          descriptionClassName: "text-muted-foreground",
        });
        router.push("/login");
        return;
      }

      // Process each row
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
          const values = line.split(',').map(value => value.trim().replace(/"/g, ''));
          const row: Record<string, string> = {};
          
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });

          // Map BHK values to enum values
          const mapBhkValue = (bhkValue: string): string => {
            switch (bhkValue) {
              case "1": return "ONE";
              case "2": return "TWO";
              case "3": return "THREE";
              case "4": return "FOUR";
              default: return bhkValue;
            }
          };

          // Prepare data for API
          const buyerData = {
            fullName: row.fullName,
            email: row.email || null,
            phone: row.phone,
            city: row.city,
            propertyType: row.propertyType,
            bhk: (row.propertyType === "Apartment" || row.propertyType === "Villa") 
              ? mapBhkValue(row.bhk)
              : null,
            purpose: row.purpose,
            budgetMin: row.budgetMin ? parseInt(row.budgetMin) : null,
            budgetMax: row.budgetMax ? parseInt(row.budgetMax) : null,
            timeline: row.timeline,
            source: row.source || "Website",
            notes: row.notes || null,
            tags: row.tags ? row.tags.split(',').map(tag => tag.trim()) : [],
            ownerId: user.id,
          };

          // Submit to API
          const response = await fetch("/api/buyers", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(buyerData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to create buyer");
          }

          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Show results
      if (successCount > 0) {
        toast.success(`${successCount} buyer(s) imported successfully!`, {
          description: errorCount > 0 ? `${errorCount} record(s) failed to import` : "",
          descriptionClassName: "text-muted-foreground",
        });
      }

      if (errorCount > 0) {
        console.error("Import errors:", errors);
        toast.error(`${errorCount} buyer(s) failed to import`, {
          description: "Check console for details",
          descriptionClassName: "text-muted-foreground",
        });
      }

      // Refresh the page to show new buyers
      router.push("/authenticated/buyers");
    } catch (error) {
      toast.error("Failed to import CSV", {
        description: error instanceof Error ? error.message : "Please try again",
        descriptionClassName: "text-muted-foreground",
      });
      console.error("Error importing CSV:", error);
    } finally {
      setIsImporting(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast.error("Invalid file type", {
          description: "Please select a CSV file",
          descriptionClassName: "text-muted-foreground",
        });
        return;
      }
      
      processCSVFile(file);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
      <Link
        href="/authenticated/buyers"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary mb-4 focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-2 py-1"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        Back to buyers
      </Link>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Add New Buyer</CardTitle>
            <Button variant="outline" onClick={handleImportCSV} disabled={isImporting}>
              {isImporting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></span>
                  Importing...
                </>
              ) : (
                "Import CSV"
              )}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,text/csv"
              className="hidden"
            />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter full name"
                aria-invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? "fullName-error" : undefined}
              />
              {errors.fullName && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p id="fullName-error" className="text-red-500 text-sm" role="alert">
                    {errors.fullName}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email address"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p id="email-error" className="text-red-500 text-sm" role="alert">
                    {errors.email}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "phone-error" : undefined}
              />
              {errors.phone && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p id="phone-error" className="text-red-500 text-sm" role="alert">
                    {errors.phone}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Select
                name="city"
                value={formData.city}
                onValueChange={(value) => handleSelectChange("city", value)}
              >
                <SelectTrigger 
                  aria-invalid={!!errors.city}
                  aria-describedby={errors.city ? "city-error" : undefined}
                >
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Chandigarh">Chandigarh</SelectItem>
                  <SelectItem value="Mohali">Mohali</SelectItem>
                  <SelectItem value="Zirakpur">Zirakpur</SelectItem>
                  <SelectItem value="Panchkula">Panchkula</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.city && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p id="city-error" className="text-red-500 text-sm" role="alert">
                    {errors.city}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="propertyType">Property Type *</Label>
              <Select
                name="propertyType"
                value={formData.propertyType}
                onValueChange={(value) => handleSelectChange("propertyType", value)}
              >
                <SelectTrigger 
                  aria-invalid={!!errors.propertyType}
                  aria-describedby={errors.propertyType ? "propertyType-error" : undefined}
                >
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Apartment">Apartment</SelectItem>
                  <SelectItem value="Villa">Villa</SelectItem>
                  <SelectItem value="Plot">Plot</SelectItem>
                  <SelectItem value="Office">Office</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                </SelectContent>
              </Select>
              {errors.propertyType && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p id="propertyType-error" className="text-red-500 text-sm" role="alert">
                    {errors.propertyType}
                  </p>
                </div>
              )}
            </div>

            {(formData.propertyType === "Apartment" ||
              formData.propertyType === "Villa") && (
              <div className="space-y-2">
                <Label htmlFor="bhk">BHK *</Label>
                <Select
                  name="bhk"
                  value={formData.bhk}
                  onValueChange={(value) => handleSelectChange("bhk", value)}
                >
                  <SelectTrigger 
                    aria-invalid={!!errors.bhk}
                    aria-describedby={errors.bhk ? "bhk-error" : undefined}
                  >
                    <SelectValue placeholder="Select BHK" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 BHK</SelectItem>
                    <SelectItem value="2">2 BHK</SelectItem>
                    <SelectItem value="3">3 BHK</SelectItem>
                    <SelectItem value="4">4 BHK</SelectItem>
                    <SelectItem value="Studio">Studio</SelectItem>
                  </SelectContent>
                </Select>
                {errors.bhk && (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p id="bhk-error" className="text-red-500 text-sm" role="alert">
                      {errors.bhk}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose *</Label>
              <Select
                name="purpose"
                value={formData.purpose}
                onValueChange={(value) => handleSelectChange("purpose", value)}
              >
                <SelectTrigger 
                  aria-invalid={!!errors.purpose}
                  aria-describedby={errors.purpose ? "purpose-error" : undefined}
                >
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Buy">Buy</SelectItem>
                  <SelectItem value="Rent">Rent</SelectItem>
                </SelectContent>
              </Select>
              {errors.purpose && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p id="purpose-error" className="text-red-500 text-sm" role="alert">
                    {errors.purpose}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="budgetMin">Minimum Budget</Label>
              <Input
                id="budgetMin"
                name="budgetMin"
                type="number"
                value={formData.budgetMin}
                onChange={handleInputChange}
                placeholder="Enter minimum budget"
                aria-invalid={!!errors.budgetMin}
                aria-describedby={errors.budgetMin ? "budgetMin-error" : undefined}
              />
              {errors.budgetMin && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p id="budgetMin-error" className="text-red-500 text-sm" role="alert">
                    {errors.budgetMin}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="budgetMax">Maximum Budget</Label>
              <Input
                id="budgetMax"
                name="budgetMax"
                type="number"
                value={formData.budgetMax}
                onChange={handleInputChange}
                placeholder="Enter maximum budget"
                aria-invalid={!!errors.budgetMax}
                aria-describedby={errors.budgetMax ? "budgetMax-error" : undefined}
              />
              {errors.budgetMax && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p id="budgetMax-error" className="text-red-500 text-sm" role="alert">
                    {errors.budgetMax}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeline">Timeline *</Label>
              <Select
                name="timeline"
                value={formData.timeline}
                onValueChange={(value) => handleSelectChange("timeline", value)}
              >
                <SelectTrigger 
                  aria-invalid={!!errors.timeline}
                  aria-describedby={errors.timeline ? "timeline-error" : undefined}
                >
                  <SelectValue placeholder="Select timeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ZERO_TO_THREE_M">0-3 months</SelectItem>
                  <SelectItem value="THREE_TO_SIX_M">3-6 months</SelectItem>
                  <SelectItem value="GREATER_THAN_SIX_M">&gt;6 months</SelectItem>
                  <SelectItem value="Exploring">Exploring</SelectItem>
                </SelectContent>
              </Select>
              {errors.timeline && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p id="timeline-error" className="text-red-500 text-sm" role="alert">
                    {errors.timeline}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Select
                name="source"
                value={formData.source}
                onValueChange={(value) => handleSelectChange("source", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Website">Website</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Walk_in">Walk-in</SelectItem>
                  <SelectItem value="Call">Call</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes about the buyer"
                rows={4}
                aria-describedby={errors.notes ? "notes-error" : undefined}
              />
              {errors.notes && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p id="notes-error" className="text-red-500 text-sm" role="alert">
                    {errors.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="tags">Tags</Label>
              <TagInput
                value={formData.tags}
                onChange={handleTagsChange}
                suggestions={["Hot Lead", "Cold Lead", "Follow Up", "Site Visit", "Qualified", "Converted"]}
                aria-describedby={errors.tags ? "tags-error" : undefined}
              />
              {errors.tags && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p id="tags-error" className="text-red-500 text-sm" role="alert">
                    {errors.tags}
                  </p>
                </div>
              )}
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || isImporting}
            className="focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></span>
                Creating...
              </>
            ) : (
              "Create Buyer"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
