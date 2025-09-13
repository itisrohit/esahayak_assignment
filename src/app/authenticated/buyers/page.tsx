"use client";

import { useState } from "react";
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

import { mockData } from "@/lib/data";

export default function BuyersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timelineFilter, setTimelineFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter and search logic would go here in a real app
  const filteredData = mockData.filter((item) => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(searchTermLower) ||
      item.phone.includes(searchTerm) ||
      item.email.toLowerCase().includes(searchTermLower) ||
      item.notes.toLowerCase().includes(searchTermLower);

    const matchesCity = cityFilter === "all" || item.city === cityFilter;
    const matchesPropertyType =
      propertyTypeFilter === "all" || item.propertyType === propertyTypeFilter;
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    const matchesTimeline =
      timelineFilter === "all" || item.timeline === timelineFilter;

    return (
      matchesSearch &&
      matchesCity &&
      matchesPropertyType &&
      matchesStatus &&
      matchesTimeline
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            <SelectItem value="New York">New York</SelectItem>
            <SelectItem value="Los Angeles">Los Angeles</SelectItem>
            <SelectItem value="Chicago">Chicago</SelectItem>
            <SelectItem value="Miami">Miami</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={propertyTypeFilter}
          onValueChange={setPropertyTypeFilter}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Property Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Apartment">Apartment</SelectItem>
            <SelectItem value="House">House</SelectItem>
            <SelectItem value="Condo">Condo</SelectItem>
            <SelectItem value="Townhouse">Townhouse</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={timelineFilter} onValueChange={setTimelineFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Timeline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Timelines</SelectItem>
            <SelectItem value="Immediate">Immediate</SelectItem>
            <SelectItem value="3-6 months">3-6 months</SelectItem>
            <SelectItem value="6-12 months">6-12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table for larger screens */}
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
            {paginatedData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.phone}</TableCell>
                <TableCell>{item.city}</TableCell>
                <TableCell>{item.propertyType}</TableCell>
                <TableCell>
                  ${item.budget.min.toLocaleString()} - $
                  {item.budget.max.toLocaleString()}
                </TableCell>
                <TableCell>{item.timeline}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      item.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : item.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {item.status}
                  </span>
                </TableCell>
                <TableCell>{item.updatedAt}</TableCell>
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

      {/* Cards for smaller screens */}
      <div className="grid gap-4 md:hidden">
        {paginatedData.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 grid gap-2"
          >
            <div className="flex justify-between items-center">
              <div className="font-medium">{item.name}</div>
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
              Budget: ${item.budget.min.toLocaleString()} - $
              {item.budget.max.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              Timeline: {item.timeline}
            </div>
            <div className="flex justify-between items-center">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  item.status === "Active"
                    ? "bg-green-100 text-green-800"
                    : item.status === "Pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                }`}
              >
                {item.status}
              </span>
              <div className="text-xs text-muted-foreground">
                {item.updatedAt}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-center">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) setCurrentPage(currentPage - 1);
                }}
              />
            </PaginationItem>

            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  href="#"
                  isActive={currentPage === i + 1}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(i + 1);
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
                  if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
