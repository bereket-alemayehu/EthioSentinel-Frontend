import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

type PasswordVisibilityToggleProps = {
  visible: boolean;
  onToggle: () => void;
  className?: string;
};

/** Show/hide password control — dark icon for contrast on light and glass inputs. */
export function PasswordVisibilityToggle({
  visible,
  onToggle,
  className,
}: PasswordVisibilityToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? 'Hide password' : 'Show password'}
      className={cn(
        'absolute top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-800 hover:text-black transition-colors focus-visible:outline-2 focus-visible:outline-slate-600/50',
        className,
      )}
    >
      {visible ? (
        <EyeOff className="h-5 w-5 stroke-[2.25]" aria-hidden />
      ) : (
        <Eye className="h-5 w-5 stroke-[2.25]" aria-hidden />
      )}
    </button>
  );
}
