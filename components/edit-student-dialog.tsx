'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Field, FieldGroup, FieldLabel } from './ui/field';
import { Input } from './ui/input';
import { updateStudent } from '@/app/actions/student-actions';
import { toast } from 'sonner';

interface StudentRecord {
  id: string;
  fullName: string;
  studentNumber: string;
  school: string;
  targetHours: number;
  email: string;
  phoneNumber: string;
}

interface EditStudentDialogProps {
  student: StudentRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditStudentDialog({
  student,
  open,
  onOpenChange,
}: EditStudentDialogProps) {
  const [fullName, setFullName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [school, setSchool] = useState('');
  const [targetHours, setTargetHours] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (student) {
      setFullName(student.fullName);
      setStudentNumber(student.studentNumber);
      setSchool(student.school);
      setTargetHours(String(student.targetHours));
      setEmail(student.email);
      setPhoneNumber(student.phoneNumber);
    }
  }, [student]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    startTransition(async () => {
      const result = await updateStudent({
        id: student.id,
        fullName,
        studentNumber,
        school,
        targetHours: Number(targetHours) || 0,
        email,
        phoneNumber,
      });

      if (result.success) {
        toast.success('Student updated');
        onOpenChange(false);
      } else {
        toast.error(result.error ?? 'Something went wrong');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update this student's details.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className='py-4'>
            <Field>
              <FieldLabel htmlFor='edit-student-fullname'>Full Name</FieldLabel>
              <Input
                id='edit-student-fullname'
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor='edit-student-number'>
                Student Number
              </FieldLabel>
              <Input
                id='edit-student-number'
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor='edit-student-school'>School</FieldLabel>
              <Input
                id='edit-student-school'
                value={school}
                onChange={(e) => setSchool(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor='edit-student-target-hours'>
                Target Hours
              </FieldLabel>
              <Input
                id='edit-student-target-hours'
                type='number'
                value={targetHours}
                onChange={(e) => setTargetHours(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor='edit-student-email'>Email</FieldLabel>
              <Input
                id='edit-student-email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor='edit-student-phone'>Phone Number</FieldLabel>
              <Input
                id='edit-student-phone'
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isPending}>
              {isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
