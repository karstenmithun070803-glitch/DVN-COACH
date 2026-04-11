export type FieldOption = string;

export interface SeatingRowConfig {
  id: string;
  location: string;
  type: string;
  multiplier: number;
}

export const DEFAULT_SEATING_ROWS: SeatingRowConfig[] = [
  { id: "rh-side-3-pass",    location: "Rh Side",  type: "3 Pass", multiplier: 3 },
  { id: "rh-side-2-plus-1",  location: "Rh Side",  type: "2+1",    multiplier: 3 },
  { id: "lh-side-2-pass",    location: "Lh Side",  type: "2 Pass", multiplier: 2 },
  { id: "platform-2-pass",   location: "Platform", type: "2 Pass", multiplier: 2 },
  { id: "platform-1-plus-1", location: "Platform", type: "1+1",    multiplier: 2 },
  { id: "platform-1-pass",   location: "Platform", type: "1 Pass", multiplier: 1 },
];

export interface Category {
  id: string;
  name: string;
  nameTamil?: string; // For Admin overrides
  options: FieldOption[];
  noteEnabled?: boolean;
}

export interface SpecCategoryGroup {
  groupName: string;
  fields: Category[];
}

export type BaseModels = "Moffusil" | "Town" | "College" | "Staff";

// Export standard prices baseline
export const BUS_MODELS_BASE = {
  "Moffusil": { basePrice: 1500000 },
  "Town": { basePrice: 1400000 },
  "College": { basePrice: 1350000 },
  "Staff": { basePrice: 1600000 },
};

