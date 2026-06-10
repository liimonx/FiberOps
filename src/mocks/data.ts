import type { Asset, Incident } from "@/types/domain";

// Mock network assets representing a fiber optic network in Dhaka, Bangladesh
export const assets: Asset[] = [
  // Points of Presence (PoP) - Core nodes
  {
    id: "pop-dhaka-01",
    kind: "pop",
    name: "Dhaka Main PoP",
    status: "active",
    location: { lat: 23.8103, lng: 90.4125 }
  },
  {
    id: "pop-gulshan-01",
    kind: "pop",
    name: "Gulshan PoP",
    status: "active",
    location: { lat: 23.7925, lng: 90.4078 }
  },

  // Junction boxes - Distribution nodes
  {
    id: "jb-banani-01",
    kind: "junction_box",
    name: "Banani Junction Box A",
    status: "active",
    location: { lat: 23.7937, lng: 90.4066 }
  },
  {
    id: "jb-mohakhali-01",
    kind: "junction_box",
    name: "Mohakhali Junction",
    status: "degraded",
    location: { lat: 23.7789, lng: 90.3944 }
  },
  {
    id: "jb-tejgaon-01",
    kind: "junction_box",
    name: "Tejgaon Distribution Hub",
    status: "active",
    location: { lat: 23.7644, lng: 90.3928 }
  },

  // Splitters
  {
    id: "split-gulshan-01",
    kind: "splitter",
    name: "Gulshan Splitter 1:8",
    status: "active",
    location: { lat: 23.7935, lng: 90.4085 }
  },
  {
    id: "split-banani-01",
    kind: "splitter",
    name: "Banani Splitter 1:16",
    status: "active",
    location: { lat: 23.7945, lng: 90.4072 }
  },

  // Poles - Access nodes
  {
    id: "pole-road-12-01",
    kind: "pole",
    name: "Road 12 Pole #1",
    status: "active",
    location: { lat: 23.7950, lng: 90.4090 }
  },
  {
    id: "pole-road-12-02",
    kind: "pole",
    name: "Road 12 Pole #2",
    status: "active",
    location: { lat: 23.7955, lng: 90.4095 }
  },
  {
    id: "pole-main-st-01",
    kind: "pole",
    name: "Main Street Pole A",
    status: "down",
    location: { lat: 23.7960, lng: 90.4100 }
  },

  // Fiber routes
  {
    id: "fiber-route-001",
    kind: "fiber_route",
    name: "Gulshan-Banani Fiber Link",
    status: "active",
    location: { lat: 23.7940, lng: 90.4080 }
  },
  {
    id: "fiber-route-002",
    kind: "fiber_route",
    name: "Mohakhali Link Segment",
    status: "maintenance",
    location: { lat: 23.7800, lng: 90.3950 }
  },

  // ONUs - Customer premises equipment
  {
    id: "onu-cust-001",
    kind: "onu",
    name: "Customer ONU - Rahman Residence",
    status: "active",
    location: { lat: 23.7965, lng: 90.4105 }
  },
  {
    id: "onu-cust-002",
    kind: "onu",
    name: "Customer ONU - Karim Tower",
    status: "active",
    location: { lat: 23.7970, lng: 90.4110 }
  },
  {
    id: "onu-cust-003",
    kind: "onu",
    name: "Customer ONU - Ahmed Plaza",
    status: "down",
    location: { lat: 23.7975, lng: 90.4115 }
  },
];

// Legacy seed reference — runtime customers are served from mocks/customersData.ts
// Legacy seed reference — runtime incidents are served from mocks/incidentsData.ts
export const incidents: Incident[] = [];

