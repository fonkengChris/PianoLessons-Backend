export default function () {
  // Check for critical environment variables
  if (!process.env.JWT_PRIVATE_KEY) {
    throw new Error("FATAL ERROR: JWT_PRIVATE_KEY is not defined.");
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("FATAL ERROR: MONGODB_URI is not defined.");
  }

  // Add other configuration checks as needed
}
