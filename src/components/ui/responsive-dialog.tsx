import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter, DrawerClose } from "@/components/ui/drawer"
import { useDeviceType } from "@/hooks/use-mobile"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ResponsiveDialogProps {
  children: React.ReactNode
  trigger?: React.ReactNode
  title?: string
  description?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  footer?: React.ReactNode
}

export function ResponsiveDialog({
  children,
  trigger,
  title,
  description,
  open,
  onOpenChange,
  className,
  footer,
}: ResponsiveDialogProps) {
  const deviceType = useDeviceType()
  const isMobile = deviceType === 'mobile'

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
        <DrawerContent className={className}>
          <div className="flex items-center justify-between p-4 border-b">
            {title && <DrawerTitle className="text-lg font-semibold">{title}</DrawerTitle>}
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
          {description && (
            <div className="px-4 pb-2">
              <DrawerDescription>{description}</DrawerDescription>
            </div>
          )}
          <div className="flex-1 overflow-auto px-4">
            {children}
          </div>
          {footer && (
            <DrawerFooter className="border-t">
              {footer}
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={className}>
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
        {footer && (
          <div className="flex justify-end gap-2 mt-4">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}