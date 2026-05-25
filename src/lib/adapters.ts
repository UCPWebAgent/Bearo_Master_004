import { OrderState } from '../types';

export interface AdapterResponse {
  success: boolean;
  adapterName: string;
  externalId?: string;
  message?: string;
  error?: any;
}

export interface OrderAdapter {
  name: string;
  send(order: OrderState): Promise<AdapterResponse>;
}

/**
 * API Adapter - Sends order to a specific backend API
 */
export class ApiAdapter implements OrderAdapter {
  constructor(public name: string, private endpoint: string) {}

  async send(order: OrderState): Promise<AdapterResponse> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        adapterName: this.name,
        externalId: data.orderId || data.id,
        message: data.message || 'Order successfully sent to API',
      };
    } catch (error) {
      return {
        success: false,
        adapterName: this.name,
        error,
        message: `Failed to send order to API: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}

/**
 * Webhook Adapter - Sends order to a generic webhook URL
 */
export class WebhookAdapter implements OrderAdapter {
  constructor(public name: string, private url: string) {}

  async send(order: OrderState): Promise<AdapterResponse> {
    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'order.created',
          timestamp: new Date().toISOString(),
          data: order,
        }),
      });

      return {
        success: response.ok,
        adapterName: this.name,
        message: response.ok ? 'Webhook delivered' : `Webhook failed with status: ${response.status}`,
      };
    } catch (error) {
      return {
        success: false,
        adapterName: this.name,
        error,
        message: `Webhook delivery failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}

/**
 * Dashboard Queue Adapter - Simulates adding to a local/remote dashboard queue
 */
export class DashboardQueueAdapter implements OrderAdapter {
  constructor(public name: string = 'Dashboard Queue') {}

  async send(order: OrderState): Promise<AdapterResponse> {
    // In a real app, this might be a specific Firestore collection or a separate service
    console.log(`[${this.name}] Adding order to queue for counter review...`);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          adapterName: this.name,
          message: 'Order added to dashboard review queue',
        });
      }, 500);
    });
  }
}

/**
 * Orchestrator - Manages multiple adapters and handles routing/fallbacks
 */
export class OrderOrchestrator {
  private adapters: OrderAdapter[] = [];

  registerAdapter(adapter: OrderAdapter) {
    this.adapters.push(adapter);
  }

  async dispatch(order: OrderState): Promise<AdapterResponse[]> {
    console.log(`[Orchestrator] Dispatching order through ${this.adapters.length} adapters...`);
    
    // We run all adapters in parallel but handle their failures independently
    const results = await Promise.all(
      this.adapters.map(async (adapter) => {
        try {
          return await adapter.send(order);
        } catch (error) {
          return {
            success: false,
            adapterName: adapter.name,
            error,
            message: `Critical adapter failure: ${error instanceof Error ? error.message : String(error)}`,
          };
        }
      })
    );

    return results;
  }
}

// Default orchestrator instance
export const orchestrator = new OrderOrchestrator();

// Register default adapters
orchestrator.registerAdapter(new ApiAdapter('Local Backend', '/api/orders'));
orchestrator.registerAdapter(new DashboardQueueAdapter());

// Optional: Register a mock webhook if configured in env
if (import.meta.env.VITE_ORDER_WEBHOOK_URL) {
  orchestrator.registerAdapter(new WebhookAdapter('External Webhook', import.meta.env.VITE_ORDER_WEBHOOK_URL));
}
