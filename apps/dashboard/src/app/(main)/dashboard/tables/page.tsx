import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DashboardMetricsCards } from "./_components/dashboard-metrics-cards";

export default function Page() {
  return (
    <div>
      <Tabs className="gap-4" defaultValue="overview">
        <TabsList>
          <TabsTrigger value="tables">
            Mesas
          </TabsTrigger>
          <TabsTrigger value="reservations">
            Reservas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tables">
          <div className="flex flex-col gap-4 **:data-[slot=card]:shadow-xs">
            <DashboardMetricsCards />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
              <div className="flex flex-col gap-4">

                <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-2">
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
