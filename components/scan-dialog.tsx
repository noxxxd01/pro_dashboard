'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { scanStudent } from '@/app/actions/attendance-actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: () => void;
}

export function ScanDialog({
  open,
  onOpenChange,
  onScanSuccess,
}: ScanDialogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const lastScannedRef = useRef<string | null>(null);
  const cooldownRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    let isMounted = true;

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (!isMounted || !containerRef.current) return;

      const scanner = new Html5Qrcode(containerRef.current.id);
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            // Prevent duplicate rapid-fire scans of the same code
            if (cooldownRef.current || decodedText === lastScannedRef.current)
              return;

            cooldownRef.current = true;
            lastScannedRef.current = decodedText;
            setIsProcessing(true);

            const result = await scanStudent(decodedText);

            if (result.success) {
              toast.success(`${result.action}: ${result.studentName}`);
              onScanSuccess();
            } else {
              toast.error(result.error ?? 'Scan failed');
            }

            setIsProcessing(false);

            // Allow scanning again after a short cooldown
            setTimeout(() => {
              cooldownRef.current = false;
              lastScannedRef.current = null;
            }, 2500);
          },
          () => {
            // Ignore per-frame "no QR found" errors — this fires constantly while scanning
          },
        )
        .catch(() => {
          toast.error('Unable to access camera');
        });
    });

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch(() => {
            // Scanner may already be stopped; ignore
          });
      }
    };
  }, [open, onScanSuccess]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Scan Student QR Code</DialogTitle>
          <DialogDescription>
            Point the camera at a student's QR code to log Time In, Break, or
            Time Out.
          </DialogDescription>
        </DialogHeader>

        <div className='relative'>
          <div
            id='qr-scanner-region'
            ref={containerRef}
            className='w-full rounded-base overflow-hidden'
          />
          {isProcessing && (
            <div className='absolute inset-0 flex items-center justify-center bg-background/70'>
              <Loader2 className='w-6 h-6 animate-spin' />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
