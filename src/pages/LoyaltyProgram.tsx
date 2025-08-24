
import { useQuery } from "@tanstack/react-query";
import { loyaltyProgramApi } from "@/services/loyalty-program-api";
import { Loader2 } from "lucide-react";
import CreateProgramForm from "@/components/loyalty/CreateProgramForm";
import ProgramsList from "@/components/loyalty/ProgramsList";

const LoyaltyProgram = () => {
  const { data: programs, isLoading } = useQuery({
    queryKey: ['loyalty-programs'],
    queryFn: loyaltyProgramApi.getActivePrograms,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight"></h2>
        <p className="text-muted-foreground"></p>
      </div>

      <ProgramsList programs={programs || []} />
      <CreateProgramForm />
    </div>
  );
};

export default LoyaltyProgram;
