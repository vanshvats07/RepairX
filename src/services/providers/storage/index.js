export function getStorageProviderAdapter() {
  const provider = (process.env.STORAGE_PROVIDER || "").toLowerCase();
  if (provider === "s3" || provider === "cloudflare-r2") {
    return {
      upload: async (input = {}) => ({ provider, status: "UPLOADED", ...input }),
      getSignedUrl: async (input = {}) => ({ provider, status: "SIGNED_URL_READY", ...input }),
      delete: async (input = {}) => ({ provider, status: "DELETED", ...input }),
    };
  }
  return {
    upload: async (input = {}) => ({ provider: "local_only", status: "NOT_CONFIGURED", ...input }),
    getSignedUrl: async (input = {}) => ({ provider: "local_only", status: "NOT_CONFIGURED", ...input }),
    delete: async (input = {}) => ({ provider: "local_only", status: "NOT_CONFIGURED", ...input }),
  };
}

export async function uploadEvidence(input = {}) {
  return getStorageProviderAdapter().upload(input);
}
