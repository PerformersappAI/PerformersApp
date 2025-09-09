
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AuditionStats } from "@/types/audition";
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Film, 
  Star 
} from "lucide-react";

interface DashboardStatsProps {
  stats: AuditionStats | null;
  isLoading: boolean;
}

const DashboardStats = ({ stats, isLoading }: DashboardStatsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20 bg-gray-700" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12 bg-gray-700" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Total Auditions",
      value: stats.total_auditions,
      icon: Calendar,
      color: "text-blue-400",
    },
    {
      title: "In Preparation",
      value: stats.preparation,
      icon: Clock,
      color: "text-yellow-400",
    },
    {
      title: "Submitted",
      value: stats.submitted,
      icon: Film,
      color: "text-purple-400",
    },
    {
      title: "Callbacks",
      value: stats.callback,
      icon: Star,
      color: "text-orange-400",
    },
    {
      title: "Booked",
      value: stats.booked,
      icon: CheckCircle,
      color: "text-green-400",
    },
    {
      title: "Success Rate",
      value: `${stats.success_rate}%`,
      icon: TrendingUp,
      color: "text-emerald-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStats;
