import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert'; // For displaying errors
import { Loader2 } from 'lucide-react'; // For loading spinner

interface FamilyCodeModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const FamilyCodeModal: React.FC<FamilyCodeModalProps> = ({ isOpen, onOpenChange }) => {
  const [code, setCode] = useState('');
  const { verifyFamilyCode, familyCodeError } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    // verifyFamilyCode will clear previous errors
    const success = await verifyFamilyCode(code);
    setIsVerifying(false);
    if (success) {
      onOpenChange(false); // Close modal on success
      setCode(''); // Reset code input
    }
  };

  const handleModalClose = () => {
    if (!isVerifying) {
      onOpenChange(false);
      setCode('');
      // Error is cleared by verifyFamilyCode on next submit.
      // If modal is closed and reopened, familyCodeError from context will persist
      // until next verification attempt. This is acceptable.
      // Alternatively, AuthContext could provide a clearFamilyCodeError function.
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Enter Family Code</DialogTitle>
            <DialogDescription>
              To enable editing features, please enter the Family Code.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="family-code" className="text-right">
                Family Code
              </Label>
              <Input
                id="family-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="col-span-3"
                type="password" // Use password type to obscure the code
                required
              />
            </div>
            {familyCodeError && (
              <Alert variant="destructive" className="col-span-4">
                <AlertDescription>{familyCodeError}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleModalClose} disabled={isVerifying}>
              Cancel
            </Button>
            <Button type="submit" disabled={isVerifying}>
              {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Verify Code
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FamilyCodeModal;
