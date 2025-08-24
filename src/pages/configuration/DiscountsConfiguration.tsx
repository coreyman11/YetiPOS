
import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { discountsApi } from "@/services";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateDiscountDialog } from "@/components/discounts/CreateDiscountDialog";
import { DiscountCard } from "@/components/discounts/DiscountCard";
import { Badge } from "@/components/ui/badge";
import { Database } from "@/types/supabase";

type Discount = Database['public']['Tables']['discounts']['Row'];

const DiscountsConfiguration = () => {
  const [activeTab, setActiveTab] = React.useState("active");
  const queryClient = useQueryClient();

  const { data: discounts, isLoading, isError } = useQuery({
    queryKey: ['discounts'],
    queryFn: discountsApi.getAll,
  });

  const handleDiscountAction = () => {
    queryClient.invalidateQueries({ queryKey: ['discounts'] });
  };

  if (isLoading) {
    return <div>Loading discounts...</div>;
  }

  if (isError) {
    return <div>Error loading discounts</div>;
  }

  const now = new Date();
  
  const activeDiscounts = discounts?.filter(discount => {
    const startDate = new Date(discount.start_date);
    const endDate = discount.end_date ? new Date(discount.end_date) : null;
    return discount.is_active && startDate <= now && (!endDate || endDate >= now);
  });

  const upcomingDiscounts = discounts?.filter(discount => {
    const startDate = new Date(discount.start_date);
    return discount.is_active && startDate > now;
  });

  const expiredDiscounts = discounts?.filter(discount => {
    const startDate = new Date(discount.start_date);
    const endDate = discount.end_date ? new Date(discount.end_date) : null;
    return !discount.is_active || (endDate && endDate < now);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Discounts</h2>
          <p className="text-muted-foreground">
            Manage your store discounts and promotional offers.
          </p>
        </div>
        <CreateDiscountDialog onDiscountCreated={handleDiscountAction} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active" className="flex gap-2">
            Active
            {activeDiscounts && activeDiscounts.length > 0 && (
              <Badge variant="secondary">{activeDiscounts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex gap-2">
            Upcoming
            {upcomingDiscounts && upcomingDiscounts.length > 0 && (
              <Badge variant="secondary">{upcomingDiscounts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="expired" className="flex gap-2">
            Expired
            {expiredDiscounts && expiredDiscounts.length > 0 && (
              <Badge variant="secondary">{expiredDiscounts.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Discounts</CardTitle>
              <CardDescription>
                Currently active discounts applied to transactions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeDiscounts && activeDiscounts.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activeDiscounts.map((discount) => (
                    <DiscountCard
                      key={discount.id}
                      discount={discount}
                      onAction={handleDiscountAction}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground">No active discounts found.</p>
                  <CreateDiscountDialog onDiscountCreated={handleDiscountAction} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Discounts</CardTitle>
              <CardDescription>
                Scheduled discounts that have not started yet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingDiscounts && upcomingDiscounts.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingDiscounts.map((discount) => (
                    <DiscountCard
                      key={discount.id}
                      discount={discount}
                      onAction={handleDiscountAction}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground">No upcoming discounts found.</p>
                  <CreateDiscountDialog onDiscountCreated={handleDiscountAction} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expired">
          <Card>
            <CardHeader>
              <CardTitle>Expired Discounts</CardTitle>
              <CardDescription>
                Past discounts that are no longer active.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expiredDiscounts && expiredDiscounts.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {expiredDiscounts.map((discount) => (
                    <DiscountCard
                      key={discount.id}
                      discount={discount}
                      onAction={handleDiscountAction}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground">No expired discounts found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DiscountsConfiguration;
