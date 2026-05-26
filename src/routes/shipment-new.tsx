import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboardingChecklistQuery } from '@/api/onboarding'
import { useToast } from '@/components/Toast/use-toast'
import { APP_ROUTES } from '@/constants/app-routes'
import ShipmentNewView from '@/views/shipments/new'

export default function ShipmentNewRoute() {
  const { data: checklist, isLoading } = useOnboardingChecklistQuery()
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    if (!isLoading && checklist && !checklist.operatorConnected) {
      toast({
        title: 'Connect a postal operator before creating a shipment',
        color: 'warning',
      })
      navigate(APP_ROUTES.profile, { replace: true })
    }
  }, [isLoading, checklist, navigate, toast])

  if (isLoading || (checklist && !checklist.operatorConnected)) return null
  return <ShipmentNewView />
}
