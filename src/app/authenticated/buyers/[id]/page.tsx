"use client";

import { useState, useEffect } from "react";
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

import { mockData, mockHistory } from "@/lib/data";

interface Buyer {
  id: number;
  name: string;
  fullName?: string;
  email: string;
  phone: string;
  city: string;
  propertyType: string;
  bhk: string;
  purpose: string;
  budget: {
    min: number;
    max: number;
  };
  budgetMin?: number;
  budgetMax?: number;
  timeline: string;
  source: string;
  notes: string;
  tags: string[];
  updatedAt: string;
  status: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function BuyerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [formData, setFormData] = useState<Buyer | null>(null);
  const [errors] = useState<FormErrors>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (id) {
      const buyer = mockData.find((b) => b.id === parseInt(id as string));
      if (buyer) {
        setFormData({
          ...buyer,
          fullName: buyer.name,
          budgetMin: buyer.budget.min,
          budgetMax: buyer.budget.max,
        });
      } else {
        toast.error("Buyer not found");
        router.push("/authenticated/buyers");
      }
    }
  }, [id, router]);

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

  const validate = () => {
    // Same validation as NewBuyerPage
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate() && formData) {
      // Concurrency Check
      const currentBuyer = mockData.find(
        (b) => b.id === parseInt(id as string),
      );
      if (currentBuyer && currentBuyer.updatedAt !== formData.updatedAt) {
        toast.error(
          "This record has been changed by someone else. Please refresh the page.",
        );
        return;
      }

      console.log("Form data submitted:", formData);
      toast.success("Buyer updated successfully!");
      router.push("/authenticated/buyers");
    }
  };

  const exportHistory = () => {
    const headers = ["Field", "Old Value", "New Value", "Timestamp", "User"];
    const csvContent = [
      headers.join(","),
      ...mockHistory.map((h) =>
        [
          h.field,
          `"${h.oldValue}"`,
          `"${h.newValue}"`,
          h.timestamp,
          h.user,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.download = `buyer_${id}_history.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!formData) {
    return <div>Loading...</div>;
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
            <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? "Cancel" : "Edit"}
            </Button>
            <Button variant="outline" onClick={exportHistory}>
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
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                disabled={!isEditing}
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
                disabled={!isEditing}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm">{errors.phone}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="propertyType">Property Type</Label>
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
                  <SelectItem value="House">House</SelectItem>
                  <SelectItem value="Condo">Condo</SelectItem>
                  <SelectItem value="Townhouse">Townhouse</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(formData.propertyType === "Apartment" ||
              formData.propertyType === "Villa") && (
              <div className="space-y-2">
                <Label htmlFor="bhk">BHK</Label>
                <Input
                  id="bhk"
                  name="bhk"
                  value={formData.bhk}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
                {errors.bhk && (
                  <p className="text-red-500 text-sm">{errors.bhk}</p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
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
                  <SelectItem value="End-use">End-use</SelectItem>
                  <SelectItem value="Investment">Investment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budgetMin">Minimum Budget</Label>
              <Input
                id="budgetMin"
                name="budgetMin"
                type="number"
                value={formData.budgetMin}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budgetMax">Maximum Budget</Label>
              <Input
                id="budgetMax"
                name="budgetMax"
                type="number"
                value={formData.budgetMax}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              {errors.budgetMax && (
                <p className="text-red-500 text-sm">{errors.budgetMax}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeline">Timeline</Label>
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
                  <SelectItem value="Immediate">Immediate</SelectItem>
                  <SelectItem value="3-6 months">3-6 months</SelectItem>
                  <SelectItem value="6-12 months">6-12 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                name="source"
                value={formData.source}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="tags">Tags</Label>
              {isEditing ? (
                <TagInput
                  value={formData.tags}
                  onChange={(tags) => handleSelectChange("tags", tags)}
                  suggestions={[
                    "Hot Lead",
                    "Cold Lead",
                    "Follow Up",
                    "Site Visit",
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
                </div>
              )}
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end">
          {isEditing && <Button onClick={handleSubmit}>Save Changes</Button>}
        </CardFooter>
      </Card>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Buyer History</h2>
        <div className="border-l-2 border-gray-200 dark:border-gray-700 ml-2">
          {mockHistory
            .slice(-5)
            .reverse()
            .map((h) => (
              <div key={h.id} className="relative pl-8 py-4">
                <div className="absolute left-0 top-5 -translate-x-1/2 w-4 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                <div className="grid gap-1 text-sm">
                  <div>
                    <span className="font-semibold">{h.field}</span> changed
                  </div>
                  <div className="text-muted-foreground">
                    <span className="line-through">{h.oldValue}</span> →{" "}
                    <span className="text-primary">{h.newValue}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(h.timestamp).toLocaleString()} by {h.user}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
