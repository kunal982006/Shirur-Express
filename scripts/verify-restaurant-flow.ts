
import "dotenv/config";
import { storage } from "../server/storage";
import { insertUserSchema, insertRestaurantOrderSchema } from "@shared/schema";

async function verifyRestaurantFlow() {
    console.log("Starting Restaurant Flow Verification...");

    try {
        // 1. Create Customer
        console.log("Creating Customer...");
        const customer = await storage.createUser({
            username: "test_customer_" + Date.now(),
            password: "password123",
            role: "user",
            phone: "1234567890",
            email: "customer@test.com"
        });
        console.log("Customer created:", customer.id);

        // 2. Fetch Category ID for 'restaurants'
        console.log("Fetching Category ID...");
        const categories = await storage.getServiceCategories();
        const restaurantCategory = categories.find(c => c.slug === "restaurants");
        if (!restaurantCategory) throw new Error("Restaurant category not found");
        console.log("Category ID:", restaurantCategory.id);

        // 3. Create Restaurant Provider
        console.log("Creating Restaurant Provider...");
        const restaurantUser = await storage.createUser({
            username: "test_restaurant_" + Date.now(),
            password: "password123",
            role: "provider",
            phone: "9876543210",
            email: "restaurant@test.com"
        });
        const restaurant = await storage.createServiceProvider({
            userId: restaurantUser.id,
            businessName: "Test Restaurant",
            categoryId: restaurantCategory.id, // Use ID, not slug
            address: "123 Food St",
            description: "Best food",
            experience: 5,
            isVerified: true,
            // serviceArea: "City", // Not in schema
            // availability: "All Day" // Not in schema
        });
        console.log("Restaurant created:", restaurant.id);

        // 4. Create Rider
        console.log("Creating Rider...");
        const riderUser = await storage.createUser({
            username: "test_rider_" + Date.now(),
            password: "password123",
            role: "rider",
            phone: "5555555555",
            email: "rider@test.com"
        });
        console.log("Rider created:", riderUser.id);

        // 5. Place Order
        console.log("Placing Order...");
        const orderData = {
            userId: customer.id,
            providerId: restaurant.id,
            items: [{ menuItemId: "dummy_item_id", name: "Burger", quantity: 2, price: 100 }], // Added menuItemId
            totalAmount: "200",
            deliveryAddress: "456 Home St",
            status: "pending"
        };

        // We use storage directly
        // Note: createRestaurantOrder expects InsertRestaurantOrder which doesn't include status or userId usually?
        // Let's check storage.createRestaurantOrder signature.
        // It takes (order: InsertRestaurantOrder & { userId: string }).
        // InsertRestaurantOrder includes items, totalAmount, deliveryAddress, providerId.
        // Status is default.
        const order = await storage.createRestaurantOrder(orderData);
        console.log("Order placed:", order.id, "Status:", order.status);

        // 6. Restaurant Accepts Order
        console.log("Restaurant Accepting Order...");
        const acceptedOrder = await storage.updateRestaurantOrderStatus(order.id, "accepted");
        console.log("Order status:", acceptedOrder.status);

        // 7. Restaurant Marks Ready
        console.log("Restaurant Marking Ready...");
        const readyOrder = await storage.updateRestaurantOrderStatus(order.id, "ready_for_pickup");
        console.log("Order status:", readyOrder.status);

        // 8. Rider Claims Order
        console.log("Rider Claiming Order...");
        // Pass riderId to assign it
        const orderWithRider = await storage.updateRestaurantOrderStatus(order.id, readyOrder.status, riderUser.id);
        console.log("Order claimed by rider:", orderWithRider.riderId === riderUser.id);

        // 9. Rider Picks Up
        console.log("Rider Picking Up...");
        const pickedUpOrder = await storage.updateRestaurantOrderStatus(order.id, "picked_up");
        console.log("Order status:", pickedUpOrder.status);

        // 10. Rider Delivers
        console.log("Rider Delivering...");
        const deliveredOrder = await storage.updateRestaurantOrderStatus(order.id, "delivered");
        console.log("Order status:", deliveredOrder.status);

        console.log("Verification Successful!");
        process.exit(0);
    } catch (error) {
        console.error("Verification Failed:", error);
        process.exit(1);
    }
}

verifyRestaurantFlow();
