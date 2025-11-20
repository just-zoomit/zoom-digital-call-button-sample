import { db } from "../db/mockDb.js";
import { generateId } from "../utils/id.js";
import { websocketService } from "./websocketService.js";

export const RequestStatus = {
  NEW: "NEW",
  CLAIMED: "CLAIMED",
  ON_THE_WAY: "ON_THE_WAY",
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
  const result = await db.updateRequest(requestId, {
    status: RequestStatus.CLAIMED,
    claimedAt: now,
    claimedBy: zoomUserId,
    claimedByName: zoomUserName
  });
  
  // Broadcast WebSocket update
  if (result) {
    websocketService.broadcastRequestUpdate(requestId, {
      status: result.status,
      claimedByDisplayName: result.claimedByName
    });
  }
  
  console.log(`[RequestService] Request ${requestId} claimed by ${zoomUserName}`);
  return result;
}

export async function onTheWayHelpRequest({ requestId, zoomUserId, zoomUserName }) {
  const now = new Date().toISOString();
  const result = await db.updateRequest(requestId, {
    status: RequestStatus.ON_THE_WAY,
    onTheWayAt: now,
    onTheWayBy: zoomUserId,
    onTheWayByName: zoomUserName
  });
  
  // Broadcast WebSocket update
  if (result) {
    websocketService.broadcastRequestUpdate(requestId, {
      status: result.status,
      claimedByDisplayName: result.onTheWayByName || result.claimedByName
    });
  }
  
  console.log(`[RequestService] Request ${requestId} marked on-the-way by ${zoomUserName}`);
  return result;
}
