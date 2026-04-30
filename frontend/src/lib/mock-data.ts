export const PLACES = [
  { id: "p1", name: "Apollo Hospital", type: "Hospital", area: "Bandra, Mumbai", rating: 4.6, features: { ramp: true, lift: true, accessibleToilet: true, braille: true, audio: true }, x: 22, y: 30 },
  { id: "p2", name: "SBI Main Branch", type: "Bank", area: "MG Road, Pune", rating: 3.8, features: { ramp: true, lift: false, accessibleToilet: false, braille: true, audio: false }, x: 60, y: 18 },
  { id: "p3", name: "Cafe Mocha", type: "Restaurant", area: "Indiranagar, Bengaluru", rating: 4.1, features: { ramp: true, lift: true, accessibleToilet: true, braille: false, audio: false }, x: 78, y: 55 },
  { id: "p4", name: "Metro Station — Rajiv Chowk", type: "Transit", area: "New Delhi", rating: 4.4, features: { ramp: true, lift: true, accessibleToilet: true, braille: true, audio: true }, x: 38, y: 70 },
  { id: "p5", name: "District Office", type: "Govt Office", area: "Jaipur", rating: 2.9, features: { ramp: false, lift: false, accessibleToilet: false, braille: false, audio: false }, x: 12, y: 78 },
  { id: "p6", name: "City Library", type: "Library", area: "Chennai", rating: 4.0, features: { ramp: true, lift: true, accessibleToilet: true, braille: true, audio: false }, x: 88, y: 30 },
];

export const JOBS = [
  { id: "j1", title: "Customer Support Associate", company: "TCS", location: "Pune (WFH)", salary: "₹4.2 LPA", wfh: true, wheelchair: true, isl: true, score: 92, suitable: ["locomotor", "hearing", "visual"], description: "Handle inbound queries via chat. Screen reader friendly tools. Trained ISL interpreter on standby for interviews." },
  { id: "j2", title: "Data Entry Operator", company: "Infosys", location: "Bengaluru", salary: "₹3.0 LPA", wfh: false, wheelchair: true, isl: false, score: 78, suitable: ["locomotor", "other"], description: "Office is fully ramp-accessible with adjustable desks." },
  { id: "j3", title: "Content Moderator", company: "Wipro", location: "Hyderabad (Hybrid)", salary: "₹5.0 LPA", wfh: true, wheelchair: true, isl: true, score: 88, suitable: ["hearing", "visual", "other"], description: "Hybrid role with caption-enabled video meetings." },
  { id: "j4", title: "Software Developer Trainee", company: "Zoho", location: "Chennai (WFH)", salary: "₹6.5 LPA", wfh: true, wheelchair: true, isl: true, score: 95, suitable: ["locomotor", "hearing", "visual", "other"], description: "Fully accessible toolchain. Mentorship for first 3 months." },
  { id: "j5", title: "Telecaller", company: "ICICI Bank", location: "Mumbai", salary: "₹3.6 LPA", wfh: false, wheelchair: true, isl: false, score: 70, suitable: ["locomotor", "visual"], description: "Audio-first role with screen-reader-compatible CRM." },
  { id: "j6", title: "Graphic Designer", company: "Freelance via Toptal", location: "Anywhere (WFH)", salary: "₹8.0 LPA", wfh: true, wheelchair: true, isl: true, score: 90, suitable: ["hearing", "locomotor", "other"], description: "Project-based, full WFH, async-first communication." },
];

export const SCHEMES = [
  { id: "s1", name: "Indira Gandhi National Disability Pension", benefit: "₹500–1500/month pension", forTypes: ["visual", "hearing", "locomotor", "other"], severityMin: 40, docs: ["UDID Card", "Aadhaar", "Income Certificate", "Bank Passbook"], steps: ["Visit district Social Welfare office", "Submit documents and UDID", "Verification within 30 days", "Pension credited to bank monthly"], simple: "If you have a disability of 40% or more, the government will give you a small monthly pension to help with daily expenses." },
  { id: "s2", name: "ADIP — Free Assistive Devices", benefit: "Free wheelchair, hearing aid, white cane, prosthetic", forTypes: ["visual", "hearing", "locomotor"], severityMin: 40, docs: ["UDID Card", "Income proof (under ₹30k/month)", "Doctor's prescription"], steps: ["Apply at nearest ALIMCO/DDRC camp", "Medical assessment", "Device fitted free of cost"], simple: "Government gives free equipment like wheelchairs, hearing aids, or canes to people who need them." },
  { id: "s3", name: "Railway Concession (Divyangjan)", benefit: "50–75% off train tickets, escort also gets concession", forTypes: ["visual", "hearing", "locomotor", "other"], severityMin: 40, docs: ["UDID Card or Disability Certificate", "Photo ID"], steps: ["Apply for Concession ID at any major station", "Get a Photo Identity Card", "Use it while booking tickets"], simple: "You and one helper can travel by train at half-price or less." },
  { id: "s4", name: "National Scholarship for PwDs", benefit: "₹500–₹2500/month for school & college students", forTypes: ["visual", "hearing", "locomotor", "other"], severityMin: 40, docs: ["UDID Card", "Income Certificate", "Marksheets", "Aadhaar"], steps: ["Apply on scholarships.gov.in", "Upload documents", "School verifies", "Money sent to bank"], simple: "Students with disabilities get monthly money to pay for school and college." },
  { id: "s5", name: "Niramaya Health Insurance", benefit: "Up to ₹1 lakh/year health cover for ₹250–500 premium", forTypes: ["visual", "hearing", "locomotor", "other"], severityMin: 40, docs: ["UDID Card", "Aadhaar", "Address proof"], steps: ["Visit National Trust portal", "Pay yearly premium", "Use for hospital bills"], simple: "A cheap health insurance — pay ₹500 once a year, get ₹1 lakh of medical coverage." },
];

export const QUICK_PHRASES = [
  "Hello",
  "Welcome",
  "Thank you",
  "I need help",
  "I'm looking for work",
  "Tell me about the interview",
  "What is the salary?",
  "I have experience",
  "Yes",
  "I am happy",
  "Can I introduce myself?",
];

export const SIGN_PHRASES = [
  { label: "Hello", text: "HELLO" },
  { label: "Thank you", text: "THANK YOU" },
  { label: "Help", text: "HELP" },
  { label: "Sorry", text: "SORRY" },
  { label: "Yes", text: "YES" },
  { label: "No", text: "NO" },
  { label: "Water", text: "WATER" },
  { label: "Food", text: "FOOD" },
  { label: "Please", text: "PLEASE" },
  { label: "Good", text: "GOOD" },
];

export const UDID_STEPS = [
  { title: "Personal Details", desc: "Aadhaar, name, date of birth, contact" },
  { title: "Disability Information", desc: "Type of disability and how long you have had it" },
  { title: "Upload Documents", desc: "Photo, Aadhaar copy, address proof" },
  { title: "Choose Medical Authority", desc: "Pick a hospital in your district for assessment" },
  { title: "Medical Assessment", desc: "Visit the hospital on the assigned date" },
  { title: "Get Your UDID Card", desc: "Card delivered by post in 30–90 days" },
];

export const UDID_DOCUMENTS = [
  "Aadhaar Card",
  "Recent passport-size photo",
  "Address proof (Ration card / Voter ID / Electricity bill)",
  "Existing disability certificate (if any)",
  "Bank passbook copy",
  "Income certificate (optional, for free schemes)",
];
