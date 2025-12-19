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

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-muted flex items-center justify-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground" />
        </div>
      )}
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg leading-tight min-h-[1.5rem]">
          {product.name.charAt(0).toUpperCase() + product.name.slice(1).toLowerCase()}
        </h3>
        {product.weight && <p className="text-sm text-muted-foreground">{product.weight}</p>}
        <div className="flex flex-col mt-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">₹{priceAsNumber.toFixed(2)}</span>
            {mrpAsNumber && mrpAsNumber > priceAsNumber && (
              <span className="text-sm text-red-500 line-through">
                ₹{mrpAsNumber.toFixed(2)}
              </span>
            )}
          </div>
          {product.category && <Badge variant="outline" className="mt-2 w-fit">{product.category}</Badge>}
        </div>

        {quantity === 0 ? (
          <Button
            className="w-full mt-4"
            onClick={() => onAddToCart(product)}
            disabled={!product.inStock}
          >
            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </Button>
        ) : (
          <div className="flex justify-between items-center mt-4 border rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary"
              onClick={onDecreaseQuantity}
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="font-medium text-lg">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary"
              onClick={onIncreaseQuantity}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}