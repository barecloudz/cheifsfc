import { calculateStandings } from "@/lib/standings";
import StandingsTable from "@/components/StandingsTable";

export const dynamic = "force-dynamic";

export default async function TablePage() {
  const standings = await calculateStandings();

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-6 md:max-w-5xl animate-fadeInUp">
      <div className="card-premium p-4">
        <StandingsTable standings={standings} />
      </div>
    </div>
  );
}
