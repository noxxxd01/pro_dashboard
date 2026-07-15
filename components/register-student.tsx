'use client';

import React, { useState, useTransition } from 'react';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Badge } from './ui/badge';
import {
  Mail,
  Phone,
  School,
  Clock,
  Hash,
  EllipsisVertical,
  Save,
  Edit,
  Trash,
  X,
} from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Field } from './ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { deleteStudent } from '@/app/actions/student-actions';
import { toast } from 'sonner';
import { EditStudentDialog } from './edit-student-dialog';
import { generateDTR } from '@/app/actions/dtr-actions';
import RegisterStudentsDialog from './register-students-dialog';

interface StudentRecord {
  id: string;
  fullName: string;
  studentNumber: string;
  school: string;
  targetHours: number;
  email: string;
  phoneNumber: string;
  totalHoursRendered: number;
}

interface RegisterStudentsProps {
  students: StudentRecord[];
}

async function downloadQrCode(studentNumber: string, fullName: string) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(studentNumber)}`;
  const response = await fetch(url);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `${fullName.replace(/\s+/g, '_')}_QR.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}

export default function RegisterStudents({ students }: RegisterStudentsProps) {
  const [search, setSearch] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(
    null,
  );
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const schools = Array.from(new Set(students.map((s) => s.school)));

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      search.trim() === '' ||
      student.fullName.toLowerCase().includes(search.toLowerCase()) ||
      student.studentNumber.toLowerCase().includes(search.toLowerCase());
    const matchesSchool =
      schoolFilter === 'all' || student.school === schoolFilter;
    return matchesSearch && matchesSchool;
  });

  const hasActiveFilters = search.trim() !== '' || schoolFilter !== 'all';

  const handleDelete = (id: string, name: string) => {
    startTransition(async () => {
      const result = await deleteStudent(id);
      if (result.success) {
        toast.success(`"${name}" removed`);
      } else {
        toast.error(result.error ?? 'Something went wrong');
      }
    });
  };

  const handleSaveQr = (student: StudentRecord) => {
    downloadQrCode(student.studentNumber, student.fullName).catch(() => {
      toast.error('Failed to download QR code');
    });
  };

  const handleGenerateDtr = (student: StudentRecord) => {
    const now = new Date();
    startTransition(async () => {
      const result = await generateDTR(
        student.id,
        now.getFullYear(),
        now.getMonth() + 1,
      );

      if (result.success && result.pdfBase64) {
        const byteCharacters = atob(result.pdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([new Uint8Array(byteNumbers)], {
          type: 'application/pdf',
        });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        URL.revokeObjectURL(url);
      } else {
        toast.error(result.error ?? 'Failed to generate DTR');
      }
    });
  };

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-row justify-between items-center gap-2'>
        <RegisterStudentsDialog />

        <div className='flex flex-row items-center gap-2'>
          <Select value={schoolFilter} onValueChange={setSchoolFilter}>
            <SelectTrigger className='w-56'>
              <SelectValue placeholder='School' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Schools</SelectItem>
              {schools.map((school) => (
                <SelectItem key={school} value={school}>
                  {school}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Field orientation='horizontal' className='w-72'>
            <Input
              type='search'
              placeholder='Search name or student number...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Field>

          {hasActiveFilters && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                setSearch('');
                setSchoolFilter('all');
              }}
            >
              <X className='w-4 h-4' /> Clear filters
            </Button>
          )}
        </div>
      </div>

      <main className='grid grid-cols-4 gap-4'>
        {filteredStudents.length === 0 ? (
          <p className='col-span-full text-center text-muted-foreground py-8'>
            {students.length === 0
              ? 'No students registered yet.'
              : 'No students match your search/filter.'}
          </p>
        ) : (
          filteredStudents.map((student) => {
            const renderedHours =
              Math.round(student.totalHoursRendered * 10) / 10;
            const progressPercent = student.targetHours
              ? Math.min(100, (renderedHours / student.targetHours) * 100)
              : 0;

            return (
              <Card key={student.id}>
                <CardHeader className='flex flex-row items-center justify-between gap-2'>
                  <CardTitle className='text-sm'>{student.fullName}</CardTitle>
                  <CardAction>
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            className='pr-0 hover:bg-white'
                            disabled={isPending}
                          >
                            <EllipsisVertical className='w-4 h-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              onSelect={() => {
                                setEditingStudent(student);
                                setEditOpen(true);
                              }}
                            >
                              <Edit className='w-4 h-4' /> Edit
                            </DropdownMenuItem>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className='text-destructive'
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash className='w-4 h-4 text-destructive' />{' '}
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete "{student.fullName}"?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            remove this student's record.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              handleDelete(student.id, student.fullName)
                            }
                            className='bg-destructive text-white hover:bg-destructive/90'
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardAction>
                </CardHeader>
                <CardContent className='flex flex-col gap-3'>
                  <div className='flex justify-center'>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(student.studentNumber)}`}
                      alt={`QR code for ${student.fullName}`}
                      className='w-28 h-28 border rounded-base'
                    />
                  </div>

                  <div className='flex flex-col gap-1.5 text-xs'>
                    <div className='flex items-center gap-1.5 text-muted-foreground'>
                      <Hash className='w-3.5 h-3.5' />
                      <span>{student.studentNumber}</span>
                    </div>
                    <div className='flex items-center gap-1.5 text-muted-foreground'>
                      <School className='w-3.5 h-3.5' />
                      <span className='truncate'>{student.school}</span>
                    </div>
                    <div className='flex items-center gap-1.5 text-muted-foreground'>
                      <Clock className='w-3.5 h-3.5' />
                      <span>{student.targetHours} target hours</span>
                    </div>
                    <div className='flex items-center gap-1.5 text-muted-foreground'>
                      <Mail className='w-3.5 h-3.5' />
                      <span className='truncate'>{student.email}</span>
                    </div>
                    <div className='flex items-center gap-1.5 text-muted-foreground'>
                      <Phone className='w-3.5 h-3.5' />
                      <span>{student.phoneNumber}</span>
                    </div>
                    <div className='text-muted-foreground flex flex-col gap-1.5 mt-4'>
                      <span>Progress</span>
                      <div>
                        <Progress value={progressPercent} />
                        <div className='flex flex-row justify-between items-center mt-1'>
                          <span>{renderedHours}</span>
                          <span>{student.targetHours}</span>
                        </div>
                      </div>
                    </div>
                    <div className='mt-4 flex flex-col gap-2'>
                      <Button
                        variant='outline'
                        onClick={() => handleGenerateDtr(student)}
                        disabled={isPending}
                      >
                        Generate DTR
                      </Button>
                      <Button onClick={() => handleSaveQr(student)}>
                        <Save className='w-4 h-4' /> Save QR Code
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </main>

      <EditStudentDialog
        student={editingStudent}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}
