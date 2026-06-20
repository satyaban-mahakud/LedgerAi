import { Receipt, SharedInboxFile } from "./types";

export const INITIAL_RECEIPTS: Receipt[] = [
  {
    id: "rec_1",
    amount: 1152.00,
    currency: "USD",
    vendor: "Slack Technologies LLC",
    category: "Software & Subscriptions",
    date: "2026-06-01",
    taxAmount: 92.16,
    summary: "Standard Plan Annual Subscription - 12 Seats",
    confidence: 1.0,
    sourceType: "pdf",
    sourceName: "Slack_Invoice_INV-88712.pdf",
    createdAt: "2026-06-01T10:30:00Z",
    status: "verified",
    notes: "Approved by CTO. Booked to software budget.",
    sapStatus: "synced",
    sfStatus: "not_synced",
    erpStatus: "synced"
  },
  {
    id: "rec_2",
    amount: 342.18,
    currency: "USD",
    vendor: "Amazon Web Services (AWS)",
    category: "Software & Subscriptions",
    date: "2026-06-03",
    taxAmount: 27.37,
    summary: "Cloud hosting fees - VPC, EC2 & RDS DB production instances",
    confidence: 0.98,
    sourceType: "pdf",
    sourceName: "AWS-June-Bill-9901.pdf",
    createdAt: "2026-06-03T18:45:00Z",
    status: "verified",
    notes: "Core system hosting. High variance on RDS IOPS.",
    sapStatus: "synced",
    sfStatus: "not_synced",
    erpStatus: "synced"
  },
  {
    id: "rec_3",
    amount: 2400.00,
    currency: "USD",
    vendor: "Apex Legal Partners",
    category: "Professional Services",
    date: "2026-05-28",
    taxAmount: 0.00,
    summary: "Trademark filing & general operational counseling for May",
    confidence: 0.95,
    sourceType: "pdf",
    sourceName: "Apex_Legal_Partners_May_Invoice.pdf",
    createdAt: "2026-05-28T14:15:00Z",
    status: "verified",
    notes: "Approved by CEO. Multi-state entity filing.",
    sapStatus: "synced",
    sfStatus: "synced",
    erpStatus: "synced"
  },
  {
    id: "rec_4",
    amount: 45.80,
    currency: "USD",
    vendor: "Uber Technologies Inc",
    category: "Travel & Lodging",
    date: "2026-06-11",
    taxAmount: 3.20,
    summary: "Business ride from airport to downtown HQ",
    confidence: 0.99,
    sourceType: "image",
    sourceName: "IMG_6654_UberReceipt.png",
    createdAt: "2026-06-11T21:12:00Z",
    status: "pending_review",
    notes: "Audit required - please attach meeting memo.",
    sapStatus: "not_synced",
    sfStatus: "not_synced",
    erpStatus: "not_synced"
  },
  {
    id: "rec_5",
    amount: 24.50,
    currency: "USD",
    vendor: "Starbucks Store #9302",
    category: "Meals & Entertainment",
    date: "2026-06-15",
    taxAmount: 1.96,
    summary: "Team coffee meeting - Marketing strategy brainstorm",
    confidence: 0.92,
    sourceType: "paste",
    sourceName: "Pasted SMS Text",
    createdAt: "2026-06-15T09:12:00Z",
    status: "pending_review",
    notes: "",
    sapStatus: "not_synced",
    sfStatus: "not_synced",
    erpStatus: "not_synced"
  },
  {
    id: "rec_6",
    amount: 258.00,
    currency: "USD",
    vendor: "Home Depot / Office Depot",
    category: "Office Supplies",
    date: "2026-06-14",
    taxAmount: 18.06,
    summary: "Ergonomic mesh chairs for new interns",
    confidence: 0.98,
    sourceType: "csv",
    sourceName: "ledger_import_june_14.csv",
    createdAt: "2026-06-14T15:20:00Z",
    status: "verified",
    notes: "Intern workspace setup stipend.",
    sapStatus: "not_synced",
    sfStatus: "not_synced",
    erpStatus: "not_synced"
  },
  {
    id: "rec_7",
    amount: 185.00,
    currency: "USD",
    vendor: "Pacific Gas & Electric",
    category: "Utilities",
    date: "2026-06-05",
    taxAmount: 0.00,
    summary: "Monthly electricity invoice - Suite 400 Office",
    confidence: 1.0,
    sourceType: "pdf",
    sourceName: "PGE_Utility_Suite400_June.pdf",
    createdAt: "2026-06-05T08:00:00Z",
    status: "verified",
    notes: "Standard operational building utilities.",
    sapStatus: "synced",
    sfStatus: "not_synced",
    erpStatus: "synced"
  },
  {
    id: "rec_8",
    amount: 750.00,
    currency: "USD",
    vendor: "SuperAds Inc",
    category: "Advertising & Marketing",
    date: "2026-05-30",
    taxAmount: 52.50,
    summary: "CPC Retargeting campaign for summer launch",
    confidence: 0.94,
    sourceType: "pdf",
    sourceName: "SuperAds_Invoice_S8811.pdf",
    createdAt: "2026-05-30T16:00:00Z",
    status: "verified",
    notes: "Campaign ID: SUM-LAUNCH-2026-A.",
    sapStatus: "synced",
    sfStatus: "synced",
    erpStatus: "not_synced"
  }
];

