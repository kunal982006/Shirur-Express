import axios from 'axios';

async function test() {
    try {
        const { data: providers } = await axios.get('http://localhost:5000/api/admin/providers');
        const restaurant = providers.find((p: any) => p.categoryId === 'restaurants');
        if (restaurant) {
            console.log("Found restaurant:", restaurant.id);
            const res = await axios.get(`http://localhost:5000/api/admin/provider-menu/restaurant/${restaurant.id}`);
            console.log("Response type:", typeof res.data);
            console.log("Is array?", Array.isArray(res.data));
            console.log("Response data:", res.data);
        }
    } catch (e: any) {
        console.error("Error:", e.response?.data || e.message);
    }
}
test();
