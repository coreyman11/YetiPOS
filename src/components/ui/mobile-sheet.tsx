import * as React from "react"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useDeviceType } from "@/hooks/use-mobile"

interface MobileSheetProps {
  children: React.ReactNode
  trigger?: React.ReactNode
  title?: string
  description?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

export function MobileSheet({
  children,
  trigger,
  title,
  description,
  open,
  onOpenChange,
  className,
}: MobileSheetProps) {
  const deviceType = useDeviceType()
  const isMobile = deviceType === 'mobile'

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
        <DrawerContent className={className}>
          {title && (
            <DrawerHeader>
              <DrawerTitle>{title}</DrawerTitle>
              {description && <DrawerDescription>{description}</DrawerDescription>}
            </DrawerHeader>
          )}
          {children}
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
      </DialogContent>
    </Dialog>
  )
}