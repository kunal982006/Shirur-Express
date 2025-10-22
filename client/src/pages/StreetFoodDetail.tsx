import React from 'react';
import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// Yeh function vendor ke details aur menu fetch karega
const fetchVendorDetails = async (vendorId: string) => {
  // Provider ki details fetch karo
  const providerRes = await fetch(`/api/service-providers/${vendorId}`);
  if (!providerRes.ok) throw new Error('Vendor not found');
  const provider = await providerRes.json();

  // Us provider ke menu items fetch karo
  const menuRes = await fetch(`/api/street-food-items?providerId=${vendorId}`);
  if (!menuRes.ok) throw new Error('Menu not found');
  const menuItems = await menuRes.json();

  return { provider, menuItems };
};

export default function StreetFoodDetail() {
  const params = useParams();
  const vendorId = params.vendorId;

  const { data, isLoading, error } = useQuery({
    queryKey: ['vendorDetails', vendorId],
    queryFn: () => fetchVendorDetails(vendorId!),
    enabled: !!vendorId, // Yeh tabhi run hoga jab vendorId ho
  });

  if (isLoading) {
    return <div>Loading delicious food details...</div>;
  }

  if (error) {
    return <div>Oops! Something went wrong: {error.message}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <Link href="/street-food">
        <Button variant="outline" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to all vendors
        </Button>
      </Link>

      {data?.provider && (
        <div className="mb-8">
          <h1 className="text-4xl font-bold">{data.provider.businessName}</h1>
          <p className="text-lg text-muted-foreground mt-2">{data.provider.description}</p>
        </div>
      )}

      <div>
        <h2 className="text-3xl font-bold border-b pb-2 mb-6">Menu</h2>
        {data?.menuItems && data.menuItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.menuItems.map((item: any) => (
              <div key={item.id} className="border p-4 rounded-lg flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">₹{item.price}</p>
                  <Button size="sm" className="mt-2">Order</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No menu items found for this vendor.</p>
        )}
      </div>
    </div>
  );
}