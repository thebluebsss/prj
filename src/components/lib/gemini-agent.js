// CommonJS version of the GeminiAgent
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { PrismaClient } = require("@prisma/client");

class GeminiAgent {
  constructor() {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_GEMINI_API_KEY environment variable is not set");
    }

    this.model = new ChatGoogleGenerativeAI({
      apiKey,
      modelName: "gemini-2.0-flash",
      maxOutputTokens: 2048,
      temperature: 0.0,
    });

    this.prisma = new PrismaClient();

    // Define schema information for the model
    this.schemaInfo = `
Database Schema Information:

Product Model:
- id: String (ID)
- name: String
- description: String
- price: Float
- salePrice: Float (optional)
- inventory: Int
- isArchived: Boolean
- isFeatured: Boolean
- categoryId: String
- category: Relation to Category
- images: Relation to Image[]
- reviews: Relation to Review[]

Category Model:
- id: String (ID)
- name: String
- description: String (optional)
- parentId: String (optional)
- products: Relation to Product[]

Image Model:
- id: String (ID)
- productId: String
- url: String
- alt: String (optional)
- isPrimary: Boolean

Review Model:
- id: String (ID)
- userId: String
- productId: String
- rating: Int
- comment: String (optional)

Available Prisma Operators:
- equals: ==
- not: !=
- in: [value1, value2]
- notIn: [value1, value2]
- lt: <
- lte: <=
- gt: >
- gte: >=
- contains: LIKE '%value%'
- startsWith: LIKE 'value%'
- endsWith: LIKE '%value'
- AND: { AND: [condition1, condition2] }
- OR: { OR: [condition1, condition2] }
`;
  }

  async analyzeQuery(query) {
    try {
      const response = await this.model.invoke(
        `You are an AI that determines if a product-related query needs current database information or can be answered with general knowledge.

Question: ${query}

Consider:
1. Does the query ask about specific products, prices, inventory, or other current data?
2. Does the query require counting, aggregating, or filtering actual products?
3. Could this be answered with general product knowledge without specific data?

Answer with either NEEDS_DB or DIRECT.
First explain your reasoning, then provide your decision.`
      );

      console.log(`Query Analysis: ${query} -> ${response.text}`);
      return response.text.includes("NEEDS_DB");
    } catch (error) {
      console.error("Error in analyzeQuery:", error);
      // Default to using DB for safety
      return true;
    }
  }

  getDefaultQuery() {
    return {
      where: {
        isArchived: false,
        inventory: { gt: 0 },
      },
      take: 5,
      select: {
        id: true,
        name: true,
        price: true,
        description: true,
        category: {
          select: {
            name: true,
          },
        },
        images: {
          where: {
            isPrimary: true,
          },
          select: {
            url: true,
          },
          take: 1,
        },
      },
    };
  }

  validateQueryObject(queryObject) {
    // Ensure basic structure exists
    if (!queryObject || typeof queryObject !== "object") {
      return this.getDefaultQuery();
    }

    // Ensure where clause exists and has isArchived: false
    if (!queryObject.where) {
      queryObject.where = { isArchived: false };
    } else {
      queryObject.where = {
        isArchived: false,
        ...queryObject.where,
      };
    }

    // Ensure select clause exists with required fields
    if (!queryObject.select) {
      queryObject.select = {
        id: true,
        name: true,
        price: true,
        description: true,
      };
    } else {
      queryObject.select = {
        id: true,
        name: true,
        price: true,
        description: true,
        ...queryObject.select,
      };
    }

    // Limit results to prevent excessive data
    if (!queryObject.take) {
      queryObject.take = 10;
    }

    return queryObject;
  }

  async getDatabaseContext(query) {
    try {
      console.log("Generating Prisma query via Gemini model for query:", query);

      // Always attempt to generate query via model first
      const sqlPrompt = `
SYSTEM: You are a Prisma query generator. Your task is to generate a valid Prisma query object based on the user's question about products.

${this.schemaInfo}

USER: Generate a Prisma query object for this question: "${query}"

IMPORTANT RULES:
1. Your response must ONLY contain a valid JSON object that can be parsed with JSON.parse()
2. The JSON object must contain 'where' and 'select' properties
3. Always include 'isArchived: false' in the where clause
4. Always include id, name, price, and description fields in the select clause
5. Include category and image relations when appropriate
6. Limit results with 'take: 5' to prevent excessive data
7. For price comparisons, use the appropriate operator (lt, gt, lte, gte)
8. For text searches, use 'contains' operator
9. Do NOT include any explanatory text or code formatting in your response

Example query structure:
{
  "where": {
    "isArchived": false,
    "price": { "lt": 50 }
  },
  "select": {
    "id": true,
    "name": true,
    "price": true,
    "description": true,
    "category": {
      "select": { "name": true }
    },
    "images": {
      "where": { "isPrimary": true },
      "select": { "url": true },
      "take": 1
    }
  },
  "take": 5
}

SYSTEM: Output ONLY the JSON object with no text before or after.`;

      const response = await this.model.invoke(sqlPrompt);
      console.log("Raw model response:", response.text);

      // Extract and parse JSON object
      let queryObject = this.getDefaultQuery(); // Default fallback

      try {
        // Try multiple extraction methods
        let jsonText = "";

        // Method 1: Direct parsing of entire response
        try {
          queryObject = JSON.parse(response.text.trim());
          console.log("Successfully parsed complete response as JSON");
          // Continue with this parsed object
        } catch (e) {
          // Method 2: Extract from markdown code blocks
          const markdownMatch = response.text.match(
            /```(?:json)?\s*([\s\S]*?)```/
          );
          if (markdownMatch && markdownMatch[1]) {
            try {
              queryObject = JSON.parse(markdownMatch[1].trim());
              console.log(
                "Successfully extracted and parsed JSON from markdown code block"
              );
            } catch (markdownError) {
              console.log(
                "Failed to parse markdown-extracted JSON, trying regex"
              );

              // Method 3: Extract using regex for JSON object
              const jsonMatch = response.text.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                try {
                  queryObject = JSON.parse(jsonMatch[0]);
                  console.log(
                    "Successfully extracted and parsed JSON using regex"
                  );
                } catch (regexError) {
                  console.error("Failed to parse regex-extracted JSON");
                  throw regexError;
                }
              } else {
                throw new Error("No JSON object found in response");
              }
            }
          } else {
            // No markdown block, try direct regex
            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                queryObject = JSON.parse(jsonMatch[0]);
                console.log(
                  "Successfully extracted and parsed JSON using regex"
                );
              } catch (regexError) {
                console.error("Failed to parse regex-extracted JSON");
                throw regexError;
              }
            } else {
              throw new Error("No JSON object found in response");
            }
          }
        }
      } catch (error) {
        console.error("All attempts to extract valid JSON failed:", error);
        console.log("Using default query as fallback");
        // Keep the default queryObject
      }

      // Validate and enhance the query object
      queryObject = this.validateQueryObject(queryObject);

      console.log("Executing query:", JSON.stringify(queryObject, null, 2));

      // Execute the query
      const results = await this.prisma.product.findMany(queryObject);

      if (!results || results.length === 0) {
        console.log("No results found, using broadened query");
        return this.formatArrayResults(
          await this.prisma.product.findMany({
            where: { isArchived: false },
            take: 5,
            select: queryObject.select,
          })
        );
      }

      return this.formatArrayResults(results);
    } catch (error) {
      console.error("Error in getDatabaseContext:", error);
      try {
        // Last-ditch effort - try the simplest possible query
        const fallbackResults = await this.prisma.product.findMany({
          where: { isArchived: false },
          take: 5,
          select: {
            id: true,
            name: true,
            price: true,
            description: true,
          },
        });
        return this.formatArrayResults(fallbackResults);
      } catch (fallbackError) {
        return "Sorry, I couldn't retrieve product information from the database at this time.";
      }
    }
  }

  // Helper method to format array results
  formatArrayResults(results) {
    if (!results.length) return "No matching items found.";

    // Determine result type based on first item properties
    const firstItem = results[0];

    // Product results
    if (
      firstItem.name &&
      (firstItem.price !== undefined || firstItem.salePrice !== undefined)
    ) {
      return `Found ${results.length} products:\n${results
        .map((p) => {
          const price = p.salePrice
            ? `$${p.salePrice} (was $${p.price})`
            : `$${p.price}`;
          const category = p.category?.name ? ` [${p.category.name}]` : "";
          const imageUrl =
            p.images && p.images.length > 0 ? p.images[0].url : null;
          const imageInfo = imageUrl ? ` (Image available)` : "";

          return `- ${p.name}${category}: ${price}${imageInfo}${p.description ? `\n  ${p.description.substring(0, 100)}${p.description.length > 100 ? "..." : ""}` : ""}`;
        })
        .join("\n")}`;
    }

    // Category results
    if (firstItem.name && firstItem.products) {
      return `Found ${results.length} categories:\n${results
        .map((c) => {
          const productCount = Array.isArray(c.products)
            ? c.products.length
            : "(count not available)";
          return `- ${c.name}${c.description ? `: ${c.description}` : ""} (${productCount} products)`;
        })
        .join("\n")}`;
    }

    // Order results
    if (firstItem.status && firstItem.total !== undefined) {
      return `Found ${results.length} orders:\n${results
        .map((o) => {
          return `- Order #${o.id.substring(0, 8)}: $${o.total} (Status: ${o.status})${o.createdAt ? ` - Placed on ${new Date(o.createdAt).toLocaleDateString()}` : ""}`;
        })
        .join("\n")}`;
    }

    // Review results
    if (firstItem.rating !== undefined && firstItem.productId) {
      return `Found ${results.length} reviews:\n${results
        .map((r) => {
          const productName =
            r.product?.name || `Product #${r.productId.substring(0, 8)}`;
          return `- ${r.rating}/5 stars for ${productName}${r.comment ? `: "${r.comment.substring(0, 100)}${r.comment.length > 100 ? "..." : ""}"` : ""}`;
        })
        .join("\n")}`;
    }

    // Generic formatting for other result types
    return `Database results (${results.length} items):\n${results
      .map((item) => {
        if (typeof item !== "object" || item === null)
          return `- ${JSON.stringify(item)}`;

        // Extract the most meaningful fields
        const displayFields = Object.entries(item)
          .filter(
            ([key, value]) =>
              !key.endsWith("Id") &&
              key !== "createdAt" &&
              key !== "updatedAt" &&
              value !== null &&
              typeof value !== "object"
          )
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ");

        return `- ${displayFields || JSON.stringify(item)}`;
      })
      .join("\n")}`;
  }

  // Helper method to format a single result object
  formatSingleResult(result) {
    // Product result
    if (
      result.name &&
      (result.price !== undefined || result.salePrice !== undefined)
    ) {
      const price = result.salePrice
        ? `$${result.salePrice} (was $${result.price})`
        : `$${result.price}`;
      const category = result.category?.name
        ? `Category: ${result.category.name}`
        : "";
      const inventory =
        result.inventory !== undefined ? `In stock: ${result.inventory}` : "";

      let details = [`Name: ${result.name}`, `Price: ${price}`];
      if (category) details.push(category);
      if (inventory) details.push(inventory);
      if (result.description)
        details.push(`Description: ${result.description}`);

      // Add review info if available
      if (
        result.reviews &&
        Array.isArray(result.reviews) &&
        result.reviews.length > 0
      ) {
        const avgRating =
          result.reviews.reduce((sum, r) => sum + r.rating, 0) /
          result.reviews.length;
        details.push(
          `Rating: ${avgRating.toFixed(1)}/5 (${result.reviews.length} reviews)`
        );
      }

      return `Product details:\n${details.join("\n")}`;
    }

    // Generic object formatting
    const formattedPairs = Object.entries(result)
      .filter(([key, value]) => value !== null && typeof value !== "object")
      .map(([key, value]) => `${key}: ${value}`);

    return `Database result:\n${formattedPairs.join("\n")}`;
  }

  async generateResponse(query, context) {
    try {
      const response = await this.model.invoke(
        `You are NBDAStore's AI shopping assistant for a clothing e-commerce store. 
