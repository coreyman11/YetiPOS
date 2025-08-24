
import { useQuery } from "@tanstack/react-query";
import { transactionsApi } from "@/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface TopProduct {
  id: number;
  type: string;
  name: string;
  count: number;
  total: number;
  rank: number;
}

export const TopProductsCard = () => {
  const { data: topProducts, isLoading } = useQuery<TopProduct[]>({
    queryKey: ['top-products'],
    queryFn: () => transactionsApi.getTopProducts(5),
  });

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold">Top Products</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-2">
        {isLoading ? (
          <div className="space-y-4 mt-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-8" />
              </div>
            ))}
          </div>
        ) : topProducts && topProducts.length > 0 ? (
          <div className="space-y-0">
            {topProducts.map((product, index) => (
              <div key={`${product.type}-${product.id}`}>
                <div className="py-3 flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-base">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {product.count} sales &nbsp; {formatCurrency(product.total)}
                    </p>
                  </div>
                  <div className="text-muted-foreground font-medium">
                    #{product.rank}
                  </div>
                </div>
                {index < topProducts.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No product sales found for this month
          </div>
        )}
      </CardContent>
    </Card>
  );
};
