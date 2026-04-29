import type { Asset, Customer, Incident } from "@/types/domain";

// Mock network assets representing a fiber optic network
export const mockAssets: Asset[] = [
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
  {
    id: "pop-banani-01",
    kind: "pop",
    name: "Banani Core Hub",
    status: "active",
    location: { lat: 23.7940, lng: 90.4030 }
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
  {
    id: "jb-gulshan-02",
    kind: "junction_box",
    name: "Gulshan Circle 2 Hub",
    status: "active",
    location: { lat: 23.7910, lng: 90.4150 }
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
  {
    id: "split-uttara-01",
    kind: "splitter",
    name: "Uttara Sec 4 Splitter",
    status: "active",
    location: { lat: 23.8710, lng: 90.3950 }
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
  {
    id: "pole-circle-2-01",
    kind: "pole",
    name: "Circle 2 Pole #4",
    status: "active",
    location: { lat: 23.7915, lng: 90.4155 }
  },
  {
    id: "pole-circle-2-02",
    kind: "pole",
    name: "Circle 2 Pole #5",
    status: "active",
    location: { lat: 23.7920, lng: 90.4160 }
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
  {
    id: "fiber-route-003",
    kind: "fiber_route",
    name: "Tejgaon Main Link",
    status: "active",
    location: { lat: 23.7650, lng: 90.3930 }
  }
];

// Mock customers with locations in Dhaka
export const mockCustomers: Customer[] = [
  // Residential customers
  {
    id: "cust-001",
    name: "Rahman Residence",
    plan: "Fiber 100Mbps",
    status: "online",
    location: { lat: 23.7948, lng: 90.4088 }
  },
  {
    id: "cust-002",
    name: "Karim Tower",
    plan: "Fiber 200Mbps",
    status: "online",
    location: { lat: 23.7952, lng: 90.4092 }
  },
  {
    id: "cust-003",
    name: "Ahmed Plaza",
    plan: "Fiber 50Mbps",
    status: "offline",
    location: { lat: 23.7958, lng: 90.4098 }
  },
  {
    id: "cust-014",
    name: "Siddique Heights",
    plan: "Fiber 100Mbps",
    status: "online",
    location: { lat: 23.7920, lng: 90.4170 }
  },
  {
    id: "cust-015",
    name: "Manir Mansion",
    plan: "Fiber 50Mbps",
    status: "online",
    location: { lat: 23.7925, lng: 90.4175 }
  },
  
  // Business customers
  {
    id: "cust-004",
    name: "Hossain Enterprise",
    plan: "Fiber 500Mbps",
    status: "online",
    location: { lat: 23.7932, lng: 90.4075 }
  },
  {
    id: "cust-005",
    name: "Fatema Medical Center",
    plan: "Fiber 1Gbps",
    status: "unstable",
    location: { lat: 23.7940, lng: 90.4082 }
  },
  {
    id: "cust-016",
    name: "Green Bank Ltd",
    plan: "Fiber 2Gbps",
    status: "online",
    location: { lat: 23.7918, lng: 90.4145 }
  },
  
  // Additional residential customers
  {
    id: "cust-006",
    name: "Islam Apartment",
    plan: "Fiber 50Mbps",
    status: "online",
    location: { lat: 23.7943, lng: 90.4070 }
  },
  {
    id: "cust-007",
    name: "Chowdhury Villa",
    plan: "Fiber 100Mbps",
    status: "online",
    location: { lat: 23.7955, lng: 90.4085 }
  },
  {
    id: "cust-008",
    name: "Begum House",
    plan: "Fiber 200Mbps",
    status: "online",
    location: { lat: 23.7938, lng: 90.4095 }
  },
  
  // Commercial customers
  {
    id: "cust-009",
    name: "Gulshan Tech Park",
    plan: "Fiber 1Gbps",
    status: "online",
    location: { lat: 23.7928, lng: 90.4080 }
  },
  {
    id: "cust-010",
    name: "Banani Shopping Complex",
    plan: "Fiber 500Mbps",
    status: "online",
    location: { lat: 23.7945, lng: 90.4075 }
  },
  {
    id: "cust-011",
    name: "Dhaka Cafe & Restaurant",
    plan: "Fiber 100Mbps",
    status: "unstable",
    location: { lat: 23.7950, lng: 90.4078 }
  },
  
  // Educational institutions
  {
    id: "cust-012",
    name: "Gulshan International School",
    plan: "Fiber 500Mbps",
    status: "online",
    location: { lat: 23.7935, lng: 90.4090 }
  },
  {
    id: "cust-013",
    name: "Banani Library",
    plan: "Fiber 200Mbps",
    status: "online",
    location: { lat: 23.7942, lng: 90.4068 }
  },
];

// Mock incidents
export const mockIncidents: Incident[] = [
  {
    id: "inc-001",
    title: "Fiber cut on Main Street - Road 12 intersection",
    severity: "critical",
    status: "investigating",
    relatedAssetId: "pole-main-st-01"
  },
  {
    id: "inc-002",
    title: "Signal degradation at Mohakhali Junction",
    severity: "high",
    status: "assigned",
    relatedAssetId: "jb-mohakhali-01"
  },
  {
    id: "inc-003",
    title: "ONU offline - Ahmed Plaza",
    severity: "medium",
    status: "new",
    relatedAssetId: "onu-cust-003"
  },
  {
    id: "inc-004",
    title: "Scheduled maintenance - Mohakhali fiber link",
    severity: "low",
    status: "investigating",
    relatedAssetId: "fiber-route-002"
  },
];
