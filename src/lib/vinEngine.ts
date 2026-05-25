import { GoogleGenAI, Type } from "@google/genai";
import { VehicleInfo, VehicleIdentityLock, IdentificationState, IdentificationGrade } from '../types';

// ------------------------------------------------------------
// 1. TYPES & INTERFACES
// ------------------------------------------------------------
export interface VehicleData {
  vin:           string;
  year:          string;
  make:          string;
  model:         string;
  engine:        string;
  valid:         boolean;
  checksumValid?: boolean;
  confidence:    'STRONG' | 'PARTIAL' | 'WEAK';
  confirmed:     boolean;
  source?:       string;
  error?:        string;
}

// ------------------------------------------------------------
// 2. SESSION CACHE — prevents duplicate API charges
// Cleared on page reload, persists within session
// ------------------------------------------------------------
const plateCache = new Map<string, VehicleData>();

export function clearVehicleCache(): void {
  plateCache.clear();
}

// ------------------------------------------------------------
// 3. VEHICLE IDENTITY LOCK — single source of truth
// Never auto-locks. Requires confirmation + PARTIAL or STRONG
// ------------------------------------------------------------
let _vehicleIdentityLock: any = null;

export function getVehicleLock(): any {
  return _vehicleIdentityLock;
}

export function lockVehicle(data: VehicleData): {
  success: boolean;
  error?: string;
} {
  if (!data.confirmed) {
    return { success: false, error: 'Vehicle must be confirmed before locking' };
  }
  if (data.confidence === 'WEAK') {
    return { success: false, error: 'Cannot lock a WEAK confidence vehicle — verify manually' };
  }
  if (!data.valid) {
    return { success: false, error: 'Cannot lock invalid vehicle data' };
  }

  _vehicleIdentityLock = {
    data,
    source:     data.source || 'manual',
    confirmed:  true,
    confidence: data.confidence,
    timestamp:  Date.now(),
    locked:     true
  };

  return { success: true };
}

export function resetVehicleLock(): void {
  _vehicleIdentityLock = null;
}

export function confirmVehicle(data: VehicleData): VehicleData {
  return { ...data, confirmed: true };
}

// ------------------------------------------------------------
// 4. VIN FORMAT + CHECKSUM VALIDATION
// Returns both formatValid and checksumValid separately
// checksumValid = false does NOT block decode attempt
// ------------------------------------------------------------
export function validateVIN(vin: string): {
  formatValid:   boolean;
  checksumValid: boolean;
  error?:        string;
} {
  if (!vin || vin.length !== 17) {
    return { formatValid: false, checksumValid: false,
             error: 'VIN must be exactly 17 characters' };
  }
  if (/[IOQ]/i.test(vin)) {
    return { formatValid: false, checksumValid: false,
             error: 'VIN cannot contain letters I, O, or Q' };
  }

  const values: Record<string, number> = {
    A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,
    J:1,K:2,L:3,M:4,N:5,P:7,R:9,
    S:2,T:3,U:4,V:5,W:6,X:7,Y:8,Z:9,
    '0':0,'1':1,'2':2,'3':3,'4':4,
    '5':5,'6':6,'7':7,'8':8,'9':9
  };
  const weights = [8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2];

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const char = vin[i].toUpperCase();
    if (!(char in values)) {
      return { formatValid: false, checksumValid: false,
               error: `Invalid character "${char}" in VIN` };
    }
    sum += values[char] * weights[i];
  }

  const remainder  = sum % 11;
  const checkDigit = remainder === 10 ? 'X' : String(remainder);
  return {
    formatValid:   true,
    checksumValid: checkDigit === vin[8].toUpperCase()
  };
}

