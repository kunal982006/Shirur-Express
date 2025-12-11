
import { insertGroceryOrderSchema } from "./shared/schema";
import { z } from "zod";

const payload = {
    items: [{ productId: "1", quantity: 1, price: 100 }],
    subtotal: "100.00",
    platformFee: "10.00",
    deliveryFee: "20.00",
    total: "130.00",
    deliveryAddress: "123 Test St",
    providerId: null
};

try {
    insertGroceryOrderSchema.parse(payload);
    console.log("Validation Successful");
} catch (error) {
    if (error instanceof z.ZodError) {
        console.log("Validation Failed:");
        console.log(JSON.stringify(error.errors, null, 2));
    } else {
        console.log("Unknown error:", error);
    }
}
