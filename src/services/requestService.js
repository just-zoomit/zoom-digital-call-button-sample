import { db } from "../db/mockDb.js";
import { generateId } from "../utils/id.js";

export const RequestStatus = {
  NEW: "NEW",
  CLAIMED: "CLAIMED",
  RESOLVED: "RESOLVED"
};

export async function createHelpRequest({ storeId, itemId, promptId, customQuestion }) {
  const id = generateId("req");
  const now = new Date();

  const request = {
    id,
    storeId,
    itemId,
    promptId: promptId || null,
    customQuestion: customQuestion || null,
    status: RequestStatus.NEW,
    createdAt: now.toISOString(),
    claimedAt: null,
    claimedBy: null,
    claimedByName: null
  };

  await db.createRequest(request);
  return request;
}

export async function getHelpRequest(id) {
  return db.getRequestById(id);
}

export async function claimHelpRequest({ requestId, zoomUserId, zoomUserName }) {
  const now = new Date().toISOString();
  return db.updateRequest(requestId, {
    status: RequestStatus.CLAIMED,
    claimedAt: now,
    claimedBy: zoomUserId,
    claimedByName: zoomUserName
  });
}
