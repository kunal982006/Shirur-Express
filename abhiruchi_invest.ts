import 'dotenv/config';
import { db } from './server/db';
import { users, serviceProviders, restaurantMenuItems } from '@shared/schema';
import { eq, ilike } from 'drizzle-orm';
import * as fs from 'fs';

async function run() {
    // Find all users with username like "Abhiruchi"
    const matchingUsers = await db.query.users.findMany({
        where: ilike(users.username, '%Abhiruchi%')
    });
    
    // Find all service providers with businessName like "Abhiruchi"
    const matchingProviders = await db.query.serviceProviders.findMany({
        where: ilike(serviceProviders.businessName, '%Abhiruchi%')
    });

    const report: any = {
        users: matchingUsers.map(u => ({ id: u.id, username: u.username, role: u.role, isApproved: u.isApproved })),
        providers: []
    };

    for (const p of matchingProviders) {
        // Count menu items for this provider
        const menuItems = await db.query.restaurantMenuItems.findMany({
            where: eq(restaurantMenuItems.providerId, p.id)
        });
        
        // Find associated user
        const user = await db.query.users.findFirst({
            where: eq(users.id, p.userId)
        });
        
        report.providers.push({
            id: p.id,
            userId: p.userId,
            username: user ? user.username : 'Unknown',
            businessName: p.businessName,
            menuItemCount: menuItems.length
        });
    }

    fs.writeFileSync('abhiruchi_investigation.json', JSON.stringify(report, null, 2), 'utf-8');
    process.exit(0);
}
run();
