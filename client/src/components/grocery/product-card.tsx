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
        <h3 className="font-semibold text-lg truncate">{product.name}</h3>
        {product.weight && <p className="text-sm text-muted-foreground">{product.weight}</p>}
        <div className="flex items-center justify-between mt-4">
          {/* --- YAHAN BADLAV KIYA HAI --- */}
          <span className="text-xl font-bold text-primary">₹{priceAsNumber.toFixed(2)}</span>
          {product.category && <Badge variant="outline">{product.category}</Badge>}
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