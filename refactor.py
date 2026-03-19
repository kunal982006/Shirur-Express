import os

file_path = "c:\\Users\\Sai\\Desktop\\Shirur-Express\\server\\routes.ts"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Inject the helper function before payment verification route
helper_text = """
  // --- HELPER FUNCTION FOR ORDER NOTIFICATIONS ---
  async function sendOrderNotifications(updatedOrder: any, orderType: string, database_order_id: string) {
    try {
      const orderLabel = orderType === 'restaurant' ? '🍽️ Restaurant'
        : orderType === 'street_food' ? '🌮 Street Food'
          : '🛒 Grocery';

      if (orderType === 'street_food') {
        const sfAdmin = await storage.getUserByUsername('streetfood_admin');
        if (sfAdmin) {
          console.log(`[FCM] New Order Notification! Sending Ring to streetfood_admin`);
          const allTokens: string[] = [];
          if (sfAdmin.fcmTokens && Array.isArray(sfAdmin.fcmTokens)) {
            allTokens.push(...sfAdmin.fcmTokens);
          } else if (sfAdmin.fcmToken) {
            allTokens.push(sfAdmin.fcmToken);
          }
          const uniqueTokens = [...new Set(allTokens)];
          const sfItems = Array.isArray(updatedOrder?.items) ? updatedOrder.items : [];
          const sfItemsSummary = sfItems.slice(0, 3).map((i: any) => `${i.quantity}x ${i.name}`).join(', ') + (sfItems.length > 3 ? ` +${sfItems.length - 3} more` : '');
          const sfAmount = updatedOrder?.totalAmount?.toString() || updatedOrder?.total?.toString() || 'Check App';
          // Fix for userId being root user id or something
          const orderUserId = updatedOrder?.userId;
          let sfCustomer;
          let sfPhone = 'N/A';
          if (orderUserId) {
              sfCustomer = await storage.getUser(orderUserId);
              sfPhone = sfCustomer?.phone || 'N/A';
          }

          for (const deviceToken of uniqueTokens) {
            await sendPushNotification(deviceToken, {
              type: 'ORDER_REQUEST',
              title: `${orderLabel} Order — ₹${sfAmount} (COD/Paid)`,
              body: `🛒 ${sfItemsSummary || 'New order'} • 📞 ${sfPhone} • 📍 ${updatedOrder?.deliveryAddress || 'Check App'}`,
              data: {
                orderId: database_order_id,
                orderType: orderType || 'street_food',
                customerName: sfCustomer?.username || 'Customer',
                customerPhone: sfPhone,
                amount: sfAmount,
                itemsSummary: sfItemsSummary || 'Street food order',
                dropAddress: updatedOrder?.deliveryAddress || 'Check App',
                navigateTo: '/provider/dashboard'
              }
            });
          }
        }
      } else {
        const providerId = updatedOrder?.providerId;
        if (providerId) {
          const provider = await storage.getServiceProvider(providerId);
          if (provider && provider.user) {
            console.log(`[FCM] New Order Notification! Sending Ring to ${provider.businessName}`);
            const allTokens: string[] = [];
            if (provider.user.fcmTokens && Array.isArray(provider.user.fcmTokens)) {
              allTokens.push(...provider.user.fcmTokens);
            } else if (provider.user.fcmToken) {
              allTokens.push(provider.user.fcmToken);
            }
            const uniqueTokens = [...new Set(allTokens)];
            const orderItems = Array.isArray(updatedOrder?.items) ? updatedOrder.items : [];
            const itemsSummary = orderItems.slice(0, 3).map((i: any) => `${i.quantity}x ${i.name}`).join(', ') + (orderItems.length > 3 ? ` +${orderItems.length - 3} more` : '');
            const orderAmount = updatedOrder?.totalAmount?.toString() || updatedOrder?.total?.toString() || 'Check App';
            
            const orderUserId = updatedOrder?.userId;
            let orderCustomer;
            let orderPhone = 'N/A';
            if (orderUserId) {
                orderCustomer = await storage.getUser(orderUserId);
                orderPhone = orderCustomer?.phone || 'N/A';
            }

            for (const deviceToken of uniqueTokens) {
              await sendPushNotification(deviceToken, {
                type: 'ORDER_REQUEST',
                title: `${orderLabel} Order — ₹${orderAmount} (COD/Paid)`,
                body: `🛒 ${itemsSummary || 'New order'} • 📞 ${orderPhone} • 📍 ${updatedOrder?.deliveryAddress || 'Check App'}`,
                data: {
                  orderId: database_order_id,
                  orderType: orderType || 'grocery',
                  customerName: orderCustomer?.username || 'Customer',
                  customerPhone: orderPhone,
                  amount: orderAmount,
                  itemsSummary: itemsSummary || `${orderLabel} order`,
                  dropAddress: updatedOrder?.deliveryAddress || 'Check App',
                  navigateTo: '/provider/dashboard'
                }
              });
            }
          }
        }
      }
    } catch (fcmError) {
      console.error('[FCM Error] Post-payment notification failed (non-critical):', fcmError);
    }
    
    // --- ADMIN NOTIFICATION: Also alert admin (main_branch) ---
    try {
      const adminOrderLabel = orderType === 'restaurant' ? '🍽️ Restaurant'
        : orderType === 'street_food' ? '🌮 Street Food'
          : '🛒 Grocery';
      let adminProviderName = 'N/A';
      if (orderType === 'street_food') {
        adminProviderName = 'Street Food Admin';
      } else if (updatedOrder?.providerId) {
        const prov = await storage.getServiceProvider(updatedOrder.providerId);
        adminProviderName = prov?.businessName || 'Unknown';
      }
      const adminAmount = updatedOrder?.totalAmount?.toString() || updatedOrder?.total?.toString() || 'Check App';
      const adminItems = Array.isArray(updatedOrder?.items)
        ? updatedOrder.items.slice(0, 3).map((i: any) => `${i.quantity}x ${i.name}`).join(', ') + (updatedOrder.items.length > 3 ? ` +${updatedOrder.items.length - 3} more` : '')
        : '';
      await notifyAdmin({
        title: `${adminOrderLabel} Order — ₹${adminAmount}`,
        body: `Provider: ${adminProviderName} • 🛒 ${adminItems || 'New order'} • 📍 ${updatedOrder?.deliveryAddress || 'N/A'}`,
        data: {
          orderId: database_order_id,
          orderType: orderType || 'grocery',
          providerName: adminProviderName,
          amount: adminAmount,
          itemsSummary: adminItems || `${adminOrderLabel} order`,
          dropAddress: updatedOrder?.deliveryAddress || 'N/A',
        }
      });
    } catch (adminErr) {
      console.error('[Admin Notif] Order admin alert failed:', adminErr);
    }
  }

  // --- PAYMENT VERIFICATION ROUTE (GENERIC) ---"""

