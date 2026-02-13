// src/components/common/ResponsiveTable.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Column {
  header: string;
  accessor: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface ResponsiveTableProps {
  columns: Column[];
  data: any[];
  keyField: string;
}

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({ columns, data, keyField }) => {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((column, index) => (
                <TableHead key={index} className="font-semibold text-foreground">
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row[keyField]} className="hover:bg-muted/30 transition-colors">
                {columns.map((column, index) => (
                  <TableCell key={index}>
                    {column.render ? column.render(row[column.accessor], row) : row[column.accessor]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {data.map((row) => (
          <div key={row[keyField]} className="rounded-lg border bg-card p-4 shadow-sm space-y-2">
            {columns.map((column, index) => (
              <div key={index} className="flex justify-between items-start gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase shrink-0">
                  {column.header}
                </span>
                <span className="text-sm text-right">
                  {column.render ? column.render(row[column.accessor], row) : row[column.accessor]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
};

export default ResponsiveTable;
