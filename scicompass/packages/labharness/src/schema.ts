export interface Capability {
  experimentType: string;
  parameterSchema: Record<string, unknown>;
  constraints: string[];
}

export interface DeviceProfile {
  id: string;
  name: string;
  kind: 'automated-platform' | 'instrument';
  physicalAvailable: boolean;
  partOf?: string;
  members?: string[];
  capabilities: Capability[];
  safetyRules: string[];
  supportedPolicies: string[];
}