// ------------------------------------------------------------
// 5. VIN DECODE — NHTSA API (free, no key required)
// Attempts decode even on checksum failure — marks as WEAK
// ------------------------------------------------------------
export async function decodeVIN(vin: string): Promise<VehicleData> {
  const trimmed = vin.trim().toUpperCase();
  const { formatValid, checksumValid, error: fmtError } = validateVIN(trimmed);

  if (!formatValid) {
    return {
      vin: trimmed, year:'', make:'', model:'', engine:'',
      valid: false, checksumValid: false,
      confidence: 'WEAK', confirmed: false,
      error: fmtError
    };
  }

  try {
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${trimmed}?format=json`
    );
    if (!response.ok) throw new Error(`NHTSA HTTP ${response.status}`);
    const data = await response.json();
    const results = data.Results;

    const get = (varName: string): string =>
      results.find((r: any) => r.Variable === varName)?.Value?.trim() || '';

    const year   = get('Model Year');
    const make   = get('Make');
    const model  = get('Model');
    const dispL  = get('Displacement (L)');
    const cyls   = get('Engine Number of Cylinders');
    const engMod = get('Engine Model');

    let engine = '';
    if (dispL) {
      const liters = parseFloat(dispL);
      engine = isNaN(liters) ? dispL
        : `${liters.toFixed(1)}L${cyls ? ' ' + cyls + '-cyl' : ''}`;
    } else {
      engine = engMod || '';
    }

    if (!year || !make || !model) {
      return {
        vin: trimmed, year:'', make:'', model:'', engine:'',
        valid: false, checksumValid,
        confidence: 'WEAK', confirmed: false,
        error: 'VIN not found in NHTSA database — try manual entry'
      };
    }

    const confidence: VehicleData['confidence'] =
      !checksumValid ? 'WEAK' :
      !engine        ? 'PARTIAL' :
      'STRONG';

    return {
      vin: trimmed, year, make, model, engine,
      valid: true, checksumValid,
      confidence, confirmed: false,
      source: 'NHTSA'
    };

  } catch (err: any) {
    return {
      vin: trimmed, year:'', make:'', model:'', engine:'',
      valid: false, checksumValid,
      confidence: 'WEAK', confirmed: false,
      error: `NHTSA lookup failed: ${err.message}`
    };
  }
}

// ------------------------------------------------------------
// 6. PLATE DECODE — Gemini + Google Search
// ------------------------------------------------------------
const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
]);

export async function decodePlate(
  plate: string,
  state: string
): Promise<VehicleData> {
  const cleanPlate = plate.trim().toUpperCase().replace(/\s+/g, '');
  const cleanState = state.trim().toUpperCase();

  if (!cleanPlate || cleanPlate.length < 2) {
    return {
      vin:'', year:'', make:'', model:'', engine:'',
      valid: false, confidence: 'WEAK', confirmed: false,
      error: 'Please enter a license plate number'
    };
  }
  if (!US_STATES.has(cleanState)) {
    return {
      vin:'', year:'', make:'', model:'', engine:'',
      valid: false, confidence: 'WEAK', confirmed: false,
      error: 'Please enter a valid US state abbreviation (e.g. CA, TX)'
    };
  }

  // Check cache first
  const cacheKey = `${cleanPlate}:${cleanState}`;
  if (plateCache.has(cacheKey)) {
    return plateCache.get(cacheKey)!;
  }

  const apiKey = (process.env.API_KEY as string) || (process.env.GEMINI_API_KEY as string);
  if (!apiKey) {
    return {
      vin:'', year:'', make:'', model:'', engine:'',
      valid: false, confidence: 'WEAK', confirmed: false,
      error: 'Gemini API key not configured — please select a key in settings'
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find the 17-character VIN for the following US license plate: ${cleanPlate} in the state of ${cleanState}. 
      Use Google Search to find the vehicle details and VIN. 
      Return ONLY the 17-character VIN if found, or "NOT_FOUND" if you cannot find it.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vin: { type: Type.STRING, description: "The 17-character VIN or 'NOT_FOUND'" }
          },
          required: ["vin"]
        }
      }
    });

    const resultJson = JSON.parse(response.text || "{}");
    const vin = resultJson.vin?.trim().toUpperCase();

    if (!vin || vin === "NOT_FOUND" || vin.length !== 17) {
      return {
        vin:'', year:'', make:'', model:'', engine:'',
        valid: false, confidence: 'WEAK', confirmed: false,
        error: 'Could not find a valid VIN for this plate using Google Search.'
      };
    }

    // Chain to NHTSA for full vehicle details
    const vehicleData = await decodeVIN(vin);
    const result: VehicleData = {
      ...vehicleData,
      vin: vin,
      source: 'Google Search + NHTSA'
    };

    // Cache successful result
    if (result.valid) {
      plateCache.set(cacheKey, result);
    }

    return result;

  } catch (err: any) {
    return {
      vin:'', year:'', make:'', model:'', engine:'',
      valid: false, confidence: 'WEAK', confirmed: false,
      error: `AI Plate lookup failed: ${err.message}`
    };
  }
}

// ------------------------------------------------------------
// 7. MASTER LOOKUP — single entry point for order engine
// Tries VIN first, then plate. UI owns confirmation + lock.
// ------------------------------------------------------------
export async function lookupVehicle(input: {
  vin?:   string;
  plate?: string;
  state?: string;
}): Promise<VehicleData & { method: 'vin' | 'plate' | 'none' }> {

  if (input.vin && input.vin.trim().length > 0) {
    const result = await decodeVIN(input.vin.trim());
    if (result.valid) return { ...result, method: 'vin' };
  }

  if (input.plate && input.plate.trim().length > 0 && input.state) {
    const result = await decodePlate(input.plate.trim(), input.state.trim());
    if (result.valid) return { ...result, method: 'plate' };
  }

  return {
    vin:'', year:'', make:'', model:'', engine:'',
    valid: false, confidence: 'WEAK', confirmed: false,
    method: 'none',
    error: 'Could not identify vehicle — please enter details manually'
  };
}

// ------------------------------------------------------------
// 8. COMPATIBILITY WRAPPER (for App.tsx)
// ------------------------------------------------------------
export const processVehicleInput = async (
  input: string,
  type: 'vin' | 'plate' | 'ymm' = 'vin',
  plateState?: string
): Promise<any> => {
  const timestamp = Date.now();
  
  let result: any;
  if (type === 'vin') {
    result = await decodeVIN(input);
  } else if (type === 'plate') {
    result = await decodePlate(input, plateState || 'CA');
  } else {
    return { status: 'NO_CANDIDATE', timestamp };
  }

  if (!result.valid) {
    return { 
      status: result.error?.includes('not found') ? 'INVALID' : 'NO_CANDIDATE',
      timestamp 
    };
  }

  const grade: IdentificationGrade = result.confidence === 'STRONG' ? 'STRONG' : (result.confidence === 'PARTIAL' ? 'USABLE_BUT_INCOMPLETE' : 'WEAK');

  return {
    inputType: type,
    rawInput: input,
    normalizedInput: result.vin || input,
    plateState,
    validationResult: true,
    vinChecksumValid: result.checksumValid,
    decodeResult: {
      year: result.year,
      make: result.make,
      model: result.model,
      engine: result.engine,
      vin: result.vin
    },
    grade,
    status: grade === 'STRONG' ? 'CONFIRMATION_REQUIRED' : (type === 'vin' ? 'DECODE_WEAK' : 'LOOKUP_WEAK'),
    confidenceScore: result.confidence === 'STRONG' ? 0.95 : 0.5,
    isConfirmed: result.confirmed,
    timestamp
  };
};

// ============================================================
// .env SETUP — root .env file (already in .gitignore)
// ============================================================
//
// VERIFY before demo: RegCheck API endpoint
// ============================================================
