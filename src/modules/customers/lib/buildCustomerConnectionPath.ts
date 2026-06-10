import type { Asset, Customer } from "@/types/domain";

const kindLabels: Record<Asset["kind"], string> = {
  pop: "PoP",
  junction_box: "Junction Box",
  splitter: "Splitter",
  pole: "Pole",
  onu: "ONU",
  fiber_route: "Fiber Route",
};

function findNearest<T extends { location: { lat: number; lng: number } }>(
  target: { lat: number; lng: number },
  options: T[]
): T | null {
  if (options.length === 0) return null;
  let nearest = options[0];
  let minDist = Infinity;

  for (const option of options) {
    const dist = Math.hypot(
      target.lat - option.location.lat,
      target.lng - option.location.lng
    );
    if (dist < minDist) {
      minDist = dist;
      nearest = option;
    }
  }
  return nearest;
}

export function buildCustomerConnectionPath(
  customer: Customer,
  assets: Asset[]
): string {
  const pops = assets.filter((a) => a.kind === "pop");
  const poles = assets.filter((a) => a.kind === "pole");
  const splitters = assets.filter((a) => a.kind === "splitter");
  const onus = assets.filter((a) => a.kind === "onu");

  const onu = customer.relatedOnuId
    ? assets.find((a) => a.id === customer.relatedOnuId) ?? null
    : customer.location
      ? findNearest(customer.location, onus)
      : null;

  if (!onu) {
    return customer.plan;
  }

  const segments: string[] = [];

  const nearestPop = findNearest(onu.location, pops);
  if (nearestPop) {
    segments.push(kindLabels.pop);
  }

  const nearestSplitter = findNearest(onu.location, splitters);
  if (nearestSplitter) {
    segments.push(kindLabels.splitter);
  }

  const nearestPole = findNearest(onu.location, poles);
  if (nearestPole) {
    segments.push(kindLabels.pole);
  }

  segments.push(onu.name.replace(/^Customer ONU - /, "ONU • "));
  segments.push(customer.name);

  return segments.join(" → ");
}