export const MOCK_SHARED_INBOX_FILES: SharedInboxFile[] = [
  {
    id: "sh_1",
    name: "Uber_Ride_Client_Visit_INV_9021.pdf",
    size: "142 KB",
    type: "application/pdf",
    source: "Slack Finance Channel",
    receivedAt: "2026-06-19T14:24:00Z",
    parsed: false
  },
  {
    id: "sh_2",
    name: "starbucks_latte_receipt_06_18.jpg",
    size: "890 KB",
    type: "image/jpeg",
    source: "Email Inbox",
    receivedAt: "2026-06-18T08:12:00Z",
    parsed: false
  },
  {
    id: "sh_3",
    name: "Amazon_Office_Supplies_INV_441.pdf",
    size: "2.1 MB",
    type: "application/pdf",
    source: "Shared Drive Ingestion",
    receivedAt: "2026-06-17T11:45:00Z",
    parsed: false
  },
  {
    id: "sh_4",
    name: "Figma_Pro_Billing_INV_993.pdf",
    size: "340 KB",
    type: "application/pdf",
    source: "Email Inbox",
    receivedAt: "2026-06-20T03:15:00Z",
    parsed: false
  },
  {
    id: "sh_5",
    name: "Marketing_Dinner_Receipt.png",
    size: "1.4 MB",
    type: "image/png",
    source: "Slack Finance Channel",
    receivedAt: "2026-06-20T07:44:00Z",
    parsed: false
  }
];

export const RAW_RECEIPT_TEXT_EXAMPLES = [
  {
    title: "Uber Ride (Text)",
    text: `UBER TECHNOLOGIES INC.
1455 Market St, San Francisco, CA
Date: June 11, 2026 / Ride Receipt #67fa23
---------------------------------------------
Subtotal: $42.60
Tax & Airport Surcharge: $3.20
TOTAL PAID (Visa *4321): $45.80
Thank you for riding with Uber!
Driver: Jane Smith
Category: Business Trip to HQ`
  },
  {
    title: "Slack SaaS Invoice (Text)",
    text: `SLACK TECHNOLOGIES LLC
500 Howard Street, San Francisco, CA 94105
INVOICE #INV-88712
Invoice Date: June 1, 2026
Bill To: Neha's Team (Finance Dept)
---------------------------------------------
Subscription: Standard Plan Annual Billing
Quantity: 12 Seats @ $96.00/Seat
Net Amount: $1,152.00
VAT / Sales Tax (8%): $92.16
TOTAL DUE / PAID: $1,244.16 USD
Paid automatically on June 1, 2026`
  },
  {
    title: "Starbucks Coffee (Text)",
    text: `STARBUCKS STORE #9302
123 Main Street, Palo Alto, CA
06/15/2026 09:12 AM
---------------------------------------------
1x Grande Caramel Macchiato: $5.75
2x Almond Butter Croissant: $9.50
1x Venti Iced Latte: $6.25
Subtotal: $21.50
Tax (8%): $1.96
Tip: $1.04
TOTAL PAID: $24.50
Merchant ID: STB-882211`
  }
];
