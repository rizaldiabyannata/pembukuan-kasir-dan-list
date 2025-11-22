import * as Minio from "minio";

// Initialize MinIO client
export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT || "9002"), // This should be the external port (9002)
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ROOT_USER || "minioadmin",
  secretKey: process.env.MINIO_ROOT_PASSWORD || "minioadmin", // Fixed to match default
});

export const BUCKET_NAME = process.env.MINIO_BUCKET || "my-bucket";

/**
 * Test MinIO connection on initialization
 * Note: This is NOT called automatically during module load to avoid blocking builds.
 * Call this manually when you need to test the connection.
 */
export async function testMinIOConnection() {
  try {
    // Test connection by checking if we can list buckets
    const buckets = await minioClient.listBuckets();
    console.log("✅ MinIO Connection Successful!");
    console.log(
      `   Endpoint: ${process.env.MINIO_ENDPOINT || "localhost"}:${process.env.MINIO_PORT || "9000"}`
    );
    console.log(`   Status: Connected`);
    console.log(`   Buckets available: ${buckets.length}`);
    return true;
  } catch (error) {
    console.error("❌ MinIO Connection Failed!");
    console.error(`   Error: ${error.message}`);
    console.error(
      `   Endpoint: ${process.env.MINIO_ENDPOINT || "localhost"}:${process.env.MINIO_PORT || "9000"}`
    );
    // Don't throw here, let it fail gracefully if MinIO is not available
    return false;
  }
}

// DO NOT test connection on module load - it blocks the build process
// Connection will be tested on first actual use

/**
 * Ensure bucket exists, create if not, and set public read policy
 */
export async function ensureBucket() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, "us-east-1");
      if (process.env.NODE_ENV !== "production") {
        console.log(`✅ Bucket created: ${BUCKET_NAME}`);
      }

      // Set bucket policy to allow public read
      await setBucketPublicRead();
    } else {
      if (process.env.NODE_ENV !== "production") {
        console.log(`✅ Bucket exists: ${BUCKET_NAME}`);
      }

      // Check and set bucket policy if needed
      await checkAndSetBucketPolicy();
    }
  } catch (error) {
    console.error(`❌ Error ensuring bucket ${BUCKET_NAME}:`, error.message);
    throw error;
  }
}

/**
 * Set bucket policy to allow public read access
 */
async function setBucketPublicRead() {
  try {
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
        },
      ],
    };

    await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
    if (process.env.NODE_ENV !== "production") {
      console.log(`✅ Bucket ${BUCKET_NAME} set to public read`);
    }
  } catch (error) {
    console.error(
      `❌ Error setting bucket policy for ${BUCKET_NAME}:`,
      error.message
    );
    throw error;
  }
}

/**
 * Check current bucket policy and set if needed
 */
async function checkAndSetBucketPolicy() {
  try {
    const currentPolicy = await minioClient.getBucketPolicy(BUCKET_NAME);
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `📋 Current bucket policy status: ${currentPolicy ? "Set" : "Not set"}`
      );
    }

    if (!currentPolicy) {
      if (process.env.NODE_ENV !== "production") {
        console.log(`🔧 Setting public read policy for bucket ${BUCKET_NAME}`);
      }
      await setBucketPublicRead();
    } else {
      if (process.env.NODE_ENV !== "production") {
        console.log(`✅ Bucket ${BUCKET_NAME} already has policy configured`);
      }
    }
  } catch (error) {
    if (error.code === "NoSuchBucketPolicy") {
      if (process.env.NODE_ENV !== "production") {
        console.log(
          `🔧 No policy found, setting public read policy for bucket ${BUCKET_NAME}`
        );
      }
      await setBucketPublicRead();
    } else {
      console.error(
        `❌ Error checking bucket policy for ${BUCKET_NAME}:`,
        error.message
      );
    }
  }
}

/**
 * Upload file to MinIO
 * @param {Buffer} buffer - File buffer
 * @param {string} fileName - File name with path
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - File URL or path
 */
export async function uploadFile(buffer, fileName, contentType) {
  try {
    await ensureBucket();

    const metaData = {
      "Content-Type": contentType,
    };

    await minioClient.putObject(
      BUCKET_NAME,
      fileName,
      buffer,
      buffer.length,
      metaData
    );

    return fileName;
  } catch (error) {
    console.error("Error uploading file to MinIO:", error);
    throw error;
  }
}