export const SPEC_CONFIGURATOR: SpecCategoryGroup[] = [
  {
    groupName: "CHASSIS",
    fields: [
      { id: "chassis-brand", name: "Chassis Brand", options: ["Leyland", "TATA", "Eicher"] },
      { id: "body-type", name: "Body Type", options: ["Moffusil", "Town", "College", "Staff"] },
    ]
  },
  {
    groupName: "STRUCTURE",
    fields: [
      { id: "wheel-base", name: "Wheel Base", options: ["222\"", "ROH"] },
      { id: "body-width", name: "Body Width", options: ["8'6\"", "8'8\""] },
      { id: "body-inner-height", name: "Body Inner Height", options: ["6'3\""] },
      { id: "foundation-channel", name: "Foundation Channel", options: ["4\"x2\" STD", "4\" Bed", "6\" Bed"] },
      { id: "entrance", name: "Entrance", options: ["Rear", "Nil"] },
      { id: "exit-position", name: "Exit Position", options: ["Extreme Front", "In Between Wheel"] },
      { id: "body-pillar", name: "Body Pillar", options: ["60x40", "50x40"] },
      { id: "sun-shade", name: "Sun Shade", options: ["Yes", "No"] },
      { id: "footstep-type", name: "Footstep Type", options: ["2/3 Step STD", "JK", "Balasakthi"] },
      { id: "jk-door", name: "JK Door", options: ["Shutter"] },
      { id: "3-pass-seat-width", name: "3 Pass Seat Width", options: ["1200mm", "45\"", "46\""] },
      { id: "2-pass-seat-width", name: "2 Pass Seat Width", options: ["800mm", "30\"", "31\""] },
      { id: "side-body-sheet", name: "Side Body Sheet", options: ["GP", "Aluminium", "Stainless Steel"] },
      { id: "front-glass", name: "Front Glass", options: ["54\"", "60\"", "61\"", "64\" Volvo", "Laminated"] },
      { id: "rear-glass", name: "Rear Glass", options: ["As per Photo", "Job No."] },
      { id: "side-body-slide", name: "Side Body Slide", options: ["Mazda", "Railway Shutter"] },
      { id: "engine-platform", name: "Engine Platform", options: ["OE", "Sheet Metal", "Angler Type"] },
      { id: "battery-box", name: "Battery Box", options: ["Side Body", "Under the Seat"] },
      { id: "side-mudguard", name: "Side Mudguard", options: ["Round", "Square", "MG Type"] },
      { id: "dickey", name: "Dickey", options: ["Left", "Right", "Rear"] },
      { id: "driver-door", name: "Driver Door", options: ["Full", "Half"] },
      { id: "spare-wheel", name: "Spare Wheel", options: ["Left Side", "Right Side", "Hanging Type"] },
      { id: "emergency-door", name: "Emergency Door", options: ["Yes", "No"] },
      { id: "flooring-plywood", name: "Flooring Plywood", options: ["12mm", "15mm", "Alu. Chequered Sheet", "Mat"] },
      { id: "ceiling", name: "Ceiling", options: ["ACP", "Mica"] },
    ]
  },
  {
    groupName: "WOOD",
    fields: [
      { id: "wood-flooring-plywood", name: "Wood Flooring Plywood", options: ["12mm Diamond Ply", "15mm", "3mm Alu. Chequered", "Mat"] },
      { id: "name-board", name: "Name Board", options: ["Yes - Front", "Yes - Rear", "No"] },
      { id: "voice-speaker", name: "Voice Speaker", options: ["Yes", "No"] }
    ]
  },
  {
    groupName: "FRONT & BACK",
    fields: [
      { id: "front-glass-grill", name: "Front Glass & Grill", options: ["54\"", "60\"", "61\"", "64\" Volvo", "Laminated"] },
      { id: "rear-glass-grill", name: "Rear Glass & Grill", options: ["Job No.", "As per Photo"] },
      { id: "volvo-mirror", name: "Volvo Mirror", options: ["Yes", "No"] },
      { id: "bonnet", name: "Bonnet", options: ["OE", "Sheet Metal", "Angler Type"] },
      { id: "dashboard", name: "Dashboard", options: ["SRVS", "FRP"] },
      { id: "lifting-door", name: "Lifting Door", options: ["Yes", "No"] },
      { id: "wiper", name: "Wiper", options: ["Volvo", "TVS"] },
    ]
  },
  // --- STAGE 4 MISSING SECTIONS MAPPED ---
  {
    groupName: "SHEET METAL",
    fields: [
      { id: "sheet-metal-body-sheet", name: "Sheet Metal Body Sheet", options: ["GP", "Aluminium", "Stainless Steel"] },
      { id: "ac", name: "AC", options: ["BSBS", "Kerala", "Sutlej"] },
      { id: "roof-luggage-carrier-length", name: "Roof Luggage Carrier Length", options: ["3/4", "Full"] },
      { id: "lc-slide", name: "LC Slide", options: ["Sq Tube", "Pipe", "SS"] },
      { id: "ladder", name: "Ladder", options: ["Sq Tube", "Pipe", "SS"] },
      { id: "inner-mudguard", name: "Inner Mudguard", options: ["Sq"] },
      { id: "hanging-mudguard", name: "Hanging Mudguard", options: ["GI"] },
      { id: "footstep-material", name: "Footstep Material", options: ["Stainless Steel"] },
      { id: "top-ventilator", name: "Top Ventilator", options: ["Front - 1 No", "Centre - 1 No"] },
    ]
  },
  {
    groupName: "DOOR",
    fields: [
      { id: "door-driver-door", name: "Door Driver Door", options: ["Full", "Half"] },
      { id: "side-dickey", name: "Side Dickey", options: ["Yes", "No"] },
      { id: "right-emergency-door", name: "Right Emergency Door", options: ["Yes", "No"] },
      { id: "rear-dickey", name: "Rear Dickey", options: ["Yes", "No"] },
      { id: "battery-box-door", name: "Battery Box Door", options: ["Yes", "No"] },
      { id: "spare-wheel-door", name: "Spare Wheel Door", options: ["Yes", "No"] },
      { id: "jk-door-pneumatic", name: "JK Door Pneumatic", options: ["Yes", "No"] },
    ]
  },
  {
    groupName: "GLASS FRAME",
    fields: [
      { id: "side-quarter-glass", name: "Side Quarter Glass", options: ["Fixing"] },
      { id: "sliding-glass", name: "Sliding Glass", options: ["Mazda", "Railway Shutter"] },
      { id: "glass-colour", name: "Glass Colour", options: ["Clear", "Light Grey", "Light Green", "Dark Green", "Dark Grey"] },
      { id: "glass-frame-finish", name: "Glass Frame Finish", options: ["Polish", "Powder Coat"] },
      { id: "holes", name: "Holes", options: ["30x40", "Lock Holes"] },
    ]
  },
  {
    groupName: "CEILING",
    fields: [
      { id: "interior-vangu", name: "Interior Vangu", options: ["SS"] },
      { id: "mica-design", name: "Mica Design", options: ["Yes", "No"] },
      { id: "seat-angle", name: "Seat Angle", options: ["SS", "Mica", "ACP"] },
      { id: "interior-design", name: "Interior Design", options: ["Yes", "No"] },
      { id: "step-ceiling", name: "Step Ceiling", options: ["Nams"] },
    ]
  },
  {
    groupName: "FITTINGS",
    fields: [
      { id: "seat-type", name: "Seat Type", options: ["STD", "School Type", "Jeeva", "S-Bend", "SK / DVN"] },
      { id: "backrest", name: "Backrest", options: ["SS"] },
      { id: "headrest-cover", name: "Headrest Cover", options: ["Full Cover", "Double Colour", "Velcro Type", "Name"] },
      { id: "pathway-beading", name: "Pathway Beading", options: ["Yes", "No"] },
      { id: "cloth-material", name: "Cloth Material", options: ["5D", "Rexene"] },
      { id: "side-body-beading", name: "Side Body Beading", options: ["Volvo"] },
      { id: "hatrack", name: "Hatrack", options: ["Left Side", "Right Side", "STD", "Travels Type"] },
      { id: "bonnet-partition", name: "Bonnet Partition", options: ["Yes", "No"] },
      { id: "tv-partition", name: "TV Partition", options: ["Cabin Only", "TV"] },
      { id: "tv-position", name: "TV Position", options: ["RH Side", "LH Side"] },
      { id: "igr", name: "IGR", options: ["1 Row", "2 Row", "3 Row"] },
      { id: "post", name: "Post", options: ["10 Nos"] },
      { id: "windows-side-bar", name: "Windows Side Bar", options: ["2 Line"] },
      { id: "fitting-materials", name: "Fitting Materials", options: ["SS", "Powder Coat"] },
      { id: "footstep-beading", name: "Footstep Beading", options: ["Travels"] },
      { id: "wheel-arch", name: "Wheel Arch", options: ["SS", "FRP", "Rubber"] },
    ]
  },
  {
    groupName: "WIRING",
    fields: [
      { id: "wiring-dashboard", name: "Wiring Dashboard", options: ["SRVS", "FRP"] },
      { id: "wiper-motor", name: "Wiper Motor", options: ["TVS", "Volvo"] },
      { id: "tape-recorder", name: "Tape Recorder", options: ["Yes", "No"] },
      { id: "camera-wiring", name: "Camera Wiring", options: ["Yes", "No"] },
      { id: "fancy-lights", name: "Fancy Lights", options: ["Yes", "No"] },
      { id: "tube-light", name: "Tube Light", options: ["LED 12+2"] },
      { id: "footstep-tube-light", name: "Footstep Tube Light", options: ["Yes", "No"] },
      { id: "step-colour-tube-light", name: "Step Colour Tube Light", options: ["Yes", "No"] },
      { id: "route-board-tube-light", name: "Route Board Tube Light", options: ["Yes", "No"] },
      { id: "side-body-light", name: "Side Body Light", options: ["Yes", "No"] },
      { id: "top-dome-light", name: "Top Dome Light", options: ["Yes", "No"] },
      { id: "front-headlight", name: "Front Headlight", options: ["As per Grill"] },
      { id: "rear-danger-light", name: "Rear Danger Light", options: ["As per Grill"] },
      { id: "hatrack-light", name: "Hatrack Light", options: ["Yes", "No"] },
      { id: "emergency-buzzer", name: "Emergency Buzzer", options: ["Yes", "No"] },
      { id: "electric-calling-buzzer", name: "Electric Calling Buzzer", options: ["Yes", "No"] },
    ]
  },
  {
    groupName: "EXTRAS & PAINT (PRICED)",
    fields: [
      { id: "art-work", name: "Art Work", options: ["Yes", "No"] },
      { id: "audio-video", name: "Audio & Video", options: ["Yes", "No"] },
      { id: "decorative-lights", name: "Decorative Lights", options: ["Yes", "No"] },
      { id: "stickers", name: "Stickers", options: ["Yes", "No"] },
      { id: "bottom-aluminium-sheet-extra", name: "Bottom Aluminium Sheet", options: ["Yes", "No"] },
      { id: "black-cobra-plywood-extra", name: "Black Cobra 15mm Plywood", options: ["Yes", "No"] },
    ]
  }
];

