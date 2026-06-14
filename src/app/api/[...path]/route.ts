import { handleApiRequest } from "@/mocks/apiRouter";

async function route(request: Request) {
  return handleApiRequest(request);
}

export const GET = route;
export const POST = route;
export const PATCH = route;
export const DELETE = route;