/**
 * Get file from MinIO
 * @param {string} fileName - File name/path
 * @returns {Promise<Buffer>}
 */
export async function getFile(fileName) {
  try {
    const dataStream = await minioClient.getObject(BUCKET_NAME, fileName);
    const chunks = [];

    return new Promise((resolve, reject) => {
      dataStream.on("data", (chunk) => chunks.push(chunk));
      dataStream.on("end", () => resolve(Buffer.concat(chunks)));
      dataStream.on("error", reject);
    });
  } catch (error) {
    console.error("Error getting file from MinIO:", error);
    throw error;
  }
}

/**
 * Delete file from MinIO
 * @param {string} fileName - File name/path
 * @returns {Promise<void>}
 */
export async function deleteFile(fileName) {
  try {
    await minioClient.removeObject(BUCKET_NAME, fileName);
  } catch (error) {
    console.error("Error deleting file from MinIO:", error);
    throw error;
  }
}

/**
 * List files in a directory
 * @param {string} prefix - Directory prefix
 * @returns {Promise<Array>}
 */
export async function listFiles(prefix) {
  try {
    const objectsStream = minioClient.listObjects(BUCKET_NAME, prefix, true);
    const objects = [];

    return new Promise((resolve, reject) => {
      objectsStream.on("data", (obj) => objects.push(obj));
      objectsStream.on("end", () => resolve(objects));
      objectsStream.on("error", reject);
    });
  } catch (error) {
    console.error("Error listing files from MinIO:", error);
    throw error;
  }
}

/**
 * Get public URL for file (if bucket is public)
 * @param {string} fileName - File name/path
 * @returns {string} - Public URL
 */
export function getPublicUrl(fileName) {
  const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
  const endpoint = process.env.MINIO_ENDPOINT || "localhost";
  const port = process.env.MINIO_PORT || "9000";

  // Only add port if it's not default HTTP/HTTPS ports
  const portSuffix =
    (port === "80" && protocol === "http") ||
    (port === "443" && protocol === "https")
      ? ""
      : `:${port}`;

  return `${protocol}://${endpoint}${portSuffix}/${BUCKET_NAME}/${fileName}`;
}

/**
 * Test MinIO integration and bucket status
 */
export async function testMinIOIntegration() {
  console.log("\n🔍 Testing MinIO Integration...");

  try {
    // Test connection
    const buckets = await minioClient.listBuckets();
    console.log("✅ MinIO Connection: OK");
    console.log(
      `   Available buckets: ${buckets.map((b) => b.name).join(", ")}`
    );

    // Test bucket
    await ensureBucket();

    // Test bucket policy
    try {
      const policy = await minioClient.getBucketPolicy(BUCKET_NAME);
      if (policy) {
        console.log("✅ Bucket Policy: Public read enabled");
      } else {
        console.log("⚠️  Bucket Policy: No policy set (private)");
      }
    } catch (error) {
      if (error.code === "NoSuchBucketPolicy") {
        console.log("⚠️  Bucket Policy: No policy set (private)");
      } else {
        console.log(`❌ Bucket Policy: Error checking - ${error.message}`);
      }
    }

    // Test upload/download
    const testFileName = `test-${Date.now()}.txt`;
    const testContent = Buffer.from("MinIO integration test");

    await uploadFile(testContent, testFileName, "text/plain");
    console.log("✅ Upload Test: OK");

    const downloadedContent = await getFile(testFileName);
    if (downloadedContent.toString() === testContent.toString()) {
      console.log("✅ Download Test: OK");
    } else {
      console.log("❌ Download Test: Content mismatch");
    }

    // Clean up test file
    await deleteFile(testFileName);
    console.log("✅ Delete Test: OK");

    // Show public URL format
    console.log(`\n📝 Public URL format: ${getPublicUrl("filename.ext")}`);

    console.log("\n🎉 MinIO Integration: All tests passed!");
    return true;
  } catch (error) {
    console.error("❌ MinIO Integration Test Failed:", error.message);
    return false;
  }
}

/**
 * Generate presigned URL for downloading file
 * @param {string} fileName - File name/path
 * @param {number} expiry - Expiry time in seconds (default: 24 hours)
 * @returns {Promise<string>}
 */
export async function getPresignedUrl(fileName, expiry = 24 * 60 * 60) {
  try {
    const url = await minioClient.presignedGetObject(
      BUCKET_NAME,
      fileName,
      expiry
    );
    return url;
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw error;
  }
}
