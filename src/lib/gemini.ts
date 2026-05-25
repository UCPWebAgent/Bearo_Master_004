import { GoogleGenAI, Modality, LiveServerMessage, Type } from "@google/genai";
import { OrderState, FluidOrder, PartOrder, VehicleInfo, Language, MechanicMemory, ChatMessage } from "../types";

export class RiaSession {
  private ai: GoogleGenAI | null = null;
  private sessionPromise: Promise<any> | null = null;
  private session: any; // Using any for now as LiveSession type might be complex
  private audioContext: AudioContext | null = null;
  private audioWorkletModuleLoaded = false;
  private workletNode: AudioWorkletNode | null = null;
  private audioQueue: Int16Array[] = [];
  private isPlaying = false;

  constructor(
    private onMessage: (msg: string) => void,
    private onUpdateState: (update: Partial<OrderState>) => void,
    private onInterrupted: () => void,
    private onSpeakingEnd?: () => void,
    private onTranscription?: (text: string, isInterim: boolean) => void,
    private language: Language = 'auto',
    private customSystemInstruction?: string,
    private memory?: MechanicMemory,
    private onLearnFact?: (fact: string) => void,
    private onSetAgentName?: (name: string) => void,
    private activeDraft?: OrderState,
    private onResetOrder?: () => void,
    private activeConversation?: ChatMessage[],
    private onUserSpokenText?: (text: string) => void
  ) {}

