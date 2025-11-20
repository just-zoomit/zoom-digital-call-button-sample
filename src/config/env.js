import dotenv from "dotenv";
dotenv.config();

function required(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

export const env = {
  port: process.env.PORT || 3000,
  zoomClientID: required("ZOOM_CLIENT_ID"),
  zoomChannelId: required("ZOOM_CHANNEL_ID")
};
