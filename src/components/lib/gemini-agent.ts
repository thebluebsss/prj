import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { PrismaClient } from "@prisma/client";

export class GeminiAgent {
    private model: ChatGoogleGenerativeAI;
    private prisma: PrismaClient;
    private schemaInfo: string;

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

    async analyzeQuery(query: string): Promise<boolean> {
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

    private getDefaultQuery() {
        return {
            where: {
                isArchived: false,
                inventory: { gt: 0 }
            },
            take: 5,
            select: {
                id: true,
                name: true,
                price: true,
                description: true,
                category: {
                    select: {
                        name: true
                    }
                },
                images: {
                    where: {
                        isPrimary: true
                    },
                    select: {
                        url: true
                    },
                    take: 1
                }
            }
        };
    }

    private validateQueryObject(queryObject: any, isCountingQuery: boolean = false, wantsAllProducts: boolean = false): any {
        // Ensure basic structure exists
        if (!queryObject || typeof queryObject !== 'object') {
            return this.getDefaultQuery();
        }

        // Ensure where clause exists and has isArchived: false
        if (!queryObject.where) {
            queryObject.where = { isArchived: false };
        } else {
            queryObject.where = {
                isArchived: false,
                ...queryObject.where
            };
        }

        // Ensure select clause exists with required fields
        if (!queryObject.select) {
            queryObject.select = {
                id: true,
                name: true,
                price: true,
                description: true
            };
        } else {
            queryObject.select = {
                id: true,
                name: true,
                price: true,
                description: true,
                ...queryObject.select
            };
        }

        // Set appropriate limits based on query type
        if (isCountingQuery) {
            queryObject.take = 100; // Much higher limit for counting operations
        } else if (wantsAllProducts) {
            queryObject.take = 50; // Higher limit when requesting all products
        } else if (!queryObject.take) {
            queryObject.take = 10; // Default limit for regular queries
        }

        return queryObject;
    }

    async getDatabaseContext(query: string): Promise<string> {
        try {
            console.log("Generating Prisma query via Gemini model for query:", query);
            
            // Determine if this is a counting query or asking for all products
            const isCountingQuery = query.toLowerCase().includes("how many") || 
                                   query.toLowerCase().includes("count") ||
                                   !!query.toLowerCase().match(/number of .*(products|items)/i);
            
            const wantsAllProducts = query.toLowerCase().includes("all products") ||
                                    query.toLowerCase().includes("list all") ||
                                    query.toLowerCase().includes("show all");
            
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
6. For counting queries (How many, count, etc.), set 'take' property to 100
7. For queries asking for "all products", set 'take' property to 50
8. For regular queries, limit results with 'take: 10' to prevent excessive data
9. For price comparisons, use the appropriate operator (lt, gt, lte, gte)
10. For text searches, use 'contains' operator and make it case-insensitive
11. For sale products, check if salePrice is not null
12. Do NOT include any explanatory text or code formatting in your response

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
  "take": 10
}

SYSTEM: Output ONLY the JSON object with no text before or after.`;

            const response = await this.model.invoke(sqlPrompt);
            console.log('Raw model response:', response.text);

            // Extract and parse JSON object
            let queryObject = this.getDefaultQuery(); // Default fallback
            
            try {
                // Try multiple extraction methods
                let jsonText = '';
                
                // Method 1: Direct parsing of entire response
                try {
                    queryObject = JSON.parse(response.text.trim());
                    console.log("Successfully parsed complete response as JSON");
                    // Continue with this parsed object
                } catch (e) {
                    // Method 2: Extract from markdown code blocks
                    const markdownMatch = response.text.match(/```(?:json)?\s*([\s\S]*?)```/);
                    if (markdownMatch && markdownMatch[1]) {
                        try {
                            queryObject = JSON.parse(markdownMatch[1].trim());
                            console.log("Successfully extracted and parsed JSON from markdown code block");
                        } catch (markdownError) {
                            console.log("Failed to parse markdown-extracted JSON, trying regex");
                            
                            // Method 3: Extract using regex for JSON object
                            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
                            if (jsonMatch) {
                                try {
                                    queryObject = JSON.parse(jsonMatch[0]);
                                    console.log("Successfully extracted and parsed JSON using regex");
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
                                console.log("Successfully extracted and parsed JSON using regex");
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
            queryObject = this.validateQueryObject(queryObject, isCountingQuery, wantsAllProducts);
            
            console.log('Executing query:', JSON.stringify(queryObject, null, 2));
            
            // Execute the query
            const results = await this.prisma.product.findMany(queryObject);

            if (!results || results.length === 0) {
                console.log('No results found, using broadened query');
                return this.formatArrayResults(await this.prisma.product.findMany({
                    where: { isArchived: false },
                    take: isCountingQuery || wantsAllProducts ? 50 : 10,
                    select: queryObject.select
                }), isCountingQuery);
            }

            return this.formatArrayResults(results, isCountingQuery);
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
                        description: true
                    }
                });
                return this.formatArrayResults(fallbackResults);
            } catch (fallbackError) {
                return "Sorry, I couldn't retrieve product information from the database at this time.";
            }
        }
    }

    // Helper method to format array results
    private formatArrayResults(results: any[], isCountingQuery: boolean = false): string {
        if (!results.length) return "No matching items found.";
        
        // If this is a counting query, return the count first
        if (isCountingQuery) {
            return `Found ${results.length} products matching your criteria.\n\n${this.formatProductList(results)}`;
        }
        
        // Determine result type based on first item properties
        const firstItem = results[0];
        
        // Product results
        if (firstItem.name && (firstItem.price !== undefined || firstItem.salePrice !== undefined)) {
            return this.formatProductList(results);
        }
        
        // Category results
        if (firstItem.name && firstItem.products) {
            return `Found ${results.length} categories:\n${results.map(c => {
                const productCount = Array.isArray(c.products) ? c.products.length : '(count not available)';
                return `- ${c.name}${c.description ? `: ${c.description}` : ''} (${productCount} products)`;
            }).join('\n')}`;
        }
        
        // Order results
        if (firstItem.status && firstItem.total !== undefined) {
            return `Found ${results.length} orders:\n${results.map(o => {
                return `- Order #${o.id.substring(0, 8)}: $${o.total} (Status: ${o.status})${o.createdAt ? ` - Placed on ${new Date(o.createdAt).toLocaleDateString()}` : ''}`;
            }).join('\n')}`;
        }
        
        // Review results
        if (firstItem.rating !== undefined && firstItem.productId) {
            return `Found ${results.length} reviews:\n${results.map(r => {
                const productName = r.product?.name || `Product #${r.productId.substring(0, 8)}`;
                return `- ${r.rating}/5 stars for ${productName}${r.comment ? `: "${r.comment.substring(0, 100)}${r.comment.length > 100 ? '...' : ''}"` : ''}`;
            }).join('\n')}`;
        }
        
        // Generic formatting for other result types
        return `Database results (${results.length} items):\n${results.map(item => {
            if (typeof item !== 'object' || item === null) return `- ${JSON.stringify(item)}`;
            
            // Extract the most meaningful fields
            const displayFields = Object.entries(item)
                .filter(([key, value]) => 
                    !key.endsWith('Id') && 
                    key !== 'createdAt' && 
                    key !== 'updatedAt' && 
                    value !== null && 
                    typeof value !== 'object'
                )
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
                
            return `- ${displayFields || JSON.stringify(item)}`;
        }).join('\n')}`;
    }

    // Format product list in a clean way without markdown syntax
    private formatProductList(products: any[]): string {
        return `Found ${products.length} products:\n${products.map(p => {
            const price = p.salePrice ? `$${p.salePrice} (was $${p.price})` : `$${p.price}`;
            const category = p.category?.name ? ` in ${p.category.name}` : '';
            const imageUrl = p.images && p.images.length > 0 ? p.images[0].url : null;
            const imageInfo = imageUrl ? ` (Image available)` : '';
            
            return `- ${p.name}${category}: ${price}${imageInfo}${p.description ? `\n  ${p.description.substring(0, 100)}${p.description.length > 100 ? '...' : ''}` : ''}`;
        }).join('\n')}`;
    }

    // Helper method to format a single result object
    private formatSingleResult(result: any): string {
        // Product result
        if (result.name && (result.price !== undefined || result.salePrice !== undefined)) {
            const price = result.salePrice ? `$${result.salePrice} (was $${result.price})` : `$${result.price}`;
            const category = result.category?.name ? `Category: ${result.category.name}` : '';
            const inventory = result.inventory !== undefined ? `In stock: ${result.inventory}` : '';
            
            let details = [`Name: ${result.name}`, `Price: ${price}`];
            if (category) details.push(category);
            if (inventory) details.push(inventory);
            if (result.description) details.push(`Description: ${result.description}`);
            
            // Add review info if available
            if (result.reviews && Array.isArray(result.reviews) && result.reviews.length > 0) {
                const avgRating = result.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / result.reviews.length;
                details.push(`Rating: ${avgRating.toFixed(1)}/5 (${result.reviews.length} reviews)`);
            }
            
            return `Product details:\n${details.join('\n')}`;
        }
        
        // Generic object formatting
        const formattedPairs = Object.entries(result)
            .filter(([key, value]) => 
                value !== null && 
                typeof value !== 'object'
            )
            .map(([key, value]) => `${key}: ${value}`);
            
        return `Database result:\n${formattedPairs.join('\n')}`;
    }

    async generateResponse(query: string, context?: string): Promise<string> {
        try {
            const response = await this.model.invoke(
                `You are NBDAStore's AI shopping assistant for a clothing e-commerce store. 
Your goal is to provide helpful, friendly, and concise responses to customer inquiries.
${context ? `Use this context to answer accurately:\n${context}\n\n` : ''}
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

    async processQuery(query: string): Promise<{
        response: string;
        used_database: boolean;
        context?: string;
    }> {
        try {
            // Analyze if query needs database context
            const needs_db = await this.analyzeQuery(query);
            console.log(`Query Analysis: ${query} -> ${needs_db ? 'NEEDS_DB' : 'DIRECT'}`);

            // Get context if needed
            const context = needs_db ? await this.getDatabaseContext(query) : undefined;
            
            // Generate response
            const response = await this.generateResponse(query, context);
            
            return {
                response,
                used_database: needs_db,
                context: needs_db ? context : undefined
            };
        } catch (e) {
            console.error("Error processing query:", e);
            return {
                response: "I apologize, but I encountered an error processing your query.",
                used_database: false
            };
        }
    }
}

// Create singleton instance
export const geminiAgent = new GeminiAgent();