// ─── Shared Moffusil Baseline ─────────────────────────────────────────────
// This is the single source of truth for the standard build.
// All other models inherit from this and override only what differs.
const MOFFUSIL_BASE_SELECTIONS: Record<string, string> = {
  // CHASSIS
  "Chassis Brand": "Leyland",
  "Body Type": "Moffusil",
  // STRUCTURE
  "Wheel Base": "222\"",
  "Body Width": "8'6\"",
  "Body Inner Height": "6'3\"",
  "Foundation Channel": "4\"x2\" STD",
  "Entrance": "Rear",
  "Body Pillar": "60x40",
  "Sun Shade": "Yes",
  "Footstep Type": "2/3 Step STD",
  "JK Door": "JK",
  "3 Pass Seat Width": "1200mm",
  "2 Pass Seat Width": "800mm",
  "Side Body Sheet": "GP",
  "Front Glass": "54\"",
  "Rear Glass": "As per Photo",
  "Side Body Slide": "Mazda",
  "Engine Platform": "OE",
  "Battery Box": "Side Body",
  "Side Mudguard": "Round",
  "Dickey": "Left",
  "Driver Door": "Full",
  "Spare Wheel": "Left Side",
  "Emergency Door": "Yes",
  "Flooring Plywood": "12mm",
  "Ceiling": "ACP",
  // WOOD
  "Wood Flooring Plywood": "12mm Diamond Ply",
  "Name Board": "Yes - Front",
  "Voice Speaker": "Yes",
  // FRONT & BACK
  "Front Glass & Grill": "54\"",
  "Rear Glass & Grill": "As per Photo",
  "Volvo Mirror": "No",
  "Bonnet": "OE",
  "Dashboard": "SRVS",
  "Lifting Door": "Yes",
  "Wiper": "TVS",
  // SHEET METAL
  "Sheet Metal Body Sheet": "GP",
  "AC": "Kerala",
  "Roof Luggage Carrier Length": "Full",
  "LC Slide": "Sq Tube",
  "Ladder": "Sq Tube",
  "Inner Mudguard": "Sq",
  "Hanging Mudguard": "GI",
  "Footstep Material": "Stainless Steel",
  "Top Ventilator": "Safety - 1 No",
  // DOOR
  "Door Driver Door": "Full",
  "Side Dickey": "Yes",
  "Right Emergency Door": "No",
  "Rear Dickey": "Yes",
  "Battery Box Door": "Yes",
  "Spare Wheel Door": "Yes",
  "JK Door Pneumatic": "No",
  // GLASS FRAME
  "Side Quarter Glass": "Fixing",
  "Sliding Glass": "Mazda",
  "Glass Colour": "Light Grey",
  "Glass Frame Finish": "Powder Coat",
  "Holes": "30x40",
  // CEILING
  "Interior Vangu": "SS",
  "Mica Design": "Yes",
  "Seat Angle": "ACP",
  "Interior Design": "Yes",
  "Step Ceiling": "Nams",
  // FITTINGS
  "Seat Type": "STD",
  "Backrest": "SS",
  "Headrest Cover": "Full Cover",
  "Pathway Beading": "Yes",
  "Cloth Material": "5D",
  "Side Body Beading": "Volvo",
  "Hatrack": "STD",
  "Bonnet Partition": "Yes",
  "TV Partition": "Cabin Only",
  "TV Position": "LH Side",
  "IGR": "1 Row",
  "Post": "10 Nos",
  "Windows Side Bar": "2 Line",
  "Fitting Materials": "Powder Coat",
  "Footstep Beading": "Travels",
  "Wheel Arch": "FRP",
  // WIRING
  "Wiring Dashboard": "SRVS",
  "Wiper Motor": "TVS",
  "Tape Recorder": "Yes",
  "Camera Wiring": "Yes",
  "Fancy Lights": "Yes",
  "Tube Light": "LED 12+2",
  "Footstep Tube Light": "Yes",
  "Step Colour Tube Light": "No",
  "Route Board Tube Light": "Yes",
  "Side Body Light": "No",
  "Top Dome Light": "Yes",
  "Front Headlight": "As per Grill",
  "Rear Danger Light": "As per Grill",
  "Hatrack Light": "Yes",
  "Emergency Buzzer": "Yes",
  "Electric Calling Buzzer": "Yes",
};

// Master "Standard Build" Configuration per model.
// Each model spreads the full Moffusil baseline and overrides only its unique fields.
export const STANDARD_VARIATIONS: Record<BaseModels, Record<string, string>> = {
  Moffusil: { ...MOFFUSIL_BASE_SELECTIONS },

  Town: {
    ...MOFFUSIL_BASE_SELECTIONS,
    "Body Type": "Town",
    "Chassis Brand": "TATA",
    "Entrance": "Nil",
    "Exit Position": "In Between Wheel",
    "Door Driver Door": "Half",
    "Side Dickey": "No",
    "Seat Type": "Jeeva",
  },

  College: {
    ...MOFFUSIL_BASE_SELECTIONS,
    "Body Type": "College",
    "Chassis Brand": "Eicher",
    "Entrance": "Rear",
    "Seat Type": "School Type",
  },

  Staff: {
    ...MOFFUSIL_BASE_SELECTIONS,
    "Body Type": "Staff",
    "Chassis Brand": "Leyland",
    "Entrance": "Rear",
    "AC": "BSBS",
  },
};