content = content.replace("  // --- PAYMENT VERIFICATION ROUTE (GENERIC) ---", helper_text)

# 2. Extract out the previous notification block
import re
pattern = r"// --- PUSH NOTIFICATION \(RINGING\) — Only after payment is verified! ---.+?// --- ADMIN NOTIFICATION: Also alert admin \(main_branch\) ---.+?}\n"

# A regex approach to delete the large try catch block inside verify-signature
start_marker = "// --- PUSH NOTIFICATION (RINGING) — Only after payment is verified! ---"
end_marker = 'res.status(400).json({ status: "failure", message: "Invalid signature" });'

if start_marker in content and end_marker in content:
    start_idx = content.find(start_marker)
    # find the end marker *after* the start marker
    end_idx = content.find(end_marker, start_idx)
    # The end marker should have '} else {' right before it.
    actual_end_idx = content.rfind("} else {", start_idx, end_idx)
    
    to_replace = content[start_idx:actual_end_idx]
    
    new_text = """// --- PUSH NOTIFICATION (RINGING) ---
        await sendOrderNotifications(updatedOrder, orderType, database_order_id);
        
      """
    
    content = content.replace(to_replace, new_text)

# 3. Update Grocery Orders Endpoint
grocery_tgt = """    try {
      const userId = req.userId!;
      const orderData = insertGroceryOrderSchema.parse(req.body);
      const order = await storage.createGroceryOrder({ ...orderData, userId });
      // NOTE: Push notification moved to /api/payment/verify-signature
      // Provider is notified ONLY after payment is verified successfully

      res.status(201).json(order);"""

