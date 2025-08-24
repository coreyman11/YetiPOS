
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database } from "@/types/supabase";
import { discountsApi } from "@/services";
import { toast } from "sonner";

type Discount = Database['public']['Tables']['discounts']['Row'];

const discountFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["percentage", "fixed"]),
  value: z.coerce.number().positive("Value must be positive"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
});

type DiscountFormValues = z.infer<typeof discountFormSchema>;

interface DiscountFormProps {
  discount?: Discount;
  onSuccess: () => void;
}

export const DiscountForm = ({ discount, onSuccess }: DiscountFormProps) => {
  const isEditing = !!discount;

  const form = useForm<DiscountFormValues>({
    resolver: zodResolver(discountFormSchema),
    defaultValues: {
      name: discount?.name || "",
      type: discount?.type || "percentage",
      value: discount?.value || 0,
      start_date: discount?.start_date 
        ? new Date(discount.start_date).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0],
      end_date: discount?.end_date 
        ? new Date(discount.end_date).toISOString().split('T')[0] 
        : "",
      description: discount?.description || "",
      is_active: discount?.is_active ?? true,
    },
  });

  const onSubmit = async (values: DiscountFormValues) => {
    try {
      // Format dates properly
      const formattedValues = {
        ...values,
        end_date: values.end_date && values.end_date.trim() !== "" 
          ? new Date(values.end_date).toISOString()
          : null,
        start_date: new Date(values.start_date).toISOString(),
      };

      if (isEditing && discount) {
        await discountsApi.update(discount.id, formattedValues);
        toast.success("Discount updated successfully");
      } else {
        // Make sure all required fields are present when creating a new discount
        const newDiscount = {
          name: formattedValues.name,
          type: formattedValues.type,
          value: formattedValues.value,
          start_date: formattedValues.start_date,
          end_date: formattedValues.end_date,
          description: formattedValues.description,
          is_active: formattedValues.is_active
        };
        
        await discountsApi.create(newDiscount);
        toast.success("Discount created successfully");
      }
      
      onSuccess();
    } catch (error) {
      console.error("Error saving discount:", error);
      toast.error("Failed to save discount");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Discount Name</FormLabel>
              <FormControl>
                <Input placeholder="Summer Sale" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select discount type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Value</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step={form.watch("type") === "percentage" ? "1" : "0.01"}
                    placeholder={form.watch("type") === "percentage" ? "10" : "5.00"} 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field} 
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value || null)} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Description of the discount" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="h-4 w-4"
                />
              </FormControl>
              <FormLabel className="text-sm font-normal">Active</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit">
            {isEditing ? "Update" : "Create"} Discount
          </Button>
        </div>
      </form>
    </Form>
  );
};
