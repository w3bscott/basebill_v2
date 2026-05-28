import { Attribution } from "ox/erc8021";

const BUILDER_CODE = "bc_ex62j14h";

export function applyBaseAttribution(encodedData: string): `0x${string}` {
  const dataSuffix = Attribution.toDataSuffix({ codes: [BUILDER_CODE] });
  return `${encodedData}${dataSuffix.slice(2)}` as `0x${string}`;
}
