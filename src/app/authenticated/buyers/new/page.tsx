"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useState } from "react";
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

  const validate = () => {
    const newErrors: FormErrors = {};

    if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }

    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required";
    } else {
      // Strip non-digit characters and validate length
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (phoneDigits.length < 10 || phoneDigits.length > 15) {
        newErrors.phone = "Phone must be 10-15 digits";
      }
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.propertyType) {
      newErrors.propertyType = "Property type is required";
    }

    if (
      (formData.propertyType === "Apartment" ||
        formData.propertyType === "Villa") &&
      !formData.bhk.trim()
    ) {
      newErrors.bhk = "BHK is required for Apartment or Villa";
    }

    if (!formData.purpose) {
      newErrors.purpose = "Purpose is required";
    }

    const budgetMin = parseFloat(formData.budgetMin) || 0;
    const budgetMax = parseFloat(formData.budgetMax) || 0;

    if (formData.budgetMin && isNaN(budgetMin)) {
      newErrors.budgetMin = "Minimum budget must be a number";
    }

    if (formData.budgetMax && isNaN(budgetMax)) {
      newErrors.budgetMax = "Maximum budget must be a number";
    }

    if (formData.budgetMin && formData.budgetMax && budgetMin > budgetMax) {
      newErrors.budgetMax = "Maximum budget must be greater than or equal to minimum";
    }

    if (!formData.timeline) {
      newErrors.timeline = "Timeline is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
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
        phone: formData.phone,
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

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
      <Link
        href="/authenticated/buyers"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary mb-4"
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
          <CardTitle>Add New Buyer</CardTitle>
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
              />
              {errors.fullName && (
                <p className="text-red-500 text-sm">{errors.fullName}</p>
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
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
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
              />
              {errors.phone && (
                <p className="text-red-500 text-sm">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Select
                name="city"
                value={formData.city}
                onValueChange={(value) => handleSelectChange("city", value)}
              >
                <SelectTrigger>
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
                <p className="text-red-500 text-sm">{errors.city}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="propertyType">Property Type *</Label>
              <Select
                name="propertyType"
                value={formData.propertyType}
                onValueChange={(value) => handleSelectChange("propertyType", value)}
              >
                <SelectTrigger>
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
                <p className="text-red-500 text-sm">{errors.propertyType}</p>
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
                  <SelectTrigger>
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
                  <p className="text-red-500 text-sm">{errors.bhk}</p>
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
                <SelectTrigger>
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Buy">Buy</SelectItem>
                  <SelectItem value="Rent">Rent</SelectItem>
                </SelectContent>
              </Select>
              {errors.purpose && (
                <p className="text-red-500 text-sm">{errors.purpose}</p>
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
              />
              {errors.budgetMin && (
                <p className="text-red-500 text-sm">{errors.budgetMin}</p>
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
              />
              {errors.budgetMax && (
                <p className="text-red-500 text-sm">{errors.budgetMax}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeline">Timeline *</Label>
              <Select
                name="timeline"
                value={formData.timeline}
                onValueChange={(value) => handleSelectChange("timeline", value)}
              >
                <SelectTrigger>
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
                <p className="text-red-500 text-sm">{errors.timeline}</p>
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
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="tags">Tags</Label>
              <TagInput
                value={formData.tags}
                onChange={handleTagsChange}
                suggestions={["Hot Lead", "Cold Lead", "Follow Up", "Site Visit", "Qualified", "Converted"]}
              />
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSubmit} disabled={isSubmitting}>
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
