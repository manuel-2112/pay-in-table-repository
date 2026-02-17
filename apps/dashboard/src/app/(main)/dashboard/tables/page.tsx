import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DashboardMetricsCards } from "./_components/dashboard-metrics-cards";
import { TablesDataTable } from "./_components/tables-data-table";

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
          <div className="@container/main flex flex-col gap-4 md:gap-6">
            <DashboardMetricsCards />

            <TablesDataTable />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
