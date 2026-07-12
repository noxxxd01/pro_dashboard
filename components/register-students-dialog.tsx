'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Field, FieldGroup, FieldLabel } from './ui/field';
import { Input } from './ui/input';
import { Plus } from 'lucide-react';
import { registerStudent } from '@/app/actions/student-actions';
import { toast } from 'sonner';

export default function RegisterStudentsDialog() {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [school, setSchool] = useState('');
  const [targetHours, setTargetHours] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setFullName('');
    setStudentNumber('');
    setSchool('');
    setTargetHours('');
    setEmail('');
    setPhoneNumber('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await registerStudent({
        fullName,
        studentNumber,
        school,
        targetHours: Number(targetHours) || 0,
        email,
        phoneNumber,
      });

      if (result.success) {
        toast.success('Student registered');
        resetForm();
        setOpen(false);
      } else {
        toast.error(result.error ?? 'Something went wrong');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className='w-4 h-4' /> Register Students
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Register Student</DialogTitle>
            <DialogDescription>
              Add a new OJT student to the registry.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className='py-4'>
            <Field>
              <FieldLabel htmlFor='student-fullname'>Full Name</FieldLabel>
              <Input
                id='student-fullname'
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder='e.g. Juan Dela Cruz'
              />
            </Field>
            <Field>
              <FieldLabel htmlFor='student-number'>Student Number</FieldLabel>
              <Input
                id='student-number'
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                placeholder='e.g. 2023-00123'
              />
            </Field>
            <Field>
              <FieldLabel htmlFor='student-school'>School</FieldLabel>
              <Input
                id='student-school'
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder='e.g. Surigao del Norte State University'
              />
            </Field>
            <Field>
              <FieldLabel htmlFor='student-target-hours'>
                Target Hours
              </FieldLabel>
              <Input
                id='student-target-hours'
                type='number'
                value={targetHours}
                onChange={(e) => setTargetHours(e.target.value)}
                placeholder='e.g. 486'
              />
            </Field>
            <Field>
              <FieldLabel htmlFor='student-email'>Email</FieldLabel>
              <Input
                id='student-email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='e.g. juan.delacruz@example.com'
              />
            </Field>
            <Field>
              <FieldLabel htmlFor='student-phone'>Phone Number</FieldLabel>
              <Input
                id='student-phone'
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder='e.g. 0917 123 4567'
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isPending}>
              {isPending ? 'Registering...' : 'Register'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
