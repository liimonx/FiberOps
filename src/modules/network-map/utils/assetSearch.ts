import {
  AssetCategory,
  CategorizedResult,
  ConnectionType,
  NetworkConnection,
  NetworkNode,
  NetworkNodeType,
} from "../types";

const CONNECTION_TYPE_LABELS: Record<ConnectionType, string> = {
  [ConnectionType.FIBER_ROUTE]: "Fiber route",
  [ConnectionType.CUSTOMER_CONNECTION]: "Customer drop",
};

/** Match score from 0 (no match) to 1 (exact). */
export function calculateMatchScore(text: string, query: string): number {
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) return 0;
  if (normalizedText === normalizedQuery) return 1;
  if (normalizedText.startsWith(normalizedQuery)) return 0.8;
  if (normalizedText.includes(normalizedQuery)) return 0.6;

  let queryIndex = 0;
  for (
    let i = 0;
    i < normalizedText.length && queryIndex < normalizedQuery.length;
    i++
  ) {
    if (normalizedText[i] === normalizedQuery[queryIndex]) {
      queryIndex++;
    }
  }
  if (queryIndex === normalizedQuery.length) return 0.4;

  return 0;
}

export function getBestMatchScore(
  fields: Array<string | undefined | null>,
  query: string
): number {
  return fields.reduce(
    (best, field) => Math.max(best, field ? calculateMatchScore(field, query) : 0),
    0
  );
}

function humanizeNodeType(type: NetworkNodeType): string {
  return type.replace(/_/g, " ");
}

function nodeMatchesCategory(node: NetworkNode, category: AssetCategory): boolean {
  const isCustomer = node.type === NetworkNodeType.CUSTOMER;
  if (category === "customers") return isCustomer;
  if (category === "nodes") return !isCustomer;
  return true;
}

export function formatConnectionLabel(
  connection: NetworkConnection,
  nodeById: Map<string, NetworkNode>
): { name: string; detail: string } {
  const source = nodeById.get(connection.sourceNodeId);
  const target = nodeById.get(connection.targetNodeId);
  const sourceLabel = source?.name ?? connection.sourceNodeId;
  const targetLabel = target?.name ?? connection.targetNodeId;
  const typeLabel = CONNECTION_TYPE_LABELS[connection.type] ?? connection.type;

  return {
    name: `${sourceLabel} → ${targetLabel}`,
    detail: `${typeLabel} · ${connection.id}`,
  };
}

function searchNodes(
  nodes: NetworkNode[],
  query: string,
  category: AssetCategory
): CategorizedResult[] {
  const results: CategorizedResult[] = [];

  for (const node of nodes) {
    if (!nodeMatchesCategory(node, category)) continue;
    if (category === "connections") continue;

    const matchScore = getBestMatchScore(
      [node.name, node.id, humanizeNodeType(node.type)],
      query
    );

    if (matchScore <= 0) continue;

    results.push({
      id: node.id,
      name: node.name,
      type: node.type === NetworkNodeType.CUSTOMER ? "customer" : "node",
      matchScore,
      category: node.type === NetworkNodeType.CUSTOMER ? "customers" : "nodes",
      detail: `${humanizeNodeType(node.type)} · ${node.id}`,
    });
  }

  return results;
}

function searchConnections(
  connections: NetworkConnection[],
  nodeById: Map<string, NetworkNode>,
  query: string,
  category: AssetCategory
): CategorizedResult[] {
  if (category !== "all" && category !== "connections") return [];

  const results: CategorizedResult[] = [];

  for (const conn of connections) {
    const { name, detail } = formatConnectionLabel(conn, nodeById);
    const source = nodeById.get(conn.sourceNodeId);
    const target = nodeById.get(conn.targetNodeId);
    const typeLabel = CONNECTION_TYPE_LABELS[conn.type] ?? conn.type;

    const matchScore = getBestMatchScore(
      [
        conn.id,
        conn.sourceNodeId,
        conn.targetNodeId,
        source?.name,
        target?.name,
        typeLabel,
        conn.type,
        name,
      ],
      query
    );

    if (matchScore <= 0) continue;

    results.push({
      id: conn.id,
      name,
      type: "connection",
      matchScore,
      category: "connections",
      detail,
    });
  }

  return results;
}

/** Search nodes and connections with category filtering and ranked results. */
export function searchNetworkAssets(
  nodes: NetworkNode[],
  connections: NetworkConnection[],
  query: string,
  category: AssetCategory,
  maxResults = 10
): CategorizedResult[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const results = [
    ...searchNodes(nodes, trimmed, category),
    ...searchConnections(connections, nodeById, trimmed, category),
  ];

  results.sort((a, b) => b.matchScore - a.matchScore);
  return results.slice(0, maxResults);
}
