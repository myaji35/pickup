'use client';

import { PassengerGroup } from '@/types/passenger-group';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pencil, Trash2 } from 'lucide-react';

interface PassengerGroupTableProps {
  groups: PassengerGroup[];
  onEdit: (group: PassengerGroup) => void;
  onDelete: (group: PassengerGroup) => void;
}

/**
 * PassengerGroupTable Component
 * 승객 그룹 목록 테이블
 */
export function PassengerGroupTable({ groups, onEdit, onDelete }: PassengerGroupTableProps) {
  if (groups.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No passenger groups found. Create your first group to get started.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Group Code</TableHead>
            <TableHead>Group Name</TableHead>
            <TableHead className="text-right">Passenger Count</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => (
            <TableRow key={group.id}>
              <TableCell className="font-medium">{group.groupCode}</TableCell>
              <TableCell>{group.name}</TableCell>
              <TableCell className="text-right">
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                  {group.totalPassengerCount}
                </span>
              </TableCell>
              <TableCell>
                {new Date(group.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(group)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(group)}
                    disabled={group.totalPassengerCount > 0}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
