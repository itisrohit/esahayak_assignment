"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

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
  status: string;
  notes: string | null;
  tags: string[];
  ownerId: string;
  updatedAt: string;
  createdAt: string;
}

// Format budget display
const formatBudget = (min: number | null, max: number | null) => {
  if (!min && !max) return "N/A";
  if (!min) return `Up to ₹${max?.toLocaleString()}`;
  if (!max) return `₹${min?.toLocaleString()}+`;
  return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};



export default function BuyersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Get initial filter values from URL
  const initialSearchTerm = searchParams.get("searchTerm") || "";
  const initialCity = searchParams.get("city") || "all";
  const initialPropertyType = searchParams.get("propertyType") || "all";
  const initialStatus = searchParams.get("status") || "all";
  const initialTimeline = searchParams.get("timeline") || "all";

  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [city, setCity] = useState(initialCity);
  const [propertyType, setPropertyType] = useState(initialPropertyType);
  const [status, setStatus] = useState(initialStatus);
  const [timeline, setTimeline] = useState(initialTimeline);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Update URL when filters change
  const updateUrl = (params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams.toString());

    // Clear all filters first
    newParams.delete("searchTerm");
    newParams.delete("city");
    newParams.delete("propertyType");
    newParams.delete("status");
    newParams.delete("timeline");
    newParams.delete("page");

    // Set new filters
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== "all") {
        newParams.set(key, value);
      }
    });

    // Set page if not 1
    if (currentPage > 1) {
      newParams.set("page", currentPage.toString());
    }

    const newUrl = `/authenticated/buyers?${newParams.toString()}`;
    router.push(newUrl, { scroll: false });
  };

  // Debounced search
  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    updateUrl({
      ...(value && { searchTerm: value }),
      ...(city !== "all" && { city }),
      ...(propertyType !== "all" && { propertyType }),
      ...(status !== "all" && { status }),
      ...(timeline !== "all" && { timeline }),
    });
  }, 300);

  // Handle filter changes
  const handleCityChange = (value: string) => {
    setCity(value);
    setCurrentPage(1);
    updateUrl({
      ...(searchTerm && { searchTerm }),
      ...(value !== "all" && { city: value }),
      ...(propertyType !== "all" && { propertyType }),
      ...(status !== "all" && { status }),
      ...(timeline !== "all" && { timeline }),
    });
  };

  const handlePropertyTypeChange = (value: string) => {
    setPropertyType(value);
    setCurrentPage(1);
    updateUrl({
      ...(searchTerm && { searchTerm }),
      ...(city !== "all" && { city }),
      ...(value !== "all" && { propertyType: value }),
      ...(status !== "all" && { status }),
      ...(timeline !== "all" && { timeline }),
    });
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setCurrentPage(1);
    updateUrl({
      ...(searchTerm && { searchTerm }),
      ...(city !== "all" && { city }),
      ...(propertyType !== "all" && { propertyType }),
      ...(value !== "all" && { status: value }),
      ...(timeline !== "all" && { timeline }),
    });
  };

  const handleTimelineChange = (value: string) => {
    setTimeline(value);
    setCurrentPage(1);
    updateUrl({
      ...(searchTerm && { searchTerm }),
      ...(city !== "all" && { city }),
      ...(propertyType !== "all" && { propertyType }),
      ...(status !== "all" && { status }),
      ...(value !== "all" && { timeline: value }),
    });
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const newParams = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      newParams.set("page", page.toString());
    } else {
      newParams.delete("page");
    }
    const newUrl = `/authenticated/buyers?${newParams.toString()}`;
    router.push(newUrl, { scroll: false });
  };

  const fetchBuyers = useCallback(async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", itemsPerPage.toString());

      if (searchTerm) params.append("searchTerm", searchTerm);
      if (city !== "all") params.append("city", city);
      if (propertyType !== "all") params.append("propertyType", propertyType);
      if (status !== "all") params.append("status", status);
      if (timeline !== "all") params.append("timeline", timeline);

      const response = await fetch(`/api/buyers?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch buyers");
      }

      const data = await response.json();
      setBuyers(data.buyers);
      setTotalCount(data.totalCount);
    } catch (error) {
      toast.error("Failed to load buyers", {
        description: "Please try again",
        descriptionClassName: "text-muted-foreground",
      });
      console.error("Error fetching buyers:", error);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    searchTerm,
    city,
    propertyType,
    status,
    timeline,
    itemsPerPage,
  ]);

  // Fetch buyers when filters or page changes
  useEffect(() => {
    fetchBuyers();
  }, [fetchBuyers]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pt-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Buyers</h1>
        <Link href="/authenticated/buyers/new">
          <Button>Add New Buyer</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="lg:col-span-2">
          <Input
            placeholder="Search by name, phone, email, or notes..."
            defaultValue={searchTerm}
            onChange={(e) => debouncedSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={city} onValueChange={handleCityChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            <SelectItem value="Chandigarh">Chandigarh</SelectItem>
            <SelectItem value="Mohali">Mohali</SelectItem>
            <SelectItem value="Zirakpur">Zirakpur</SelectItem>
            <SelectItem value="Panchkula">Panchkula</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={propertyType} onValueChange={handlePropertyTypeChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Property Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Apartment">Apartment</SelectItem>
            <SelectItem value="Villa">Villa</SelectItem>
            <SelectItem value="Plot">Plot</SelectItem>
            <SelectItem value="Office">Office</SelectItem>
            <SelectItem value="Retail">Retail</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="Qualified">Qualified</SelectItem>
            <SelectItem value="Contacted">Contacted</SelectItem>
            <SelectItem value="Visited">Visited</SelectItem>
            <SelectItem value="Negotiation">Negotiation</SelectItem>
            <SelectItem value="Converted">Converted</SelectItem>
            <SelectItem value="Dropped">Dropped</SelectItem>
          </SelectContent>
        </Select>
        <Select value={timeline} onValueChange={handleTimelineChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Timeline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Timelines</SelectItem>
            <SelectItem value="ZERO_TO_THREE_M">0-3 months</SelectItem>
            <SelectItem value="THREE_TO_SIX_M">3-6 months</SelectItem>
            <SelectItem value="GREATER_THAN_SIX_M">&gt;6 months</SelectItem>
            <SelectItem value="Exploring">Exploring</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Empty state */}
      {!loading && buyers.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No buyers found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search or filter criteria
          </p>
          <Link href="/authenticated/buyers/new">
            <Button>Add New Buyer</Button>
          </Link>
        </div>
      )}

      {/* Table for larger screens */}
      {!loading && buyers.length > 0 && (
        <div className="rounded-md border hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Property Type</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buyers.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.fullName}</TableCell>
                  <TableCell>{item.phone}</TableCell>
                  <TableCell>{item.city}</TableCell>
                  <TableCell>{item.propertyType}</TableCell>
                  <TableCell>
                    {formatBudget(item.budgetMin, item.budgetMax)}
                  </TableCell>
                  <TableCell>
                    {item.timeline === "ZERO_TO_THREE_M" && "0-3 months"}
                    {item.timeline === "THREE_TO_SIX_M" && "3-6 months"}
                    {item.timeline === "GREATER_THAN_SIX_M" && ">6 months"}
                    {item.timeline === "Exploring" && "Exploring"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        item.status === "New"
                          ? "bg-blue-100 text-blue-800"
                          : item.status === "Qualified"
                            ? "bg-green-100 text-green-800"
                            : item.status === "Contacted"
                              ? "bg-yellow-100 text-yellow-800"
                              : item.status === "Visited"
                                ? "bg-purple-100 text-purple-800"
                                : item.status === "Negotiation"
                                  ? "bg-orange-100 text-orange-800"
                                  : item.status === "Converted"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {item.status}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(item.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/authenticated/buyers/${item.id}`}>
                      <button className="text-primary hover:underline">
                        View/Edit
                      </button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Cards for smaller screens */}
      {!loading && buyers.length > 0 && (
        <div className="grid gap-4 md:hidden">
          {buyers.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 grid gap-2"
            >
              <div className="flex justify-between items-center">
                <div className="font-medium">{item.fullName}</div>
                <Link href={`/authenticated/buyers/${item.id}`}>
                  <button className="text-primary hover:underline text-sm">
                    View/Edit
                  </button>
                </Link>
              </div>
              <div className="text-sm text-muted-foreground">{item.phone}</div>
              <div className="text-sm text-muted-foreground">
                {item.city} - {item.propertyType}
              </div>
              <div className="text-sm text-muted-foreground">
                Budget: {formatBudget(item.budgetMin, item.budgetMax)}
              </div>
              <div className="text-sm text-muted-foreground">
                Timeline: {item.timeline === "ZERO_TO_THREE_M" && "0-3 months"}
                {item.timeline === "THREE_TO_SIX_M" && "3-6 months"}
                {item.timeline === "GREATER_THAN_SIX_M" && ">6 months"}
                {item.timeline === "Exploring" && "Exploring"}
              </div>
              <div className="flex justify-between items-center">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    item.status === "New"
                      ? "bg-blue-100 text-blue-800"
                      : item.status === "Qualified"
                        ? "bg-green-100 text-green-800"
                        : item.status === "Contacted"
                          ? "bg-yellow-100 text-yellow-800"
                          : item.status === "Visited"
                            ? "bg-purple-100 text-purple-800"
                            : item.status === "Negotiation"
                              ? "bg-orange-100 text-orange-800"
                              : item.status === "Converted"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {item.status}
                </span>
                <div className="text-xs text-muted-foreground">
                  {formatDate(item.updatedAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && buyers.length > 0 && (
        <div className="mt-6 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) handlePageChange(currentPage - 1);
                  }}
                  className={
                    currentPage <= 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>

              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    href="#"
                    isActive={currentPage === i + 1}
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(i + 1);
                    }}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages)
                      handlePageChange(currentPage + 1);
                  }}
                  className={
                    currentPage >= totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
