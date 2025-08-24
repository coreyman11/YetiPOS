
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Program = {
  id: number;
  name: string;
  description: string | null;
  points_per_dollar: number;
  minimum_points_redeem: number;
  points_value_cents: number;
};

interface ProgramsListProps {
  programs: Program[];
}

const ProgramsList = ({ programs }: ProgramsListProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold tracking-tight"></h3>
      <Card>
        <CardHeader>
          <CardTitle>Current Loyalty Programs</CardTitle>
          <CardDescription>
            
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Points per Dollar</TableHead>
                <TableHead>Minimum Points</TableHead>
                <TableHead>Point Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs?.map((program) => (
                <TableRow key={program.id}>
                  <TableCell className="font-medium">{program.name}</TableCell>
                  <TableCell>{program.description}</TableCell>
                  <TableCell>{program.points_per_dollar} pts/$</TableCell>
                  <TableCell>{program.minimum_points_redeem} pts</TableCell>
                  <TableCell>${(program.points_value_cents / 100).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgramsList;
