"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { TagInput } from "@/components/ui/tag-input";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Buyer {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  city: string;
  propertyType: string;
  bhk: string | null;
  purpose: string;
  budgetMin: number | null;
  budgetMax: number | null;
  timeline: string;
  source: string;
  notes: string | null;
  tags: string[];
  updatedAt: string;
  createdAt: string;
  status: string;
  ownerId: string; // Add ownerId to the interface
}

interface BuyerHistory {
  id: string;
  buyerId: string;
  changedBy: string;
  changedAt: string;
  diff: Record<string, { oldValue: string; newValue: string }>;
}

interface FormErrors {
  [key: string]: string;
}

interface User {
  id: string;
  email: string | null;
}

export default function BuyerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [formData, setFormData] = useState<Buyer | null>(null);
  const [history, setHistory] = useState<BuyerHistory[]>([]);
  const [errors] = useState<FormErrors>({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null); // Add current user state

  // Map database BHK values to form values
  const mapBhkToFormValue = (bhkValue: string | null): string => {
    if (!bhkValue) return "";
    switch (bhkValue) {
      case "ONE": return "1";
      case "TWO": return "2";
      case "THREE": return "3";
      case "FOUR": return "4";
      default: return bhkValue; // For "Studio" and any other values
    }
  };

  // Map form BHK values to database enum values
  const mapBhkToEnumValue = (bhkValue: string): string => {
    switch (bhkValue) {
      case "1": return "ONE";
      case "2": return "TWO";
      case "3": return "THREE";
      case "4": return "FOUR";
      default: return bhkValue; // For "Studio" and any other values
    }
  };

  // Check if current user is the owner of the buyer
  const isOwner = formData && currentUser && formData.ownerId === currentUser.id;

  const fetchBuyer = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/buyers/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch buyer");
      }

      const buyer = await response.json();
      
      // Map BHK value for display
      const buyerWithMappedBhk = {
        ...buyer,
        bhk: mapBhkToFormValue(buyer.bhk),
      };
      
      setFormData(buyerWithMappedBhk);
    } catch (error) {
      toast.error("Failed to load buyer", {
        description: "Please try again",
        descriptionClassName: "text-muted-foreground",
      });
      console.error("Error fetching buyer:", error);
      router.push("/authenticated/buyers");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch(`/api/buyers/${id}/history`);

      if (!response.ok) {
        throw new Error("Failed to fetch history");
      }

      const historyData = await response.json();
      setHistory(historyData);
    } catch (error) {
      console.error("Error fetching history:", error);
      // Don't show error toast for history as it's not critical
    }
  }, [id]);

  // Fetch current user
  const fetchCurrentUser = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        router.push("/login");
        return;
      }
      
      setCurrentUser({
        id: user.id,
        email: user.email || null,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (id) {
      fetchCurrentUser(); // Fetch current user first
      fetchBuyer();
      fetchHistory();
    }
  }, [id, fetchBuyer, fetchHistory, fetchCurrentUser]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      if (!prev) return null;
      return { ...prev, [name]: value };
    });
  };

  const handleSelectChange = (name: string, value: string | string[]) => {
    setFormData((prev) => {
      if (!prev) return null;
      return { ...prev, [name]: value };
    });
  };

  const handleTagsChange = (tags: string[]) => {
    setFormData((prev) => {
      if (!prev) return null;
      return { ...prev, tags };
    });
  };

  const validate = () => {
    const newErrors: FormErrors = {};

    if (!formData) return false;

    if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
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
      !formData.bhk
    ) {
      newErrors.bhk = "BHK is required for Apartment or Villa";
    }

    if (!formData.purpose) {
      newErrors.purpose = "Purpose is required";
    }

    const budgetMin = formData.budgetMin || 0;
    const budgetMax = formData.budgetMax || 0;

    if (formData.budgetMin && isNaN(budgetMin)) {
      newErrors.budgetMin = "Minimum budget must be a number";
    }

    if (formData.budgetMax && isNaN(budgetMax)) {
      newErrors.budgetMax = "Maximum budget must be a number";
    }

    if (formData.budgetMin && formData.budgetMax && budgetMin > budgetMax) {
      newErrors.budgetMax =
        "Maximum budget must be greater than or equal to minimum";
    }

    if (!formData.timeline) {
      newErrors.timeline = "Timeline is required";
    }

    // Update errors state
    // In a real implementation, we would set the errors state here
    // For now, we're just returning the validation result

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !formData) {
      return;
    }

    // Check if user is owner before allowing edit
    if (!isOwner) {
      toast.error("Unauthorized", {
        description: "You can only edit your own buyers",
        descriptionClassName: "text-muted-foreground",
      });
      return;
    }

    // Prepare data for API
    const buyerData = {
      ...formData,
      bhk: (formData.propertyType === "Apartment" || formData.propertyType === "Villa") 
        ? mapBhkToEnumValue(formData.bhk || "")
        : null,
    };

    try {
      const response = await fetch(`/api/buyers/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buyerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Handle concurrency error
        if (response.status === 409) {
          toast.error("Record changed", {
            description: "The record has been modified by another user. Please refresh and try again.",
            descriptionClassName: "text-muted-foreground",
          });
          return;
        }
        throw new Error(errorData.error || "Failed to update buyer");
      }

      toast.success("Buyer updated successfully!", {
        descriptionClassName: "text-muted-foreground",
      });

      // Refresh data
      await fetchBuyer();
      await fetchHistory();
      setIsEditing(false);
    } catch (error: unknown) {
      toast.error("Failed to update buyer", {
        description: (error as Error).message || "Please try again",
        descriptionClassName: "text-muted-foreground",
      });
      console.error("Error updating buyer:", error);
    }
  };

  const exportCSV = () => {
    if (!formData) {
      toast.error("No data to export", {
        description: "Buyer data is not available",
        descriptionClassName: "text-muted-foreground",
      });
      return;
    }

    // Define the headers that match the import template
    const headers = ['fullName', 'email', 'phone', 'city', 'propertyType', 'bhk', 'purpose', 'budgetMin', 'budgetMax', 'timeline', 'source', 'notes', 'tags'];
    
    // Create the CSV row with current buyer data
    const csvRow = [
      `"${formData.fullName}"`,
      `"${formData.email || ''}"`,
      `"${formData.phone}"`,
      `"${formData.city}"`,
      `"${formData.propertyType}"`,
      `"${formData.bhk || ''}"`,
      `"${formData.purpose}"`,
      `"${formData.budgetMin || ''}"`,
      `"${formData.budgetMax || ''}"`,
      `"${formData.timeline}"`,
      `"${formData.source}"`,
      `"${formData.notes || ''}"`,
      `"${formData.tags.join(', ')}"`
    ];

    // Combine header and data
    const csvContent = [headers.join(","), csvRow.join(",")].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.download = `buyer_${id}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async () => {
    if (!formData) return;

    // Check if user is owner before allowing delete
    if (!isOwner) {
      toast.error("Unauthorized", {
        description: "You can only delete your own buyers",
        descriptionClassName: "text-muted-foreground",
      });
      return;
    }

    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete ${formData.fullName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/buyers/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Check if it's a network error
        if (errorData.error && errorData.error.includes("Can't reach database")) {
          throw new Error("Unable to connect to database. Please check your internet connection and try again.");
        }
        throw new Error(errorData.error || "Failed to delete buyer");
      }

      toast.success("Buyer deleted successfully!", {
        descriptionClassName: "text-muted-foreground",
      });

      // Redirect to buyers list
      router.push("/authenticated/buyers");
    } catch (error: unknown) {
      toast.error("Failed to delete buyer", {
        description: (error as Error).message || "Please check your internet connection and try again",
        descriptionClassName: "text-muted-foreground",
      });
      console.error("Error deleting buyer:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">Buyer not found</h3>
          <p className="text-muted-foreground mb-4">
            The requested buyer could not be found
          </p>
          <Link href="/authenticated/buyers">
            <Button>Back to buyers</Button>
          </Link>
        </div>
      </div>
    );
  }

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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>View / Edit Buyer</CardTitle>
          <div className="flex items-center gap-2">
            {isOwner && ( // Only show delete button to owner
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            )}
            {isOwner && ( // Only show edit button to owner
              <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? "Cancel" : "Edit"}
              </Button>
            )}
            <Button variant="outline" onClick={exportCSV}>
              Export as CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            <input type="hidden" name="updatedAt" value={formData.updatedAt} />
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                disabled={!isEditing}
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
                value={formData.email || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
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
                disabled={!isEditing}
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
                disabled={!isEditing}
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
                onValueChange={(value) =>
                  handleSelectChange("propertyType", value)
                }
                disabled={!isEditing}
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
                  value={formData.bhk || ""}
                  onValueChange={(value) => handleSelectChange("bhk", value)}
                  disabled={!isEditing}
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
                disabled={!isEditing}
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
                value={formData.budgetMin || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
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
                value={formData.budgetMax || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
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
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ZERO_TO_THREE_M">0-3 months</SelectItem>
                  <SelectItem value="THREE_TO_SIX_M">3-6 months</SelectItem>
                  <SelectItem value="GREATER_THAN_SIX_M">
                    {">"}6 months
                  </SelectItem>
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
                disabled={!isEditing}
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
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                name="status"
                value={formData.status}
                onValueChange={(value) => handleSelectChange("status", value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Qualified">Qualified</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Visited">Visited</SelectItem>
                  <SelectItem value="Negotiation">Negotiation</SelectItem>
                  <SelectItem value="Converted">Converted</SelectItem>
                  <SelectItem value="Dropped">Dropped</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Additional notes about the buyer"
                rows={4}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="tags">Tags</Label>
              {isEditing ? (
                <TagInput
                  value={formData.tags}
                  onChange={handleTagsChange}
                  suggestions={[
                    "Hot Lead",
                    "Cold Lead",
                    "Follow Up",
                    "Site Visit",
                    "Qualified",
                    "Converted",
                  ]}
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                  {formData.tags.length === 0 && (
                    <span className="text-muted-foreground text-sm">
                      No tags
                    </span>
                  )}
                </div>
              )}
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end">
          {isEditing && isOwner && <Button onClick={handleSubmit}>Save Changes</Button>}
        </CardFooter>
      </Card>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Buyer History</h2>
        {history.length === 0 ? (
          <p className="text-muted-foreground">No history available</p>
        ) : (
          <div className="border-l-2 border-gray-200 dark:border-gray-700 ml-2">
            {history
              .slice(-5)
              .reverse()
              .map((h) => {
                // Get all field changes for this history entry
                const fieldChanges = Object.entries(h.diff || {}).map(([field, values]) => ({
                  field,
                  oldValue: values?.oldValue ?? "N/A",
                  newValue: values?.newValue ?? "N/A"
                }));

                return (
                  <div key={h.id} className="relative pl-8 py-4">
                    <div className="absolute left-0 top-5 -translate-x-1/2 w-4 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                    <div className="grid gap-1 text-sm">
                      {fieldChanges.map((change, index) => (
                        <div key={index} className="mb-1 last:mb-0">
                          <span className="font-semibold">{change.field}</span> changed
                          <div className="text-muted-foreground">
                            <span className="line-through">{String(change.oldValue)}</span> →{" "}
                            <span className="text-primary">{String(change.newValue)}</span>
                          </div>
                        </div>
                      ))}
                      <div className="text-xs text-muted-foreground mt-2">
                        {new Date(h.changedAt).toLocaleString()} by{" "}
                        {h.changedBy}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
