import { PrismaClient } from "@prisma/client";
import { GeminiAgent } from "../gemini-agent";

// Mock PrismaClient
jest.mock("@prisma/client", () => ({
    PrismaClient: jest.fn().mockImplementation(() => ({
        product: {            findMany: jest.fn().mockResolvedValue([{
                id: 1,
                name: "Test Product",
                price: 99.99,
                salePrice: null,
                description: "A test product",
                inventory: 10,
                isFeatured: false,
                isArchived: false,
                categoryId: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            }])
        }
    }))
}));

// Mock ChatGoogleGenerativeAI
jest.mock("@langchain/google-genai", () => ({
    ChatGoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        invoke: jest.fn().mockImplementation(async (prompt: string) => {
            return {
                text: prompt.includes("determines if a product-related query needs")
                    ? "After analyzing the query, I believe it NEEDS_DB"
                    : prompt.includes("Generate a Prisma query")
                        ? "prisma.product.findMany()"
                        : "Here is your response about products"
            };
        })
    }))
}));

describe("GeminiAgent", () => {    const defaultProducts = [{
        id: 1,
        name: "Test Product",
        price: 99.99,
        salePrice: null,
        description: "A test product",
        inventory: 10,
        isFeatured: false,
        isArchived: false,
        categoryId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
    }];

    let agent: GeminiAgent;
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
        process.env.GOOGLE_GEMINI_API_KEY = "test-api-key";
        // Reset the mock implementation for findMany
        (agent?.['prisma']?.product?.findMany as jest.Mock)?.mockResolvedValue(defaultProducts);
        agent = new GeminiAgent();
    });

    afterEach(() => {
        process.env = originalEnv;
        jest.clearAllMocks();
    });

    describe("analyzeQuery", () => {
        it("should determine if query needs database context", async () => {
            const result = await agent.analyzeQuery("What products do you have?");
            expect(result).toBe(true);
        });

        it("should handle analysis errors gracefully", async () => {
            jest.spyOn(agent["model"], "invoke").mockRejectedValueOnce(new Error("API Error"));
            await expect(agent.analyzeQuery("test query")).rejects.toThrow();
        });
    });

    describe("getDatabaseContext", () => {
        it("should retrieve database context for query", async () => {
            jest.spyOn(global, "Function").mockImplementationOnce(() => () => defaultProducts);
            const context = await agent.getDatabaseContext("Show me all products");
            expect(context).toContain("Test Product");
        });

        it("should handle empty results", async () => {
            // Mock both the Function eval and the findMany to return empty results
            jest.spyOn(global, "Function").mockImplementationOnce(() => () => []);
            (agent['prisma'].product.findMany as jest.Mock).mockResolvedValueOnce([]);
            
            const context = await agent.getDatabaseContext("Show me products");
            expect(context).toBe("No products found matching the criteria.");
        });
    });

    describe("generateResponse", () => {
        it("should generate response with context", async () => {
            const response = await agent.generateResponse(
                "Tell me about products",
                "Products: Test Product ($99.99)"
            );
            expect(response).toBeTruthy();
        });

        it("should generate response without context", async () => {
            const response = await agent.generateResponse("What are your hours?");
            expect(response).toBeTruthy();
        });
    });

    describe("processQuery", () => {
        it("should process full query flow", async () => {
            const result = await agent.processQuery("What products are available?");
            expect(result).toEqual(expect.objectContaining({
                response: expect.any(String),
                used_database: expect.any(Boolean),
                context: expect.any(String)
            }));
        });

        it("should handle processing errors gracefully", async () => {
            jest.spyOn(agent, "analyzeQuery").mockRejectedValueOnce(new Error("Test error"));
            const result = await agent.processQuery("Test query");
            expect(result.response).toContain("error");
            expect(result.used_database).toBe(false);
        });
    });
});