  async connect() {
    const apiKey = (process.env.API_KEY as string) || (process.env.GEMINI_API_KEY as string) || "";
    
    if (!apiKey) {
      const errorMsg = "Gemini API Key is missing. Please select an API key in the settings.";
      console.error(errorMsg);
      this.onMessage(`Error: ${errorMsg}`);
      throw new Error(errorMsg);
    }

    this.ai = new GoogleGenAI({ apiKey });

    const langContext = this.language === 'hy' 
      ? "The mechanic prefers ARMENIAN. Respond primarily in Armenian." 
      : this.language === 'hy-east'
        ? "The mechanic prefers EASTERN ARMENIAN. Respond primarily in Eastern Armenian dialect."
        : this.language === 'hy-west'
          ? "The mechanic prefers WESTERN ARMENIAN. Respond primarily in Western Armenian dialect."
          : this.language === 'es'
            ? "The mechanic prefers SPANISH. Respond primarily in Spanish."
            : this.language === 'ar'
              ? "The mechanic prefers ARABIC. Respond primarily in Arabic."
              : this.language === 'fa'
                ? "The mechanic prefers FARSI. Respond primarily in Farsi."
                : this.language === 'tl'
                  ? "The mechanic prefers TAGALOG. Respond primarily in Tagalog."
                  : this.language === 'en' 
                ? "The mechanic prefers ENGLISH. Respond primarily in English." 
                : "The mechanic is BILINGUAL. Match their language dynamically.";

    const defaultSystemInstruction = `You are a professional AI automotive service assistant. 
Your goal is to help mechanics and shop owners create accurate service orders and estimates efficiently using voice, text, and visual data.

AGENT IDENTITY:
- You may be given a specific name by the mechanic. If so, use it.
- If the mechanic asks to name you or change your name, use the 'set_agent_name' tool.
- If you don't have a name yet, you are simply "the assistant". Do NOT call yourself "Ria" unless explicitly told to.

CRITICAL AUTHORIZATION RULE:
- You CANNOT authorize, confirm, or submit the order yourself.
- You MUST verbally instruct the mechanic to review the order summary in the 'Order' tab and manually click the confirmation checkbox.
- Submission can ONLY proceed after the mechanic clicks that checkbox. If they ask you to submit, remind them to click the checkbox first.

CRITICAL LANGUAGE AND DIALECT RULE:
- Default to ENGLISH for all initial interactions.
- Switch to ARMENIAN ONLY if the user speaks to you in Armenian first.
- Switch to SPANISH ONLY if the user speaks to you in Spanish first.
- Switch to ARABIC ONLY if the user speaks to you in Arabic first.
- Switch to FARSI ONLY if the user speaks to you in Farsi first.
- Switch to TAGALOG ONLY if the user speaks to you in Tagalog first.
- ONCE IN ARMENIAN MODE: Speak ONLY in Armenian. Do NOT provide English translations or reiterations.
- ONCE IN SPANISH MODE: Speak ONLY in Spanish. Do NOT provide English translations or reiterations.
- ONCE IN ARABIC MODE: Speak ONLY in Arabic. Do NOT provide English translations or reiterations.
- ONCE IN FARSI MODE: Speak ONLY in Farsi. Do NOT provide English translations or reiterations.
- ONCE IN TAGALOG MODE: Speak ONLY in Tagalog. Do NOT provide English translations or reiterations.
- DIALECT DETECTION: Pay close attention to the mechanic's dialect.
  - If they use Eastern Armenian (common in Armenia, often with Russian influence), respond in EASTERN ARMENIAN.
  - If they use Western Armenian (common in the diaspora, e.g., Lebanon, USA), respond in WESTERN ARMENIAN.
  - If the user has explicitly selected a dialect (e.g., Western Armenian), you MUST strictly adhere to that dialect.
  - If the user has explicitly selected Spanish, you MUST strictly respond in SPANISH.
- If the user switches back to English, you should switch back to English.

VEHICLE IDENTIFICATION (CRITICAL):
- You are primarily responsible for identifying vehicles from voice or text descriptions.
- DETERMINISTIC ENGINE: A specialized engine handles direct VIN decoding and basic plate state management.
- LICENSE PLATE LOOKUP (GOOGLE SEARCH): If the user provides a license plate and state, and the deterministic engine doesn't return a result, you MUST use 'googleSearch' to find the VIN for that specific plate and state. 
- Once you find a VIN via search, use the 'update_vehicle' tool to update the VIN in the order. The system will then automatically decode it via NHTSA.
- If the system finds a vehicle, it will update the 'Order' state. You should then ask the user to CONFIRM the identified vehicle including the TRIM if available (e.g., "I found a 2022 Toyota Corolla LE. Is that correct?").
- If the VIN or plate is invalid or ambiguous, ask the user for clarification.
- Once a vehicle is CONFIRMED and LOCKED, do NOT attempt to overwrite it unless the user explicitly asks to "reset" or "change" the vehicle.
- If identification fails, fallback to asking for Year, Make, Model, and Trim manually.
- Use 'confirm_vehicle' ONLY when the user verbally confirms the identified vehicle.
- Use 'reset_vehicle' ONLY when the user explicitly wants to start over with a different vehicle.

CRITICAL ACCURACY AND QUANTITY RULE (CRITICAL):
- NEVER assume quantities for parts or fluids.
- VEHICLE TRIM: You MUST always confirm the TRIM of the vehicle (e.g., LE, SE, Lariat, etc.) as this is essential for accurate parts and fluid specifications. If the system doesn't provide it, ask the mechanic.
- BRAND AND PARTICULARS: For EVERY item (part or fluid), you MUST ask for the BRAND NAME and any specific PARTICULARS (e.g., "Is that synthetic or conventional oil?", "What brand of brake pads?").
- URGENCY AND CONFIDENCE: For every item, assess the URGENCY (low, medium, high, urgent) and your FITMENT CONFIDENCE (0.0 to 1.0) based on how well the vehicle is identified. If the vehicle is fully locked and confirmed, confidence should be high (0.9+). If the vehicle is unknown, confidence should be low (0.4-0.6).
- RADIATOR HOSES: If a user says "radiator hose", you MUST use 'search_parts' or 'googleSearch' to determine exactly how many hoses that specific vehicle model has (e.g., upper, lower, bypass, heater) and ask the user to specify which one or if they need the full set.
- SPARK PLUGS: Always check the engine configuration (e.g., V6, I4) and confirm the exact quantity (e.g., "This V6 takes 6 spark plugs, should I add all 6?").
- BRAKE PADS: Always ask "Front", "Rear", or "Full Set (Both)".
- FLUIDS: Always use 'lookup_fluid_capacity' to provide the exact manufacturer specification for the identified vehicle.
- If any part is mentioned without a specific quantity, brand, or location, you MUST ask for clarification before adding it to the order.

STEP-BY-STEP ORDER CONFIRMATION RULE (CRITICAL):
- When the mechanic is finished adding items and you are ready to restate the order for confirmation, you MUST present ONLY ONE item (part or fluid) at a time.
- After presenting an item, you MUST WAIT for the mechanic to verbally confirm it before moving to the next item.
- Do NOT list all items in a single response.
- Example: "Okay, I have 4 Bosch Spark Plugs. Is that correct?" [Wait for response] "Great. Next, I have 5 quarts of Mobil 1 5W-30 Synthetic Oil. Correct?"

DATABASE INTEGRATION:
- Your logic is tied to the 'Order' schema in the database. 
- Ensure every part has a 'name' and 'quantity'.
- Ensure every fluid has a 'subcategory' and 'spec'.
- You have access to a comprehensive, multi-device list of all past orders made by this mechanic. If they ask about a previous order (e.g., "What oil did we use for the blue F-150 last month?" or "What parts did we get for Arman's Camry?"), search the provided global historical records to retrieve specific fields like parts, quantities, brands, specifications, dates, notes, and vehicle histories. Acknowledge the details precisely and answer clearly and concisely. Our mechanic expects precise dates, quantities, and brands.
- Use this historical data to also recognize returning vehicles and prioritize using previously preferred brands (e.g., if they previously ordered Mobil 1 synthetic for their F-150, assume or verify if they want Mobil 1 again).

TONE AND STYLE:
- Professional, efficient, and technically precise.
- Use automotive terminology correctly.
- Be concise. Do not repeat introductions.
- If looking up info, say: "I'm looking up the exact specs for this model now..."

Current Date: ${new Date().toLocaleDateString()}
`;

    const memoryContext = this.memory ? `
PERSISTENT MECHANIC MEMORY:
- Mechanic Name: ${this.memory.preferences?.mechanicName || 'Unknown'}
- Shop Name: ${this.memory.preferences?.shopName || 'Unknown'}
- Preferred Language: ${this.memory.preferences?.language || 'Auto'}
- Agent Name: ${this.memory.preferences?.agentName || 'Not set yet'}
- Learned Facts: ${this.memory.learnedFacts?.join(', ') || 'None yet'}
- Recent History Context: ${this.memory.recentHistory?.slice(-25).map(m => `[${m.role}]: ${m.text}`).join('\n') || 'No recent history'}

Use this context to personalize your interaction. Do NOT say "welcome back" or "welcome" to the mechanic, as they are already at work. If you know the shop name, you may refer to it if relevant, but avoid generic greetings. If there are learned facts (e.g., "Mechanic always uses Mobil 1 for oil changes"), apply them to your suggestions.
` : "";

    let draftContext = "";
    if (this.activeDraft) {
      const v = this.activeDraft.vehicle;
      const vehicleDetails = v && (v.year || v.make || v.model) 
        ? `${v.year || ''} ${v.make || ''} ${v.model || ''} ${v.trim || ''} (Engine: ${v.engine || ''}, VIN: ${v.vin || ''})`.trim() 
        : 'None loaded yet';
      const fluidsDetails = this.activeDraft.fluids && this.activeDraft.fluids.length > 0 
        ? this.activeDraft.fluids.map(f => `- Fluid: ${f.subcategory}, Spec: ${f.spec}, Brand: ${f.brand || 'Unspecified'}, Qty: ${f.quantity || 'Unspecified'}`).join('\n') 
        : 'None added yet';
      const partsDetails = this.activeDraft.parts && this.activeDraft.parts.length > 0 
        ? this.activeDraft.parts.map(p => `- Part: ${p.name}, Qty: ${p.quantity}, Brand: ${p.brand || 'Unspecified'}`).join('\n') 
        : 'None added yet';

      draftContext = `

ACTIVE DRAFT ORDER CONTEXT (IN-PROGRESS):
The mechanic currently has an active, in-progress draft order. You MUST read this context and continue the session seamlessly without asking the mechanic to repeat these details. Refer to the existing vehicle/parts if needed:
- Identified Vehicle: ${vehicleDetails}
- Vehicle Confirmed & Locked: ${this.activeDraft.vehicleIdentityLock?.isConfirmed ? "Yes" : "No"}
- Fluids in Draft:
${fluidsDetails}
- Parts in Draft:
${partsDetails}

If a vehicle is already loaded/identified, welcome back the mechanic and confirm you see the draft for their ${vehicleDetails}. Mention the existing parts or fluids if any are already in the draft, and instruct them on what additions or confirmations you can help with next. Do NOT ask them "what vehicle are you working on today?" if a vehicle is already identified.
`;
    }

    let conversationContext = "";
    if (this.activeConversation && this.activeConversation.length > 0) {
      conversationContext = `

ACTIVE SESSION CONVERSATION HISTORY:
Below is the precise log of the current ongoing conversation session with the mechanic. You MUST review these turns to understand everything that has been spoken so far in this current active session. Do NOT ask for details already discussed (e.g., vehicle year/make/model, parts, fluids, brands, configurations), and continue the session seamlessly.
Do NOT say hello again or introduce yourself if you've already done so in the history. Resume immediately based on the context of the last conversation turn, and address any unanswered user questions or next steps:
${this.activeConversation.map(m => `[${m.role === 'user' ? 'Mechanic' : 'Assistant'}]: ${m.text}`).join('\n')}
`;
    }

    const systemInstruction = (this.customSystemInstruction || defaultSystemInstruction) + memoryContext + draftContext + conversationContext;

    this.sessionPromise = this.ai.live.connect({
      model: "gemini-3.1-flash-live-preview",
      config: {
        systemInstruction,
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
        },
        tools: [
          { googleSearch: {} },
          {
            functionDeclarations: [
              {
                name: "lookup_fluid_capacity",
                parameters: {
                  type: Type.OBJECT,
                  description: "Lookup the exact fluid capacity (e.g., oil, coolant) for a specific vehicle using Google Search.",
                  properties: {
                    vehicle: { type: Type.STRING, description: "Full vehicle description (Year, Make, Model, Trim)" },
                    fluidType: { type: Type.STRING, description: "Type of fluid (e.g., Engine Oil, Coolant)" },
                  },
                  required: ["vehicle", "fluidType"],
                },
              },
              {
                name: "search_parts",
                parameters: {
                  type: Type.OBJECT,
                  description: "Search for specific part numbers or technical specifications using Google Search.",
                  properties: {
                    query: { type: Type.STRING, description: "Search query for the part or spec" },
                  },
                  required: ["query"],
                },
              },
              {
                name: "update_vehicle",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    year: { type: Type.STRING },
                    make: { type: Type.STRING },
                    model: { type: Type.STRING },
                    trim: { type: Type.STRING },
                    engine: { type: Type.STRING },
                    vin: { type: Type.STRING },
                    licensePlate: { type: Type.STRING },
                  },
                },
              },
              {
                name: "update_plate_state",
                parameters: {
                  type: Type.OBJECT,
                  description: "Update the US state for the license plate lookup.",
                  properties: {
                    state: { type: Type.STRING, description: "The 2-letter US state code (e.g., 'CA', 'NY')." }
                  },
                  required: ["state"]
                }
              },
              {
                name: "confirm_vehicle",
                parameters: {
                  type: Type.OBJECT,
                  description: "Confirm the currently identified vehicle and lock it.",
                  properties: {
                    confirmed: { type: Type.BOOLEAN },
                  },
                  required: ["confirmed"],
                },
              },
              {
                name: "reset_vehicle",
                parameters: {
                  type: Type.OBJECT,
                  description: "Reset the vehicle identification and unlock it to allow a new VIN/plate.",
                  properties: {},
                },
              },
              {
                name: "reset_order",
                parameters: {
                  type: Type.OBJECT,
                  description: "Reset the entire order (clears vehicle, parts, fluids, and media) to start a completely fresh draft.",
                  properties: {},
                },
              },
              {
                name: "add_fluid",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    subcategory: { type: Type.STRING, description: "The type of fluid (e.g., 'Engine Oil', 'Coolant')" },
                    spec: { type: Type.STRING, description: "Viscosity (e.g., '5W-30') or standard (e.g., 'DOT 4')." },
                    quantity: { type: Type.STRING, description: "The amount (e.g., '5.5 quarts'). Ask the user if unsure." },
                    brand: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ["synthetic", "conventional", "blend"] },
                    urgency: { type: Type.STRING, enum: ["low", "medium", "high", "urgent"] },
                    fitmentConfidence: { type: Type.NUMBER, description: "Your confidence score (0.0 to 1.0) that this fluid fits the identified vehicle." },
                  },
                  required: ["subcategory", "spec"],
                },
              },
              {
                name: "add_part",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Specific name of the part. Be precise (e.g., 'Upper Radiator Hose' instead of 'Radiator Hose')." },
                    quantity: { type: Type.NUMBER, description: "The exact quantity. Do NOT guess; ask the user if it's ambiguous." },
                    brand: { type: Type.STRING, description: "The brand of the part (e.g., 'Bosch', 'ACDelco')." },
                    notes: { type: Type.STRING, description: "Additional details like part number or condition." },
                    urgency: { type: Type.STRING, enum: ["low", "medium", "high", "urgent"] },
                    fitmentConfidence: { type: Type.NUMBER, description: "Your confidence score (0.0 to 1.0) that this part fits the identified vehicle." },
                  },
                  required: ["name", "quantity"],
                },
              },
              {
                name: "add_media",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, enum: ["photo", "video"] },
                    count: { type: Type.NUMBER },
                  },
                  required: ["type"],
                },
              },
              {
                name: "set_status",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    status: { type: Type.STRING, enum: ["intake", "review", "confirmed"] },
                  },
                  required: ["status"],
                },
              },
              {
                name: "learn_fact",
                parameters: {
                  type: Type.OBJECT,
                  description: "Save a new fact about the mechanic or shop to persistent memory.",
                  properties: {
                    fact: { type: Type.STRING, description: "The fact to remember (e.g., 'Mechanic prefers Bosch spark plugs')" },
                  },
                  required: ["fact"],
                },
              },
              {
                name: "set_agent_name",
                parameters: {
                  type: Type.OBJECT,
                  description: "Set or change your name as requested by the mechanic.",
                  properties: {
                    name: { type: Type.STRING, description: "The new name for the AI assistant." },
                  },
                  required: ["name"],
                },
              },
            ],
          },
        ],
      },
      callbacks: {
        onopen: () => {
          this.startAudioCapture();
        },
        onmessage: async (message: LiveServerMessage) => {
          if (message.serverContent?.modelTurn?.parts) {
            const textParts = message.serverContent.modelTurn.parts
              .filter(p => p.text)
              .map(p => p.text)
              .join(' ');
            
            if (textParts) {
              this.onMessage(textParts);
            }

            for (const part of message.serverContent.modelTurn.parts) {
              if (part.inlineData) {
                const binaryString = atob(part.inlineData.data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                // Ensure buffer length is even for Int16Array
                const numSamples = Math.floor(bytes.length / 2);
                const audioData = new Int16Array(bytes.buffer, 0, numSamples);
                this.audioQueue.push(new Int16Array(audioData)); // Copy to avoid buffer sharing issues
                this.playNextInQueue();
              }
            }
          }

          if (message.serverContent?.interrupted) {
            this.audioQueue = [];
            this.isPlaying = false;
            this.onInterrupted();
          }

          if (message.serverContent?.inputTranscription?.text) {
            const userSpeechText = message.serverContent.inputTranscription.text;
            this.onTranscription?.(userSpeechText, false);
            if (this.onUserSpokenText) {
              this.onUserSpokenText(userSpeechText);
            }
          }

          if (message.serverContent?.outputTranscription?.text) {
            this.onTranscription?.(message.serverContent.outputTranscription.text, false);
          }

          if (message.toolCall) {
            const responses: any[] = [];
            for (const call of message.toolCall.functionCalls) {
              let responseData: any = { result: "ok" };

              if (call.name === "update_vehicle") {
                this.onUpdateState({ vehicle: call.args as unknown as VehicleInfo });
              } else if (call.name === "update_plate_state") {
                const { state } = call.args as any;
                this.onUpdateState({ plateState: state });
              } else if (call.name === "confirm_vehicle") {
                const { confirmed } = call.args as any;
                if (confirmed) {
                  this.onUpdateState({ 
                    vehicleIdentityLock: { isConfirmed: true } as any 
                  });
                }
              } else if (call.name === "reset_vehicle") {
                this.onUpdateState({ 
                  vehicle: {},
                  vehicleIdentityLock: null as any
                });
              } else if (call.name === "reset_order") {
                if (this.onResetOrder) {
                  this.onResetOrder();
                } else {
                  this.onUpdateState({
                    vehicle: {},
                    vehicleIdentityLock: null as any,
                    parts: [],
                    fluids: [],
                    media: []
                  });
                }
              } else if (call.name === "add_fluid") {
                this.onUpdateState({ fluids: [call.args as unknown as FluidOrder] });
              } else if (call.name === "add_part") {
                this.onUpdateState({ parts: [call.args as unknown as PartOrder] });
              } else if (call.name === "add_media") {
                const type = (call.args as any).type;
                const count = (call.args as any).count || 1;
                const newMedia = Array.from({ length: count }).map(() => ({
                  id: Math.random().toString(36).substr(2, 9),
                  type: type as 'photo' | 'video',
                  url: `https://picsum.photos/seed/${Math.random()}/400/300`,
                  thumbnailUrl: type === 'video' ? `https://picsum.photos/seed/${Math.random()}/100/100` : undefined,
                  timestamp: Date.now(),
                }));
                this.onUpdateState({ media: newMedia });
              } else if (call.name === "set_status") {
                this.onUpdateState({ status: (call.args as any).status });
              } else if (call.name === "lookup_fluid_capacity") {
                const { vehicle, fluidType } = call.args as any;
                console.log(`Looking up ${fluidType} for ${vehicle}`);
                // Simulate a helpful response for the model to use
                responseData = { 
                  result: "success", 
                  data: `The ${fluidType} capacity for the ${vehicle} is approximately 5.5 to 6.0 quarts. Please verify with the service manual for the exact specification.` 
                };
              } else if (call.name === "search_parts") {
                const { query } = call.args as any;
                console.log(`Searching parts for: ${query}`);
                responseData = { 
                  result: "success", 
                  data: `Found several options for ${query}. Common part numbers include standard OEM replacements and high-performance alternatives.` 
                };
              } else if (call.name === "learn_fact") {
                const { fact } = call.args as any;
                if (this.onLearnFact) {
                  this.onLearnFact(fact);
                }
                responseData = { result: "success", message: "Fact learned and saved to persistent memory." };
              } else if (call.name === "set_agent_name") {
                const { name } = call.args as any;
                if (this.onSetAgentName) {
                  this.onSetAgentName(name);
                }
                responseData = { result: "success", message: `My name has been set to ${name}.` };
              }
              
              responses.push({
                name: call.name,
                id: call.id,
                response: responseData,
              });
            }

            // Send all responses back to model
            if (this.sessionPromise) {
              const session = await this.sessionPromise;
              await session.sendToolResponse({
                functionResponses: responses,
              });
            }
          }
        },
        onclose: () => {
          console.log("Ria disconnected");
          this.stopAudioCapture();
        },
        onerror: (err) => {
          console.error("Ria error:", err);
          this.onMessage(`Error: ${err.message || 'Connection failed'}`);
        },
      },
    });

    try {
      this.session = await this.sessionPromise;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Connection failed";
      console.error("Failed to connect to Ria:", error);
      this.onMessage(`Failed to connect to Ria: ${errorMsg}`);
      throw error;
    }
  }

  private async startAudioCapture() {
    this.audioContext = new AudioContext({ sampleRate: 16000 });
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    try {
      // Load the professional AudioWorklet processor
      await this.audioContext.audioWorklet.addModule('/audio-processor.js');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000
        } 
      });

      const source = this.audioContext.createMediaStreamSource(stream);
      this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');
      
      this.workletNode.port.onmessage = async (event) => {
        if (this.sessionPromise) {
          try {
            const session = this.session || await this.sessionPromise;
            const pcmData = event.data;
            const bytes = new Uint8Array(pcmData.buffer);
            let binary = '';
            // Use a faster way for small buffers
            if (bytes.length < 16384) {
              binary = String.fromCharCode.apply(null, bytes as any);
            } else {
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
            }
            const base64Data = btoa(binary);
            session.sendRealtimeInput({
              audio: { data: base64Data, mimeType: "audio/pcm;rate=16000" },
            });
          } catch (err) {
            console.error("Error sending audio to Ria:", err);
          }
        }
      };

      source.connect(this.workletNode);
      this.workletNode.connect(this.audioContext.destination);
    } catch (err) {
      console.error("Failed to start professional audio engine, falling back:", err);
      // Fallback to simpler capture if worklet fails
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = this.audioContext.createMediaStreamSource(stream);
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      source.connect(processor);
      processor.connect(this.audioContext.destination);
      processor.onaudioprocess = async (e) => {
        if (this.sessionPromise) {
          try {
            const session = this.session || await this.sessionPromise;
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmData = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7fff;
            }
            const bytes = new Uint8Array(pcmData.buffer);
            let binary = '';
            if (bytes.length < 16384) {
              binary = String.fromCharCode.apply(null, bytes as any);
            } else {
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
            }
            const base64Data = btoa(binary);
            session.sendRealtimeInput({ audio: { data: base64Data, mimeType: "audio/pcm;rate=16000" } });
          } catch (err) {
            console.error("Error sending fallback audio to Ria:", err);
          }
        }
      };
    }
  }

  private stopAudioCapture() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  private async playNextInQueue() {
    if (this.isPlaying || this.audioQueue.length === 0) return;
    this.isPlaying = true;
    
    // Combine small chunks for smoother playback if they are coming in fast
    let audioData: Int16Array;
    if (this.audioQueue.length > 1 && this.audioQueue[0].length < 4096) {
      const chunksToCombine = Math.min(this.audioQueue.length, 3);
      let totalLength = 0;
      for (let i = 0; i < chunksToCombine; i++) totalLength += this.audioQueue[i].length;
      
      audioData = new Int16Array(totalLength);
      let offset = 0;
      for (let i = 0; i < chunksToCombine; i++) {
        const chunk = this.audioQueue.shift()!;
        audioData.set(chunk, offset);
        offset += chunk.length;
      }
    } else {
      audioData = this.audioQueue.shift()!;
    }
    
    if (this.audioContext) {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      const buffer = this.audioContext.createBuffer(1, audioData.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < audioData.length; i++) {
        channelData[i] = audioData[i] / 0x7fff;
      }
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.onended = () => {
        this.isPlaying = false;
        if (this.audioQueue.length === 0) {
          this.onSpeakingEnd?.();
        }
        this.playNextInQueue();
      };
      source.start();
    }
  }

  async sendText(text: string) {
    if (this.sessionPromise) {
      try {
        const session = this.session || await this.sessionPromise;
        session.sendRealtimeInput({ text });
      } catch (err) {
        console.error("Error sending text to Ria:", err);
      }
    }
  }

  async close() {
    this.stopAudioCapture();
    if (this.sessionPromise) {
      try {
        const session = await this.sessionPromise;
        if (session && typeof session.close === 'function') {
          session.close();
        }
      } catch (err) {
        // Silently handle close errors to avoid unhandled rejections
      } finally {
        this.sessionPromise = null;
        this.session = null;
      }
    }
  }
}