grocery_rep = """    try {
      const userId = req.userId!;
      const orderData = insertGroceryOrderSchema.parse(req.body);
      const order = await storage.createGroceryOrder({ ...orderData, userId });
      
      if (orderData.paymentMethod === 'cod') {
        // COD order creates notification immediately
        await sendOrderNotifications(order, 'grocery', order.id);
      }

      res.status(201).json(order);"""

content = content.replace(grocery_tgt, grocery_rep)

# 4. Update Street Food Orders Endpoint
street_tgt = """    try {
      const userId = req.userId!;
      // Validate body
      const orderData = insertStreetFoodOrderSchema.parse(req.body);

      // Assign a static runner ID for MVP (e.g., "runner-1")
      const orderWithRunner = { ...orderData, runnerId: "runner-1" };

      const order = await storage.createStreetFoodOrder({ ...orderWithRunner, userId });
      console.log("Created Street Food Order:", order); // DEBUG LOG

      // NOTE: Push notification moved to /api/payment/verify-signature
      // Provider is notified ONLY after payment is verified successfully

      res.status(201).json(order);"""

street_rep = """    try {
      const userId = req.userId!;
      // Validate body
      const orderData = insertStreetFoodOrderSchema.parse(req.body);

      // Assign a static runner ID for MVP (e.g., "runner-1")
      const orderWithRunner = { ...orderData, runnerId: "runner-1" };

      const order = await storage.createStreetFoodOrder({ ...orderWithRunner, userId });
      console.log("Created Street Food Order:", order); // DEBUG LOG

      if (orderData.paymentMethod === 'cod') {
        // COD order creates notification immediately
        await sendOrderNotifications(order, 'street_food', order.id);
      }

      res.status(201).json(order);"""

content = content.replace(street_tgt, street_rep)

# 5. Update Restaurant Orders Endpoint
rest_tgt = """    try {
      const userId = req.userId!;
      const orderData = insertRestaurantOrderSchema.parse(req.body);

      // Assign a static rider ID for MVP (e.g., "rider-1") if needed, or leave null
      // For now, let's leave riderId as null until a rider accepts it (if that's the flow)
      // Or if we want to auto-assign, we can do it here.
      // Let's keep it simple: created with status 'pending', no rider yet.

      const order = await storage.createRestaurantOrder({ ...orderData, userId });
      console.log("Created Restaurant Order:", order);

      // NOTE: Push notification moved to /api/payment/verify-signature
      // Provider is notified ONLY after payment is verified successfully
      // -----------------------------------

      res.status(201).json(order);"""

rest_rep = """    try {
      const userId = req.userId!;
      const orderData = insertRestaurantOrderSchema.parse(req.body);

      // Assign a static rider ID for MVP (e.g., "rider-1") if needed, or leave null
      // For now, let's leave riderId as null until a rider accepts it (if that's the flow)
      // Or if we want to auto-assign, we can do it here.
      // Let's keep it simple: created with status 'pending', no rider yet.

      const order = await storage.createRestaurantOrder({ ...orderData, userId });
      console.log("Created Restaurant Order:", order);

      if (orderData.paymentMethod === 'cod') {
        // COD order creates notification immediately
        await sendOrderNotifications(order, 'restaurant', order.id);
      }

      res.status(201).json(order);"""

content = content.replace(rest_tgt, rest_rep)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Refactor complete.")
