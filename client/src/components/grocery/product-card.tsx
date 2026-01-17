import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Minus, Plus } from "lucide-react";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: string | number; // Price string ya number ho sakta hai
    weight?: string;
    imageUrl?: string;
    mrp?: string | number;
    category?: string;
    inStock?: boolean;
  };
  onAddToCart: (product: any) => void;
  quantity: number;
  onIncreaseQuantity: () => void;
  onDecreaseQuantity: () => void;
}

export default function ProductCard({
  product,
  onAddToCart,
  quantity,
  onIncreaseQuantity,
  onDecreaseQuantity,
}: ProductCardProps) {
  // Price ko number me convert karo
  const priceAsNumber = parseFloat(product.price as string);
  const mrpAsNumber = product.mrp ? parseFloat(product.mrp as string) : null;
  const discountPercentage = mrpAsNumber && mrpAsNumber > priceAsNumber
    ? Math.round(((mrpAsNumber - priceAsNumber) / mrpAsNumber) * 100)
    : 0;

  return (
    <Card className="overflow-hidden border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-md transition-all rounded-md flex flex-col h-full bg-white relative">
      {/* Discount Badge */}
      {discountPercentage > 0 && (
        <div className="absolute top-0 left-0 bg-blue-600 text-white text-[9px] font-bold px-1 py-0.5 rounded-br-md z-10">
          {discountPercentage}% OFF
        </div>
      )}

      {/* Image Section - Compact & Aspect Ratio Preserved */}
      <div className="relative w-full aspect-[1/1] bg-gray-50 flex items-center justify-center p-1.5">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-contain mix-blend-multiply"
          />
        ) : (
          <ShoppingBag className="h-6 w-6 text-gray-300" />
        )}
      </div>

      {/* Content Section */}
      <CardContent className="p-1.5 flex-grow flex flex-col justify-between">
        <div className="mb-1">
          <h3 className="font-medium text-[11px] text-gray-800 leading-3 line-clamp-2 h-7 mb-0.5">
            {product.name}
          </h3>

          {product.weight && (
            <p className="text-[9px] text-gray-500 font-medium leading-none">
              {product.weight}
            </p>
          )}
        </div>

        {/* Price & Add Button Row */}
        <div className="flex flex-col gap-1.5 mt-auto">
          {/* Price */}
          <div className="flex items-end gap-1 flex-wrap leading-none">
            <span className="text-[11px] font-bold text-gray-900">₹{priceAsNumber.toFixed(0)}</span>
            {mrpAsNumber && mrpAsNumber > priceAsNumber && (
              <span className="text-[9px] text-gray-400 line-through">₹{mrpAsNumber}</span>
            )}
          </div>

          {/* Add Button - Ultra Compact */}
          <div className="w-full">
            {quantity === 0 ? (
              <Button
                variant="outline"
                className="w-full h-6 text-[10px] font-bold text-green-700 border-green-200 bg-green-50 hover:bg-green-100 hover:text-green-800 uppercase tracking-wider rounded-md shadow-none px-0"
                onClick={() => onAddToCart(product)}
                disabled={!product.inStock}
              >
                {product.inStock ? 'ADD' : 'SOLD'}
              </Button>
            ) : (
              <div className="flex items-center justify-between bg-green-50 rounded-md border border-green-200 h-6 px-0.5">
                <button
                  className="w-5 h-full flex items-center justify-center text-green-700 hover:bg-green-200 rounded-sm"
                  onClick={onDecreaseQuantity}
                  disabled={quantity <= 0}
                >
                  <Minus className="h-2.5 w-2.5" />
                </button>
                <span className="font-bold text-[10px] text-green-700">{quantity}</span>
                <button
                  className="w-5 h-full flex items-center justify-center text-green-700 hover:bg-green-200 rounded-sm"
                  onClick={onIncreaseQuantity}
                >
                  <Plus className="h-2.5 w-2.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}