Your goal is to provide helpful, friendly, and concise responses to customer inquiries.
${context ? `Use this context to answer accurately:\n${context}\n\n` : ""}
Question: ${query}

Provide a clear, concise, and helpful response. 
Respond in a friendly, helpful tone. Keep responses concise but informative.
Do NOT use markdown formatting like asterisks (*) for bullets or for bold/italic text.
Present product information in a clean format using regular text.
For lists, use simple dashes (-) or numbers and avoid special formatting.
`
      );

      return response.text.trim();
    } catch (error) {
      console.error("Error in generateResponse:", error);

      // Provide a fallback response
      if (context) {
        return `Based on our product information, I found some items that might interest you. ${context}`;
      } else {
        return "I apologize, but I'm having trouble generating a response right now. Please try again later.";
      }
    }
  }

  async processQuery(query) {
    try {
      // Analyze if query needs database context
      const needs_db = await this.analyzeQuery(query);
      console.log(
        `Query Analysis: ${query} -> ${needs_db ? "NEEDS_DB" : "DIRECT"}`
      );

      // Get context if needed
      const context = needs_db
        ? await this.getDatabaseContext(query)
        : undefined;

      // Generate response
      const response = await this.generateResponse(query, context);

      return {
        response,
        used_database: needs_db,
        context: needs_db ? context : undefined,
      };
    } catch (e) {
      console.error("Error processing query:", e);
      return {
        response:
          "I apologize, but I encountered an error processing your query.",
        used_database: false,
      };
    }
  }
}

// Create singleton instance
const geminiAgent = new GeminiAgent();

module.exports = {
  GeminiAgent,
  geminiAgent,
};
